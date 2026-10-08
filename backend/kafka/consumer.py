import json
import os
import sys
import time
import warnings
from datetime import datetime, timezone

from kafka import KafkaConsumer
from kafka.errors import KafkaError
import pymongo

# Suppress deprecation warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

# --------------------------------------------------
# PROJECT ROOT & PATH
# --------------------------------------------------
PROJECT_ROOT = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        ".."
    )
)
sys.path.insert(0, PROJECT_ROOT)

from streaming.bloom_filter import BloomFilter
from streaming.flajolet_martin import FlajoletMartin

# --------------------------------------------------
# CONFIG
# --------------------------------------------------
KAFKA_SERVER = "localhost:9092"
TOPIC_NAME = "network-traffic"
MONGO_URI = "mongodb://localhost:27017/"

# --------------------------------------------------
# MONGODB CONNECTION
# --------------------------------------------------
mongo_client = pymongo.MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=3000
)
db = mongo_client["IntrusionDetection"]
alerts_collection = db["LiveAlerts"]
stats_collection = db["TrafficStats"]
blacklist_collection = db["Blacklist"]

# --------------------------------------------------
# LOAD BLACKLIST (MongoDB + MapReduce Baselines fallback)
# --------------------------------------------------
blacklisted_ips = []

try:
    for document in blacklist_collection.find({}, {"ip": 1}):
        if "ip" in document:
            blacklisted_ips.append(document["ip"])
except Exception as mongo_err:
    print(f"[-] Warning: MongoDB access issue: {mongo_err}", flush=True)

if not blacklisted_ips:
    baseline_path = os.path.join(PROJECT_ROOT, "data", "processed", "historical_ip_baselines.csv")
    if os.path.exists(baseline_path):
        print(f"[*] Loading blacklisted IPs directly from MapReduce baselines: {baseline_path}...", flush=True)
        try:
            with open(baseline_path, "r", encoding="utf-8") as f:
                docs_to_insert = []
                for line in f:
                    parts = line.strip().split(",")
                    if len(parts) == 2 and parts[1].strip().isdigit():
                        cnt = int(parts[1].strip())
                        if cnt > 5:
                            ip = parts[0].strip()
                            blacklisted_ips.append(ip)
                            docs_to_insert.append({
                                "ip": ip,
                                "historical_count": cnt,
                                "threat_level": "High"
                            })
            if docs_to_insert:
                try:
                    blacklist_collection.insert_many(docs_to_insert, ordered=False)
                except Exception:
                    pass
        except Exception as read_err:
            print(f"[-] Error reading baselines file: {read_err}", flush=True)

print(f"[*] Loaded {len(blacklisted_ips)} blacklisted IPs.", flush=True)

# --------------------------------------------------
# BLOOM FILTER & FLAJOLET-MARTIN
# --------------------------------------------------
bloom_filter = BloomFilter(
    expected_items=max(len(blacklisted_ips), 1),
    false_positive_rate=0.01
)
for ip in blacklisted_ips:
    bloom_filter.add(ip)

print(
    f"[+] Initialized Bloom Filter with {bloom_filter.size} bits and {bloom_filter.hash_count} hash functions.",
    flush=True
)

fm = FlajoletMartin(num_hashes=64)

# --------------------------------------------------
# THREAT SCORING LOGIC
# --------------------------------------------------
def calculate_threat_score(bloom_match, label, distinct_ip_estimate):
    score = 0
    if bloom_match:
        score += 40
    if label:
        lbl = label.upper()
        if lbl in ["DDOS", "BOTNET", "PORTSCAN", "INFILTRATION", "HEARTBLEED", "BRUTEFORCE"]:
            score += 40
        elif lbl != "BENIGN":
            score += 30
    if distinct_ip_estimate > 500:
        score += 20
    return min(score, 100)


def get_threat_level(score):
    if score >= 80:
        return "CRITICAL"
    elif score >= 60:
        return "HIGH"
    elif score >= 30:
        return "MEDIUM"
    return "LOW"


# --------------------------------------------------
# CREATE CONSUMER WITH RETRY
# --------------------------------------------------
def create_consumer(retries=5, delay=2):
    for attempt in range(1, retries + 1):
        try:
            cons = KafkaConsumer(
                TOPIC_NAME,
                bootstrap_servers=KAFKA_SERVER,
                value_deserializer=lambda value: json.loads(value.decode("utf-8")),
                auto_offset_reset="earliest",
                enable_auto_commit=True,
                group_id="intrusion-detection-group"
            )
            return cons
        except KafkaError as ke:
            print(f"[-] Kafka error at {KAFKA_SERVER} (attempt {attempt}/{retries}): {ke}", flush=True)
            if attempt < retries:
                time.sleep(delay)
        except Exception as e:
            print(f"[-] Error creating Kafka Consumer: {e}", flush=True)
            if attempt < retries:
                time.sleep(delay)
    return None


def main():
    print("[*] Connecting Kafka Consumer to broker...", flush=True)
    consumer = create_consumer()

    if not consumer:
        print("[ERROR] Could not connect to Kafka. Ensure Kafka is running on localhost:9092.", flush=True)
        print("[TIP] Start Kafka using: .\\scripts\\start_kafka.bat", flush=True)
        sys.exit(1)

    print("[+] Kafka Consumer successfully connected.", flush=True)
    print(f"[+] Actively consuming from topic: '{TOPIC_NAME}'", flush=True)

    # Restore existing stats if available
    total_flows = 0
    total_alerts = 0
    try:
        existing_stats = stats_collection.find_one({"name": "global"})
        if existing_stats:
            total_flows = existing_stats.get("total_flows", 0)
            total_alerts = existing_stats.get("total_alerts", 0)
    except Exception:
        pass

    try:
        for message in consumer:
            event = message.value
            if not isinstance(event, dict):
                continue

            total_flows += 1

            source_ip = event.get("source_ip", "").strip()
            destination_ip = event.get("destination_ip", "").strip()
            source_port = event.get("source_port", "").strip()
            destination_port = event.get("destination_port", "").strip()
            protocol = event.get("protocol", "").strip()
            label = event.get("label", "").strip()
            timestamp = event.get("timestamp", "").strip()

            # Bloom Filter Check
            bloom_match = bloom_filter.check(source_ip) if source_ip else False

            # Flajolet-Martin Distinct Tracking
            if source_ip:
                fm.add(source_ip)
            distinct_ip_estimate = fm.estimate()

            # Threat Scoring
            threat_score = calculate_threat_score(bloom_match, label, distinct_ip_estimate)
            threat_level = get_threat_level(threat_score)

            attack_detected = (
                bloom_match or
                (label.upper() not in ["", "BENIGN"])
            )

            print(
                f"[FLOW #{total_flows}] {source_ip}:{source_port} -> {destination_ip}:{destination_port} "
                f"[{protocol}] | Label: {label} | Bloom Match: {bloom_match} | "
                f"Distinct IPs: {distinct_ip_estimate} | Score: {threat_score} ({threat_level})",
                flush=True
            )

            # Record Alert in MongoDB
            if attack_detected:
                total_alerts += 1
                alert_doc = {
                    "source_ip": source_ip,
                    "destination_ip": destination_ip,
                    "source_port": source_port,
                    "destination_port": destination_port,
                    "protocol": protocol,
                    "attack_type": label if (label and label.upper() != "BENIGN") else "Blacklisted IP Access",
                    "threat_score": threat_score,
                    "threat_level": threat_level,
                    "bloom_match": bloom_match,
                    "fm_estimate": distinct_ip_estimate,
                    "timestamp": timestamp,
                    "created_at": datetime.now(timezone.utc)
                }

                try:
                    alerts_collection.insert_one(alert_doc)
                    print(f"  --> [ALERT RECORDED] {threat_level}: {alert_doc['attack_type']} from {source_ip}", flush=True)
                except Exception as mongo_err:
                    print(f"  [-] Failed to write alert to MongoDB: {mongo_err}", flush=True)

            # Update Traffic Statistics
            try:
                stats_collection.update_one(
                    {"name": "global"},
                    {
                        "$set": {
                            "total_flows": total_flows,
                            "total_alerts": total_alerts,
                            "unique_ip_estimate": distinct_ip_estimate,
                            "last_updated": datetime.now(timezone.utc)
                        }
                    },
                    upsert=True
                )
            except Exception:
                pass

    except KeyboardInterrupt:
        print("\n[!] Kafka Consumer stopped by user.", flush=True)
    finally:
        consumer.close()
        mongo_client.close()
        print("[+] Kafka Consumer and MongoDB connections closed cleanly.", flush=True)


if __name__ == "__main__":
    main()
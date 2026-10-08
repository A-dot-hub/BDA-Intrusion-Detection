import asyncio
import csv
import json
import os
import sys
import time
import warnings
from datetime import datetime, timezone

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import pymongo

# Suppress deprecation warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

# Add the project root to sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from streaming.bloom_filter import BloomFilter
from streaming.flajolet_martin import FlajoletMartin

app = FastAPI(
    title="Real-Time Intrusion and Distributed Attack Detection System",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# MONGODB CONNECTION & INITIALIZATION
# --------------------------------------------------
MONGO_URI = "mongodb://localhost:27017/"
mongo_client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
db = mongo_client["IntrusionDetection"]
alerts_col = db["LiveAlerts"]
stats_col = db["TrafficStats"]
blacklist_col = db["Blacklist"]

malicious_ips = []
baseline_path = os.path.join(PROJECT_ROOT, "data", "processed", "historical_ip_baselines.csv")

try:
    mongo_client.server_info()
    for doc in blacklist_col.find({}, {"ip": 1}):
        if "ip" in doc:
            malicious_ips.append(doc["ip"])
    print(f"[*] Connected to MongoDB. Loaded {len(malicious_ips)} blacklisted IPs from database.")
except Exception as e:
    print(f"[-] MongoDB connection warning ({e}). Loading fallback from baselines...")

# Fallback to CSV if MongoDB collection was empty
if not malicious_ips and os.path.exists(baseline_path):
    try:
        docs_to_insert = []
        with open(baseline_path, "r", encoding="utf-8") as f:
            for line in f:
                parts = line.strip().split(",")
                if len(parts) == 2 and parts[1].strip().isdigit():
                    cnt = int(parts[1].strip())
                    if cnt > 5:
                        ip = parts[0].strip()
                        malicious_ips.append(ip)
                        docs_to_insert.append({
                            "ip": ip,
                            "historical_count": cnt,
                            "threat_level": "High"
                        })
        print(f"[+] Loaded {len(malicious_ips)} blacklisted IPs from MapReduce baselines.")
        if docs_to_insert:
            try:
                blacklist_col.insert_many(docs_to_insert, ordered=False)
            except Exception:
                pass
    except Exception as read_err:
        print(f"[-] Could not read baselines file: {read_err}")

# Initialize Global Bloom Filter & Flajolet-Martin
bf = BloomFilter(expected_items=max(len(malicious_ips), 1), false_positive_rate=0.01)
for ip in malicious_ips:
    bf.add(ip)

fm_estimator = FlajoletMartin(num_hashes=64)


# --------------------------------------------------
# HELPER FUNCTIONS
# --------------------------------------------------
def check_kafka_status():
    try:
        from kafka import KafkaConsumer
        consumer = KafkaConsumer(
            bootstrap_servers="localhost:9092",
            request_timeout_ms=1000
        )
        consumer.close()
        return "online"
    except Exception:
        return "offline"


def calculate_threat(source_ip, label, distinct_est):
    is_bloom_threat = bf.check(source_ip) if source_ip else False
    score = 0
    if is_bloom_threat:
        score += 40
    if label:
        lbl = label.upper()
        if lbl in ["DDOS", "BOTNET", "PORTSCAN", "INFILTRATION"]:
            score += 40
        elif lbl != "BENIGN":
            score += 30
    if distinct_est > 500:
        score += 20

    final_score = min(score, 100)
    level = "LOW"
    if final_score >= 80:
        level = "CRITICAL"
    elif final_score >= 60:
        level = "HIGH"
    elif final_score >= 30:
        level = "MEDIUM"

    is_threat = is_bloom_threat or (label.upper() not in ["", "BENIGN"])
    return is_threat, final_score, level


# --------------------------------------------------
# REST ENDPOINTS
# --------------------------------------------------
@app.get("/")
async def root():
    return {
        "system": "Real-Time Intrusion and Distributed Attack Detection System",
        "status": "running",
        "kafka_status": check_kafka_status(),
        "database": "MongoDB IntrusionDetection",
        "blacklisted_ips_loaded": len(malicious_ips)
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "blacklist_size": len(malicious_ips),
        "bloom_filter_bits": bf.size,
        "bloom_filter_hashes": bf.hash_count,
        "kafka_status": check_kafka_status()
    }


@app.get("/api/stats")
async def get_stats():
    stats = None
    try:
        stats = stats_col.find_one({"name": "global"})
    except Exception:
        pass

    if not stats:
        return {
            "total_flows": 0,
            "total_alerts": 0,
            "unique_ip_estimate": fm_estimator.estimate()
        }

    return {
        "total_flows": stats.get("total_flows", 0),
        "total_alerts": stats.get("total_alerts", 0),
        "unique_ip_estimate": stats.get("unique_ip_estimate", fm_estimator.estimate())
    }


@app.get("/api/alerts")
async def get_alerts():
    results = []
    try:
        cursor = alerts_col.find({}).sort("created_at", -1).limit(50)
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if "created_at" in doc and isinstance(doc["created_at"], datetime):
                doc["created_at"] = doc["created_at"].isoformat()
            results.append(doc)
    except Exception as e:
        print(f"[-] Error fetching alerts: {e}")
    return results


@app.get("/api/blacklist")
async def get_blacklist():
    results = []
    try:
        cursor = blacklist_col.find({}).limit(100)
        for doc in cursor:
            results.append({
                "ip": doc.get("ip", ""),
                "historical_count": doc.get("historical_count", 0),
                "threat_level": doc.get("threat_level", "High")
            })
    except Exception:
        pass

    if not results and malicious_ips:
        for ip in malicious_ips[:100]:
            results.append({
                "ip": ip,
                "historical_count": 15,
                "threat_level": "High"
            })
    return results


@app.get("/api/network/graph")
async def get_network_graph():
    return {
        "nodes": [
            {"id": "104.16.207.165", "label": "104.16.207.165 (C2)", "group": "C2 Server", "val": 20},
            {"id": "10.0.0.1", "label": "10.0.0.1 (Bot)", "group": "Compromised Bot", "val": 10},
            {"id": "10.0.0.2", "label": "10.0.0.2 (Bot)", "group": "Compromised Bot", "val": 10},
            {"id": "10.0.0.3", "label": "10.0.0.3 (Bot)", "group": "Compromised Bot", "val": 10},
            {"id": "10.0.0.4", "label": "10.0.0.4 (Bot)", "group": "Compromised Bot", "val": 10},
            {"id": "10.0.0.5", "label": "10.0.0.5 (Bot)", "group": "Compromised Bot", "val": 10},
            {"id": "192.168.10.5", "label": "192.168.10.5 (Host)", "group": "Normal Host", "val": 8},
            {"id": "192.168.10.8", "label": "192.168.10.8 (Host)", "group": "Normal Host", "val": 8},
            {"id": "192.168.10.9", "label": "192.168.10.9 (Host)", "group": "Normal Host", "val": 8},
            {"id": "192.168.10.14", "label": "192.168.10.14 (Host)", "group": "Normal Host", "val": 8},
            {"id": "192.168.10.16", "label": "192.168.10.16 (Host)", "group": "Normal Host", "val": 8},
            {"id": "192.168.10.25", "label": "192.168.10.25 (Host)", "group": "Normal Host", "val": 8},
        ],
        "links": [
            {"source": "10.0.0.1", "target": "104.16.207.165"},
            {"source": "10.0.0.2", "target": "104.16.207.165"},
            {"source": "10.0.0.3", "target": "104.16.207.165"},
            {"source": "10.0.0.4", "target": "104.16.207.165"},
            {"source": "10.0.0.5", "target": "104.16.207.165"},
            {"source": "10.0.0.1", "target": "10.0.0.2"},
            {"source": "10.0.0.2", "target": "10.0.0.3"},
            {"source": "192.168.10.5", "target": "192.168.10.8"},
            {"source": "192.168.10.8", "target": "192.168.10.9"},
            {"source": "192.168.10.14", "target": "192.168.10.16"},
            {"source": "192.168.10.16", "target": "192.168.10.25"}
        ],
        "c2_server": "104.16.207.165",
        "communities_count": 3
    }


# --------------------------------------------------
# WEBSOCKET STREAMING ENDPOINT
# --------------------------------------------------
@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[+] Dashboard connected to WebSocket stream.", flush=True)

    stream_path = os.path.join(PROJECT_ROOT, "data", "processed", "cicids2017_stream_processed.csv")
    kafka_consumer = None

    try:
        from kafka import KafkaConsumer
        group_id = f"dashboard-{int(time.time()*1000)}"
        kafka_consumer = KafkaConsumer(
            "network-traffic",
            bootstrap_servers="localhost:9092",
            value_deserializer=lambda v: json.loads(v.decode("utf-8")),
            auto_offset_reset="latest",
            enable_auto_commit=True,
            group_id=group_id,
            consumer_timeout_ms=50
        )
        print("[+] WebSocket consumer connected to Kafka.", flush=True)
    except Exception as kafka_err:
        print(f"[-] Kafka consumer initialization skipped: {kafka_err}", flush=True)
        kafka_consumer = None

    count = 0
    idle_ticks = 0
    csv_file = None
    csv_reader = None

    try:
        while True:
            got_kafka_item = False

            # 1. Try polling Kafka
            if kafka_consumer is not None:
                try:
                    records = kafka_consumer.poll(timeout_ms=50)
                    if records:
                        for topic_partition, messages in records.items():
                            for msg in messages:
                                event = msg.value
                                if not isinstance(event, dict):
                                    continue

                                got_kafka_item = True
                                idle_ticks = 0
                                count += 1

                                source_ip = event.get("source_ip", "").strip()
                                dest_ip = event.get("destination_ip", "").strip()
                                source_port = event.get("source_port", "")
                                dest_port = event.get("destination_port", "")
                                protocol = event.get("protocol", "")
                                label = event.get("label", "BENIGN")
                                timestamp = event.get("timestamp", datetime.now().strftime("%H:%M:%S"))

                                if source_ip:
                                    fm_estimator.add(source_ip)
                                distinct_ip_estimate = fm_estimator.estimate()

                                is_threat, threat_score, threat_level = calculate_threat(
                                    source_ip, label, distinct_ip_estimate
                                )

                                packet_data = {
                                    "id": count,
                                    "timestamp": timestamp,
                                    "source_ip": source_ip,
                                    "source_port": source_port,
                                    "destination_ip": dest_ip,
                                    "destination_port": dest_port,
                                    "protocol": protocol,
                                    "label": label,
                                    "threat_detected": is_threat,
                                    "threat_score": threat_score,
                                    "threat_level": threat_level,
                                    "fm_estimate": distinct_ip_estimate,
                                    "stream_source": "kafka"
                                }

                                await websocket.send_json(packet_data)
                                await asyncio.sleep(0.01)
                except Exception as poll_err:
                    pass

            # 2. If no Kafka traffic currently active, stream from CSV dataset playback
            if not got_kafka_item:
                idle_ticks += 1
                if idle_ticks >= 4:
                    if csv_file is None and os.path.exists(stream_path):
                        csv_file = open(stream_path, "r", encoding="utf-8", errors="replace")
                        csv_reader = csv.DictReader(csv_file)

                    if csv_reader is not None:
                        try:
                            row = next(csv_reader)
                        except StopIteration:
                            csv_file.seek(0)
                            csv_reader = csv.DictReader(csv_file)
                            row = next(csv_reader)

                        count += 1
                        source_ip = row.get("Source IP", "").strip()
                        dest_ip = row.get("Destination IP", "").strip()
                        source_port = row.get("Source Port", "").strip()
                        dest_port = row.get("Destination Port", "").strip()
                        protocol = row.get("Protocol", "").strip()
                        label = row.get("Label", "BENIGN").strip()
                        timestamp = row.get("Timestamp", "").strip()

                        if source_ip:
                            fm_estimator.add(source_ip)
                        distinct_ip_estimate = fm_estimator.estimate()

                        is_threat, threat_score, threat_level = calculate_threat(
                            source_ip, label, distinct_ip_estimate
                        )

                        packet_data = {
                            "id": count,
                            "timestamp": timestamp,
                            "source_ip": source_ip,
                            "source_port": source_port,
                            "destination_ip": dest_ip,
                            "destination_port": dest_port,
                            "protocol": protocol,
                            "label": label,
                            "threat_detected": is_threat,
                            "threat_score": threat_score,
                            "threat_level": threat_level,
                            "fm_estimate": distinct_ip_estimate,
                            "stream_source": "dataset_playback"
                        }

                        await websocket.send_json(packet_data)
                        await asyncio.sleep(0.06)
                else:
                    await asyncio.sleep(0.05)

    except WebSocketDisconnect:
        print("[-] Dashboard disconnected from WebSocket stream.", flush=True)
    except Exception as e:
        print(f"[-] Stream error: {e}", flush=True)
    finally:
        if csv_file is not None:
            try:
                csv_file.close()
            except Exception:
                pass
        if kafka_consumer is not None:
            try:
                kafka_consumer.close()
            except Exception:
                pass
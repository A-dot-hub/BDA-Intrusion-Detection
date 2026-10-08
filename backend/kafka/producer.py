import csv
import json
import os
import sys
import time
import warnings

from kafka import KafkaProducer
from kafka.errors import KafkaError

# Suppress deprecation warnings from third-party libraries
warnings.filterwarnings("ignore", category=DeprecationWarning)

KAFKA_SERVER = "localhost:9092"
TOPIC_NAME = "network-traffic"


def create_producer(retries=5, delay=2):
    for attempt in range(1, retries + 1):
        try:
            producer = KafkaProducer(
                bootstrap_servers=KAFKA_SERVER,
                value_serializer=lambda value: json.dumps(value).encode("utf-8"),
                acks="all",
                retries=3,
                request_timeout_ms=10000,
            )
            return producer
        except KafkaError as ke:
            print(f"[-] Kafka error at {KAFKA_SERVER} (attempt {attempt}/{retries}): {ke}", flush=True)
            if attempt < retries:
                time.sleep(delay)
        except Exception as e:
            print(f"[-] Error connecting to Kafka: {e}", flush=True)
            if attempt < retries:
                time.sleep(delay)
    return None


def get_dataset_path():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(
        os.path.join(
            current_dir,
            "..",
            "..",
            "data",
            "processed",
            "cicids2017_stream_processed.csv"
        )
    )


def main():
    print("[*] Starting Kafka Producer...", flush=True)

    producer = create_producer()
    if not producer:
        print("[ERROR] Could not connect to Kafka. Please ensure Kafka is running on localhost:9092.", flush=True)
        print("[TIP] You can start Kafka using: .\\scripts\\start_kafka.bat", flush=True)
        sys.exit(1)

    dataset_path = get_dataset_path()
    print(f"[*] Dataset: {dataset_path}", flush=True)

    if not os.path.exists(dataset_path):
        print(f"[ERROR] Dataset not found at {dataset_path}.", flush=True)
        return

    print("[+] Connected to Kafka.", flush=True)
    print(f"[+] Streaming live traffic to topic: {TOPIC_NAME}", flush=True)

    count = 0
    loop_count = 0

    try:
        while True:
            with open(
                dataset_path,
                "r",
                encoding="utf-8",
                errors="replace"
            ) as file:
                reader = csv.DictReader(file)

                for row in reader:
                    event = {
                        "id": count,
                        "flow_id": row.get("Flow ID", ""),
                        "source_ip": row.get("Source IP", "").strip(),
                        "source_port": row.get("Source Port", "").strip(),
                        "destination_ip": row.get("Destination IP", "").strip(),
                        "destination_port": row.get("Destination Port", "").strip(),
                        "protocol": row.get("Protocol", "").strip(),
                        "timestamp": row.get("Timestamp", "").strip(),
                        "label": row.get("Label", "").strip()
                    }

                    producer.send(TOPIC_NAME, value=event)
                    producer.flush()

                    print(
                        f"[STREAM #{count}] {event['source_ip']}:{event['source_port']} -> "
                        f"{event['destination_ip']}:{event['destination_port']} "
                        f"[{event['protocol']}] | Label: {event['label']}",
                        flush=True
                    )

                    count += 1
                    time.sleep(0.08)

            loop_count += 1
            print(f"[*] Completed dataset pass {loop_count}. Looping for continuous stream...", flush=True)

    except KeyboardInterrupt:
        print("\n[!] Kafka Producer stopped by user.", flush=True)
    finally:
        producer.close()
        print("[+] Kafka Producer closed cleanly.", flush=True)


if __name__ == "__main__":
    main()
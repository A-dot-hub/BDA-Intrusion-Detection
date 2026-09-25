import asyncio
import csv
import os
import sys
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import pymongo

# Add the root directory to Python's path so it can find the streaming folder
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import your actual academic algorithms
from streaming.bloom_filter import BloomFilter
from streaming.flajolet_martin import FlajoletMartin

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to MongoDB Serving Layer (with graceful fallback if Mongo is offline)
malicious_ips = []
alerts_col = None
blacklist_col = None

try:
    client = pymongo.MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=1500)
    client.server_info()
    db = client["IntrusionDetection"]
    alerts_col = db["LiveAlerts"]
    blacklist_col = db["Blacklist"]
    malicious_ips = [doc["ip"] for doc in blacklist_col.find({}, {"ip": 1})]
    print(f"[*] Connected to MongoDB. Loaded {len(malicious_ips)} blacklisted IPs.")
except Exception as e:
    print(f"[-] MongoDB offline or unreachable ({e}). Loading blacklisted IPs directly from MapReduce baselines...")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    baseline_path = os.path.join(script_dir, "..", "data", "processed", "historical_ip_baselines.csv")
    try:
        with open(baseline_path, 'r') as f:
            for line in f:
                parts = line.strip().split(',')
                if len(parts) == 2 and parts[1].strip().isdigit():
                    if int(parts[1].strip()) > 5:
                        malicious_ips.append(parts[0].strip())
        print(f"[+] Loaded {len(malicious_ips)} blacklisted IPs from MapReduce baselines.")
    except Exception as read_err:
        print(f"[-] Could not read baselines file: {read_err}")

print("[*] Initializing Big Data Stream Engine...")

# 1. Initialize Bloom Filter with NoSQL/Baseline Data
bf = BloomFilter(expected_items=max(len(malicious_ips), 1), false_positive_rate=0.01)
for ip in malicious_ips:
    bf.add(ip)

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[+] Dashboard connected to WebSocket stream.")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    stream_path = os.path.join(script_dir, "..", "data", "processed", "cicids2017_stream_processed.csv")
    
    # 2. Initialize Flajolet-Martin
    fm_estimator = FlajoletMartin(num_hashes=64)
    
    try:
        with open(stream_path, 'r') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                await asyncio.sleep(0.05) 
                
                source_ip = row.get("Source IP", "")
                timestamp = row.get("Timestamp", "")
                
                # Bloom Filter Check
                is_threat = bf.check(source_ip)
                
                # Flajolet-Martin Distinct Tracking
                fm_estimator.add(source_ip)
                distinct_ip_estimate = fm_estimator.estimate()
                
                packet_data = {
                    "id": count,
                    "timestamp": timestamp,
                    "source_ip": source_ip,
                    "destination_ip": row.get("Destination IP", ""),
                    "protocol": row.get("Protocol", ""),
                    "threat_detected": is_threat,
                    "fm_estimate": distinct_ip_estimate
                }
                
                if is_threat and alerts_col is not None:
                    try:
                        alerts_col.insert_one({
                            "ip": source_ip, 
                            "timestamp": timestamp, 
                            "type": "Bloom Filter Match",
                            "status": "Blocked"
                        })
                    except Exception:
                        pass
                
                await websocket.send_json(packet_data)
                count += 1
                
    except FileNotFoundError:
        await websocket.send_json({"error": "Stream dataset not found"})
    except Exception as e:
        print(f"[-] Stream error: {e}")
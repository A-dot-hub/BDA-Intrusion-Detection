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

# Connect to MongoDB Serving Layer
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["IntrusionDetection"]
alerts_col = db["LiveAlerts"]
blacklist_col = db["Blacklist"]

print("[*] Initializing Big Data Stream Engine...")

# 1. Initialize Bloom Filter with NoSQL Data
malicious_ips = [doc["ip"] for doc in blacklist_col.find({}, {"ip": 1})]
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
                
                if is_threat:
                    alerts_col.insert_one({
                        "ip": source_ip, 
                        "timestamp": timestamp, 
                        "type": "Bloom Filter Match",
                        "status": "Blocked"
                    })
                
                await websocket.send_json(packet_data)
                count += 1
                
    except FileNotFoundError:
        await websocket.send_json({"error": "Stream dataset not found"})
    except Exception as e:
        print(f"[-] Stream error: {e}")
import asyncio
import csv
import os
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import pymongo

app = FastAPI()

# Allow the frontend dashboard to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to MongoDB NoSQL Serving Layer
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["IntrusionDetection"]
alerts_col = db["LiveAlerts"]
blacklist_col = db["Blacklist"]

# Load NoSQL Blacklist into a fast-lookup Python Set (Mimicking your Bloom Filter)
print("[*] Loading Blacklist into memory...")
blacklist_set = set(doc["ip"] for doc in blacklist_col.find({}, {"ip": 1}))

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[+] Dashboard connected to WebSocket stream.")
    
    # Point to the 8-feature stream dataset
    script_dir = os.path.dirname(os.path.abspath(__file__))
    stream_path = os.path.join(script_dir, "..", "data", "processed", "cicids2017_stream_processed.csv")
    
    try:
        with open(stream_path, 'r') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                # Delay to simulate live network traffic speed
                await asyncio.sleep(0.05) 
                
                source_ip = row.get("Source IP", "")
                timestamp = row.get("Timestamp", "")
                
                # Instant Threat Detection Check
                is_threat = source_ip in blacklist_set
                
                packet_data = {
                    "id": count,
                    "timestamp": timestamp,
                    "source_ip": source_ip,
                    "destination_ip": row.get("Destination IP", ""),
                    "protocol": row.get("Protocol", ""),
                    "threat_detected": is_threat
                }
                
                if is_threat:
                    # Log active attacks to NoSQL
                    alerts_col.insert_one({
                        "ip": source_ip, 
                        "timestamp": timestamp, 
                        "type": "Blacklist Match",
                        "status": "Blocked"
                    })
                
                # Broadcast packet to the frontend
                await websocket.send_json(packet_data)
                count += 1
                
    except FileNotFoundError:
        await websocket.send_json({"error": "Stream dataset not found in data/processed/"})
    except Exception as e:
        print(f"[-] Stream error: {e}")
import asyncio
import csv
import os
import sys
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pymongo
import random
import networkx as nx
from networkx.algorithms.community import greedy_modularity_communities

# Add the root directory to Python's path so it can find the streaming folder
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import actual academic algorithms
from streaming.bloom_filter import BloomFilter
from streaming.flajolet_martin import FlajoletMartin

app = FastAPI(title="NetSentinel Big Data Analytics API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to MongoDB Serving Layer
try:
    client = pymongo.MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=2000)
    db = client["IntrusionDetection"]
    alerts_col = db["LiveAlerts"]
    blacklist_col = db["Blacklist"]
    db.command("ping")
    mongo_available = True
    print("[+] Connected to MongoDB Serving Layer.")
except Exception as e:
    mongo_available = False
    print(f"[-] MongoDB connection warning: {e}")

print("[*] Initializing Big Data Stream Engine...")

# 1. Initialize Bloom Filter with NoSQL Data
malicious_ips = []
if mongo_available:
    try:
        malicious_ips = [doc["ip"] for doc in blacklist_col.find({}, {"ip": 1})]
    except Exception:
        pass

bf = BloomFilter(expected_items=max(len(malicious_ips), 1), false_positive_rate=0.01)
for ip in malicious_ips:
    bf.add(ip)

# REST API Endpoints
@app.get("/api/health")
def health_check():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    stream_path = os.path.join(script_dir, "..", "data", "processed", "cicids2017_stream_processed.csv")
    dataset_exists = os.path.exists(stream_path)
    
    return {
        "status": "online",
        "engine": "NetSentinel Big Data Engine",
        "mongodb_connected": mongo_available,
        "dataset_available": dataset_exists,
        "blacklist_size": len(malicious_ips),
        "bloom_filter_bits": bf.size,
        "bloom_filter_hashes": bf.hash_count
    }

@app.get("/api/alerts")
def get_alerts(limit: int = 50):
    if not mongo_available:
        return []
    try:
        alerts = list(alerts_col.find({}, {"_id": 0}).sort("_id", -1).limit(limit))
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/blacklist")
def get_blacklist():
    if not mongo_available:
        return []
    try:
        blacklist = list(blacklist_col.find({}, {"_id": 0}))
        return blacklist
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/network/graph")
def get_network_graph():
    """Generates NetworkX Greedy Modularity Community Graph data for Frontend visualization"""
    G = nx.Graph()
    normal_ips = [f"192.168.1.{i}" for i in range(1, 15)]
    for _ in range(25):
        src = random.choice(normal_ips)
        dst = random.choice(normal_ips)
        if src != dst:
            G.add_edge(src, dst)

    c2_server = "104.16.207.165"
    bot_ips = [f"10.0.0.{i}" for i in range(1, 10)]
    for bot in bot_ips:
        G.add_edge(bot, c2_server)
    for _ in range(8):
        G.add_edge(random.choice(bot_ips), random.choice(bot_ips))

    communities = list(greedy_modularity_communities(G))
    
    nodes = []
    for node in G.nodes():
        is_c2 = (node == c2_server)
        is_bot = node in bot_ips
        nodes.append({
            "id": node,
            "label": node,
            "group": "C2 Server" if is_c2 else ("Compromised Bot" if is_bot else "Normal Host"),
            "val": 15 if is_c2 else (10 if is_bot else 5)
        })

    links = []
    for u, v in G.edges():
        links.append({"source": u, "target": v})

    return {
        "nodes": nodes,
        "links": links,
        "c2_server": c2_server,
        "communities_count": len(communities)
    }

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[+] Dashboard connected to WebSocket stream.")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    stream_path = os.path.join(script_dir, "..", "data", "processed", "cicids2017_stream_processed.csv")
    
    # Initialize Flajolet-Martin estimator per session
    fm_estimator = FlajoletMartin(num_hashes=64)
    
    try:
        with open(stream_path, 'r', encoding='utf-8', errors='replace') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                await asyncio.sleep(0.04) # controlled stream tick
                
                flow_id = row.get("Flow ID", f"FLOW-{count}")
                source_ip = row.get("Source IP", "0.0.0.0")
                source_port = row.get("Source Port", "0")
                destination_ip = row.get("Destination IP", "0.0.0.0")
                destination_port = row.get("Destination Port", "0")
                protocol = row.get("Protocol", "6")
                timestamp = row.get("Timestamp", "")
                label = row.get("Label", "BENIGN")
                
                # Bloom Filter Membership Check
                is_threat = bf.check(source_ip)
                detection_method = "Bloom Filter Match" if is_threat else "None"
                
                # Flajolet-Martin Distinct IP Tracking
                fm_estimator.add(source_ip)
                distinct_ip_estimate = fm_estimator.estimate()
                
                packet_data = {
                    "id": count,
                    "flow_id": flow_id,
                    "timestamp": timestamp,
                    "source_ip": source_ip,
                    "source_port": source_port,
                    "destination_ip": destination_ip,
                    "destination_port": destination_port,
                    "protocol": protocol,
                    "label": label,
                    "threat_detected": is_threat,
                    "detection_method": detection_method,
                    "fm_estimate": distinct_ip_estimate
                }
                
                if is_threat and mongo_available:
                    try:
                        alerts_col.insert_one({
                            "ip": source_ip, 
                            "timestamp": timestamp, 
                            "type": "Bloom Filter Match",
                            "status": "Blocked",
                            "destination_ip": destination_ip,
                            "protocol": protocol
                        })
                    except Exception:
                        pass
                
                await websocket.send_json(packet_data)
                count += 1
                
    except FileNotFoundError:
        await websocket.send_json({"error": "Stream dataset cicids2017_stream_processed.csv not found"})
    except Exception as e:
        print(f"[-] Stream error: {e}")
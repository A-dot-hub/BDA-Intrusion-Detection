import pymongo
import os

# 1. Connect to MongoDB (Update the URI if you are using MongoDB Atlas)
client = pymongo.MongoClient("mongodb://localhost:27017/")

# 2. Create the Database
db = client["IntrusionDetection"]

# 3. Create the Collections
blacklist_col = db["Blacklist"]
alerts_col = db["LiveAlerts"]

print("[*] Connected to MongoDB.")
print("[*] Initializing 'IntrusionDetection' database...")

# Clear out any old data for a fresh start during testing
blacklist_col.delete_many({})
alerts_col.delete_many({})

# 4. Migrate MapReduce Baselines into NoSQL Blacklist
script_dir = os.path.dirname(os.path.abspath(__file__))
baseline_path = os.path.join(script_dir, "..", "data", "processed", "historical_ip_baselines.csv")

blacklist_data = []

print("[*] Reading MapReduce baselines...")
try:
    with open(baseline_path, 'r') as f:
        for line in f:
            parts = line.strip().split(',')
            if len(parts) == 2 and parts[1].lower() != 'count':
                ip, count = parts[0], int(parts[1])
                
                # Filtering for malicious IPs based on our threshold
                if count > 5:
                    blacklist_data.append({
                        "ip": ip,
                        "historical_count": count,
                        "threat_level": "High"
                    })
                    
    # Insert the data in a fast batch operation
    if blacklist_data:
        blacklist_col.insert_many(blacklist_data)
        print(f"[+] Successfully loaded {len(blacklist_data)} malicious IPs into the NoSQL Blacklist collection.")
        
except FileNotFoundError:
    print(f"[-] Error: Could not find {baseline_path}")

# Create an index on the IP field for sub-millisecond lookups
blacklist_col.create_index("ip", unique=True)
print("[+] Database setup complete. Ready for real-time streaming.")
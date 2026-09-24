import csv
import math
import hashlib
import csv
import math
import hashlib
import os
class BloomFilter:
    def __init__(self, expected_items, false_positive_rate=0.01):
        # Calculate optimal size of bit array (m) and number of hash functions (k)
        self.size = self.get_size(expected_items, false_positive_rate)
        self.hash_count = self.get_hash_count(self.size, expected_items)
        self.bit_array = [0] * self.size
        print(f"[+] Initialized Bloom Filter with {self.size} bits and {self.hash_count} hash functions.")

    def add(self, item):
        for i in range(self.hash_count):
            digest = self._hash(item, i) % self.size
            self.bit_array[digest] = 1

    def check(self, item):
        for i in range(self.hash_count):
            digest = self._hash(item, i) % self.size
            if self.bit_array[digest] == 0:
                return False
        return True

    def _hash(self, item, seed):
        # Using hashlib's MD5 to generate deterministic hashes based on a seed
        h = hashlib.md5(f"{seed}_{item}".encode())
        return int(h.hexdigest(), 16)

    @staticmethod
    def get_size(n, p):
        return int(-(n * math.log(p)) / (math.log(2)**2))

    @staticmethod
    def get_hash_count(m, n):
        return int((m / n) * math.log(2))

if __name__ == "__main__":
    # 1. Load the Historical Baseline data
    script_dir = os.path.dirname(os.path.abspath(__file__))
    baseline_path = os.path.join(script_dir, "..", "data", "processed", "historical_ip_baselines.csv")
    
    malicious_ips = []
    
    print("[*] Loading IP Baselines from MapReduce output...")
    try:
        with open(baseline_path, 'r') as f:
            for line in f:
                parts = line.strip().split(',')
                if len(parts) == 2:
                    # Skip the header row if it exists
                    if parts[1].lower() == 'count':
                        continue
                        
                    ip, count = parts[0], int(parts[1])
                    
                    # I lowered this threshold to 5 so it picks up the IPs from your sample!
                    if count > 5:
                        malicious_ips.append(ip)
    except FileNotFoundError:
        print(f"[-] Error: Could not find {baseline_path}. Make sure you moved it to data/processed!")
        exit()

    print(f"[+] Found {len(malicious_ips)} highly active IPs to blacklist.")

    # 2. Populate the Bloom Filter
    # We set expected items to length of malicious_ips, with a 1% false positive rate
    bf = BloomFilter(expected_items=max(len(malicious_ips), 1), false_positive_rate=0.01)
    
    for ip in malicious_ips:
        bf.add(ip)

    # 3. Simulate checking a real-time stream
    print("\n[*] Simulating real-time IP checks...")
    test_ips = ["1.1.70.73", "192.168.10.5", "104.16.207.165", "8.8.8.8"]
    
    # Let's add a known bad one from the list to test
    if malicious_ips:
         test_ips.append(malicious_ips[0])

    for ip in test_ips:
        if bf.check(ip):
            print(f"[ALERT] Traffic from {ip} flagged by Bloom Filter! (Sub-millisecond lookup)")
        else:
            print(f"[OK] Traffic from {ip} is clear.")
import hashlib
import random
import statistics

class FlajoletMartin:
    def __init__(self, num_hashes=64): # Increased to 64 hashes for better distribution
        self.num_hashes = num_hashes
        self.max_trailing_zeros = [0] * num_hashes

    def _hash(self, item, seed):
        h = hashlib.md5(f"{seed}_{item}".encode())
        return int(h.hexdigest(), 16)

    def _trailing_zeros(self, num):
        if num == 0:
            return 0
        binary_str = bin(num)[2:]
        return len(binary_str) - len(binary_str.rstrip('0'))

    def add(self, item):
        for i in range(self.num_hashes):
            hash_val = self._hash(item, i)
            zeros = self._trailing_zeros(hash_val)
            if zeros > self.max_trailing_zeros[i]:
                self.max_trailing_zeros[i] = zeros

    def estimate(self):
        estimates = [2 ** r for r in self.max_trailing_zeros]
        # Use MEDIAN instead of MEAN to eliminate extreme exponential outliers
        median_estimate = statistics.median(estimates)
        return int(median_estimate / 0.77351)

if __name__ == "__main__":
    print("[*] Initializing Flajolet-Martin Stream Analyzer...")
    fm = FlajoletMartin(num_hashes=64)
    
    print("\n[*] Simulating Normal Traffic Window (10 unique IPs making 500 requests total)...")
    normal_ips = [f"192.168.1.{i}" for i in range(10)]
    for _ in range(500):
        fm.add(random.choice(normal_ips))
        
    print(f"    -> Actual Distinct IPs: {len(normal_ips)}")
    print(f"    -> Flajolet-Martin Estimate: {fm.estimate()}")
    
    fm = FlajoletMartin(num_hashes=64)
    
    print("\n[*] Simulating DDoS Attack Window (Botnet flood)...")
    actual_ddos_count = 1000
    
    for i in range(actual_ddos_count):
        spoofed_ip = f"10.0.{random.randint(0, 255)}.{i % 255}"
        fm.add(spoofed_ip)

    print(f"    -> Actual Distinct IPs: {actual_ddos_count}")
    print(f"    -> Flajolet-Martin Estimate: {fm.estimate()}")
    
    threshold = 500
    if fm.estimate() > threshold:
        print(f"\n[CRITICAL ALERT] Distinct IP threshold ({threshold}) exceeded! Volumetric DDoS attack detected!")
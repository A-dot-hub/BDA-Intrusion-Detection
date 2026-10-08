-- ====================================================================
-- Real-Time Intrusion and Distributed Attack Detection System
-- Export Hive Baselines to CSV for NoSQL & Bloom Filter Ingestion
-- ====================================================================

USE ids_analytics;

-- Export malicious IPs with threshold count > 5 to local directory
INSERT OVERWRITE LOCAL DIRECTORY '/tmp/hive_ip_baselines'
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
SELECT 
    source_ip AS ip,
    COUNT(*) AS count
FROM network_traffic_orc
WHERE UPPER(label) != 'BENIGN'
GROUP BY source_ip
HAVING COUNT(*) > 5
ORDER BY count DESC;


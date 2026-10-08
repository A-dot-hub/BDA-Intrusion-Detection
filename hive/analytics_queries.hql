-- ====================================================================
-- Real-Time Intrusion and Distributed Attack Detection System
-- HiveQL Batch Analytics Suite
-- ====================================================================

USE ids_analytics;

-- --------------------------------------------------------------------
-- QUERY 1: Malicious IP Baseline Generation (Feeds Bloom Filter & NoSQL)
-- Identifies recurrent malicious IP addresses with request count > 5.
-- Translates to MapReduce: Map(source_ip -> 1) | Reduce(SUM(1) HAVING > 5)
-- --------------------------------------------------------------------
SELECT 
    source_ip AS ip,
    COUNT(*) AS request_count,
    'High' AS threat_level
FROM network_traffic_orc
WHERE UPPER(label) != 'BENIGN'
GROUP BY source_ip
HAVING COUNT(*) > 5
ORDER BY request_count DESC;


-- --------------------------------------------------------------------
-- QUERY 2: Volumetric Attack Distribution (Forensic Breakdown)
-- Calculates absolute flow volume and percentage share per attack vector.
-- --------------------------------------------------------------------
SELECT 
    label AS attack_type,
    COUNT(*) AS total_flows,
    ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) AS percentage_share
FROM network_traffic_orc
GROUP BY label
ORDER BY total_flows DESC;


-- --------------------------------------------------------------------
-- QUERY 3: Target Port Vulnerability & Service Targeting Analysis
-- Identifies the most frequently targeted destination ports during attacks.
-- --------------------------------------------------------------------
SELECT 
    destination_port,
    CASE 
        WHEN protocol = 6 THEN 'TCP (6)'
        WHEN protocol = 17 THEN 'UDP (17)'
        ELSE CAST(protocol AS STRING)
    END AS transport_protocol,
    label AS attack_label,
    COUNT(*) AS attack_hits
FROM network_traffic_orc
WHERE UPPER(label) != 'BENIGN'
GROUP BY destination_port, protocol, label
ORDER BY attack_hits DESC
LIMIT 20;


-- --------------------------------------------------------------------
-- QUERY 4: Distributed Attack & Botnet Fan-Out Detection
-- Detects source IPs launching distributed probes across multiple distinct hosts.
-- --------------------------------------------------------------------
SELECT 
    source_ip,
    COUNT(DISTINCT destination_ip) AS distinct_targets,
    COUNT(*) AS total_packets,
    'Distributed Scanner / Botnet' AS threat_classification
FROM network_traffic_orc
GROUP BY source_ip
HAVING COUNT(DISTINCT destination_ip) > 5
ORDER BY distinct_targets DESC;


-- --------------------------------------------------------------------
-- QUERY 5: Transport Layer Protocol Breakdown (TCP vs UDP Flood Analysis)
-- Evaluates the protocol distribution of attack traffic versus benign traffic.
-- --------------------------------------------------------------------
SELECT 
    CASE 
        WHEN protocol = 6 THEN 'TCP'
        WHEN protocol = 17 THEN 'UDP'
        ELSE 'OTHER'
    END AS protocol_name,
    COUNT(CASE WHEN UPPER(label) != 'BENIGN' THEN 1 END) AS malicious_flows,
    COUNT(CASE WHEN UPPER(label) = 'BENIGN' THEN 1 END) AS benign_flows,
    COUNT(*) AS total_flows,
    ROUND(COUNT(CASE WHEN UPPER(label) != 'BENIGN' THEN 1 END) * 100.0 / COUNT(*), 2) AS attack_ratio_pct
FROM network_traffic_orc
GROUP BY protocol;


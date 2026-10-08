# Apache Hive & HiveQL Analytics Module

This module implements the **Batch Analytical & Forensics Layer** of the Intrusion and Distributed Attack Detection System using **HiveQL (HQL)** over the CICIDS2017 dataset.

---

## 1. Architecture: The Batch Layer (Lambda Architecture)

```
+-------------------------------------------------------------+
|          Raw Network Traffic Logs (HDFS / CSV)              |
|        /intrusion_detection/data/raw/cicids2017.csv         |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|             Apache Hive Data Warehouse (HiveQL)             |
|   - External Table (raw_network_traffic)                    |
|   - Partitioned ORC Managed Table (network_traffic_orc)     |
|   - Columnar Snappy compression + Bloom Indexing            |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|               Analytical MapReduce / Tez Jobs               |
|   [Query 1] Malicious IP Baseline Extraction                |
|   [Query 2] Volumetric Attack Distribution (DDoS/Hulk/etc)  |
|   [Query 3] Port Vulnerability & Service Targeting          |
|   [Query 4] Botnet & Distributed Scanner Fan-Out            |
|   [Query 5] Transport Protocol Attack Proportions (TCP/UDP) |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                 Serving & Real-Time Sync                    |
|   - Exported to data/processed/historical_ip_baselines.csv  |
|   - Synchronized to MongoDB 'IntrusionDetection.Blacklist'  |
|   - Real-time Bloom Filter in Kafka Consumer updated        |
+-------------------------------------------------------------+
```

---

## 2. File Organization

- [`schema.hql`](schema.hql): Hive DDL script defining the database `ids_analytics`, external text table, and partitioned ORC table.
- [`analytics_queries.hql`](analytics_queries.hql): 5 production analytical queries covering baseline extraction, attack volume, port targeting, and botnet detection.
- [`export_baselines.hql`](export_baselines.hql): HiveQL export script to write aggregated malicious IPs to CSV format.
- [`run_hive.py`](run_hive.py): Hybrid runner that supports both native Apache Hive CLI and high-performance embedded SQL execution directly against local data.

---

## 3. How to Run HiveQL Queries

### Option A: Via Windows Batch Scripts (1-Click)
- **Run All Analytics Queries**:
  ```cmd
  .\scripts\run_hive_queries.bat
  ```
- **Export Baselines & Sync to MongoDB**:
  ```cmd
  .\scripts\export_hive_baselines.bat
  ```
- **Launch Interactive HiveQL Shell**:
  ```cmd
  .\scripts\hive_interactive_shell.bat
  ```

### Option B: Via Python CLI
- **Run a specific query (1 to 5)**:
  ```bash
  python hive/run_hive.py --query 2
  ```
- **Run all preset queries**:
  ```bash
  python hive/run_hive.py --all
  ```
- **Run a custom HiveQL query**:
  ```bash
  python hive/run_hive.py --custom "SELECT label, count(*) FROM network_traffic_orc GROUP BY label"
  ```
- **Export baselines to CSV and update MongoDB**:
  ```bash
  python hive/run_hive.py --export-baselines
  ```

### Option C: Via Web Dashboard & REST API
The system exposes HiveQL execution endpoints on the FastAPI backend:
- `GET http://127.0.0.1:8000/api/hive/queries` (List preset queries)
- `POST http://127.0.0.1:8000/api/hive/execute` (Run any custom or preset query)
- `POST http://127.0.0.1:8000/api/hive/export-baselines` (Export baselines)

---

## 4. HiveQL Optimization Techniques Applied

1. **ORC Columnar Format**: Reduces raw log storage footprint by over 75% using Snappy compression and min/max stripe indices.
2. **Partitioning by Label**: `PARTITIONED BY (label STRING)` enables partition pruning during attack forensic queries, avoiding full table scans.
3. **Bucketing by Source IP**: `CLUSTERED BY (source_ip) INTO 8 BUCKETS` enables map-side bucketed joins with external threat intelligence feeds.
4. **Vectorized Execution**: Evaluates batches of 1,024 records at CPU register level using SIMD operations rather than record-by-record iteration.


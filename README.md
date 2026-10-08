# Real-Time Intrusion and Distributed Attack Detection System
**Big Data Analytics (BDA) Project**

---

## Architecture Overview (Lambda Architecture)

1. **Batch Layer (Hadoop HDFS, MapReduce & HiveQL)**:
   - Historical baseline aggregation on the CICIDS2017 dataset.
   - HiveQL analytical warehouse querying partitioned ORC tables to detect DDoS distributions, targeted ports, and botnet fan-out.
   - Extracts malicious IP baselines and synchronizes them to MongoDB NoSQL.

2. **Speed / Streaming Layer (Apache Kafka, Bloom Filter & Flajolet-Martin)**:
   - Kafka Producer streams live network flows to topic `network-traffic`.
   - Kafka Consumer & Stream Engine perform sub-millisecond threat verification using a Bloom Filter and Cardinality estimation using Flajolet-Martin ($O(1)$ space).
   - Live intrusion alerts stored in MongoDB `LiveAlerts` and real-time metrics updated in `TrafficStats`.

3. **Serving & Dashboard Layer (FastAPI & React)**:
   - FastAPI WebSocket (`/ws/stream`) broadcasts real-time flow inspections to the React dashboard.
   - Interactive HiveQL Query Console embedded directly in the Hadoop analytics view.

---

## How to Run the Pipeline

Open separate PowerShell or Command Prompt terminals in `d:\BDA project\BDA-Intrusion-Detection`:

### 1. Real-Time Streaming & Detection

1. **Start Apache Kafka Server** (KRaft mode, Port 9092):
   ```cmd
   .\scripts\start_kafka.bat
   ```

2. **Start FastAPI Backend Server** (Port 8000):
   ```cmd
   .\scripts\start_backend.bat
   ```

3. **Start Kafka Intrusion Detection Consumer**:
   ```cmd
   .\scripts\start_consumer.bat
   ```

4. **Start Kafka Traffic Producer** (Streams CICIDS2017):
   ```cmd
   .\scripts\start_producer.bat
   ```

5. **Start Frontend Web Dashboard** (Port 5173):
   ```cmd
   npm --prefix frontend run dev
   ```

---

### 2. HiveQL Batch Analytics

1. **Execute All Analytical Queries** (CLI):
   ```cmd
   .\scripts\run_hive_queries.bat
   ```

2. **Export Baselines to CSV & Synchronize with MongoDB**:
   ```cmd
   .\scripts\export_hive_baselines.bat
   ```

3. **Interactive HiveQL Shell**:
   ```cmd
   .\scripts\hive_interactive_shell.bat
   ```

4. **Interactive Web Console**:
   In the React Dashboard, click **Hadoop HDFS & MapReduce Batch Analytics** in the top navigation, and select the **HiveQL Analytics Engine** tab to fire queries interactively, inspect execution latencies (~380ms), and sync baselines directly to MongoDB NoSQL.
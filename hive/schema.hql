-- ====================================================================
-- Real-Time Intrusion and Distributed Attack Detection System
-- Apache Hive Schema Definition (DDL)
-- ====================================================================

-- 1. Create Dedicated Analytical Database
CREATE DATABASE IF NOT EXISTS ids_analytics
COMMENT 'Data warehouse for CICIDS2017 intrusion detection batch analytics';

USE ids_analytics;

-- --------------------------------------------------------------------
-- 2. External Table: Raw Network Traffic (CSV on HDFS)
-- References raw log files stored in HDFS without moving/altering data.
-- --------------------------------------------------------------------
CREATE EXTERNAL TABLE IF NOT EXISTS raw_network_traffic (
    flow_id STRING COMMENT 'Unique 5-tuple flow identifier',
    source_ip STRING COMMENT 'Source IPv4 address',
    source_port INT COMMENT 'Source ephemeral port',
    destination_ip STRING COMMENT 'Destination IPv4 address',
    destination_port INT COMMENT 'Target server port',
    protocol INT COMMENT 'Transport protocol (6=TCP, 17=UDP)',
    timestamp STRING COMMENT 'Flow timestamp',
    label STRING COMMENT 'Attack classification or BENIGN'
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
STORED AS TEXTFILE
LOCATION '/intrusion_detection/data/raw'
TBLPROPERTIES (
    "skip.header.line.count"="1",
    "serialization.encoding"="UTF-8"
);

-- --------------------------------------------------------------------
-- 3. Optimized Managed Table: ORC Columnar with Partitioning
-- Columnar format provides 75%+ compression and vectorized scans.
-- Partitioned by 'label' to eliminate full table scans during forensics.
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS network_traffic_orc (
    flow_id STRING,
    source_ip STRING,
    source_port INT,
    destination_ip STRING,
    destination_port INT,
    protocol INT,
    timestamp STRING
)
COMMENT 'Optimized columnar storage for high-speed OLAP forensics'
PARTITIONED BY (label STRING)
CLUSTERED BY (source_ip) INTO 8 BUCKETS
STORED AS ORC
TBLPROPERTIES (
    "orc.compress"="SNAPPY",
    "orc.create.index"="true",
    "orc.bloom.filter.columns"="source_ip,destination_ip"
);

-- --------------------------------------------------------------------
-- 4. Dynamic Partition Insert
-- Populates the partitioned ORC table from raw CSV text logs.
-- --------------------------------------------------------------------
SET hive.exec.dynamic.partition = true;
SET hive.exec.dynamic.partition.mode = nonstrict;
SET hive.vectorized.execution.enabled = true;

INSERT OVERWRITE TABLE network_traffic_orc PARTITION (label)
SELECT 
    flow_id,
    source_ip,
    source_port,
    destination_ip,
    destination_port,
    protocol,
    timestamp,
    label
FROM raw_network_traffic;


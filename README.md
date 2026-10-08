This just BDA mini Project
Names - Real time Intrusion And Distributed attack detection System


How to Run the Pipeline

Open separate PowerShell or Command Prompt terminals in d:\BDA project\BDA-Intrusion-Detection:

Start Kafka:

cmd
.\scripts\start_kafka.bat

(Currently running in the background on port 9092)

Start Backend:

cmd
.\scripts\start_backend.bat

(Currently active on http://127.0.0.1:8000)

Start Kafka Consumer:

cmd
.\scripts\start_consumer.bat

Start Kafka Producer:

cmd
.\scripts\start_producer.bat

Start Frontend Dashboard:

cmd
npm --prefix frontend run dev
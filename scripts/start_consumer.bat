@echo off
title Kafka Intrusion Detection Consumer
echo ========================================================
echo  Kafka Consumer - Real-time Intrusion Detection Engine
echo ========================================================
cd /d "%~dp0.."
.\venv\Scripts\python.exe backend\kafka\consumer.py
pause


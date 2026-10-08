@echo off
title Kafka Network Traffic Producer
echo ========================================================
echo  Kafka Producer - Streaming CICIDS2017 Traffic
echo ========================================================
cd /d "%~dp0.."
.\venv\Scripts\python.exe backend\kafka\producer.py
pause


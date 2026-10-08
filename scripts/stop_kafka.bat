@echo off
title Stop Apache Kafka
echo Stopping Kafka broker processes...
call C:\kafka\bin\windows\kafka-server-stop.bat
echo Kafka stopped.
pause


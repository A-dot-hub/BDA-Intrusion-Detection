@echo off
title Apache Kafka Server (KRaft)
echo ========================================================
echo  Starting Apache Kafka Server (Port 9092, KRaft Mode)
echo ========================================================

rem Ensure Java 17 is used for Kafka
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

cd /d C:\kafka
call .\bin\windows\kafka-server-start.bat .\config\server.properties
pause


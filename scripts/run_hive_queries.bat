@echo off
title HiveQL Analytical Query Suite
echo ========================================================
echo  Executing HiveQL Intrusion Detection Analytics
echo ========================================================
cd /d "%~dp0.."
.\venv\Scripts\python.exe hive\run_hive.py --all
pause


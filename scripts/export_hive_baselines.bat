@echo off
title HiveQL Baseline Export
echo ========================================================
echo  Exporting HiveQL Baselines to CSV and MongoDB
echo ========================================================
cd /d "%~dp0.."
.\venv\Scripts\python.exe hive\run_hive.py --export-baselines
pause


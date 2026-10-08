@echo off
title HiveQL Interactive Shell
echo ========================================================
echo  Launching HiveQL Interactive Analytical Shell
echo ========================================================
cd /d "%~dp0.."
.\venv\Scripts\python.exe hive\run_hive.py --shell
pause


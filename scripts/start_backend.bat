@echo off
title FastAPI Backend Server
echo ========================================================
echo  Starting FastAPI Backend on http://127.0.0.1:8000
echo ========================================================
cd /d "%~dp0.."
.\venv\Scripts\uvicorn.exe backend.app:app --host 127.0.0.1 --port 8000 --reload
pause


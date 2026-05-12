@echo off
cd /d "%~dp0"
"C:\Users\omer\AppData\Local\Programs\Python\Python312\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

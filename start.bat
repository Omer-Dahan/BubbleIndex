@echo off
title BubbleIndex — Launcher
echo Starting BubbleIndex...

start "BubbleIndex Backend" cmd /k "cd /d "%~dp0backend" && "C:\Users\omer\AppData\Local\Programs\Python\Python312\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 /nobreak >nul

start "BubbleIndex Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Backend  → http://localhost:8000
echo Frontend → http://localhost:3000
echo.

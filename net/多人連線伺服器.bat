@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 熱血排球 多人連線伺服器
where node >nul 2>nul
if errorlevel 1 (
  echo 需要先安裝 Node.js（18 版以上）：https://nodejs.org/
  pause
  exit /b
)
start "熱血排球伺服器" node server.js 8787
timeout /t 2 >nul
start "" http://localhost:8787/
where cloudflared >nul 2>nul
if errorlevel 1 (
  echo.
  echo 沒有找到 cloudflared。只在同一個區網玩可以不用；要給外面的朋友連，請先安裝：
  echo   winget install --id Cloudflare.cloudflared
  echo.
  pause
  exit /b
)
echo.
echo 正在開啟 trycloudflare 通道，下面會出現 https://xxxx.trycloudflare.com 網址，把它傳給朋友
echo.
cloudflared tunnel --url http://localhost:8787
pause

#!/bin/sh
# macOS / Linux：開伺服器，並（有裝 cloudflared 的話）開 trycloudflare 通道
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "需要先安裝 Node.js（18 版以上）：https://nodejs.org/"; exit 1; }
node server.js 8787 &
SRV=$!
trap 'kill $SRV' EXIT
sleep 1
echo "本機網址：http://localhost:8787/"
if command -v cloudflared >/dev/null; then
  echo "正在開啟 trycloudflare 通道，下面會出現 https://xxxx.trycloudflare.com 網址，把它傳給朋友"
  cloudflared tunnel --url http://localhost:8787
else
  echo "沒有找到 cloudflared（brew install cloudflared）。按 Ctrl+C 結束伺服器。"
  wait $SRV
fi

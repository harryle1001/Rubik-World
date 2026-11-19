#!/bin/sh
# Kiểm tra: KHÔNG có script/khung quảng cáo nào trong game (trang chơi, mã đảo 3D, game 2D lưu trữ).
cd "$(dirname "$0")/.." || exit 1
PAT='adsbygoogle|googlesyndication|doubleclick|rubik-ads|site/site\.js|data-ad-client'
if grep -rEn "$PAT" client/ocean.html client/index.html client/js client/school client/world-2d.html client/sw.js 2>/dev/null; then echo "❌ Có dấu vết quảng cáo trong game!"; exit 1; fi
echo "✅ Game sạch quảng cáo (ocean.html, js/, school/, sw.js)"

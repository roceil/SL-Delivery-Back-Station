#!/bin/bash

# 快速啟動列印服務的腳本

echo "🖨️  正在啟動靜默列印服務..."
echo ""

# 檢查 print-service 目錄是否存在
if [ ! -d "print-service" ]; then
    echo "❌ 找不到 print-service 目錄"
    exit 1
fi

cd print-service

# 檢查是否已安裝依賴
if [ ! -d "node_modules" ]; then
    echo "📦 首次運行，正在安裝依賴..."

    # 檢查套件管理工具
    if command -v pnpm &> /dev/null; then
        pnpm install
    elif command -v npm &> /dev/null; then
        npm install
    else
        echo "❌ 找不到 npm 或 pnpm"
        exit 1
    fi

    echo ""
fi

echo "✅ 啟動服務..."
echo ""

# 啟動服務
if command -v pnpm &> /dev/null; then
    pnpm start
else
    npm start
fi

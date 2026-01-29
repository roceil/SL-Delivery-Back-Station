#!/bin/bash

# 靜默列印服務安裝腳本

echo "🖨️  安裝靜默列印服務..."
echo ""

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 錯誤：找不到 Node.js"
    echo "請先安裝 Node.js：https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本：$(node -v)"

# 檢查套件管理工具
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
    echo "✅ 使用 pnpm"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    echo "✅ 使用 npm"
else
    echo "❌ 錯誤：找不到 npm 或 pnpm"
    exit 1
fi

# 安裝依賴
echo ""
echo "📦 安裝依賴套件..."
$PKG_MANAGER install

if [ $? -ne 0 ]; then
    echo "❌ 安裝失敗"
    exit 1
fi

echo ""
echo "✅ 安裝完成！"
echo ""
echo "🚀 啟動服務："
echo "   $PKG_MANAGER start"
echo ""
echo "📚 查看完整文件："
echo "   cat README.md"
echo ""

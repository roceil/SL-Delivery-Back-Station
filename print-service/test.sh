#!/bin/bash

# 列印服務測試腳本

echo "🧪 測試列印服務..."
echo ""

# 測試健康檢查
echo "1️⃣ 測試健康檢查端點..."
HEALTH_RESPONSE=$(curl -s http://localhost:9100/health)

if [ $? -eq 0 ]; then
    echo "✅ 服務正在運行"
    echo "   回應: $HEALTH_RESPONSE"
else
    echo "❌ 服務未運行"
    echo "   請先啟動服務: pnpm start"
    exit 1
fi

echo ""

# 測試印表機列表
echo "2️⃣ 測試印表機列表端點..."
PRINTERS_RESPONSE=$(curl -s http://localhost:9100/printers)

if [ $? -eq 0 ]; then
    echo "✅ 成功獲取印表機列表"
    echo "   可用印表機:"
    echo "$PRINTERS_RESPONSE" | grep -v "^$"
else
    echo "❌ 獲取印表機列表失敗"
fi

echo ""
echo "✅ 測試完成！"
echo ""
echo "💡 提示："
echo "   - 服務運行於 http://localhost:9100"
echo "   - 查看完整 API 文件: cat README.md"
echo ""

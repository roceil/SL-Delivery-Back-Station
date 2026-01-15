#!/bin/bash

# SSL 憑證狀態監控腳本
# 每 30 秒檢查一次憑證狀態，直到憑證生效

PROJECT_ID="project-5a5db59a-018a-4d16-b9b"
SSL_CERT_NAME="laggage-porter-backend-ssl-cert"
DOMAIN="sl-luggage-porter.starlines.com.tw"

# 顏色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}===== SSL 憑證狀態監控 =====${NC}"
echo -e "域名: ${YELLOW}$DOMAIN${NC}"
echo -e "憑證: ${YELLOW}$SSL_CERT_NAME${NC}"
echo ""
echo -e "${YELLOW}每 30 秒檢查一次狀態...（按 Ctrl+C 停止）${NC}"
echo ""

CHECK_COUNT=0

while true; do
  CHECK_COUNT=$((CHECK_COUNT + 1))
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

  echo -e "${BLUE}[$TIMESTAMP] 第 $CHECK_COUNT 次檢查${NC}"

  # 取得憑證狀態
  STATUS=$(gcloud compute ssl-certificates describe $SSL_CERT_NAME \
    --global \
    --project=$PROJECT_ID \
    --format="get(managed.status)" 2>/dev/null)

  DOMAIN_STATUS=$(gcloud compute ssl-certificates describe $SSL_CERT_NAME \
    --global \
    --project=$PROJECT_ID \
    --format="get(managed.domainStatus.$DOMAIN)" 2>/dev/null)

  if [ "$STATUS" = "ACTIVE" ]; then
    echo -e "${GREEN}✓ SSL 憑證已生效！${NC}"
    echo ""
    echo -e "${GREEN}===== 憑證配置完成！=====${NC}"
    echo ""
    echo "您現在可以："
    echo "1. 測試 HTTPS 連線："
    echo "   curl -I https://$DOMAIN"
    echo ""
    echo "2. 在瀏覽器中訪問："
    echo "   https://$DOMAIN"
    echo ""
    echo "3. 檢查完整狀態："
    echo "   ./scripts/manage-load-balancer.sh status"
    break
  elif [ "$STATUS" = "PROVISIONING" ]; then
    echo -e "${YELLOW}⏳ 狀態: PROVISIONING（配置中）${NC}"
    echo -e "   域名狀態: $DOMAIN_STATUS"
  else
    echo -e "${YELLOW}狀態: $STATUS${NC}"
    echo -e "域名狀態: $DOMAIN_STATUS"
  fi

  echo ""

  # 等待 30 秒
  sleep 30
done

#!/bin/bash

# Load Balancer 管理工具
# 用於檢查狀態、更新設定等

PROJECT_ID="project-5a5db59a-018a-4d16-b9b"
REGION="asia-east1"
SERVICE_NAME="laggage-porter-backend"
SSL_CERT_NAME="${SERVICE_NAME}-ssl-cert"
FORWARDING_RULE_NAME="${SERVICE_NAME}-forwarding-rule"

# 顏色輸出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

function show_help {
  echo "Load Balancer 管理工具"
  echo ""
  echo "用法: $0 [指令]"
  echo ""
  echo "可用指令:"
  echo "  status      - 顯示 Load Balancer 和 SSL 憑證狀態"
  echo "  ip          - 顯示 Load Balancer IP 位址"
  echo "  ssl         - 檢查 SSL 憑證狀態"
  echo "  test        - 測試域名連線"
  echo "  delete      - 刪除所有 Load Balancer 資源"
  echo "  help        - 顯示此說明"
  echo ""
}

function check_status {
  echo -e "${YELLOW}===== Load Balancer 狀態 =====${NC}"
  echo ""

  echo "📍 Forwarding Rule (IP 位址):"
  gcloud compute forwarding-rules describe $FORWARDING_RULE_NAME \
    --global \
    --project=$PROJECT_ID \
    --format="table(IPAddress, target)" 2>/dev/null || echo -e "${RED}未建立${NC}"

  echo ""
  echo "🔒 SSL 憑證狀態:"
  gcloud compute ssl-certificates describe $SSL_CERT_NAME \
    --global \
    --project=$PROJECT_ID \
    --format="table(name, managed.status, managed.domainStatus)" 2>/dev/null || echo -e "${RED}未建立${NC}"

  echo ""
  echo "🚀 Cloud Run 服務:"
  gcloud run services describe $SERVICE_NAME \
    --region=$REGION \
    --project=$PROJECT_ID \
    --format="table(status.url, status.conditions.status)" 2>/dev/null || echo -e "${RED}未部署${NC}"
}

function get_ip {
  echo -e "${YELLOW}取得 Load Balancer IP...${NC}"
  LB_IP=$(gcloud compute forwarding-rules describe $FORWARDING_RULE_NAME \
    --global \
    --project=$PROJECT_ID \
    --format="get(IPAddress)" 2>/dev/null)

  if [ -n "$LB_IP" ]; then
    echo -e "${GREEN}Load Balancer IP: $LB_IP${NC}"
    echo ""
    echo "請在 Cloudflare 設定 A 記錄指向此 IP"
  else
    echo -e "${RED}找不到 Load Balancer${NC}"
    exit 1
  fi
}

function check_ssl {
  echo -e "${YELLOW}檢查 SSL 憑證狀態...${NC}"

  STATUS=$(gcloud compute ssl-certificates describe $SSL_CERT_NAME \
    --global \
    --project=$PROJECT_ID \
    --format="get(managed.status)" 2>/dev/null)

  if [ "$STATUS" = "ACTIVE" ]; then
    echo -e "${GREEN}✓ SSL 憑證已生效${NC}"
  elif [ "$STATUS" = "PROVISIONING" ]; then
    echo -e "${YELLOW}⏳ SSL 憑證配置中...（可能需要 15-60 分鐘）${NC}"
    echo ""
    echo "詳細狀態："
    gcloud compute ssl-certificates describe $SSL_CERT_NAME \
      --global \
      --project=$PROJECT_ID \
      --format="yaml(managed)"
  else
    echo -e "${RED}❌ SSL 憑證狀態異常: $STATUS${NC}"
  fi
}

function test_connection {
  echo -e "${YELLOW}請輸入要測試的域名:${NC}"
  read -p "域名: " DOMAIN

  if [ -z "$DOMAIN" ]; then
    echo -e "${RED}域名不能為空${NC}"
    exit 1
  fi

  echo ""
  echo "測試 DNS 解析..."
  dig +short $DOMAIN

  echo ""
  echo "測試 HTTPS 連線..."
  curl -I https://$DOMAIN -m 10
}

function delete_all {
  echo -e "${RED}警告: 這將刪除所有 Load Balancer 相關資源${NC}"
  read -p "確定要繼續嗎？(yes/no): " CONFIRM

  if [ "$CONFIRM" != "yes" ]; then
    echo "取消操作"
    exit 0
  fi

  echo ""
  echo "刪除資源中..."

  # 按照相依順序刪除
  gcloud compute forwarding-rules delete $FORWARDING_RULE_NAME --global --project=$PROJECT_ID --quiet 2>/dev/null || true
  gcloud compute target-https-proxies delete ${SERVICE_NAME}-target-proxy --global --project=$PROJECT_ID --quiet 2>/dev/null || true
  gcloud compute ssl-certificates delete $SSL_CERT_NAME --global --project=$PROJECT_ID --quiet 2>/dev/null || true
  gcloud compute url-maps delete ${SERVICE_NAME}-url-map --global --project=$PROJECT_ID --quiet 2>/dev/null || true
  gcloud compute backend-services delete ${SERVICE_NAME}-backend --global --project=$PROJECT_ID --quiet 2>/dev/null || true
  gcloud compute network-endpoint-groups delete ${SERVICE_NAME}-neg --region=$REGION --project=$PROJECT_ID --quiet 2>/dev/null || true

  echo -e "${GREEN}清理完成${NC}"
}

# 主程式
case "$1" in
  status)
    check_status
    ;;
  ip)
    get_ip
    ;;
  ssl)
    check_ssl
    ;;
  test)
    test_connection
    ;;
  delete)
    delete_all
    ;;
  help|--help|-h|"")
    show_help
    ;;
  *)
    echo -e "${RED}未知指令: $1${NC}"
    echo ""
    show_help
    exit 1
    ;;
esac

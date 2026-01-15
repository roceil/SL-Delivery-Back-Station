#!/bin/bash

# Cloud Run + Load Balancer 設定腳本
# 此腳本會建立完整的 HTTPS Load Balancer 配置，讓您可以使用自有域名

set -e

# ===== 配置變數 =====
PROJECT_ID="project-5a5db59a-018a-4d16-b9b"
REGION="asia-east1"
SERVICE_NAME="laggage-porter-backend"
NEG_NAME="${SERVICE_NAME}-neg"
BACKEND_SERVICE_NAME="${SERVICE_NAME}-backend"
URL_MAP_NAME="${SERVICE_NAME}-url-map"
TARGET_PROXY_NAME="${SERVICE_NAME}-target-proxy"
FORWARDING_RULE_NAME="${SERVICE_NAME}-forwarding-rule"
SSL_CERT_NAME="${SERVICE_NAME}-ssl-cert"

# 請替換成您的域名
DOMAIN="sl-luggage-porter.starlines.com.tw"

echo "===== 開始配置 Load Balancer ====="
echo "專案: $PROJECT_ID"
echo "Cloud Run 服務: $SERVICE_NAME"
echo "域名: $DOMAIN"
echo ""

# ===== Step 1: 建立 Serverless NEG (Network Endpoint Group) =====
echo "Step 1: 建立 Serverless NEG..."
gcloud compute network-endpoint-groups create $NEG_NAME \
  --region=$REGION \
  --network-endpoint-type=serverless \
  --cloud-run-service=$SERVICE_NAME \
  --project=$PROJECT_ID

echo "✓ NEG 建立完成"
echo ""

# ===== Step 2: 建立 Backend Service =====
echo "Step 2: 建立 Backend Service..."
gcloud compute backend-services create $BACKEND_SERVICE_NAME \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --project=$PROJECT_ID

echo "✓ Backend Service 建立完成"
echo ""

# ===== Step 3: 將 NEG 加入 Backend Service =====
echo "Step 3: 將 NEG 加入 Backend Service..."
gcloud compute backend-services add-backend $BACKEND_SERVICE_NAME \
  --global \
  --network-endpoint-group=$NEG_NAME \
  --network-endpoint-group-region=$REGION \
  --project=$PROJECT_ID

echo "✓ NEG 已加入 Backend Service"
echo ""

# ===== Step 4: 建立 URL Map =====
echo "Step 4: 建立 URL Map..."
gcloud compute url-maps create $URL_MAP_NAME \
  --default-service=$BACKEND_SERVICE_NAME \
  --global \
  --project=$PROJECT_ID

echo "✓ URL Map 建立完成"
echo ""

# ===== Step 5: 建立 SSL 憑證 =====
echo "Step 5: 建立 Google-managed SSL 憑證..."
echo "⚠️  請確保您的域名 DNS 已經指向 Load Balancer IP"
echo "⚠️  憑證配置可能需要 15-60 分鐘才會生效"
gcloud compute ssl-certificates create $SSL_CERT_NAME \
  --domains=$DOMAIN \
  --global \
  --project=$PROJECT_ID

echo "✓ SSL 憑證建立完成（等待配置中...）"
echo ""

# ===== Step 6: 建立 Target HTTPS Proxy =====
echo "Step 6: 建立 Target HTTPS Proxy..."
gcloud compute target-https-proxies create $TARGET_PROXY_NAME \
  --ssl-certificates=$SSL_CERT_NAME \
  --url-map=$URL_MAP_NAME \
  --global \
  --project=$PROJECT_ID

echo "✓ Target HTTPS Proxy 建立完成"
echo ""

# ===== Step 7: 建立 Global Forwarding Rule =====
echo "Step 7: 建立 Global Forwarding Rule（配置 IP）..."
gcloud compute forwarding-rules create $FORWARDING_RULE_NAME \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --network-tier=PREMIUM \
  --address-region=global \
  --global \
  --target-https-proxy=$TARGET_PROXY_NAME \
  --ports=443 \
  --project=$PROJECT_ID

echo "✓ Forwarding Rule 建立完成"
echo ""

# ===== Step 8: 取得 Load Balancer IP =====
echo "===== 設定完成！ ====="
echo ""
LB_IP=$(gcloud compute forwarding-rules describe $FORWARDING_RULE_NAME \
  --global \
  --project=$PROJECT_ID \
  --format="get(IPAddress)")

echo "🎉 Load Balancer IP: $LB_IP"
echo ""
echo "下一步驟："
echo "1. 在 Cloudflare 設定 DNS 記錄："
echo "   類型: A"
echo "   名稱: @ (或子域名)"
echo "   內容: $LB_IP"
echo "   Proxy: DNS only（灰色雲朵，待憑證生效後可改為 Proxied）"
echo ""
echo "2. 等待 SSL 憑證配置（15-60 分鐘）"
echo "   檢查憑證狀態："
echo "   gcloud compute ssl-certificates describe $SSL_CERT_NAME --global --project=$PROJECT_ID"
echo ""
echo "3. 憑證狀態變為 ACTIVE 後，訪問 https://$DOMAIN 測試"
echo ""

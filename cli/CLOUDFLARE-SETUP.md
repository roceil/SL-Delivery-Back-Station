# Cloudflare DNS 設定指引

本文件說明如何在 Cloudflare 上設定 DNS，讓自有域名指向 Google Cloud Load Balancer。

## 前置作業

1. 確保已執行 `setup-load-balancer.sh` 建立 Load Balancer
2. 取得 Load Balancer IP 位址：
   ```bash
   ./cli/manage-load-balancer.sh ip
   ```

## Cloudflare DNS 設定步驟

### 方案 A：使用 A 記錄（建議）

適用於：想要完整控制 SSL 憑證和 CDN 的情況

**步驟：**

1. **登入 Cloudflare Dashboard**
   - 前往 https://dash.cloudflare.com
   - 選擇您的域名

2. **新增 A 記錄**
   - 進入 DNS 設定頁面
   - 點擊「Add record」
   - 設定如下：
     ```
     Type:    A
     Name:    @ (根域名) 或 api (子域名，例如 api.example.com)
     IPv4 address: [Load Balancer IP]
     Proxy status: DNS only（灰色雲朵 ☁️）
     TTL:     Auto
     ```

3. **等待 SSL 憑證配置**
   - Google-managed SSL 憑證需要 15-60 分鐘配置
   - 檢查憑證狀態：
     ```bash
     ./cli/manage-load-balancer.sh ssl
     ```

4. **測試連線**
   ```bash
   # DNS 解析測試
   dig +short your-domain.com

   # HTTPS 連線測試
   curl -I https://your-domain.com
   ```

5. **（可選）啟用 Cloudflare Proxy**
   - 憑證狀態變為 ACTIVE 後
   - 將 Proxy status 改為 Proxied（橘色雲朵 🟠）
   - 同時需要調整 Cloudflare SSL/TLS 設定（見下方）

### 方案 B：完全使用 Google SSL（最簡單）

如果您不需要 Cloudflare 的 CDN、WAF、DDoS 防護等功能，這是最簡單的方案。

**設定：**
```
Type:    A
Name:    @ 或子域名
IPv4 address: [Load Balancer IP]
Proxy status: DNS only（灰色雲朵 ☁️）
```

**優點：**
- 設定簡單
- 不會有雙層 Proxy 的問題
- Google Cloud CDN 已經提供基本的 CDN 功能

**缺點：**
- 無法使用 Cloudflare 的進階功能（WAF、Rate Limiting 等）

### 方案 C：使用 Cloudflare Proxy（進階）

如果您需要 Cloudflare 的進階功能（WAF、Analytics、Rate Limiting 等）。

**額外設定：**

1. **SSL/TLS 模式**
   - 進入 SSL/TLS 設定頁面
   - 將加密模式設為 **Full (strict)**
   - 這確保 Cloudflare 到 Google Cloud 之間的連線也是加密的

2. **（可選）調整 Cloudflare 快取**
   - 進入 Caching → Configuration
   - 設定 Browser Cache TTL
   - 建立 Page Rules 來控制快取行為

3. **（可選）設定 WAF 規則**
   - 進入 Security → WAF
   - 啟用 Managed Rules
   - 根據需求自訂規則

**注意事項：**
- 使用 Cloudflare Proxy 會有雙層 CDN（Cloudflare + Google Cloud CDN）
- 可能增加延遲
- WebSocket 連線需要特別設定
- 需要確保 SSL 憑證配置正確

## 進階配置

### 1. 設定多個域名

如果需要支援多個域名（例如 example.com 和 www.example.com）：

```bash
# 更新 SSL 憑證以支援多個域名
gcloud compute ssl-certificates create laggage-porter-backend-ssl-cert \
  --domains=example.com,www.example.com,api.example.com \
  --global \
  --project=liuchiu-luggage-delivery
```

然後在 Cloudflare 為每個域名新增 A 記錄。

### 2. 設定 HTTPS 重定向

在 Cloudflare 設定 Page Rules：

```
URL: http://your-domain.com/*
設定: Always Use HTTPS
```

### 3. 健康檢查

Load Balancer 預設會檢查 Cloud Run 服務的健康狀態。如果需要自訂健康檢查：

```bash
# 建立健康檢查
gcloud compute health-checks create https health-check-name \
  --request-path=/health \
  --port=443

# 更新 backend service
gcloud compute backend-services update laggage-porter-backend-backend \
  --global \
  --health-checks=health-check-name
```

## 故障排除

### 憑證一直處於 PROVISIONING 狀態

**可能原因：**
1. DNS 記錄尚未生效
2. Cloudflare Proxy 干擾憑證驗證

**解決方法：**
```bash
# 1. 確認 DNS 解析正確
dig +short your-domain.com

# 2. 確認 Cloudflare Proxy 為 DNS only
# 3. 等待 15-60 分鐘
# 4. 檢查憑證詳細狀態
./cli/manage-load-balancer.sh ssl
```

### 502 Bad Gateway

**可能原因：**
1. Cloud Run 服務未正常運行
2. Backend Service 設定錯誤

**解決方法：**
```bash
# 檢查 Cloud Run 服務狀態
gcloud run services describe laggage-porter-backend \
  --region=asia-east1 \
  --project=liuchiu-luggage-delivery

# 檢查 Load Balancer 狀態
./cli/manage-load-balancer.sh status
```

### SSL 憑證錯誤

**可能原因：**
1. 使用 Cloudflare Proxy 但 SSL 模式設定錯誤
2. Google-managed 憑證尚未生效

**解決方法：**
1. 如果使用 Cloudflare Proxy，確保 SSL/TLS 模式為 **Full (strict)**
2. 等待 Google-managed 憑證配置完成
3. 暫時將 Cloudflare Proxy 設為 DNS only

## 檢查清單

設定完成後，請確認以下項目：

- [ ] DNS A 記錄已設定並指向正確的 Load Balancer IP
- [ ] DNS 解析正確（使用 `dig` 或 `nslookup` 測試）
- [ ] Google-managed SSL 憑證狀態為 ACTIVE
- [ ] HTTPS 連線正常（使用 `curl` 測試）
- [ ] Cloud Run 服務運行正常
- [ ] （如使用 Cloudflare Proxy）SSL/TLS 模式為 Full (strict)

## 相關指令

```bash
# 檢查 Load Balancer 狀態
./cli/manage-load-balancer.sh status

# 取得 Load Balancer IP
./cli/manage-load-balancer.sh ip

# 檢查 SSL 憑證狀態
./cli/manage-load-balancer.sh ssl

# 測試域名連線
./cli/manage-load-balancer.sh test

# 刪除所有 Load Balancer 資源
./cli/manage-load-balancer.sh delete
```

## 成本考量

使用 Load Balancer 會產生以下費用：

1. **Load Balancer 本身**
   - 前 5 條轉發規則：每條 $0.025/小時
   - 處理的流量費用

2. **Cloud Run**
   - 請求次數費用
   - CPU 和記憶體使用費用

3. **Cloudflare**
   - Free 方案通常足夠
   - 如需進階功能可升級至 Pro/Business 方案

詳細定價請參考：
- [Google Cloud Load Balancer 定價](https://cloud.google.com/load-balancing/pricing)
- [Cloud Run 定價](https://cloud.google.com/run/pricing)
- [Cloudflare 定價](https://www.cloudflare.com/plans/)

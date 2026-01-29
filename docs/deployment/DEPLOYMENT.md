# 部署指南

本文件說明如何將 Nuxt 4 應用程式部署到 GCP Cloud Run。

## 架構概覽

```
使用者
  ↓
自有域名 (Cloudflare DNS)
  ↓
Cloud Load Balancer + SSL + CDN
  ↓
Cloud Run (Nuxt 4 App)
  ↓
Supabase (PostgreSQL + Auth + Storage)
```

## 前置需求

1. **GCP 專案**
   - 專案 ID: `project-5a5db59a-018a-4d16-b9b`
   - 專案名稱: Laggage-Porter-System
   - 區域: `asia-east1`

2. **已安裝工具**
   - [gcloud CLI](https://cloud.google.com/sdk/docs/install)
   - [Docker](https://docs.docker.com/get-docker/)
   - pnpm (已在專案中使用)

3. **已啟用的 GCP API**
   - ✅ Cloud Run API
   - ✅ Artifact Registry API
   - ✅ Cloud Build API
   - ✅ Compute Engine API

## 環境變數設定

### 1. 本地開發

複製環境變數範例檔案：

```bash
cp .env.example .env
```

編輯 `.env` 填入實際值：

```env
# Supabase 設定
NUXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NUXT_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Sheets API
NUXT_GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
NUXT_GOOGLE_PRIVATE_KEY="your-private-key"
NUXT_GOOGLE_PROJECT_ID=project-5a5db59a-018a-4d16-b9b
NUXT_GOOGLE_SHEETS_ID=your-sheets-id
```

### 2. Cloud Run 環境變數

部署後需要在 Cloud Run 設定環境變數。有兩種方式：

#### 方式 A：透過 gcloud 指令

```bash
gcloud run services update laggage-porter-backend \
  --region=asia-east1 \
  --update-env-vars="\
NUXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co,\
NUXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key,\
NUXT_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key,\
NUXT_GOOGLE_SERVICE_ACCOUNT_EMAIL=your-email,\
NUXT_GOOGLE_PRIVATE_KEY=your-key,\
NUXT_GOOGLE_PROJECT_ID=project-5a5db59a-018a-4d16-b9b,\
NUXT_GOOGLE_SHEETS_ID=your-sheets-id"
```

#### 方式 B：透過 Cloud Console

1. 前往 [Cloud Run Console](https://console.cloud.google.com/run)
2. 選擇 `laggage-porter-backend` 服務
3. 點擊「編輯和部署新修訂版本」
4. 在「變數與密鑰」頁籤中新增環境變數
5. 點擊「部署」

## 部署方式

### 方式 1：使用部署腳本（推薦）

```bash
# 確保已登入 GCP
gcloud auth login

# 執行部署腳本
./cli/deploy.sh
```

部署腳本會自動：
- 建置 Docker 映像
- 推送到 Artifact Registry
- 部署到 Cloud Run
- 顯示服務 URL

### 方式 2：手動部署

#### 步驟 1：設定 Docker 認證

```bash
gcloud auth configure-docker asia-east1-docker.pkg.dev
```

#### 步驟 2：建置映像

```bash
docker build -t asia-east1-docker.pkg.dev/project-5a5db59a-018a-4d16-b9b/cloud-run-source-deploy/laggage-porter-backend:latest .
```

#### 步驟 3：推送映像

```bash
docker push asia-east1-docker.pkg.dev/project-5a5db59a-018a-4d16-b9b/cloud-run-source-deploy/laggage-porter-backend:latest
```

#### 步驟 4：部署到 Cloud Run

```bash
gcloud run deploy laggage-porter-backend \
  --image=asia-east1-docker.pkg.dev/project-5a5db59a-018a-4d16-b9b/cloud-run-source-deploy/laggage-porter-backend:latest \
  --region=asia-east1 \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --port=8080
```

### 方式 3：使用 Cloud Build（CI/CD）

Cloud Build 可以自動化建置和部署流程。

#### 觸發手動建置

```bash
gcloud builds submit --config=cloudbuild.yaml
```

#### 設定 GitHub 自動觸發

1. 前往 [Cloud Build 觸發條件](https://console.cloud.google.com/cloud-build/triggers)
2. 點擊「建立觸發條件」
3. 連接 GitHub repository
4. 設定觸發條件：
   - 分支：`main`
   - 建置配置：Cloud Build 配置檔案
   - 位置：`/cloudbuild.yaml`
5. 儲存

之後每次推送到 `main` 分支時會自動建置和部署。

## 驗證部署

### 1. 檢查服務狀態

```bash
gcloud run services describe laggage-porter-backend --region=asia-east1
```

### 2. 取得服務 URL

```bash
gcloud run services describe laggage-porter-backend \
  --region=asia-east1 \
  --format="value(status.url)"
```

### 3. 測試服務

```bash
curl https://your-service-url.run.app
```

## 查看日誌

### 即時日誌

```bash
gcloud run services logs tail laggage-porter-backend --region=asia-east1
```

### 在 Cloud Console 查看

前往 [Cloud Run Logs](https://console.cloud.google.com/run)，選擇服務後點擊「日誌」頁籤。

## 設定 Load Balancer + 自有域名

目前服務已部署到 Cloud Run，可以透過 Load Balancer 綁定自有域名並啟用 SSL。

### 使用 Load Balancer 的優點

- ✅ 綁定自有域名（如 api.yourdomain.com）
- ✅ Google-managed SSL 憑證（自動更新）
- ✅ 全球負載均衡和 CDN
- ✅ 更好的 DDoS 防護
- ✅ 穩定的 GA 功能（不是實驗性質）

### 快速開始

#### 1. 建立 Load Balancer

執行自動化腳本：

```bash
# 編輯腳本中的 DOMAIN 變數（設定您的域名）
vim cli/setup-load-balancer.sh

# 執行設定腳本
./cli/setup-load-balancer.sh
```

腳本會自動建立：
- Serverless NEG (Network Endpoint Group)
- Backend Service
- URL Map
- SSL 憑證
- Target HTTPS Proxy
- Global Forwarding Rule

#### 2. 取得 Load Balancer IP

```bash
./cli/manage-load-balancer.sh ip
```

#### 3. 設定 Cloudflare DNS

在 Cloudflare 設定 A 記錄：

```
類型: A
名稱: @ (或子域名，如 api)
內容: [Load Balancer IP]
Proxy: DNS only（灰色雲朵 ☁️）
TTL: Auto
```

**詳細 Cloudflare 設定指引：** 請參考 [cli/CLOUDFLARE-SETUP.md](cli/CLOUDFLARE-SETUP.md)

#### 4. 等待 SSL 憑證配置

Google-managed SSL 憑證需要 15-60 分鐘配置，檢查狀態：

```bash
./cli/manage-load-balancer.sh ssl
```

#### 5. 測試連線

```bash
# 測試 DNS 解析
dig +short your-domain.com

# 測試 HTTPS 連線
curl -I https://your-domain.com
```

### Load Balancer 管理指令

```bash
# 檢查整體狀態
./cli/manage-load-balancer.sh status

# 取得 IP 位址
./cli/manage-load-balancer.sh ip

# 檢查 SSL 憑證狀態
./cli/manage-load-balancer.sh ssl

# 測試域名連線
./cli/manage-load-balancer.sh test

# 刪除所有 Load Balancer 資源
./cli/manage-load-balancer.sh delete
```

### 相關文件

- **Load Balancer 設定腳本**: [cli/setup-load-balancer.sh](cli/setup-load-balancer.sh)
- **Load Balancer 管理工具**: [cli/manage-load-balancer.sh](cli/manage-load-balancer.sh)
- **Cloudflare DNS 設定指引**: [cli/CLOUDFLARE-SETUP.md](cli/CLOUDFLARE-SETUP.md)

## 故障排除

### Docker 建置失敗

如果遇到 pnpm 相關錯誤，確認：
- `pnpm-lock.yaml` 檔案存在
- `package.json` 中 `packageManager` 欄位正確

### 環境變數未生效

確認環境變數名稱符合 Nuxt 4 的命名規則：
- 公開變數：`NUXT_PUBLIC_*`
- 私密變數：`NUXT_*`

### 服務無法啟動

檢查日誌：
```bash
gcloud run services logs tail laggage-porter-backend --region=asia-east1
```

常見問題：
- Port 設定：Cloud Run 預設使用 port 8080
- 記憶體不足：調整 `--memory` 參數
- 啟動逾時：調整 `--timeout` 參數

## 資源清理

如需刪除部署的資源：

```bash
# 刪除 Cloud Run 服務
gcloud run services delete laggage-porter-backend --region=asia-east1

# 刪除 Docker 映像（可選）
gcloud artifacts docker images delete \
  asia-east1-docker.pkg.dev/project-5a5db59a-018a-4d16-b9b/cloud-run-source-deploy/laggage-porter-backend:latest
```

## 相關連結

- [Cloud Run 文件](https://cloud.google.com/run/docs)
- [Nuxt 4 部署指南](https://nuxt.com/docs/getting-started/deployment)
- [Supabase 文件](https://supabase.com/docs)

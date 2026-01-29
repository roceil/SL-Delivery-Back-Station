# 系統架構文件

## 系統概覽

這是一個基於 Serverless 架構的行李搬運系統，採用 GCP Cloud Run + Supabase 的技術棧，具備自動擴展、高可用性和成本優化的特性。

## 架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                         使用者 (User)                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Cloud Load Balancer + Cloud CDN                    │
│  • 全球負載均衡                                                  │
│  • CDN 快取靜態資源 (圖片/CSS/JS)                               │
│  • SSL/HTTPS 憑證管理                                           │
│  • DDoS 防護 (可選)                                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloud Run (Nuxt 4 App)                       │
│  • 自動擴展 (0-10 instances)                                    │
│  • 按使用計費                                                    │
│  • 512MB RAM, 1 vCPU                                            │
│  • 並發連接: 80                                                 │
│  • Node.js 22 + pnpm                                            │
└────────────┬────────────────────────────┬───────────────────────┘
             │                            │
             ▼                            ▼
┌──────────────────────┐      ┌──────────────────────────┐
│  Supabase (Database) │      │  Google Sheets API       │
│  • PostgreSQL        │      │  • 資料同步               │
│  • Auth              │      │  • 報表匯出               │
│  • Storage           │      └──────────────────────────┘
│  • Real-time         │
│  • Row Level Security│
└──────────────────────┘
```

## 技術棧

### 前端框架
- **Nuxt 4** - 全端 Vue.js 框架
- **Vue 3** - 漸進式 JavaScript 框架
- **TailwindCSS v4** - Utility-first CSS 框架
- **Pinia** - 狀態管理 (Composition API)
- **VueUse** - Vue Composition 工具集

### 後端基礎設施
- **Google Cloud Platform (GCP)**
  - Cloud Run - Serverless 容器執行環境
  - Cloud Load Balancer - 全球負載均衡器
  - Cloud CDN - 內容分發網路
  - Artifact Registry - Docker 映像倉庫
  - Cloud Build - CI/CD 自動建置

### 資料庫與服務
- **Supabase**
  - PostgreSQL 資料庫
  - 即時訂閱 (Real-time)
  - 認證系統 (Auth)
  - 檔案儲存 (Storage)
  - Row Level Security (RLS)

- **Google Sheets API**
  - 資料同步
  - 報表匯出

## GCP 專案資訊

```yaml
專案名稱: Laggage-Porter-System
專案 ID: project-5a5db59a-018a-4d16-b9b
專案編號: 231958326374
組織 ID: 92105906632
地區: asia-east1
可用區: asia-east1-a
```

## 已啟用的 GCP 服務

```
✅ Cloud Run API (run.googleapis.com)
✅ Compute Engine API (compute.googleapis.com)
✅ Artifact Registry API (artifactregistry.googleapis.com)
✅ Cloud Build API (cloudbuild.googleapis.com)
✅ Cloud Resource Manager API (cloudresourcemanager.googleapis.com)
✅ BigQuery API (bigquery.googleapis.com)
✅ Cloud Storage API (storage.googleapis.com)
✅ Cloud Logging API (logging.googleapis.com)
✅ Cloud Monitoring API (monitoring.googleapis.com)
```

## Cloud Run 配置

### 服務規格
```yaml
服務名稱: laggage-porter-backend
區域: asia-east1
平台: Managed
運行環境: Node.js 22 Alpine
套件管理器: pnpm 10.13.1
```

### 資源配置
```yaml
記憶體: 512Mi
CPU: 1 vCPU
最小實例數: 0 (可縮放至零)
最大實例數: 10
並發連接數: 80
請求逾時: 300 秒
Port: 8080
```

### 環境變數
```bash
# 運行時環境
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# Supabase 配置
NUXT_PUBLIC_SUPABASE_URL=<您的 Supabase URL>
NUXT_PUBLIC_SUPABASE_ANON_KEY=<匿名金鑰>
NUXT_SUPABASE_SERVICE_ROLE_KEY=<服務角色金鑰>

# Google API 配置
NUXT_GOOGLE_SERVICE_ACCOUNT_EMAIL=<服務帳號>
NUXT_GOOGLE_PRIVATE_KEY=<私鑰>
NUXT_GOOGLE_PROJECT_ID=project-5a5db59a-018a-4d16-b9b
NUXT_GOOGLE_SHEETS_ID=<試算表 ID>
```

## Load Balancer + CDN 配置

### 元件組成
1. **Network Endpoint Group (NEG)** - Serverless 端點群組
2. **Backend Service** - 後端服務 + CDN 啟用
3. **URL Map** - URL 路由對應
4. **HTTP/HTTPS Proxy** - HTTP(S) 代理
5. **Forwarding Rules** - 轉發規則
6. **Static IP** - 全球靜態 IP

### CDN 快取設定
```yaml
快取模式: CACHE_ALL_STATIC
預設 TTL: 3600 秒 (1 小時)
最大 TTL: 86400 秒 (24 小時)
客戶端 TTL: 3600 秒
```

### 命名規範
```yaml
NEG: laggage-porter-backend-neg
Backend Service: laggage-porter-backend-backend
URL Map: laggage-porter-backend-url-map
HTTP Proxy: laggage-porter-backend-http-proxy
HTTPS Proxy: laggage-porter-backend-https-proxy
HTTP Forwarding Rule: laggage-porter-backend-http
HTTPS Forwarding Rule: laggage-porter-backend-https
Static IP: laggage-porter-backend-ip
SSL Certificate: laggage-porter-backend-ssl-cert
```

## Supabase 資料庫架構

### 主要資料表

#### 狀態表
- `orders_status` - 訂單狀態
- `schedules_status` - 排程狀態
- `couriers_status` - 快遞員狀態
- `trip_status` - 行程狀態
- `klook_status` - Klook 訂單狀態
- `net_status` - 網路訂單狀態
- `normal_status` - 一般訂單狀態

#### 設定表
- `merchants_types` - 商家類型
- `stations_types` - 站點類型
- `platforms` - 平台設定

#### 產品表
- `trip_products` - 行程產品
- `klook_products` - Klook 產品
- `net_products` - 網路產品
- `normal_products` - 一般產品

#### 核心業務表
- `users` - 使用者
- `merchants` - 商家
- `stations` - 站點
- `couriers` - 快遞員
- `schedules` - 排程
- `orders` - 訂單主表

#### 訂單類型表
- `trip_orders` - 行程訂單
- `klook_orders` - Klook 訂單
- `net_orders` - 網路訂單
- `normal_orders` - 一般訂單
- `schedule_orders` - 排程訂單

### 連線配置

專案使用兩種 Supabase Client：

1. **Service Role Client** (`server/utils/supabase.ts:useServiceRoleClient()`)
   - 使用 Service Role Key
   - 可繞過 RLS (Row Level Security)
   - 擁有完整資料庫權限
   - 僅限後端 API 使用
   - ⚠️ 絕不暴露於前端

2. **Anon Client** (`server/utils/supabase.ts:useAnonClient()`)
   - 使用 Anon Key
   - 受 RLS 限制
   - 適合前端使用
   - 安全性較高

## Docker 容器化

### 多階段建置
1. **deps** - 依賴安裝階段
2. **builder** - 應用程式建置階段
3. **runner** - 生產執行階段

### 最佳化措施
- 使用 Alpine Linux (最小化映像大小)
- 多階段建置 (僅包含必要檔案)
- 非 root 使用者執行 (提升安全性)
- pnpm 快取優化
- .dockerignore 過濾不必要檔案

## CI/CD 流程

### 手動部署
```bash
# 1. 建置並部署 (一鍵完成)
./cli/deploy.sh

# 2. 設定 Load Balancer + CDN
./cli/setup-loadbalancer.sh
```

### 自動部署 (Cloud Build)
```yaml
觸發條件: Push to main branch
建置工具: Cloud Build
配置檔案: cloudbuild.yaml
建置時間: ~3-5 分鐘
```

### 部署步驟
1. 建置 Docker 映像
2. 推送至 Artifact Registry
3. 部署到 Cloud Run
4. 更新環境變數（如需要）
5. 健康檢查

## 監控與日誌

### Cloud Logging
```bash
# 即時日誌
gcloud run services logs tail laggage-porter-backend --region=asia-east1

# 查看最近 100 行
gcloud run services logs read laggage-porter-backend \
  --region=asia-east1 \
  --limit=100
```

### Cloud Monitoring
- 請求延遲
- 錯誤率
- 實例數量
- CPU/記憶體使用率
- 容器啟動時間

### Supabase Dashboard
- 資料庫查詢效能
- API 使用量
- 認證活動
- Storage 用量

## 安全性措施

### 應用層
- ✅ HTTPS 強制加密
- ✅ 環境變數隔離
- ✅ Service Role Key 後端專用
- ✅ 非 root 容器執行
- ✅ RLS (Row Level Security)

### 網路層
- ✅ Cloud Armor DDoS 防護（可啟用）
- ✅ VPC 網路隔離（可配置）
- ✅ IAM 權限管理
- ✅ SSL/TLS 憑證自動更新

### 資料層
- ✅ Supabase 加密傳輸
- ✅ 資料庫備份
- ✅ 存取日誌記錄

## 成本優化

### Serverless 優勢
- ✅ 縮放至零 (無流量時無費用)
- ✅ 按請求計費
- ✅ 自動擴展 (按需付費)
- ✅ 無需管理伺服器

### CDN 快取
- ✅ 減少後端請求
- ✅ 降低流量成本
- ✅ 提升回應速度

### 預估成本
```
Cloud Run:
  - 前 200 萬請求/月 免費
  - 之後每百萬請求約 $0.40

Cloud CDN:
  - 快取命中: $0.02-0.08/GB
  - 快取未命中: $0.08-0.20/GB

Supabase:
  - 免費方案: 500MB 資料庫 + 1GB 流量
  - Pro 方案: $25/月起
```

## 效能指標

### 目標 SLA
- ✅ 可用性: 99.9%
- ✅ 回應時間: < 200ms (CDN 快取)
- ✅ 回應時間: < 1s (動態請求)
- ✅ 冷啟動: < 3s

### 擴展能力
- 最大實例數: 10
- 單實例並發: 80
- 理論 QPS: 800 (10 * 80)

## 災難復原

### 備份策略
- Supabase 自動每日備份
- Cloud Run 映像版本控制
- 配置檔案 Git 版本管理

### 復原流程
1. 從 Artifact Registry 拉取先前版本映像
2. 使用 `gcloud run deploy` 回滾
3. 從 Supabase 還原資料庫備份（如需要）

## 開發環境

### 本地開發
```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev

# 存取位址
http://localhost:3001
```

### 環境要求
- Node.js 22+
- pnpm 10.13.1+
- Docker (用於本地測試容器)

## 相關文件

- [DEPLOYMENT.md](./DEPLOYMENT.md) - 詳細部署指南
- [README.md](./README.md) - 專案說明
- [CLAUDE.md](./CLAUDE.md) - Claude Code 開發指引

## 維護清單

### 定期檢查
- [ ] 監控 Cloud Run 效能指標
- [ ] 檢查 CDN 快取命中率
- [ ] 審查 Cloud Logging 錯誤日誌
- [ ] 更新依賴套件安全性
- [ ] 檢查 Supabase 資料庫用量
- [ ] 審查 IAM 權限設定

### 月度任務
- [ ] 檢視成本報告
- [ ] 測試災難復原流程
- [ ] 更新 SSL 憑證（自動，僅需驗證）
- [ ] 審查存取日誌

### 季度任務
- [ ] 效能基準測試
- [ ] 安全性稽核
- [ ] 架構檢視與優化
- [ ] 備份復原測試

## 聯絡資訊

- **GCP 專案管理員**: island.porter.lq@gmail.com
- **專案 Repository**: [GitHub 連結]
- **問題回報**: [GitHub Issues]

---

**最後更新**: 2026-01-15
**架構版本**: 1.0.0
**維護者**: Claude Code

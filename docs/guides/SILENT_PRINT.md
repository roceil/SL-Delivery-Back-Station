# 🖨️ Chrome 靜默列印設定指南

本文件說明如何在 Chrome 中實現靜默列印（Silent Print）功能。

## 方案比較

| 方案 | 難度 | 優點 | 缺點 | 推薦程度 |
|------|------|------|------|----------|
| **本地列印服務** | ⭐⭐ | 完全靜默、跨平台、易於維護 | 需要額外啟動服務 | ⭐⭐⭐⭐⭐ |
| **Kiosk 模式** | ⭐ | 無需額外服務 | 全螢幕模式、功能受限 | ⭐⭐⭐ |
| **Chrome 擴充功能** | ⭐⭐⭐ | 使用者體驗好 | 需要企業版或自行開發 | ⭐⭐ |

---

## ✅ 方案 1：本地列印服務（推薦）

這是最推薦的方案，已在本專案中實作完成。

### 快速開始

#### 1. 安裝並啟動服務

```bash
# 方法 A：使用安裝腳本（推薦）
cd print-service
./install.sh
pnpm start

# 方法 B：手動安裝
cd print-service
pnpm install
pnpm start
```

#### 2. 驗證服務運行

開啟瀏覽器訪問：http://localhost:9100/health

應該看到：
```json
{
  "status": "ok",
  "platform": "darwin"
}
```

#### 3. 開始使用

1. 啟動主應用：`pnpm dev`（在專案根目錄）
2. 前往訂單詳情頁面
3. 你會看到綠色的「快速列印」按鈕
4. 點擊即可靜默列印，無需預覽！

### 設定自動啟動

<details>
<summary>macOS 自動啟動設定</summary>

建立 LaunchAgent 設定檔：

```bash
cat > ~/Library/LaunchAgents/com.sl-delivery.print-service.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.sl-delivery.print-service</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>ABSOLUTE_PATH_TO/print-service/server.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/print-service.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/print-service-error.log</string>
</dict>
</plist>
EOF

# 記得替換 ABSOLUTE_PATH_TO 為實際路徑
# 載入服務
launchctl load ~/Library/LaunchAgents/com.sl-delivery.print-service.plist
```

</details>

<details>
<summary>Windows 自動啟動設定</summary>

1. 開啟「工作排程器」（Task Scheduler）
2. 點擊「建立基本工作」
3. 名稱：SL Delivery Print Service
4. 觸發程序：電腦啟動時
5. 動作：啟動程式
   - 程式：`C:\Program Files\nodejs\node.exe`
   - 引數：`完整路徑\print-service\server.js`
   - 開始位於：`完整路徑\print-service`

</details>

### 疑難排解

#### 問題：看不到「快速列印」按鈕

**解決方案：**
1. 檢查服務是否運行：`curl http://localhost:9100/health`
2. 查看瀏覽器 Console 是否有錯誤
3. 重新整理頁面

#### 問題：Port 9100 被佔用

**解決方案：**
```bash
# 查看佔用 port 的程式
lsof -i :9100

# 修改 port（編輯 print-service/server.js）
const PORT = 9101  # 改為其他 port
```

#### 問題：列印失敗

**解決方案：**
1. 確認印表機已開啟並連線
2. 檢查是否有列印權限
3. 查看服務 log：`tail -f /tmp/print-service.log`

---

## 方案 2：Chrome Kiosk 模式

適合專用的列印工作站。

### 使用方式

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --kiosk-printing \
  --kiosk \
  "http://localhost:3000"

# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --kiosk-printing ^
  --kiosk ^
  "http://localhost:3000"

# Linux
google-chrome \
  --kiosk-printing \
  --kiosk \
  "http://localhost:3000"
```

### 優點
- 無需額外服務
- 設定簡單

### 缺點
- 全螢幕模式，無法使用其他視窗
- 難以正常關閉
- 不適合日常使用

---

## 方案 3：Chrome 擴充功能

### 選項 A：使用現成擴充功能

在 Chrome Web Store 搜尋：
- **Silent Print** (需要企業版 Chrome)
- **Print Preview Minimized**

### 選項 B：自行開發擴充功能

適合進階使用者，需要了解 Chrome Extension API。

---

## 技術細節

### 架構圖

```
┌─────────────────┐
│   瀏覽器前端     │
│  (Nuxt App)     │
└────────┬────────┘
         │ HTTP Request
         │ POST /print
         ▼
┌─────────────────┐
│  本地列印服務    │
│  (Node.js)      │
│  Port: 9100     │
└────────┬────────┘
         │ System Call
         │ lp / wmic
         ▼
┌─────────────────┐
│   作業系統       │
│   列印服務       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    印表機        │
└─────────────────┘
```

### API 規格

#### POST /print

**請求：**
```json
{
  "dataUrl": "data:image/png;base64,iVBORw0KG...",
  "printerName": "HP_LaserJet_Pro",
  "width": 100,
  "height": 50
}
```

**回應：**
```json
{
  "success": true,
  "message": "列印成功"
}
```

### 安全性考量

⚠️ **重要安全提醒**

- 此服務僅供內部網路使用
- 不要暴露到公開網路
- 建議設定防火牆規則
- 考慮添加 API Key 驗證

#### 添加 API Key 驗證（選用）

編輯 `print-service/server.js`：

```javascript
const API_KEY = 'your-secret-key'

app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key']
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
})
```

---

## 相關文件

- [列印服務詳細文件](./print-service/README.md)
- [Nuxt 專案文件](./README.md)
- [開發指南](./CLAUDE.md)

## 常見問題

<details>
<summary>Q: 可以在手機上使用靜默列印嗎？</summary>

A: 不行。本方案需要本地服務，僅支援桌面環境。手機建議使用一般列印功能。
</details>

<details>
<summary>Q: 支援哪些印表機？</summary>

A: 支援所有作業系統可識別的印表機，包括 USB、網路、藍牙印表機。
</details>

<details>
<summary>Q: 可以列印到 PDF 嗎？</summary>

A: 可以。在作業系統中安裝 PDF 印表機（如 Microsoft Print to PDF），然後指定該印表機名稱即可。
</details>

<details>
<summary>Q: 效能如何？</summary>

A: 非常快速。一般標籤列印（100mm×50mm）約 0.5-1 秒完成。
</details>

---

## 授權

MIT License

---

**有問題？** 請查看 [列印服務 README](./print-service/README.md) 或提交 Issue。

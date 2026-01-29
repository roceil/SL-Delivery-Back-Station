# 靜默列印服務

本服務提供靜默列印功能，讓您可以跳過瀏覽器列印預覽對話框，直接列印到指定的印表機。

## 功能特色

- ✅ 靜默列印（無預覽對話框）
- ✅ 支援自訂紙張尺寸
- ✅ 支援多種作業系統（macOS、Windows、Linux）
- ✅ 自動偵測可用印表機
- ✅ RESTful API 介面

## 安裝步驟

### 1. 安裝依賴套件

```bash
cd print-service
pnpm install
```

或使用 npm：

```bash
cd print-service
npm install
```

### 2. 啟動服務

```bash
pnpm start
```

或：

```bash
npm start
```

服務將會在 `http://localhost:9100` 上運行。

### 3. 開發模式（自動重啟）

```bash
pnpm dev
```

## 使用方式

### 前端整合

服務啟動後，前端會自動偵測並顯示「快速列印」按鈕：

1. 開啟訂單詳情頁面
2. 如果看到綠色的「快速列印」按鈕，表示服務已連接
3. 點擊「快速列印」即可直接列印，無需預覽

### API 端點

#### 1. 健康檢查

```bash
GET http://localhost:9100/health
```

回應：
```json
{
  "status": "ok",
  "platform": "darwin"
}
```

#### 2. 獲取印表機列表

```bash
GET http://localhost:9100/printers
```

回應：
```json
{
  "printers": "printer hp_laserjet_pro\nprinter Brother_HL-L2320D"
}
```

#### 3. 列印

```bash
POST http://localhost:9100/print
Content-Type: application/json

{
  "dataUrl": "data:image/png;base64,iVBORw0KG...",
  "printerName": "HP_LaserJet_Pro",
  "width": 100,
  "height": 50
}
```

回應：
```json
{
  "success": true,
  "message": "列印成功"
}
```

## 作業系統設定

### macOS

使用內建的 `lp` 指令，無需額外設定。

查看可用印表機：
```bash
lpstat -p -d
```

### Windows

#### 選項 1：使用 Node.js 套件（推薦）

安裝 `pdf-to-printer` 套件：

```bash
pnpm add pdf-to-printer
```

#### 選項 2：使用 SumatraPDF

1. 下載並安裝 [SumatraPDF](https://www.sumatrapdfreader.org/)
2. 確保 `SumatraPDF.exe` 在系統 PATH 中

查看可用印表機：
```cmd
wmic printer get name
```

### Linux

使用 CUPS 列印系統。

安裝 CUPS（如果未安裝）：
```bash
sudo apt-get install cups
```

查看可用印表機：
```bash
lpstat -p -d
```

## 自動啟動設定

### macOS - LaunchAgent

建立 `~/Library/LaunchAgents/com.sl-delivery.print-service.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.sl-delivery.print-service</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/YOUR_USERNAME/Desktop/GitHub/SL-Delivery-Backstation/print-service/server.js</string>
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
```

載入並啟動：
```bash
launchctl load ~/Library/LaunchAgents/com.sl-delivery.print-service.plist
```

### Windows - 工作排程器

1. 開啟「工作排程器」
2. 建立基本工作
3. 觸發程序：登入時
4. 動作：啟動程式
5. 程式：`node.exe`
6. 引數：`C:\path\to\print-service\server.js`

### Linux - systemd

建立 `/etc/systemd/system/print-service.service`：

```ini
[Unit]
Description=SL Delivery Print Service
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/print-service
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

啟動服務：
```bash
sudo systemctl enable print-service
sudo systemctl start print-service
```

## 疑難排解

### 服務無法啟動

檢查 port 9100 是否被佔用：

```bash
# macOS/Linux
lsof -i :9100

# Windows
netstat -ano | findstr :9100
```

如需更換 port，修改 `server.js` 中的 `PORT` 常數。

### 列印失敗

1. 確認印表機已正確安裝並設為預設印表機
2. 檢查印表機是否在線上
3. 確認有足夠的列印權限
4. 查看服務 log 檔案

### 前端看不到「快速列印」按鈕

1. 確認服務已啟動（訪問 http://localhost:9100/health）
2. 檢查瀏覽器 Console 是否有 CORS 錯誤
3. 重新整理訂單詳情頁面

## 安全性建議

- 此服務僅供內部網路使用
- 不要暴露到公開網路
- 建議設定防火牆規則限制訪問
- 考慮添加身份驗證（API Key 或 JWT）

## 進階配置

### 設定預設印表機

修改 `server.js`，在 POST `/print` 端點中添加預設印表機名稱。

### 支援更多格式

目前支援 PNG 格式。如需支援 PDF：

```bash
pnpm add pdfkit
```

### 批次列印

可擴展 API 支援一次列印多個文件。

## 授權

MIT License

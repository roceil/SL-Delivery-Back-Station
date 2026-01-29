# 🔧 修復重疊 Canvas 問題

## 問題描述

重新整理頁面後，列印的 canvas 會出現舊版和新版重疊的問題。

## 原因

這是因為 localStorage 中儲存了舊格式的模板資料（使用 `order.xxx` 欄位格式），與新格式衝突導致。

## 解決方案

### 方法 1：使用「重置為預設」按鈕（推薦）

1. 前往 [列印設定頁面](http://localhost:3000/print-settings)
2. 點擊右上角的紅色「重置為預設」按鈕
3. 確認重置
4. 頁面會自動重新載入並使用乾淨的預設模板

### 方法 2：手動清除 localStorage

開啟瀏覽器開發者工具（F12 或 Cmd+Option+I），在 Console 執行：

```javascript
// 清除所有列印設定
localStorage.removeItem('printTemplates')
localStorage.removeItem('currentTemplateId')
localStorage.removeItem('templateVersion')

// 重新載入頁面
location.reload()
```

### 方法 3：使用無痕模式測試

如果想先測試而不影響現有設定：

1. 開啟無痕視窗（Cmd+Shift+N 或 Ctrl+Shift+N）
2. 訪問應用
3. 測試列印功能

## 預防措施

現在系統已加入**版本控制機制**：

- ✅ 自動偵測舊格式資料
- ✅ 版本不符時自動清除
- ✅ 確保始終使用最新模板
- ✅ 防止資料衝突

當你下次遇到類似問題時，系統會自動處理。

## 驗證修復

清除後，請驗證：

1. **前往訂單詳情頁面**
2. **檢查預覽畫面**：
   - ✅ Canvas 顯示正常
   - ✅ 沒有重疊內容
   - ✅ 只有一套元素
3. **點擊列印**：
   - ✅ 預覽中只有一頁
   - ✅ 內容清晰不重疊
4. **重新整理頁面**：
   - ✅ 問題不再出現

## 技術細節

### 模板版本控制

系統現在使用版本號碼 `2.0` 來標記新格式：

```typescript
const TEMPLATE_VERSION = '2.0'

// 載入時檢查版本
if (savedVersion !== TEMPLATE_VERSION) {
  // 清除舊資料
  // 使用預設模板
}
```

### 欄位格式變更

| 舊格式 (v1.x) | 新格式 (v2.0) |
|---------------|---------------|
| `order.id` | `id` |
| `order.lineName` | `lineName` |
| `order.pickupLocation.name` | `pickupLocation.name` |
| `order.deliveryLocation.name` | `deliveryLocation.name` |

**原因**：`order` 物件本身就是訂單資料，不需要 `order.` 前綴。

### 自動遷移

如果系統偵測到舊格式，會自動轉換：

```typescript
function migrateFieldFormat(template) {
  template.elements = template.elements.map(element => {
    if (element.field?.startsWith('order.')) {
      element.field = element.field.replace(/^order\./, '')
    }
    return element
  })
  return template
}
```

## 常見問題

<details>
<summary>Q: 清除後我的自訂設定會消失嗎？</summary>

A: 是的，會恢復到預設模板。建議：
1. 截圖記錄目前的設定
2. 清除並重置
3. 重新調整設定
</details>

<details>
<summary>Q: 為什麼會發生這個問題？</summary>

A: 因為程式碼更新改變了資料格式，但 localStorage 中還保留著舊格式的資料，導致衝突。
</details>

<details>
<summary>Q: 以後還會遇到類似問題嗎？</summary>

A: 不會。系統現在有版本控制機制，會自動處理格式變更。
</details>

<details>
<summary>Q: 能否保留舊設定並升級？</summary>

A: 理論上可以，但因為涉及資料結構變更，建議重新設定以確保穩定性。
</details>

## 報告問題

如果清除後問題仍然存在，請提供：

1. 瀏覽器類型和版本
2. 錯誤訊息（如有）
3. 開發者工具 Console 的輸出
4. 列印預覽的截圖

---

**需要協助？** 查看 [開發文件](./CLAUDE.md) 或提交 Issue。

# 🔍 Canvas Scale 一致性修復

## 問題說明

在列印設定頁面調整好元素位置後，實際列印時樣式與預覽不一致。

## 根本原因

之前兩個地方使用的 `scale` 參數不同：

| 位置 | 舊 Scale | 新 Scale |
|------|----------|----------|
| 列印設定頁面預覽 | 3 | 2 |
| 訂單詳情列印 | 3.7795275591 | 1 |

## 解決方案

### 統一 Scale 計算邏輯

PrintCanvas 元件內部的 `mmToPx` 函數：

```typescript
const mmToPx = (mm: number) => mm * props.scale * 3.7795275591
```

其中 `3.7795275591` 是固定的 DPI 轉換常數（96 DPI）。

### 現在的配置

**列印設定頁面（用於編輯）**：
```vue
<PrintCanvas
  :scale="2"
  :interactive="true"
/>
```
- Canvas 尺寸：100mm × 50mm → 756px × 378px
- 用途：提供 2 倍放大的預覽，方便編輯

**訂單詳情頁面（用於列印）**：
```vue
<PrintCanvas
  :scale="1"
  :interactive="false"
/>
```
- Canvas 尺寸：100mm × 50mm → 378px × 189px
- 用途：實際尺寸，確保列印準確

### 為什麼可以不同？

PrintCanvas 的座標轉換邏輯會自動處理：

```typescript
// 滑鼠移動時，像素座標轉回 mm
const newX = (mouseX - dragOffset.x) / (scale * 3.7795275591)
const newY = (mouseY - dragOffset.y) / (scale * 3.7795275591)

// 繪製時，mm 轉成像素座標
const x = mmToPx(element.x)  // = element.x * scale * 3.7795275591
const y = mmToPx(element.y)  // = element.y * scale * 3.7795275591
```

**關鍵**：元素位置以 **mm** 為單位儲存，不管 scale 是多少，mm 值都一樣！

## 驗證步驟

### 1. 清除舊資料

```javascript
// 開發者工具 Console
localStorage.clear()
location.reload()
```

### 2. 測試編輯

1. 前往 http://localhost:3000/print-settings
2. 新增一個文字元素
3. 拖曳到特定位置（例如 x=20mm, y=10mm）
4. 點擊「儲存設定」

### 3. 驗證列印

1. 前往任一訂單詳情頁
2. 點擊「列印訂單」
3. 在預覽中確認：
   - ✅ 元素位置正確
   - ✅ 與編輯時的相對位置一致
   - ✅ QR Code 和文字清晰

### 4. 檢查座標

在列印設定頁面，選中元素後查看屬性面板：
- X 位置應該顯示 mm 值（例如 20.0mm）
- Y 位置應該顯示 mm 值（例如 10.0mm）

## 技術細節

### DPI 轉換

```
1 inch = 25.4 mm
1 inch = 96 px (at 96 DPI)
因此：1 mm = 96 / 25.4 = 3.7795275591 px
```

### Scale 的作用

`scale` 參數用於控制 **顯示大小**，不影響實際儲存的 mm 值：

- `scale=1`：實際大小（1mm = 3.78px）
- `scale=2`：2 倍放大（1mm = 7.56px）
- `scale=3`：3 倍放大（1mm = 11.34px）

### 為什麼編輯用 scale=2？

- ✅ 100mm × 50mm 的卡片在 scale=1 時太小（378×189px）
- ✅ scale=2 提供 756×378px 的預覽，方便操作
- ✅ 座標自動轉換，確保一致性

### 為什麼列印用 scale=1？

- ✅ 確保實際尺寸準確
- ✅ 避免不必要的縮放
- ✅ 列印品質最佳

## 常見問題

<details>
<summary>Q: 為什麼預覽和列印用不同的 scale？</summary>

A: 編輯時需要較大的預覽方便操作，列印時需要實際尺寸確保準確。元素位置以 mm 儲存，自動處理轉換。
</details>

<details>
<summary>Q: 如果我改成 scale=3 會怎樣？</summary>

A: 預覽會更大（3 倍），但元素的 mm 位置不變，列印結果一樣。
</details>

<details>
<summary>Q: 座標轉換會有誤差嗎？</summary>

A: JavaScript 使用 64 位浮點數，精度足夠。實際誤差 < 0.001mm，可忽略。
</details>

<details>
<summary>Q: 為什麼不統一用同一個 scale？</summary>

A: 可以統一，但會犧牲編輯體驗（太小）或列印準確度（過度縮放）。
</details>

## 如果還是不一致

請檢查以下幾點：

### 1. 確認 localStorage 已清除

```javascript
// 查看當前版本
console.log(localStorage.getItem('templateVersion'))  // 應該是 "2.0"

// 查看模板資料
console.log(JSON.parse(localStorage.getItem('printTemplates')))
```

### 2. 檢查元素欄位

確認所有元素的 `field` 屬性：
- ✅ 正確：`"id"`, `"lineName"`, `"pickupLocation.name"`
- ❌ 錯誤：`"order.id"`, `"order.lineName"`

### 3. 查看 Console 錯誤

開發者工具 → Console，是否有錯誤訊息？

### 4. 重新建立元素

刪除所有元素，重新添加並調整位置。

## 相關文件

- [修復重疊問題](./FIX_DUPLICATE.md)
- [列印設定指南](./PRINT_SETUP.md)
- [開發文件](./CLAUDE.md)

---

**修復完成後**，兩個地方的顯示應該是一致的了。如果還有問題，請提供截圖對比。

# 訂單系統資料表關係說明

## 架構概覽

訂單系統採用**三層資料結構**設計：

### 兩條路徑

**路徑 1: 散客訂單（兩層）**
1. **orders** (第一層) - 配送資訊
2. **normal_orders** (第二層) - 散客訂單明細

**路徑 2: 同業訂單（三層）**
1. **orders** (第一層) - 配送資訊
2. **net_orders** (第二層) - 同業訂單彙整
3. **trip_orders / klook_orders** (第三層) - 各平台訂單明細

---

## 資料表關係圖

```
                    ┌─────────────────────────┐
                    │   platforms (平台類型)   │
                    │  1. Trip                │
                    │  2. Klook               │
                    │  3. Net                 │
                    │  4. Normal              │
                    └─────────────────────────┘
                              │
                              │ platform_type (FK)
                              ▼
        ┌──────────────────────────────────────────────┐
        │         orders (第一層：訂單總表)             │
        ├──────────────────────────────────────────────┤
        │ • platform_type → platforms.id              │
        │     1=Trip, 2=Klook, 3=Net, 4=Normal        │
        │ • platform_id (VARCHAR)                     │
        │     → 對應第二層訂單表的 id (字串)           │
        │ • start_point / end_point → 配送路線        │
        │ • schedule_id → 配送行程                    │
        │ • status → 配送狀態                         │
        └──────────────────────────────────────────────┘
                              │
             ┌────────────────┴────────────────┐
             │                                 │
             │ platform_type=3                 │ platform_type=4
             │ platform_id → net_orders.id     │ platform_id → normal_orders.id
             ▼                                 ▼
┌─────────────────────────────┐   ┌────────────────────────────┐
│ net_orders (第二層：同業訂單) │   │ normal_orders (第二層)     │
├─────────────────────────────┤   │        散客訂單明細         │
│ • platform_type → platforms │   ├────────────────────────────┤
│     1=Trip, 2=Klook         │   │ • product_id               │
│ • platform_id (VARCHAR)     │   │ • departure_date           │
│     → trip_orders.id 或     │   │ • receive_time             │
│       klook_orders.id       │   │ • contacts (JSONB)         │
│ • product_id                │   │ • status                   │
│ • departure_date            │   └────────────────────────────┘
│ • contacts (JSONB)          │            (結束：兩層架構)
│ • status                    │
└─────────────────────────────┘
             │
             │ 邏輯關聯
             │
   ┌─────────┴─────────┐
   │                   │
   │ platform_type=1   │ platform_type=2
   ▼                   ▼
┌──────────────┐  ┌──────────────┐
│ trip_orders  │  │klook_orders  │
│ (第三層)     │  │  (第三層)    │
├──────────────┤  ├──────────────┤
│ • order_number│  │ • reseller_  │
│ • product_id │  │   reference  │
│ • vouchers   │  │ • unit_items │
│ • item_id    │  │ • uuid       │
│ • sequence_id│  │ • option_id  │
└──────────────┘  └──────────────┘
   (結束：三層架構)   (結束：三層架構)
```

---

## orders (訂單總表)

### 用途
存放**所有平台訂單的共通配送資訊**，包括：
- 配送路線（起點、終點）
- 配送行程（schedule_id）
- 配送狀態（待確認、已確認、配送中、已送達等）
- 使用者、商家資訊

### 關鍵欄位

| 欄位 | 類型 | 說明 |
|------|------|------|
| `platform_type` | INTEGER | 平台類型 (1=Trip, 2=Klook, 3=Net, 4=Normal) |
| `platform_id` | VARCHAR | 對應平台訂單表的 ID（字串格式）|
| `start_point` | INTEGER | 起點站點 (FK → stations) |
| `end_point` | INTEGER | 終點站點 (FK → stations) |
| `schedule_id` | INTEGER | 配送行程 (FK → schedules) |
| `status` | INTEGER | 配送狀態 (FK → orders_status) |
| `scan_counts` | INTEGER | 掃描次數 |

### orders_status (訂單配送狀態)

| ID | Status | 說明 |
|----|--------|------|
| 1 | pending | 待確認 |
| 2 | confirmed | 已確認 |
| 3 | assigned | 已分配行程 |
| 4 | in_delivery | 配送中 |
| 5 | delivered | 已送達 |
| 6 | cancelled | 已取消 |

---

## normal_orders (散客訂單明細)

### 用途
存放**散客訂單的特定資訊**，包括：
- 產品資訊
- 出發日期、取件時間
- 聯絡人資訊
- 數量管理（訂購、已使用、已取消）

### 關鍵欄位

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | SERIAL | 主鍵（對應 orders.platform_id）|
| `status` | INTEGER | 訂單狀態 (FK → normal_status) |
| `product_id` | INTEGER | 產品 (FK → normal_products) |
| `departure_date` | DATE | 出發日期 |
| `receive_time` | TIME | 取件時間 |
| `quantity` | INTEGER | 訂購數量 |
| `use_quantity` | INTEGER | 已使用數量 |
| `cancel_quantity` | INTEGER | 取消數量 |
| `contacts` | JSONB | 聯絡資訊（JSON 格式）|

### normal_status (散客訂單狀態)

| ID | Status | Code | 說明 |
|----|--------|------|------|
| 1 | 待確認 | ON_HOLD | 等待確認 |
| 2 | 已確認 | CONFIRMED | 已確認訂單 |
| 3 | 已取消 | CANCELLED | 訂單已取消 |

### normal_products (散客產品)

| ID | Product Name | Product Identity ID |
|----|--------------|---------------------|
| 1 | 小琉球｜行李運送｜單次 | Normal-Luggage-Delivery-001 |

---

## trip_orders (Trip 訂單明細)

### 關鍵欄位

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | SERIAL | 主鍵 |
| `order_number` | VARCHAR | 訂單編號 |
| `product_id` | INTEGER | 產品 (FK → trip_products) |
| `status` | INTEGER | 訂單狀態 (FK → trip_status) |
| `departure_date` | DATE | 出發日期 |
| `quantity` / `use_quantity` / `cancel_quantity` | INTEGER | 數量管理 |
| `contacts` | JSONB | 聯絡資訊 |
| `vouchers` | TEXT | 憑證資訊 |
| `item_id` / `sequence_id` | VARCHAR | Trip 平台專用欄位 |

---

## klook_orders (Klook 訂單明細)

### 關鍵欄位

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | SERIAL | 主鍵 |
| `reseller_reference` | VARCHAR | 分銷商參考編號 |
| `product_id` | INTEGER | 產品 (FK → klook_products) |
| `status` | INTEGER | 訂單狀態 (FK → klook_status) |
| `departure_date` | DATE | 出發日期 |
| `quantity` / `use_quantity` / `cancel_quantity` | INTEGER | 數量管理 |
| `contacts` | JSONB | 聯絡資訊 |
| `unit_items` | JSONB | 單位項目資訊 |
| `option_id` / `uuid` | VARCHAR | Klook 平台專用欄位 |

---

## net_orders (第二層：Net 同業訂單彙整)

### 用途
作為**同業訂單的中繼層**，彙整來自 Trip 和 Klook 的訂單，提供統一的同業訂單管理介面。

### 關鍵欄位

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | SERIAL | 主鍵（對應 orders.platform_id）|
| `platform_type` | INTEGER | 第三層平台類型 (1=Trip, 2=Klook) |
| `platform_id` | VARCHAR | 第三層訂單 ID（trip_orders.id 或 klook_orders.id，字串格式）|
| `status` | INTEGER | 訂單狀態 (FK → net_status) |
| `product_id` | INTEGER | 產品 (FK → net_products) |
| `departure_date` | DATE | 出發日期 |
| `quantity` / `use_quantity` / `cancel_quantity` | INTEGER | 數量管理 |
| `contacts` | JSONB | 聯絡資訊 |

### 重要說明

**net_orders 的雙重角色：**
1. **向上**：被 `orders` 表關聯（orders.platform_type=3, platform_id=net_orders.id）
2. **向下**：關聯到 `trip_orders` 或 `klook_orders`（net_orders.platform_type + platform_id）

**為什麼需要這個中繼層？**
- 統一管理來自不同平台（Trip/Klook）的同業訂單
- 提供一致的同業訂單介面，方便批次操作
- 在配送層面（orders）不需要區分是 Trip 還是 Klook

---

## 關聯邏輯說明

### 1. 三層架構的關聯方式

**關鍵：所有 `platform_id` 欄位都是 VARCHAR 類型（邏輯關聯，非外鍵）**

#### 路徑 1: 散客訂單（兩層）

```sql
-- 查詢 Normal 訂單的完整資訊
SELECT
  o.*,
  no.*
FROM orders o
LEFT JOIN normal_orders no ON o.platform_id = no.id::text
WHERE o.platform_type = 4;  -- 4 = Normal
```

#### 路徑 2: 同業訂單（三層）

**範例 1：查詢 Trip 訂單的完整資訊（三層查詢）**
```sql
SELECT
  o.*,              -- 第一層：配送資訊
  no.*,             -- 第二層：同業訂單彙整
  to.*              -- 第三層：Trip 訂單明細
FROM orders o
LEFT JOIN net_orders no ON o.platform_id = no.id::text
LEFT JOIN trip_orders to ON no.platform_id = to.id::text
WHERE o.platform_type = 3     -- 3 = Net
  AND no.platform_type = 1;   -- 1 = Trip
```

**範例 2：查詢 Klook 訂單的完整資訊（三層查詢）**
```sql
SELECT
  o.*,              -- 第一層：配送資訊
  no.*,             -- 第二層：同業訂單彙整
  ko.*              -- 第三層：Klook 訂單明細
FROM orders o
LEFT JOIN net_orders no ON o.platform_id = no.id::text
LEFT JOIN klook_orders ko ON no.platform_id = ko.id::text
WHERE o.platform_type = 3     -- 3 = Net
  AND no.platform_type = 2;   -- 2 = Klook
```

### 2. 為什麼使用 VARCHAR 而非 INTEGER？

關鍵原因：
1. **避免 ID 衝突** - 不同表的自增 ID 可能重複（trip_orders.id=1 和 normal_orders.id=1）
2. **彈性設計** - 某些平台可能使用字串格式的訂單 ID
3. **擴展性** - 未來可能接入使用非數字 ID 的平台

### 3. 資料流程

#### 建立散客訂單流程（兩層）
```
1. 建立 normal_orders
   ↓
   INSERT INTO normal_orders (...) RETURNING id  -- 例如: 123

2. 建立 orders
   ↓
   INSERT INTO orders (
     platform_type = 4,         -- Normal
     platform_id = '123',       -- normal_orders.id 轉字串
     start_point = ...,
     end_point = ...,
     ...
   )
```

#### 建立同業訂單流程（三層）
```
1. 建立第三層訂單（trip_orders 或 klook_orders）
   ↓
   INSERT INTO trip_orders (...) RETURNING id  -- 例如: 456

2. 建立第二層訂單（net_orders）
   ↓
   INSERT INTO net_orders (
     platform_type = 1,         -- Trip
     platform_id = '456',       -- trip_orders.id 轉字串
     product_id = ...,
     departure_date = ...,
     ...
   ) RETURNING id  -- 例如: 789

3. 建立第一層訂單（orders）
   ↓
   INSERT INTO orders (
     platform_type = 3,         -- Net
     platform_id = '789',       -- net_orders.id 轉字串
     start_point = ...,
     end_point = ...,
     ...
   )
```

#### 查詢訂單流程
```
1. 從 orders 表查詢，根據 platform_type 判斷路徑
   ↓
2. 若 platform_type = 4 (Normal)
   → 關聯 normal_orders（兩層結束）

   若 platform_type = 3 (Net)
   → 關聯 net_orders
      ↓
3. 根據 net_orders.platform_type 繼續關聯
   → 若 = 1，關聯 trip_orders（三層結束）
   → 若 = 2，關聯 klook_orders（三層結束）
```

---

## 資料一致性建議

### 目前設計的潛在問題
- **無外鍵約束**：`orders.platform_id` 與平台訂單表之間沒有強制關聯
- **資料不一致風險**：刪除平台訂單時，orders 表的記錄可能成為孤兒資料

### 建議的處理方式

#### 方案 1：應用層面控制
```typescript
// 使用 Transaction 確保資料一致性
await supabase.rpc('create_normal_order', {
  // 包含 orders 和 normal_orders 的所有欄位
  // 在資料庫中使用 transaction 一次建立兩筆記錄
})
```

#### 方案 2：資料庫層面約束（修改架構）
```sql
-- 為每個平台訂單表新增外鍵
ALTER TABLE normal_orders
ADD COLUMN order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE;

-- 這樣可以確保：
-- 1. 刪除 orders 時自動刪除對應的 normal_orders
-- 2. 或反過來，刪除 normal_orders 時限制刪除 orders
```

---

## 總結

### 第一層：orders 表的角色
- **配送中心視角**：管理所有訂單的配送狀態、路線、行程
- **統一介面**：無論是散客還是同業訂單，都用相同方式追蹤配送進度
- **關注點**：起點、終點、配送員、配送狀態

### 第二層：net_orders / normal_orders 的角色

**net_orders（同業訂單彙整）：**
- **中繼層**：彙整來自 Trip 和 Klook 的訂單
- **統一管理**：提供一致的同業訂單介面
- **雙向關聯**：向上連接 orders，向下連接 trip_orders/klook_orders

**normal_orders（散客訂單明細）：**
- **終端層**：直接存放散客訂單資訊
- **單向關聯**：只向上連接 orders

### 第三層：trip_orders / klook_orders 的角色
- **平台明細**：存放各平台特定的訂單資訊
- **業務視角**：管理產品、憑證、平台專用欄位
- **獨立狀態**：各平台有自己的狀態管理系統

### 三層架構的優勢

1. **關注點分離**
   - 第一層關注配送物流
   - 第二層關注訂單彙整
   - 第三層關注平台細節

2. **彈性擴展**
   - 新增平台只需加入第三層，不影響配送邏輯
   - 可輕鬆切換或新增同業平台（Trip、Klook、未來的其他平台）

3. **統一管理**
   - 配送人員只需關注 orders 表，不需了解平台差異
   - 業務人員可針對不同平台進行細部管理

4. **資料隔離**
   - 每個平台的特殊欄位互不干擾
   - 散客和同業訂單流程分離，便於維護

### 關聯總覽

```
散客訂單流程（兩層）：
orders (platform_type=4) → normal_orders

同業訂單流程（三層）：
orders (platform_type=3) → net_orders (platform_type=1) → trip_orders
                         → net_orders (platform_type=2) → klook_orders
```

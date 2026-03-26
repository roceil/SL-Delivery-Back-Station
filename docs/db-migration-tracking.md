# 資料庫二次開發 — Migration 執行追蹤

> 最後更新：2026-03-26（M11 新增）
> 狀態標記：⬜ 待執行 ｜ ✅ 已完成 ｜ ❌ 失敗

---

## 🔴 高優先

### M01 ✅ — `orders` 表新增 7 個欄位

```sql
ALTER TABLE orders
  ADD COLUMN service_plan VARCHAR,
  ADD COLUMN payment_status VARCHAR,
  ADD COLUMN luggage_count INTEGER DEFAULT 1,
  ADD COLUMN departure_date DATE,
  ADD COLUMN return_date DATE,
  ADD COLUMN recipient_name VARCHAR,
  ADD COLUMN recipient_phone VARCHAR;
```

| 欄位 | 類型 | 說明 |
|------|------|------|
| `service_plan` | VARCHAR | `'round_trip'` \| `'one_way'` \| `'merchant'` |
| `payment_status` | VARCHAR | `'paid'` \| `'unpaid'` |
| `luggage_count` | INTEGER | 行李數量，預設 1 |
| `departure_date` | DATE | 去程日期 |
| `return_date` | DATE | 回程日期（雙程時填入，單程為 NULL） |
| `recipient_name` | VARCHAR | 領件人姓名 |
| `recipient_phone` | VARCHAR | 領件人電話 |

---

### M02 ✅ — `schedule_orders` 表新增 `leg` 欄位

```sql
ALTER TABLE schedule_orders
  ADD COLUMN leg VARCHAR DEFAULT 'outbound';
```

| 欄位 | 類型 | 說明 |
|------|------|------|
| `leg` | VARCHAR | `'outbound'`（去程）\| `'return'`（回程），預設 outbound |

**邏輯說明**：
- 單程訂單：`schedule_orders` 只有 1 筆，`leg = 'outbound'`
- 雙程訂單：`schedule_orders` 最多 2 筆，分別為 `outbound` 和 `return`

---

### M03 ✅ — 建立 `order_fees` 資料表

```sql
CREATE TABLE order_fees (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_type   VARCHAR NOT NULL,
  item_name   VARCHAR NOT NULL,
  unit_price  INTEGER NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  subtotal    INTEGER NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE order_fees ENABLE ROW LEVEL SECURITY;
```

| 欄位 | 類型 | 說明 |
|------|------|------|
| `order_id` | INTEGER | FK → orders.id |
| `item_type` | VARCHAR | `'plan'`（方案）\| `'addon'`（加值服務） |
| `item_name` | VARCHAR | 如 `'雙程套票'`、`'大型行李'` |
| `unit_price` | INTEGER | 單價（元） |
| `quantity` | INTEGER | 數量 |
| `subtotal` | INTEGER | 小計 = unit_price × quantity |

---

## 🟡 中優先

### M04 ✅ — `couriers` 表新增 `courier_type` 欄位

```sql
ALTER TABLE couriers
  ADD COLUMN courier_type VARCHAR;
```

| 欄位 | 類型 | 說明 |
|------|------|------|
| `courier_type` | VARCHAR | `'long_term'`（長期合作）\| `'short_term'`（短期支援） |

---

### M05 ✅ — 建立 `order_history` 資料表

```sql
CREATE TABLE order_history (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  field_name  VARCHAR NOT NULL,
  old_value   TEXT,
  new_value   TEXT,
  changed_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
```

| 欄位 | 類型 | 說明 |
|------|------|------|
| `order_id` | INTEGER | FK → orders.id |
| `field_name` | VARCHAR | 修改的欄位名稱 |
| `old_value` | TEXT | 變更前的值 |
| `new_value` | TEXT | 變更後的值 |
| `changed_at` | TIMESTAMPTZ | 修改時間 |

---

### M06 ✅ — `schedules_status` 新增 cancelled

```sql
INSERT INTO schedules_status (status, explanation)
VALUES ('cancelled', '已取消');
```

---

### M07 ✅ — 新增 KKday 平台與相關資料表

#### Step 1：platforms 新增 KKday

```sql
INSERT INTO platforms (name, explanation)
VALUES ('KKday', 'KKday 訂單');
-- 預期新 id = 5
```

#### Step 2：建立 `kkday_status`

```sql
CREATE TABLE kkday_status (
  id          SERIAL PRIMARY KEY,
  status      VARCHAR NOT NULL UNIQUE,
  code        VARCHAR,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE kkday_status ENABLE ROW LEVEL SECURITY;

INSERT INTO kkday_status (status, code) VALUES
  ('pending',   'PENDING'),
  ('confirmed', 'CONFIRMED'),
  ('cancelled', 'CANCELLED');
```

#### Step 3：建立 `kkday_products`

```sql
CREATE TABLE kkday_products (
  id                   SERIAL PRIMARY KEY,
  internal_name        VARCHAR NOT NULL,
  reference            VARCHAR,
  product_identity_id  VARCHAR,
  created_at           TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE kkday_products ENABLE ROW LEVEL SECURITY;
```

#### Step 4：建立 `kkday_orders`

```sql
CREATE TABLE kkday_orders (
  id                  SERIAL PRIMARY KEY,
  reseller_reference  VARCHAR,
  status              INTEGER REFERENCES kkday_status(id),
  product_id          INTEGER REFERENCES kkday_products(id),
  departure_date      DATE,
  quantity            INTEGER DEFAULT 1,
  use_quantity        INTEGER DEFAULT 0,
  cancel_quantity     INTEGER DEFAULT 0,
  contacts            JSONB,
  unit_items          JSONB,
  notes               TEXT,
  option_id           VARCHAR,
  uuid                VARCHAR,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE kkday_orders ENABLE ROW LEVEL SECURITY;
```

---

### M11 ✅ — `service_plans` 新增 `item_type` 欄位

```sql
ALTER TABLE service_plans
  ADD COLUMN IF NOT EXISTS item_type VARCHAR;

UPDATE service_plans
  SET item_type = '服務'
  WHERE plan_type = 'addon' AND item_type IS NULL;
```

| 欄位 | 類型 | 說明 |
|------|------|------|
| `item_type` | VARCHAR | addon 專用：`'服務'` \| `'商品'` |

---

## 🟢 低優先

### M08 ✅ — 建立 `salary_records` 資料表

```sql
CREATE TABLE salary_records (
  id              SERIAL PRIMARY KEY,
  courier_id      INTEGER NOT NULL REFERENCES couriers(id),
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  delivery_count  INTEGER DEFAULT 0,
  amount          INTEGER NOT NULL,
  status          VARCHAR DEFAULT 'unpaid',
  paid_at         TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE salary_records ENABLE ROW LEVEL SECURITY;
```

| 欄位 | 類型 | 說明 |
|------|------|------|
| `courier_id` | INTEGER | FK → couriers.id |
| `period_start` / `period_end` | DATE | 結算週期 |
| `delivery_count` | INTEGER | 該週期配送次數 |
| `amount` | INTEGER | 薪資金額（元） |
| `status` | VARCHAR | `'paid'` \| `'unpaid'`，預設 unpaid |
| `paid_at` | TIMESTAMPTZ | 支付時間 |

---

### M09 ✅ — 建立 `service_plans` 資料表（定價設定）

```sql
CREATE TABLE service_plans (
  id          SERIAL PRIMARY KEY,
  plan_type   VARCHAR NOT NULL,
  name        VARCHAR NOT NULL,
  description TEXT,
  unit_price  INTEGER NOT NULL,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE service_plans ENABLE ROW LEVEL SECURITY;

INSERT INTO service_plans (plan_type, name, unit_price) VALUES
  ('delivery', '雙程套票', 250),
  ('delivery', '單程',     130),
  ('addon',    '大型行李',  50),
  ('addon',    '專業器材', 100);
```

| `plan_type` | 說明 |
|-------------|------|
| `'delivery'` | 配送方案 |
| `'addon'` | 加值服務 |

---

### M10 ✅ — 建立 `merchant_pricing` 資料表（商家個別定價）

```sql
CREATE TABLE merchant_pricing (
  id           SERIAL PRIMARY KEY,
  merchant_id  INTEGER NOT NULL REFERENCES merchants(id),
  service_name VARCHAR NOT NULL,
  unit_price   INTEGER NOT NULL,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE merchant_pricing ENABLE ROW LEVEL SECURITY;
```

---

## 執行記錄

| Migration | 執行時間 | 執行者 | 結果 | 備註 |
|-----------|---------|--------|------|------|
| M01 | 2026-03-26 | Claude | ✅ | orders 新增 7 欄 |
| M02 | 2026-03-26 | Claude | ✅ | schedule_orders 新增 leg |
| M03 | 2026-03-26 | Claude | ✅ | 建立 order_fees |
| M04 | 2026-03-26 | Claude | ✅ | couriers 新增 courier_type |
| M05 | 2026-03-26 | Claude | ✅ | 建立 order_history |
| M06 | 2026-03-26 | Claude | ✅ | schedules_status 新增 cancelled |
| M07 | 2026-03-26 | Claude | ✅ | KKday 平台 + kkday_status / kkday_products / kkday_orders |
| M08 | 2026-03-26 | Claude | ✅ | 建立 salary_records |
| M09 | 2026-03-26 | Claude | ✅ | 建立 service_plans + 初始定價資料 |
| M10 | 2026-03-26 | Claude | ✅ | 建立 merchant_pricing |
| M11 | 2026-03-26 | Claude | ✅ | service_plans 新增 item_type 欄位 |

-- =====================================================
-- Supabase Schema Migration
-- 從 Google Sheets 遷移到 PostgreSQL
-- =====================================================

-- =====================================================
-- 1. 查找表 / 狀態表（無外鍵依賴）
-- =====================================================

-- 訂單狀態
CREATE TABLE orders_status (
  id SERIAL PRIMARY KEY,
  status VARCHAR(50) NOT NULL UNIQUE,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 行程狀態
CREATE TABLE schedules_status (
  id SERIAL PRIMARY KEY,
  status VARCHAR(50) NOT NULL UNIQUE,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 配送員狀態
CREATE TABLE couriers_status (
  id SERIAL PRIMARY KEY,
  status VARCHAR(50) NOT NULL UNIQUE,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 商家類型
CREATE TABLE merchants_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 地點類型
CREATE TABLE stations_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 平台類型
CREATE TABLE platforms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip 訂單狀態
CREATE TABLE trip_status (
  id SERIAL PRIMARY KEY,
  status VARCHAR(50) NOT NULL UNIQUE,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Klook 訂單狀態
CREATE TABLE klook_status (
  id SERIAL PRIMARY KEY,
  status VARCHAR(50) NOT NULL UNIQUE,
  code VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Net 訂單狀態
CREATE TABLE net_status (
  id SERIAL PRIMARY KEY,
  status VARCHAR(50) NOT NULL UNIQUE,
  code VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Normal 訂單狀態
CREATE TABLE normal_status (
  id SERIAL PRIMARY KEY,
  status VARCHAR(50) NOT NULL UNIQUE,
  code VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. 產品表（無外鍵依賴）
-- =====================================================

-- Trip 產品
CREATE TABLE trip_products (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  product_identity_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Klook 產品
CREATE TABLE klook_products (
  id SERIAL PRIMARY KEY,
  internal_name VARCHAR(255) NOT NULL,
  reference VARCHAR(255),
  product_identity_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Net 產品
CREATE TABLE net_products (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  product_identity_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Normal 產品
CREATE TABLE normal_products (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  product_identity_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. 核心主表
-- =====================================================

-- 使用者
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  line_user_id VARCHAR(255) UNIQUE,
  display_name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  member_level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 商家
CREATE TABLE merchants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  types INTEGER REFERENCES merchants_types(id),
  is_active BOOLEAN DEFAULT true,
  is_collaborate BOOLEAN DEFAULT false,
  voucher_id VARCHAR(255),
  used_counts INTEGER DEFAULT 0,
  max_usage_counts INTEGER,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 地點站點
CREATE TABLE stations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  area VARCHAR(10),
  type INTEGER REFERENCES stations_types(id),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 配送員
CREATE TABLE couriers (
  id SERIAL PRIMARY KEY,
  employee_number VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  status INTEGER REFERENCES couriers_status(id),
  is_available BOOLEAN DEFAULT true,
  total_deliveries INTEGER DEFAULT 0,
  hire_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 配送行程
CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  courier_id INTEGER REFERENCES couriers(id),
  scheduled_date DATE NOT NULL,
  status INTEGER REFERENCES schedules_status(id) DEFAULT 1,
  dispatched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  tracking_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 統一訂單表
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  platform_type INTEGER REFERENCES platforms(id),
  platform_id VARCHAR(255),
  user_id INTEGER REFERENCES users(id),
  merchant_id INTEGER REFERENCES merchants(id),
  voucher_id VARCHAR(255),
  scan_counts INTEGER DEFAULT 0,
  start_point INTEGER REFERENCES stations(id),
  end_point INTEGER REFERENCES stations(id),
  schedule_id INTEGER REFERENCES schedules(id),
  status INTEGER REFERENCES orders_status(id) DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. 平台特定訂單表
-- =====================================================

-- Trip 訂單
CREATE TABLE trip_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(255),
  product_id INTEGER REFERENCES trip_products(id),
  status INTEGER REFERENCES trip_status(id),
  departure_date DATE,
  quantity INTEGER DEFAULT 1,
  use_quantity INTEGER DEFAULT 0,
  cancel_quantity INTEGER DEFAULT 0,
  contacts JSONB,
  vouchers TEXT,
  item_id VARCHAR(255),
  sequence_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Klook 訂單
CREATE TABLE klook_orders (
  id SERIAL PRIMARY KEY,
  reseller_reference VARCHAR(255),
  status INTEGER REFERENCES klook_status(id),
  product_id INTEGER REFERENCES klook_products(id),
  departure_date DATE,
  quantity INTEGER DEFAULT 1,
  use_quantity INTEGER DEFAULT 0,
  cancel_quantity INTEGER DEFAULT 0,
  contacts JSONB,
  unit_items JSONB,
  notes TEXT,
  option_id VARCHAR(255),
  uuid VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Net 訂單
CREATE TABLE net_orders (
  id SERIAL PRIMARY KEY,
  status INTEGER REFERENCES net_status(id),
  product_id INTEGER REFERENCES net_products(id),
  platform_id INTEGER REFERENCES platforms(id),
  departure_date DATE,
  quantity INTEGER DEFAULT 1,
  use_quantity INTEGER DEFAULT 0,
  cancel_quantity INTEGER DEFAULT 0,
  contacts JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Normal 訂單
CREATE TABLE normal_orders (
  id SERIAL PRIMARY KEY,
  status INTEGER REFERENCES normal_status(id),
  product_id INTEGER REFERENCES normal_products(id),
  departure_date DATE,
  receive_time TIME,
  quantity INTEGER DEFAULT 1,
  use_quantity INTEGER DEFAULT 0,
  cancel_quantity INTEGER DEFAULT 0,
  contacts JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. 關聯表
-- =====================================================

-- 行程訂單關聯
CREATE TABLE schedule_orders (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(schedule_id, order_id)
);

-- =====================================================
-- 6. 索引（提升查詢效能）
-- =====================================================

-- Users
CREATE INDEX idx_users_line_user_id ON users(line_user_id);
CREATE INDEX idx_users_phone ON users(phone);

-- Orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_merchant_id ON orders(merchant_id);
CREATE INDEX idx_orders_schedule_id ON orders(schedule_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_start_point ON orders(start_point);
CREATE INDEX idx_orders_end_point ON orders(end_point);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Schedules
CREATE INDEX idx_schedules_courier_id ON schedules(courier_id);
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_schedules_scheduled_date ON schedules(scheduled_date);

-- Schedule_Orders
CREATE INDEX idx_schedule_orders_schedule_id ON schedule_orders(schedule_id);
CREATE INDEX idx_schedule_orders_order_id ON schedule_orders(order_id);
CREATE INDEX idx_schedule_orders_is_completed ON schedule_orders(is_completed);

-- Stations
CREATE INDEX idx_stations_area ON stations(area);
CREATE INDEX idx_stations_type ON stations(type);

-- Merchants
CREATE INDEX idx_merchants_voucher_id ON merchants(voucher_id);
CREATE INDEX idx_merchants_is_active ON merchants(is_active);

-- Couriers
CREATE INDEX idx_couriers_status ON couriers(status);
CREATE INDEX idx_couriers_is_available ON couriers(is_available);

-- Trip Orders
CREATE INDEX idx_trip_orders_order_number ON trip_orders(order_number);
CREATE INDEX idx_trip_orders_departure_date ON trip_orders(departure_date);

-- Klook Orders
CREATE INDEX idx_klook_orders_reseller_reference ON klook_orders(reseller_reference);
CREATE INDEX idx_klook_orders_uuid ON klook_orders(uuid);

-- Net Orders
CREATE INDEX idx_net_orders_platform_id ON net_orders(platform_id);
CREATE INDEX idx_net_orders_departure_date ON net_orders(departure_date);

-- Normal Orders
CREATE INDEX idx_normal_orders_departure_date ON normal_orders(departure_date);

-- =====================================================
-- 7. 觸發器（自動更新 updated_at）
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為所有有 updated_at 欄位的表建立觸發器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_couriers_updated_at BEFORE UPDATE ON couriers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_orders_updated_at BEFORE UPDATE ON trip_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_klook_orders_updated_at BEFORE UPDATE ON klook_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_net_orders_updated_at BEFORE UPDATE ON net_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_normal_orders_updated_at BEFORE UPDATE ON normal_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 完成！
-- =====================================================

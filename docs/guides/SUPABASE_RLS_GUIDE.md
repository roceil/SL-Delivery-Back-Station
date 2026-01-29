# Supabase RLS 設定指南

## 目前的 RLS 架構

### 安全模型
- ✅ 所有資料表都已啟用 RLS
- ✅ 匿名使用者（anon key）無法直接存取任何資料
- ✅ 已登入使用者（authenticated）可以完整操作所有資料
- ✅ 後端 API 使用 service role key 繞過 RLS

### 資料表權限

#### 1. 狀態/查找表（10 個表）
- `orders_status`, `schedules_status`, `couriers_status`
- `merchants_types`, `stations_types`, `platforms`
- `trip_status`, `klook_status`, `net_status`, `normal_status`

**權限**：authenticated 使用者可 **讀取**

#### 2. 產品表（4 個表）
- `trip_products`, `klook_products`, `net_products`, `normal_products`

**權限**：authenticated 使用者可 **讀取**

#### 3. 核心表和訂單表（11 個表）
- `users`, `merchants`, `stations`, `couriers`, `schedules`, `orders`
- `trip_orders`, `klook_orders`, `net_orders`, `normal_orders`
- `schedule_orders`

**權限**：authenticated 使用者可 **完整操作（CRUD）**

---

## 在後端 API 中使用 Supabase

### 方式 1：使用 Service Role Key（推薦）

在 `server/api/` 中的 API 路由，使用 service role key 繞過 RLS：

```typescript
// server/api/orders/index.get.ts
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // 使用 service role key 建立 Supabase client（繞過 RLS）
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceRoleKey, // 這個 key 可以繞過 RLS
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // 現在可以不受 RLS 限制地查詢資料
  const { data, error } = await supabase
    .from('orders')
    .select('*')

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message
    })
  }

  return data
})
```

### 方式 2：使用前端 Anon Key + 使用者登入

如果你的前端有使用 Supabase Auth 登入：

```typescript
// 前端 app/pages/orders.vue
<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser() // 取得登入的使用者

// authenticated 使用者可以存取資料
const { data: orders } = await supabase
  .from('orders')
  .select('*')
</script>
```

---

## 環境變數設定

### 1. 取得 Service Role Key

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇你的專案
3. Settings > API
4. 複製 `service_role` key（**非常重要：此 key 擁有完整權限**）

### 2. 設定環境變數

在 `.env` 檔案中加入：

```bash
# Service Role Key（只能在後端使用！）
NUXT_SUPABASE_SERVICE_ROLE_KEY=你的_service_role_key
```

### 3. 在 nuxt.config.ts 中設定

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    // 私有環境變數（只在 server 端可用）
    supabaseServiceRoleKey: process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY,

    // 公開環境變數（前端也可用）
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    }
  }
})
```

---

## 安全最佳實踐

### ✅ DO（應該做的）

1. **後端 API 使用 service role key**
   - 在 `server/api/` 中使用 service role key
   - 可以完全控制資料存取邏輯

2. **前端使用 anon key + Auth**
   - 前端只使用 anon key
   - 透過 Supabase Auth 登入取得 authenticated 權限

3. **保護 service role key**
   - 絕對不要將 service role key 暴露於前端
   - 不要提交到 git（已加入 .gitignore）
   - 只在 server 端使用

4. **在 API 中實作業務邏輯**
   ```typescript
   // server/api/orders/[id].delete.ts
   export default defineEventHandler(async (event) => {
     const id = getRouterParam(event, 'id')

     // 在這裡實作你的權限檢查邏輯
     // 例如：檢查使用者是否有權限刪除這個訂單
     const userId = event.context.user?.id
     if (!canDeleteOrder(userId, id)) {
       throw createError({
         statusCode: 403,
         message: '無權限刪除此訂單'
       })
     }

     // 使用 service role key 執行刪除
     const supabase = createServiceRoleClient()
     await supabase.from('orders').delete().eq('id', id)
   })
   ```

### ❌ DON'T（不應該做的）

1. ❌ 不要在前端使用 service role key
2. ❌ 不要將 service role key 提交到 git
3. ❌ 不要關閉 RLS（除非你完全知道自己在做什麼）
4. ❌ 不要在前端直接操作敏感資料

---

## 常見問題

### Q: 為什麼我的 API 查詢失敗？

A: 確認是否使用了正確的 key：
- 後端 API：使用 `service_role` key
- 前端：使用 `anon` key + 使用者必須登入（authenticated）

### Q: 如何測試 RLS 是否正確運作？

A: 在前端嘗試使用 anon key 查詢資料（未登入狀態），應該會失敗。

```javascript
// 應該會失敗（返回空陣列或錯誤）
const { data } = await supabase.from('orders').select('*')
```

### Q: 我需要更細緻的權限控制怎麼辦？

A: 有兩個選擇：

1. **在後端 API 實作權限邏輯**（推薦）
   - 使用 service role key
   - 在 API handler 中檢查使用者權限

2. **修改 RLS Policy**
   - 根據使用者角色建立更細緻的 policy
   - 例如：只能查看自己的訂單

---

## 範例：完整的 API 實作

```typescript
// server/utils/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const useServiceRoleClient = () => {
  const config = useRuntimeConfig()

  return createClient(
    config.public.supabaseUrl,
    config.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
```

```typescript
// server/api/orders/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const supabase = useServiceRoleClient()

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      user:users(*),
      merchant:merchants(*),
      start_point:stations!orders_start_point_fkey(*),
      end_point:stations!orders_end_point_fkey(*),
      status:orders_status(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw createError({
      statusCode: 404,
      message: '訂單不存在'
    })
  }

  return data
})
```

---

## 相關文件

- [Supabase RLS 官方文件](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth 文件](https://supabase.com/docs/guides/auth)
- [Nuxt Supabase Module](https://supabase.nuxtjs.org/)

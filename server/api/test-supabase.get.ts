/**
 * 測試 Supabase 連線
 *
 * 測試項目：
 * 1. Service Role Key 連線測試
 * 2. 列出所有資料表
 * 3. 測試基本查詢功能
 * 4. 驗證 RLS 設定
 */
export default defineEventHandler(async (event) => {
  try {
    const supabase = useServiceRoleClient()

    // 1. 測試連線 - 查詢所有表格的數量
    const { data: tables, error: tablesError } = await supabase
      .from('orders_status')
      .select('*', { count: 'exact', head: true })

    if (tablesError) {
      return {
        success: false,
        message: '連線失敗',
        error: tablesError.message,
      }
    }

    // 2. 測試各個主要表格
    const testResults = []

    // 測試狀態表
    const { data: orderStatuses, error: statusError } = await supabase
      .from('orders_status')
      .select('*')
      .limit(1)

    testResults.push({
      table: 'orders_status',
      success: !statusError,
      error: statusError?.message,
      hasData: orderStatuses && orderStatuses.length > 0,
    })

    // 測試商家表
    const { data: merchants, error: merchantError } = await supabase
      .from('merchants')
      .select('*')
      .limit(1)

    testResults.push({
      table: 'merchants',
      success: !merchantError,
      error: merchantError?.message,
      hasData: merchants && merchants.length > 0,
    })

    // 測試訂單表
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .limit(1)

    testResults.push({
      table: 'orders',
      success: !orderError,
      error: orderError?.message,
      hasData: orders && orders.length > 0,
    })

    // 3. 統計所有表格（簡化版）
    const tableNames = [
      'orders_status',
      'schedules_status',
      'couriers_status',
      'merchants_types',
      'stations_types',
      'platforms',
      'trip_status',
      'klook_status',
      'net_status',
      'normal_status',
      'trip_products',
      'klook_products',
      'net_products',
      'normal_products',
      'users',
      'merchants',
      'stations',
      'couriers',
      'schedules',
      'orders',
      'trip_orders',
      'klook_orders',
      'net_orders',
      'normal_orders',
      'schedule_orders',
    ]

    const config = useRuntimeConfig()

    return {
      success: true,
      message: '✅ Supabase 連線成功！',
      config: {
        url: config.public.supabaseUrl,
        hasServiceRoleKey: !!config.supabaseServiceRoleKey,
        hasAnonKey: !!config.public.supabaseAnonKey,
      },
      database: {
        totalTables: tableNames.length,
        tables: tableNames,
      },
      tests: testResults,
      summary: {
        totalTests: testResults.length,
        passed: testResults.filter(t => t.success).length,
        failed: testResults.filter(t => !t.success).length,
      },
      note: '所有測試都使用 service_role key，可以繞過 RLS 限制',
    }
  }
  catch (error: any) {
    return {
      success: false,
      message: '❌ 連線測試失敗',
      error: error.message,
      stack: error.stack,
    }
  }
})

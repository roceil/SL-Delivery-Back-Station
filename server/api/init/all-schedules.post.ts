export default defineEventHandler(async (event) => {
  const results = []

  try {
    // 1. 初始化 Schedules 表
    const schedules = await $fetch('/api/init/schedules', {
      method: 'POST',
      headers: event.headers,
    })
    results.push({ table: 'Schedules', ...schedules })

    // 2. 初始化 Schedule_Orders 表
    const scheduleOrders = await $fetch('/api/init/schedule-orders', {
      method: 'POST',
      headers: event.headers,
    })
    results.push({ table: 'Schedule_Orders', ...scheduleOrders })

    // 3. 初始化 Schedules_Status 表
    const schedulesStatus = await $fetch('/api/init/schedules-status', {
      method: 'POST',
      headers: event.headers,
    })
    results.push({ table: 'Schedules_Status', ...schedulesStatus })

    // 4. 初始化 Orders_Status 表
    const ordersStatus = await $fetch('/api/init/orders-status', {
      method: 'POST',
      headers: event.headers,
    })
    results.push({ table: 'Orders_Status', ...ordersStatus })

    return {
      success: true,
      message: '成功初始化所有行程相關表',
      results,
    }
  }
  catch (error) {
    console.error('初始化失敗:', error)
    throw createError({
      statusCode: 500,
      message: `初始化失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
    })
  }
})

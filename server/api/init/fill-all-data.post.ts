export default defineEventHandler(async (event) => {
  const results = []

  try {
    // 1. 填充 Stations 資料
    const stations = await $fetch('/api/init/fill-stations', {
      method: 'POST',
      headers: event.headers,
    })
    results.push({ table: 'Stations', ...stations })

    // 2. 填充 Schedules 資料
    const schedules = await $fetch('/api/init/fill-schedules', {
      method: 'POST',
      headers: event.headers,
    })
    results.push({ table: 'Schedules', ...schedules })

    // 3. 填充 Schedule_Orders 資料
    const scheduleOrders = await $fetch('/api/init/fill-schedule-orders', {
      method: 'POST',
      headers: event.headers,
    })
    results.push({ table: 'Schedule_Orders', ...scheduleOrders })

    // 4. 填充 Orders 資料（最後執行，因為依賴 Schedules）
    const orders = await $fetch('/api/init/fill-orders', {
      method: 'POST',
      headers: event.headers,
    })
    results.push({ table: 'Orders', ...orders })

    return {
      success: true,
      message: '成功填充所有測試資料',
      results,
    }
  }
  catch (error) {
    console.error('填充資料失敗:', error)
    throw createError({
      statusCode: 500,
      message: `填充失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
    })
  }
})

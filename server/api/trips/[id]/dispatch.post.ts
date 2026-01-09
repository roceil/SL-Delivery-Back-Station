export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const tripId = getRouterParam(event, 'id')

  if (!tripId) {
    throw createError({
      statusCode: 400,
      message: '缺少行程 ID',
    })
  }

  const scheduleId = Number.parseInt(tripId)
  if (Number.isNaN(scheduleId)) {
    throw createError({
      statusCode: 400,
      message: '無效的行程 ID',
    })
  }

  // 驗證行程是否存在並檢查狀態
  const { data: schedule, error: scheduleError } = await supabase
    .from('schedules')
    .select(`
      id,
      status,
      courier_id,
      schedules_status!inner (
        status
      )
    `)
    .eq('id', scheduleId)
    .single()

  if (scheduleError || !schedule) {
    throw createError({
      statusCode: 404,
      message: '找不到該行程',
    })
  }

  const scheduleStatus = Array.isArray(schedule.schedules_status) ? schedule.schedules_status[0] : schedule.schedules_status

  // 檢查是否已派發
  if (scheduleStatus?.status !== 'pending') {
    throw createError({
      statusCode: 400,
      message: '該行程無法派發（狀態必須為待派發）',
    })
  }

  // 檢查是否有配送員
  if (!schedule.courier_id) {
    throw createError({
      statusCode: 400,
      message: '請先指派配送員',
    })
  }

  try {
    const now = new Date().toISOString()
    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    const trackingUrl = `${appUrl}/trips/track/${scheduleId}`

    // 更新行程狀態為已派發
    const { data: updatedSchedule, error: updateError } = await supabase
      .from('schedules')
      .update({
        status: 2, // dispatched
        dispatched_at: now,
        tracking_url: trackingUrl,
        updated_at: now,
      })
      .eq('id', scheduleId)
      .select(`
        id,
        name,
        status,
        dispatched_at,
        tracking_url,
        schedules_status (
          status
        )
      `)
      .single()

    if (updateError || !updatedSchedule) {
      throw createError({
        statusCode: 500,
        message: `派發行程失敗: ${updateError?.message || '未知錯誤'}`,
      })
    }

    // 更新該行程下所有訂單的狀態為配送中
    const { data: scheduleOrders } = await supabase
      .from('schedule_orders')
      .select('order_id')
      .eq('schedule_id', scheduleId)

    if (scheduleOrders && scheduleOrders.length > 0) {
      const orderIds = scheduleOrders.map(so => so.order_id)
      await supabase
        .from('orders')
        .update({ status: 4 }) // in_delivery
        .in('id', orderIds)
    }

    const updatedStatus = Array.isArray(updatedSchedule.schedules_status) ? updatedSchedule.schedules_status[0] : updatedSchedule.schedules_status

    return {
      success: true,
      message: `行程 ${updatedSchedule.name} 已派發`,
      data: {
        id: updatedSchedule.id.toString(),
        status: updatedStatus?.status || 'dispatched',
        dispatchedAt: updatedSchedule.dispatched_at,
        trackingUrl: updatedSchedule.tracking_url,
      },
    }
  }
  catch (error) {
    console.error('派發行程錯誤:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : '派發行程失敗',
    })
  }
})

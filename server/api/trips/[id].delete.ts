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

  try {
    // 驗證行程是否存在
    const { data: existingSchedule, error: existingError } = await supabase
      .from('schedules')
      .select('id')
      .eq('id', scheduleId)
      .single()

    if (existingError || !existingSchedule) {
      throw createError({
        statusCode: 404,
        message: '找不到該行程',
      })
    }

    // 查詢此行程的所有去程任務，取得受影響的訂單 IDs
    const { data: affectedTasks } = await supabase
      .from('order_tasks')
      .select('order_id')
      .eq('schedule_id', scheduleId)
      .eq('leg', 'outbound')

    const affectedOrderIds = affectedTasks?.map(t => t.order_id) || []

    // 清除所有任務的 schedule_id（含去程與回程）
    const { error: clearTasksError } = await supabase
      .from('order_tasks')
      .update({ schedule_id: null })
      .eq('schedule_id', scheduleId)

    if (clearTasksError) {
      console.error('清除任務行程指派失敗:', clearTasksError)
    }

    // 將受影響訂單狀態改回已確認
    if (affectedOrderIds.length > 0) {
      const { error: updateOrdersError } = await supabase
        .from('orders')
        .update({
          status: 2, // confirmed
          updated_at: new Date().toISOString(),
        })
        .in('id', affectedOrderIds)

      if (updateOrdersError) {
        console.error('更新訂單狀態失敗:', updateOrdersError)
      }
    }

    // 刪除行程
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId)

    if (deleteError) {
      throw createError({
        statusCode: 500,
        message: `刪除行程失敗: ${deleteError.message}`,
      })
    }

    return {
      success: true,
      message: '行程已刪除',
    }
  }
  catch (error) {
    console.error('刪除行程錯誤:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : '刪除行程失敗',
    })
  }
})

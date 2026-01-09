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

    // 將該行程相關訂單的 schedule_id 設為 null，狀態改回已確認
    const { error: updateOrdersError } = await supabase
      .from('orders')
      .update({
        schedule_id: null,
        status: 2, // confirmed
        updated_at: new Date().toISOString(),
      })
      .eq('schedule_id', scheduleId)

    if (updateOrdersError) {
      console.error('更新訂單狀態失敗:', updateOrdersError)
    }

    // 刪除行程訂單關聯
    const { error: deleteScheduleOrdersError } = await supabase
      .from('schedule_orders')
      .delete()
      .eq('schedule_id', scheduleId)

    if (deleteScheduleOrdersError) {
      console.error('刪除行程訂單關聯失敗:', deleteScheduleOrdersError)
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

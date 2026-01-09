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
    // 驗證行程是否存在且狀態為已派發
    const { data: existingSchedule, error: existingError } = await supabase
      .from('schedules')
      .select('id, status')
      .eq('id', scheduleId)
      .single()

    if (existingError || !existingSchedule) {
      throw createError({
        statusCode: 404,
        message: '找不到該行程',
      })
    }

    if (existingSchedule.status === 3) {
      throw createError({
        statusCode: 400,
        message: '該行程已經完成',
      })
    }

    // 更新行程狀態為已完成
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .update({
        status: 3, // completed
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', scheduleId)
      .select()
      .single()

    if (scheduleError || !schedule) {
      throw createError({
        statusCode: 500,
        message: `完成行程失敗: ${scheduleError?.message || '未知錯誤'}`,
      })
    }

    // 更新該行程相關訂單狀態為已送達
    const { error: updateOrdersError } = await supabase
      .from('orders')
      .update({
        status: 5, // delivered
        updated_at: new Date().toISOString(),
      })
      .eq('schedule_id', scheduleId)

    if (updateOrdersError) {
      console.error('更新訂單狀態失敗:', updateOrdersError)
    }

    return {
      success: true,
      message: '行程已完成',
      data: {
        id: schedule.id.toString(),
        status: 'completed',
        completedAt: schedule.completed_at,
      },
    }
  }
  catch (error) {
    console.error('完成行程錯誤:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : '完成行程失敗',
    })
  }
})

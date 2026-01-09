export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const tripId = getRouterParam(event, 'id')
  const body = await readBody(event)

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

  // 驗證配送員
  if (body.courierId) {
    const courierId = Number.parseInt(body.courierId)
    if (Number.isNaN(courierId)) {
      throw createError({
        statusCode: 400,
        message: '無效的配送員 ID',
      })
    }

    const { data: courier, error: courierError } = await supabase
      .from('couriers')
      .select('id')
      .eq('id', courierId)
      .single()

    if (courierError || !courier) {
      throw createError({
        statusCode: 400,
        message: '配送員不存在',
      })
    }
  }

  try {
    // 準備更新資料
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined)
      updateData.name = body.name
    if (body.description !== undefined)
      updateData.description = body.description
    if (body.scheduledDate !== undefined)
      updateData.scheduled_date = body.scheduledDate
    if (body.courierId !== undefined)
      updateData.courier_id = body.courierId ? Number.parseInt(body.courierId) : null
    if (body.notes !== undefined)
      updateData.notes = body.notes

    // 更新行程
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', scheduleId)
      .select(`
        id,
        name,
        description,
        scheduled_date,
        dispatched_at,
        completed_at,
        tracking_url,
        notes,
        created_at,
        updated_at,
        courier:couriers (
          id,
          name,
          employee_number
        ),
        status:schedules_status (
          status
        )
      `)
      .single()

    if (scheduleError || !schedule) {
      throw createError({
        statusCode: 500,
        message: `更新行程失敗: ${scheduleError?.message || '未知錯誤'}`,
      })
    }

    // 處理訂單更新
    if (body.selectedOrders !== undefined) {
      // 先刪除現有的訂單關聯
      await supabase
        .from('schedule_orders')
        .delete()
        .eq('schedule_id', scheduleId)

      // 將舊訂單的 schedule_id 設為 null
      await supabase
        .from('orders')
        .update({ schedule_id: null, status: 2 }) // 改為已確認
        .eq('schedule_id', scheduleId)

      // 如果有新的訂單，建立新的關聯
      if (body.selectedOrders.length > 0) {
        const orderIds = body.selectedOrders.map((id: string) => Number.parseInt(id)).filter((id: number) => !Number.isNaN(id))

        if (orderIds.length > 0) {
          // 驗證訂單是否存在
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id')
            .in('id', orderIds)

          if (ordersError || !orders || orders.length !== orderIds.length) {
            throw createError({
              statusCode: 400,
              message: '部分訂單不存在',
            })
          }

          // 建立新的關聯
          const scheduleOrdersData = orderIds.map((orderId: number) => ({
            schedule_id: scheduleId,
            order_id: orderId,
          }))

          const { error: scheduleOrdersError } = await supabase
            .from('schedule_orders')
            .insert(scheduleOrdersData)

          if (scheduleOrdersError) {
            console.error('建立行程訂單關聯失敗:', scheduleOrdersError)
          }

          // 更新訂單狀態為 "已分配行程"
          await supabase
            .from('orders')
            .update({ schedule_id: scheduleId, status: 3 }) // assigned
            .in('id', orderIds)
        }
      }
    }

    const courier = Array.isArray(schedule.courier) ? schedule.courier[0] : schedule.courier
    const status = Array.isArray(schedule.status) ? schedule.status[0] : schedule.status

    return {
      id: schedule.id.toString(),
      name: schedule.name,
      description: schedule.description || '',
      courierId: courier?.id?.toString() || '',
      courierName: courier?.name || '未分配',
      scheduledDate: schedule.scheduled_date,
      status: status?.status || 'pending',
      createdAt: schedule.created_at,
      updatedAt: schedule.updated_at,
      dispatchedAt: schedule.dispatched_at,
      completedAt: schedule.completed_at,
      trackingUrl: schedule.tracking_url,
      notes: schedule.notes,
    }
  }
  catch (error) {
    console.error('更新行程錯誤:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : '更新行程失敗',
    })
  }
})

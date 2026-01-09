export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const body = await readBody(event)

  // 驗證必填欄位
  if (!body.name || !body.scheduledDate || !body.courierId) {
    throw createError({
      statusCode: 400,
      message: '缺少必填欄位：行程名稱、預計日期和配送員',
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

  // 驗證訂單
  const selectedOrders = body.selectedOrders || []
  if (selectedOrders.length > 0) {
    const orderIds = selectedOrders.map((id: string) => Number.parseInt(id)).filter((id: number) => !Number.isNaN(id))

    if (orderIds.length !== selectedOrders.length) {
      throw createError({
        statusCode: 400,
        message: '無效的訂單 ID',
      })
    }

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
  }

  try {
    // 1. 建立行程（配送員為必填，狀態直接設為已派發）
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .insert({
        name: body.name,
        description: body.description || '',
        courier_id: Number.parseInt(body.courierId),
        scheduled_date: body.scheduledDate,
        status: 2, // dispatched
        dispatched_at: new Date().toISOString(),
        notes: body.notes || '',
      })
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
        message: `建立行程失敗: ${scheduleError?.message || '未知錯誤'}`,
      })
    }

    // 2. 如果有選擇訂單，建立行程訂單關聯
    if (selectedOrders.length > 0) {
      const scheduleOrdersData = selectedOrders.map((orderId: string) => ({
        schedule_id: schedule.id,
        order_id: Number.parseInt(orderId),
      }))

      const { error: scheduleOrdersError } = await supabase
        .from('schedule_orders')
        .insert(scheduleOrdersData)

      if (scheduleOrdersError) {
        // 如果建立關聯失敗，刪除剛建立的行程
        await supabase
          .from('schedules')
          .delete()
          .eq('id', schedule.id)

        throw createError({
          statusCode: 500,
          message: `建立行程訂單關聯失敗: ${scheduleOrdersError.message}`,
        })
      }

      // 更新訂單狀態為 "已分配行程"
      const { error: updateOrdersError } = await supabase
        .from('orders')
        .update({
          schedule_id: schedule.id,
          status: 3, // assigned
        })
        .in('id', selectedOrders.map((id: string) => Number.parseInt(id)))

      if (updateOrdersError) {
        console.error('更新訂單狀態失敗:', updateOrdersError)
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
      dispatchedAt: schedule.dispatched_at,
      completedAt: schedule.completed_at,
      trackingUrl: schedule.tracking_url,
      notes: schedule.notes,
    }
  }
  catch (error) {
    console.error('建立行程錯誤:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : '建立行程失敗',
    })
  }
})

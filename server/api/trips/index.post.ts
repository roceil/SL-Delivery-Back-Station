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

  // 驗證任務
  const selectedOrders = body.selectedOrders || []
  if (selectedOrders.length > 0) {
    const taskIds = selectedOrders.map((id: string) => Number.parseInt(id)).filter((id: number) => !Number.isNaN(id))

    if (taskIds.length !== selectedOrders.length) {
      throw createError({
        statusCode: 400,
        message: '無效的任務 ID',
      })
    }

    const { data: tasks, error: tasksValidError } = await supabase
      .from('order_tasks')
      .select('id')
      .in('id', taskIds)

    if (tasksValidError || !tasks || tasks.length !== taskIds.length) {
      throw createError({
        statusCode: 400,
        message: '部分任務不存在',
      })
    }
  }

  try {
    // 1. 建立行程（狀態預設為尚未運送）
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .insert({
        name: body.name,
        description: body.description || '',
        courier_id: Number.parseInt(body.courierId),
        scheduled_date: body.scheduledDate,
        status: 1, // pending
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

    // 2. 如果有選擇任務，將任務指派至此行程
    if (selectedOrders.length > 0) {
      const taskIds = selectedOrders.map((id: string) => Number.parseInt(id))

      // 更新任務的 schedule_id，並取得對應的 order_id
      const { data: affectedTasks, error: tasksError } = await supabase
        .from('order_tasks')
        .update({ schedule_id: schedule.id })
        .in('id', taskIds)
        .select('order_id')

      if (tasksError) {
        // 如果更新任務失敗，刪除剛建立的行程
        await supabase.from('schedules').delete().eq('id', schedule.id)
        throw createError({
          statusCode: 500,
          message: `指派任務至行程失敗: ${tasksError.message}`,
        })
      }

      // 更新相關訂單狀態為 "已分配行程"
      const orderIds = [...new Set(affectedTasks?.map((t: any) => t.order_id) ?? [])]
      if (orderIds.length > 0) {
        const { error: updateOrdersError } = await supabase
          .from('orders')
          .update({ status: 3 }) // assigned
          .in('id', orderIds)

        if (updateOrdersError) {
          console.error('更新訂單狀態失敗:', updateOrdersError)
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

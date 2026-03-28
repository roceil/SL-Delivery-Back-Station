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

  // 驗證行程是否存在
  const { data: schedule, error: scheduleError } = await supabase
    .from('schedules')
    .select('id')
    .eq('id', scheduleId)
    .single()

  if (scheduleError || !schedule) {
    throw createError({
      statusCode: 404,
      message: '找不到該行程',
    })
  }

  // 查詢此行程的所有任務（含 leg 欄位以判斷方向）
  const { data: tasks, error: tasksError } = await supabase
    .from('order_tasks')
    .select('id, order_id, leg, task_date')
    .eq('schedule_id', scheduleId)

  if (tasksError) {
    throw createError({
      statusCode: 500,
      message: `查詢行程任務失敗: ${tasksError.message}`,
    })
  }

  if (!tasks || tasks.length === 0)
    return []

  const orderIds = [...new Set(tasks.map(t => t.order_id))]

  // 查詢訂單詳情
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      platform_type,
      platform_id,
      luggage_count,
      notes,
      created_at,
      start_point:stations!orders_start_point_fkey (
        id,
        name,
        address,
        area
      ),
      end_point:stations!orders_end_point_fkey (
        id,
        name,
        address,
        area
      ),
      order_status:orders_status (
        status
      )
    `)
    .in('id', orderIds)
    .order('created_at', { ascending: true })

  if (ordersError) {
    throw createError({
      statusCode: 500,
      message: `查詢訂單失敗: ${ordersError.message}`,
    })
  }

  if (!ordersData || ordersData.length === 0)
    return []

  // 分類訂單 ID
  const normalOrderIds: string[] = []
  const netOrderIds: string[] = []

  ordersData.forEach((order) => {
    if (order.platform_type === 4)
      normalOrderIds.push(order.platform_id)
    else if (order.platform_type === 3)
      netOrderIds.push(order.platform_id)
  })

  // 查詢 normal_orders（取得聯絡人資訊與取件時間）
  const normalOrdersMap = new Map()
  if (normalOrderIds.length > 0) {
    const { data: normalOrdersData, error: normalError } = await supabase
      .from('normal_orders')
      .select('id, receive_time, contacts')
      .in('id', normalOrderIds)

    if (!normalError && normalOrdersData) {
      normalOrdersData.forEach((no) => {
        normalOrdersMap.set(no.id.toString(), no)
      })
    }
  }

  // 查詢 net_orders
  const netOrdersMap = new Map()
  if (netOrderIds.length > 0) {
    const { data: netOrdersData, error: netError } = await supabase
      .from('net_orders')
      .select('id, platform_type, contacts')
      .in('id', netOrderIds)

    if (!netError && netOrdersData) {
      netOrdersData.forEach((no) => {
        netOrdersMap.set(no.id.toString(), no)
      })
    }
  }

  const orderMap = new Map(ordersData.map((o: any) => [o.id, o]))

  // 以 task 為主體組合資料，inbound 任務對調取件與送達地點
  const orders = tasks.map((task) => {
    const order = orderMap.get(task.order_id) as any
    if (!order)
      return null

    let orderCategory = '未知'
    let lineName = '未提供'
    let phone = '未提供'
    let pickupTime = '-'

    if (order.platform_type === 4) {
      orderCategory = '散客'
      const normalOrder = normalOrdersMap.get(order.platform_id)

      if (!normalOrder)
        return null

      const contacts = normalOrder.contacts as { name?: string, phone?: string } || {}
      lineName = contacts.name || '未提供'
      phone = contacts.phone || '未提供'
      pickupTime = normalOrder.receive_time || '-'
    }
    else if (order.platform_type === 3) {
      const netOrder = netOrdersMap.get(order.platform_id)

      if (!netOrder)
        return null

      if (netOrder.platform_type === 1)
        orderCategory = 'Trip'
      else if (netOrder.platform_type === 2)
        orderCategory = 'Klook'
      else
        orderCategory = '合作'

      const contacts = netOrder.contacts as { name?: string, phone?: string } || {}
      lineName = contacts.name || '未提供'
      phone = contacts.phone || '未提供'
    }

    const orderStatus = Array.isArray(order.order_status) ? order.order_status[0] : order.order_status
    const startPoint = Array.isArray(order.start_point) ? order.start_point[0] : order.start_point
    const endPoint = Array.isArray(order.end_point) ? order.end_point[0] : order.end_point

    // inbound 任務：取件地點是 end_point，送達地點是 start_point
    const pickupPoint = task.leg === 'inbound' ? endPoint : startPoint
    const deliveryPoint = task.leg === 'inbound' ? startPoint : endPoint

    return {
      id: order.id.toString(),
      taskId: task.id.toString(),
      leg: task.leg,
      category: orderCategory,
      lineName,
      phone,
      deliveryDate: task.task_date || null,
      pickupTime,
      luggageCount: order.luggage_count || 0,
      status: orderStatus?.status || 'pending',
      pickupLocation: {
        id: pickupPoint?.id?.toString() || '',
        name: pickupPoint?.name || '',
        address: pickupPoint?.address || '',
        area: pickupPoint?.area || '',
      },
      deliveryLocation: {
        id: deliveryPoint?.id?.toString() || '',
        name: deliveryPoint?.name || '',
        address: deliveryPoint?.address || '',
        area: deliveryPoint?.area || '',
      },
      notes: order.notes || '',
      createdAt: order.created_at,
    }
  }).filter((order: any) => order !== null)

  return orders
})

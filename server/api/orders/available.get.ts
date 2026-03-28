export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const query = getQuery(event)
  const { date, area } = query

  // 查詢已確認或已收件的訂單
  const { data: ordersData, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      platform_type,
      platform_id,
      luggage_count,
      notes,
      merchant_id,
      start_point:stations!orders_start_point_fkey (
        id,
        name,
        area
      ),
      end_point:stations!orders_end_point_fkey (
        id,
        name,
        area
      )
    `)
    .in('status', [2, 9])
    .order('created_at', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      message: `查詢訂單失敗: ${error.message}`,
    })
  }

  if (!ordersData || ordersData.length === 0)
    return []

  const orderIds = ordersData.map((o: any) => o.id)

  // 查詢所有未排班的任務（去程 + 回程）
  const { data: allTasks } = await supabase
    .from('order_tasks')
    .select('id, order_id, leg, task_date, schedule_id')
    .in('order_id', orderIds)
    .is('schedule_id', null)

  if (!allTasks || allTasks.length === 0)
    return []

  // 建立訂單 map 方便查找
  const ordersMap = new Map<number, any>()
  ordersData.forEach((o: any) => ordersMap.set(o.id, o))

  // 收集有任務的訂單 platform_id 以查詢聯絡人
  const taskOrderIds = new Set(allTasks.map((t: any) => t.order_id))
  const normalOrderIds: string[] = []
  const netOrderIds: string[] = []

  ordersData.forEach((order: any) => {
    if (!taskOrderIds.has(order.id))
      return
    if (order.platform_type === 4)
      normalOrderIds.push(order.platform_id)
    else if (order.platform_type === 3)
      netOrderIds.push(order.platform_id)
  })

  // 查詢 normal_orders 聯絡人資訊
  const normalOrdersMap = new Map<string, any>()
  if (normalOrderIds.length > 0) {
    const { data: normalOrders } = await supabase
      .from('normal_orders')
      .select('id, contacts, quantity')
      .in('id', normalOrderIds)
    normalOrders?.forEach((no: any) => normalOrdersMap.set(no.id.toString(), no))
  }

  // 查詢 net_orders 聯絡人資訊
  const netOrdersMap = new Map<string, any>()
  if (netOrderIds.length > 0) {
    const { data: netOrders } = await supabase
      .from('net_orders')
      .select('id, contacts, quantity')
      .in('id', netOrderIds)
    netOrders?.forEach((no: any) => netOrdersMap.set(no.id.toString(), no))
  }

  const targetDate = date as string | undefined

  const result = allTasks.map((task: any) => {
    const order = ordersMap.get(task.order_id)
    if (!order)
      return null

    const startPoint = Array.isArray(order.start_point) ? order.start_point[0] : order.start_point
    const endPoint = Array.isArray(order.end_point) ? order.end_point[0] : order.end_point

    // 依 leg 決定正確的取送地點：回程時起終點對調
    const pickupPoint = task.leg === 'inbound' ? endPoint : startPoint
    const deliveryPoint = task.leg === 'inbound' ? startPoint : endPoint

    if (area && deliveryPoint?.area !== area)
      return null

    if (targetDate && task.task_date !== targetDate)
      return null

    let lineName = '未提供'
    let phone = ''

    if (order.platform_type === 4) {
      const normalOrder = normalOrdersMap.get(order.platform_id)
      const contacts = normalOrder?.contacts as { name?: string, phone?: string } || {}
      lineName = contacts.name || '未提供'
      phone = contacts.phone || ''
    }
    else if (order.platform_type === 3) {
      const netOrder = netOrdersMap.get(order.platform_id)
      const contacts = netOrder?.contacts as { name?: string, phone?: string } || {}
      lineName = contacts.name || '未提供'
      phone = contacts.phone || ''
    }

    return {
      id: task.id.toString(), // task ID（order_tasks.id）
      orderNumber: order.order_number || '',
      lineName,
      phone,
      luggageCount: order.luggage_count || 1,
      area: deliveryPoint?.area || '',
      departureDate: task.task_date || '',
      leg: task.leg as 'outbound' | 'inbound',
      notes: order.notes || '',
      pickupLocation: {
        id: pickupPoint?.id?.toString() || '',
        name: pickupPoint?.name || '',
      },
      deliveryLocation: {
        id: deliveryPoint?.id?.toString() || '',
        name: deliveryPoint?.name || '',
      },
    }
  }).filter(Boolean)

  return result
})

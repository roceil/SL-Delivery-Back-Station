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

  // 查詢該行程的所有訂單
  const { data: scheduleOrders, error: scheduleOrdersError } = await supabase
    .from('schedule_orders')
    .select('order_id')
    .eq('schedule_id', scheduleId)

  if (scheduleOrdersError) {
    throw createError({
      statusCode: 500,
      message: `查詢行程訂單失敗: ${scheduleOrdersError.message}`,
    })
  }

  if (!scheduleOrders || scheduleOrders.length === 0) {
    return []
  }

  const orderIds = scheduleOrders.map(so => so.order_id)

  // 查詢訂單詳情
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      platform_type,
      platform_id,
      status,
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

  if (!ordersData || ordersData.length === 0) {
    return []
  }

  // 分類訂單 ID
  const normalOrderIds: string[] = []
  const netOrderIds: string[] = []

  ordersData.forEach((order) => {
    if (order.platform_type === 4) {
      normalOrderIds.push(order.platform_id)
    }
    else if (order.platform_type === 3) {
      netOrderIds.push(order.platform_id)
    }
  })

  // 查詢 normal_orders
  const normalOrdersMap = new Map()
  if (normalOrderIds.length > 0) {
    const { data: normalOrdersData, error: normalError } = await supabase
      .from('normal_orders')
      .select('id, departure_date, receive_time, quantity, contacts')
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
      .select('id, platform_type, departure_date, quantity, contacts')
      .in('id', netOrderIds)

    if (!netError && netOrdersData) {
      netOrdersData.forEach((no) => {
        netOrdersMap.set(no.id.toString(), no)
      })
    }
  }

  // 組合資料
  const orders = ordersData.map((order: any) => {
    let orderCategory = '未知'
    let lineName = '未提供'
    let phone = '未提供'
    let deliveryDate = null
    let pickupTime = '-'
    let luggageCount = 0

    if (order.platform_type === 4) {
      orderCategory = '散客'
      const normalOrder = normalOrdersMap.get(order.platform_id)

      if (!normalOrder) {
        return null
      }

      const contacts = normalOrder.contacts as { name?: string, phone?: string } || {}
      lineName = contacts.name || '未提供'
      phone = contacts.phone || '未提供'
      deliveryDate = normalOrder.departure_date
      pickupTime = normalOrder.receive_time || '-'
      luggageCount = normalOrder.quantity || 0
    }
    else if (order.platform_type === 3) {
      const netOrder = netOrdersMap.get(order.platform_id)

      if (!netOrder) {
        return null
      }

      if (netOrder.platform_type === 1) {
        orderCategory = 'Trip'
      }
      else if (netOrder.platform_type === 2) {
        orderCategory = 'Klook'
      }
      else {
        orderCategory = '合作'
      }

      const contacts = netOrder.contacts as { name?: string, phone?: string } || {}
      lineName = contacts.name || '未提供'
      phone = contacts.phone || '未提供'
      deliveryDate = netOrder.departure_date
      luggageCount = netOrder.quantity || 0
    }

    const orderStatus = Array.isArray(order.order_status) ? order.order_status[0] : order.order_status
    const startPoint = Array.isArray(order.start_point) ? order.start_point[0] : order.start_point
    const endPoint = Array.isArray(order.end_point) ? order.end_point[0] : order.end_point

    return {
      id: order.id.toString(),
      category: orderCategory,
      lineName,
      phone,
      deliveryDate,
      pickupTime,
      luggageCount,
      status: orderStatus?.status || 'pending',
      pickupLocation: {
        id: startPoint?.id?.toString() || '',
        name: startPoint?.name || '',
        address: startPoint?.address || '',
        area: startPoint?.area || '',
      },
      deliveryLocation: {
        id: endPoint?.id?.toString() || '',
        name: endPoint?.name || '',
        address: endPoint?.address || '',
        area: endPoint?.area || '',
      },
      notes: order.notes || '',
      createdAt: order.created_at,
    }
  }).filter((order: any) => order !== null)

  return orders
})

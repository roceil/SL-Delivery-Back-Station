export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const query = getQuery(event)
  const filterDate = query.date as string | undefined

  const { data: ordersData, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      platform_id,
      platform_type,
      schedule_id,
      return_schedule_id,
      status,
      service_plan,
      payment_status,
      luggage_count,
      departure_date,
      return_date,
      notes,
      created_at,
      start_point:stations!orders_start_point_fkey (id, name, address),
      end_point:stations!orders_end_point_fkey (id, name, address),
      order_status:orders_status (status)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      message: `查詢訂單失敗: ${error.message}`,
    })
  }

  if (!ordersData || ordersData.length === 0) {
    return []
  }

  // 分類訂單 ID
  const normalOrderIds: string[] = []
  const netOrderIds: string[] = []
  const kkdayOrderIds: string[] = []

  ordersData.forEach((order) => {
    if (order.platform_type === 4)
      normalOrderIds.push(order.platform_id)
    else if (order.platform_type === 3)
      netOrderIds.push(order.platform_id)
    else if (order.platform_type === 5)
      kkdayOrderIds.push(order.platform_id)
  })

  // 查詢 normal_orders（僅需 contacts, receive_time）
  const normalOrdersMap = new Map()
  if (normalOrderIds.length > 0) {
    let q = supabase
      .from('normal_orders')
      .select('id, receive_time, contacts')
      .in('id', normalOrderIds)
    if (filterDate)
      q = q.eq('departure_date', filterDate)
    const { data, error: e } = await q
    if (e)
      throw createError({ statusCode: 500, message: `查詢散客訂單失敗: ${e.message}` })
    data?.forEach(no => normalOrdersMap.set(no.id.toString(), no))
  }

  // 查詢 net_orders（需 platform_type 判斷類別）
  const netOrdersMap = new Map()
  if (netOrderIds.length > 0) {
    let q = supabase
      .from('net_orders')
      .select('id, platform_type, receive_time, contacts')
      .in('id', netOrderIds)
    if (filterDate)
      q = q.eq('departure_date', filterDate)
    const { data, error: e } = await q
    if (e)
      throw createError({ statusCode: 500, message: `查詢同業訂單失敗: ${e.message}` })
    data?.forEach(no => netOrdersMap.set(no.id.toString(), no))
  }

  // 查詢 kkday_orders
  const kkdayOrdersMap = new Map()
  if (kkdayOrderIds.length > 0) {
    let q = supabase
      .from('kkday_orders')
      .select('id, contacts')
      .in('id', kkdayOrderIds)
    if (filterDate)
      q = q.eq('departure_date', filterDate)
    const { data, error: e } = await q
    if (e)
      throw createError({ statusCode: 500, message: `查詢 KKday 訂單失敗: ${e.message}` })
    data?.forEach(ko => kkdayOrdersMap.set(ko.id.toString(), ko))
  }

  // 組合資料
  const orders = ordersData.map((order) => {
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
      orderCategory = netOrder.platform_type === 1 ? 'Trip' : netOrder.platform_type === 2 ? 'Klook' : '合作'
      const contacts = netOrder.contacts as { name?: string, phone?: string } || {}
      lineName = contacts.name || '未提供'
      phone = contacts.phone || '未提供'
      pickupTime = netOrder.receive_time || '-'
    }
    else if (order.platform_type === 5) {
      orderCategory = 'KKday'
      const kkdayOrder = kkdayOrdersMap.get(order.platform_id)
      if (!kkdayOrder)
        return null
      const contacts = kkdayOrder.contacts as { name?: string, phone?: string } || {}
      lineName = contacts.name || '未提供'
      phone = contacts.phone || '未提供'
    }

    const orderStatus = Array.isArray(order.order_status) ? order.order_status[0] : order.order_status
    const startPoint = Array.isArray(order.start_point) ? order.start_point[0] : order.start_point
    const endPoint = Array.isArray(order.end_point) ? order.end_point[0] : order.end_point

    return {
      id: order.id.toString(),
      orderNumber: order.order_number || '',
      category: orderCategory,
      lineName,
      phone,
      deliveryDate: order.departure_date,
      returnDate: order.return_date,
      pickupTime,
      luggageCount: order.luggage_count || 0,
      servicePlan: order.service_plan,
      paymentStatus: order.payment_status,
      status: orderStatus?.status || 'pending',
      scheduleId: order.schedule_id?.toString() || null,
      returnScheduleId: order.return_schedule_id?.toString() || null,
      pickupLocation: {
        id: startPoint?.id?.toString() || '',
        name: startPoint?.name || '',
        address: startPoint?.address || '',
      },
      deliveryLocation: {
        id: endPoint?.id?.toString() || '',
        name: endPoint?.name || '',
        address: endPoint?.address || '',
      },
      notes: order.notes || '',
      createdAt: order.created_at,
    }
  }).filter(order => order !== null)

  return orders
})

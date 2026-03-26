export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const query = getQuery(event)
  const { date, area } = query

  // 查詢已確認 (status=2) 且尚未分配行程的訂單
  const { data: ordersData, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      platform_type,
      platform_id,
      luggage_count,
      departure_date,
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
    .eq('status', 2)
    .is('schedule_id', null)
    .order('departure_date', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      message: `查詢訂單失敗: ${error.message}`,
    })
  }

  if (!ordersData || ordersData.length === 0)
    return []

  // 分類平台訂單 ID
  const normalOrderIds: string[] = []
  const netOrderIds: string[] = []

  ordersData.forEach((order: any) => {
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

  // 篩選日期（直接用 orders.departure_date）
  const targetDate = date as string | undefined

  const result = ordersData.map((order: any) => {
    const startPoint = Array.isArray(order.start_point) ? order.start_point[0] : order.start_point
    const endPoint = Array.isArray(order.end_point) ? order.end_point[0] : order.end_point

    // 依區域篩選（若有指定）
    if (area && endPoint?.area !== area)
      return null

    // 依日期篩選（若有指定）
    if (targetDate && order.departure_date !== targetDate)
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
      id: order.id.toString(),
      orderNumber: order.order_number || '',
      lineName,
      phone,
      luggageCount: order.luggage_count || 1,
      area: endPoint?.area || '',
      departureDate: order.departure_date || '',
      notes: order.notes || '',
      pickupLocation: {
        id: startPoint?.id?.toString() || '',
        name: startPoint?.name || '',
      },
      deliveryLocation: {
        id: endPoint?.id?.toString() || '',
        name: endPoint?.name || '',
      },
    }
  }).filter(Boolean)

  return result
})

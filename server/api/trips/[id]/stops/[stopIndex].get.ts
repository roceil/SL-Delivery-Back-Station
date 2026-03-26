export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const tripId = getRouterParam(event, 'id')
  const stopIndexParam = getRouterParam(event, 'stopIndex')

  if (!tripId || !stopIndexParam) {
    throw createError({ statusCode: 400, message: '缺少必要參數' })
  }

  const scheduleId = Number.parseInt(tripId)
  const stopIndex = Number.parseInt(stopIndexParam)

  if (Number.isNaN(scheduleId) || Number.isNaN(stopIndex)) {
    throw createError({ statusCode: 400, message: '無效的參數' })
  }

  // 查詢此行程的 schedule_orders（含完成狀態）
  const { data: scheduleOrders, error: soError } = await supabase
    .from('schedule_orders')
    .select('order_id, is_completed')
    .eq('schedule_id', scheduleId)

  if (soError) {
    throw createError({ statusCode: 500, message: `查詢行程訂單失敗: ${soError.message}` })
  }

  if (!scheduleOrders || scheduleOrders.length === 0) {
    throw createError({ statusCode: 404, message: '此行程沒有訂單' })
  }

  const orderIds = scheduleOrders.map((so: any) => so.order_id)
  const completedMap = new Map<number, boolean>(
    scheduleOrders.map((so: any) => [so.order_id, so.is_completed]),
  )

  // 查詢訂單詳情
  const { data: ordersData, error: ordersError } = await supabase
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
        name
      ),
      end_point:stations!orders_end_point_fkey (
        id,
        name
      )
    `)
    .in('id', orderIds)

  if (ordersError) {
    throw createError({ statusCode: 500, message: `查詢訂單失敗: ${ordersError.message}` })
  }

  if (!ordersData || ordersData.length === 0) {
    throw createError({ statusCode: 404, message: '找不到訂單資料' })
  }

  // 取得平台訂單聯絡人
  const normalOrderIds: string[] = []
  const netOrderIds: string[] = []

  ordersData.forEach((order: any) => {
    if (order.platform_type === 4)
      normalOrderIds.push(order.platform_id)
    else if (order.platform_type === 3)
      netOrderIds.push(order.platform_id)
  })

  const normalOrdersMap = new Map<string, any>()
  if (normalOrderIds.length > 0) {
    const { data: normalOrders } = await supabase
      .from('normal_orders')
      .select('id, contacts')
      .in('id', normalOrderIds)
    normalOrders?.forEach((no: any) => normalOrdersMap.set(no.id.toString(), no))
  }

  const netOrdersMap = new Map<string, any>()
  if (netOrderIds.length > 0) {
    const { data: netOrders } = await supabase
      .from('net_orders')
      .select('id, contacts')
      .in('id', netOrderIds)
    netOrders?.forEach((no: any) => netOrdersMap.set(no.id.toString(), no))
  }

  // 建立訂單資料與聯絡人對應
  interface OrderItem {
    id: string
    orderNumber: string
    lineName: string
    luggageCount: number
    status: string
    notes: string
    isSale: boolean
  }

  const orderItems = new Map<string, OrderItem>()

  ordersData.forEach((order: any) => {
    let lineName = '未提供'
    if (order.platform_type === 4) {
      const contacts = normalOrdersMap.get(order.platform_id)?.contacts as { name?: string } || {}
      lineName = contacts.name || '未提供'
    }
    else if (order.platform_type === 3) {
      const contacts = netOrdersMap.get(order.platform_id)?.contacts as { name?: string } || {}
      lineName = contacts.name || '未提供'
    }

    const isCompleted = completedMap.get(order.id) ?? false

    orderItems.set(order.id.toString(), {
      id: order.id.toString(),
      orderNumber: order.order_number || '',
      lineName,
      luggageCount: order.luggage_count || 1,
      status: isCompleted ? '已掃描' : '待掃描',
      notes: order.notes || '',
      isSale: !!order.merchant_id,
    })
  })

  // 依訂單出現順序建立路線站點
  const stops: string[] = []
  const stopNames = new Map<string, string>()
  const stopPickups = new Map<string, string[]>()
  const stopDeliveries = new Map<string, string[]>()

  ordersData.forEach((order: any) => {
    const startPoint = Array.isArray(order.start_point) ? order.start_point[0] : order.start_point
    const endPoint = Array.isArray(order.end_point) ? order.end_point[0] : order.end_point

    if (!startPoint || !endPoint)
      return

    const startId = startPoint.id.toString()
    const endId = endPoint.id.toString()

    if (!stopPickups.has(startId)) {
      stops.push(startId)
      stopNames.set(startId, startPoint.name)
      stopPickups.set(startId, [])
      stopDeliveries.set(startId, [])
    }
    if (!stopDeliveries.has(endId)) {
      if (!stopPickups.has(endId)) {
        stops.push(endId)
        stopNames.set(endId, endPoint.name)
        stopPickups.set(endId, [])
        stopDeliveries.set(endId, [])
      }
    }

    stopPickups.get(startId)!.push(order.id.toString())
    stopDeliveries.get(endId)!.push(order.id.toString())
  })

  if (stopIndex >= stops.length) {
    throw createError({ statusCode: 404, message: `找不到第 ${stopIndex + 1} 個站點` })
  }

  const stationId = stops[stopIndex]

  return {
    index: stopIndex,
    name: stopNames.get(stationId) || '',
    totalStops: stops.length,
    pickups: (stopPickups.get(stationId) || []).map(id => orderItems.get(id)).filter(Boolean),
    deliveries: (stopDeliveries.get(stationId) || []).map(id => orderItems.get(id)).filter(Boolean),
  }
})

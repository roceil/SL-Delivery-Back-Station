export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()

  // 從查詢參數獲取日期
  const query = getQuery(event)
  const filterDate = query.date as string | undefined

  // 查詢所有訂單資料
  const { data: ordersData, error } = await supabase
    .from('orders')
    .select(`
      id,
      platform_id,
      platform_type,
      status,
      notes,
      created_at,
      start_point:stations!orders_start_point_fkey (
        id,
        name,
        address
      ),
      end_point:stations!orders_end_point_fkey (
        id,
        name,
        address
      ),
      order_status:orders_status (
        status
      )
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

  ordersData.forEach((order) => {
    if (order.platform_type === 4) {
      // Normal
      normalOrderIds.push(order.platform_id)
    }
    else if (order.platform_type === 3) {
      // Net
      netOrderIds.push(order.platform_id)
    }
  })

  // 查詢 normal_orders
  const normalOrdersMap = new Map()
  if (normalOrderIds.length > 0) {
    let normalOrdersQuery = supabase
      .from('normal_orders')
      .select('id, departure_date, receive_time, quantity, contacts')
      .in('id', normalOrderIds)

    // 如果有提供日期，則加上日期篩選
    if (filterDate) {
      normalOrdersQuery = normalOrdersQuery.eq('departure_date', filterDate)
    }

    const { data: normalOrdersData, error: normalError } = await normalOrdersQuery

    if (normalError) {
      throw createError({
        statusCode: 500,
        message: `查詢散客訂單失敗: ${normalError.message}`,
      })
    }

    normalOrdersData?.forEach((no) => {
      normalOrdersMap.set(no.id.toString(), no)
    })
  }

  // 查詢 net_orders
  const netOrdersMap = new Map()
  if (netOrderIds.length > 0) {
    let netOrdersQuery = supabase
      .from('net_orders')
      .select('id, platform_type, departure_date, quantity, contacts')
      .in('id', netOrderIds)

    // 如果有提供日期，則加上日期篩選
    if (filterDate) {
      netOrdersQuery = netOrdersQuery.eq('departure_date', filterDate)
    }

    const { data: netOrdersData, error: netError } = await netOrdersQuery

    if (netError) {
      throw createError({
        statusCode: 500,
        message: `查詢同業訂單失敗: ${netError.message}`,
      })
    }

    netOrdersData?.forEach((no) => {
      netOrdersMap.set(no.id.toString(), no)
    })
  }

  // 組合資料
  const orders = ordersData.map((order) => {
    let orderCategory = '未知'
    let lineName = '未提供'
    let phone = '未提供'
    let deliveryDate = null
    let pickupTime = '-'
    let luggageCount = 0

    if (order.platform_type === 4) {
      // 散客訂單
      orderCategory = '散客'
      const normalOrder = normalOrdersMap.get(order.platform_id)

      if (!normalOrder) {
        return null
      }

      const contacts = normalOrder.contacts as { name?: string, phone?: string, lineId?: string } || {}
      lineName = contacts.name || '未提供'
      phone = contacts.phone || '未提供'
      deliveryDate = normalOrder.departure_date
      pickupTime = normalOrder.receive_time || '-'
      luggageCount = normalOrder.quantity || 0
    }
    else if (order.platform_type === 3) {
      // 同業訂單（Net）
      const netOrder = netOrdersMap.get(order.platform_id)

      if (!netOrder) {
        return null
      }

      // 根據 net_orders.platform_type 判斷類別
      if (netOrder.platform_type === 1) {
        orderCategory = 'Trip'
      }
      else if (netOrder.platform_type === 2) {
        orderCategory = 'Klook'
      }
      else {
        orderCategory = '合作'
      }

      const contacts = netOrder.contacts as { name?: string, phone?: string, lineId?: string } || {}
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

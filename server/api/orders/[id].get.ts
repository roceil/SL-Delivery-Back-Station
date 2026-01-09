export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少訂單 ID',
    })
  }

  // 查詢單一訂單
  const { data: orderData, error } = await supabase
    .from('orders')
    .select(`
      id,
      platform_id,
      platform_type,
      voucher_id,
      status,
      notes,
      created_at,
      updated_at,
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
    .eq('id', id)
    .single()

  if (error || !orderData) {
    throw createError({
      statusCode: 404,
      message: '找不到此訂單',
    })
  }

  let orderCategory = '未知'
  let lineName = '未提供'
  let phone = '未提供'
  let deliveryDate = null
  let pickupTime = '-'
  let luggageCount = 0

  // 根據 platform_type 查詢對應的訂單明細
  if (orderData.platform_type === 4) {
    // 散客訂單
    orderCategory = '散客'
    const { data: normalOrder, error: normalError } = await supabase
      .from('normal_orders')
      .select('departure_date, receive_time, quantity, contacts')
      .eq('id', orderData.platform_id)
      .single()

    if (normalError || !normalOrder) {
      throw createError({
        statusCode: 404,
        message: '找不到訂單明細',
      })
    }

    const contacts = normalOrder.contacts as { name?: string, phone?: string, lineId?: string } || {}
    lineName = contacts.name || '未提供'
    phone = contacts.phone || '未提供'
    deliveryDate = normalOrder.departure_date
    pickupTime = normalOrder.receive_time || '-'
    luggageCount = normalOrder.quantity || 0
  }
  else if (orderData.platform_type === 3) {
    // 同業訂單
    const { data: netOrder, error: netError } = await supabase
      .from('net_orders')
      .select('platform_type, departure_date, receive_time, quantity, contacts')
      .eq('id', orderData.platform_id)
      .single()

    if (netError || !netOrder) {
      throw createError({
        statusCode: 404,
        message: '找不到訂單明細',
      })
    }

    // 判斷類別
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
    pickupTime = netOrder.receive_time || '-'
    luggageCount = netOrder.quantity || 0
  }

  // 組合資料
  const orderStatus = Array.isArray(orderData.order_status) ? orderData.order_status[0] : orderData.order_status
  const startPoint = Array.isArray(orderData.start_point) ? orderData.start_point[0] : orderData.start_point
  const endPoint = Array.isArray(orderData.end_point) ? orderData.end_point[0] : orderData.end_point

  const order = {
    id: orderData.id.toString(),
    voucherId: orderData.voucher_id,
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
    notes: orderData.notes || '',
    createdAt: orderData.created_at,
    updatedAt: orderData.updated_at,
  }

  return order
})

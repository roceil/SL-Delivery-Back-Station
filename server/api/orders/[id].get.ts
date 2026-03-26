export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少訂單 ID' })
  }

  const numericId = Number.parseInt(id)
  if (Number.isNaN(numericId)) {
    throw createError({ statusCode: 400, message: '無效的訂單 ID' })
  }

  const { data: orderData, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      platform_id,
      platform_type,
      voucher_id,
      user_id,
      schedule_id,
      status,
      service_plan,
      payment_status,
      luggage_count,
      departure_date,
      return_date,
      recipient_name,
      recipient_phone,
      notes,
      created_at,
      updated_at,
      start_point:stations!orders_start_point_fkey (id, name, address, area),
      end_point:stations!orders_end_point_fkey (id, name, address, area),
      order_status:orders_status (status)
    `)
    .eq('id', numericId)
    .single()

  if (error || !orderData) {
    throw createError({ statusCode: 404, message: '找不到此訂單' })
  }

  let orderCategory = '未知'
  let lineName = '未提供'
  let phone = '未提供'
  let pickupTime = '-'

  if (orderData.platform_type === 4) {
    orderCategory = '散客'
    const { data: normalOrder, error: normalError } = await supabase
      .from('normal_orders')
      .select('receive_time, contacts')
      .eq('id', orderData.platform_id)
      .single()

    if (normalError || !normalOrder) {
      throw createError({ statusCode: 404, message: '找不到訂單明細' })
    }

    const contacts = normalOrder.contacts as { name?: string, phone?: string } || {}
    lineName = contacts.name || '未提供'
    phone = contacts.phone || '未提供'
    pickupTime = normalOrder.receive_time || '-'
  }
  else if (orderData.platform_type === 3) {
    const { data: netOrder, error: netError } = await supabase
      .from('net_orders')
      .select('platform_type, receive_time, contacts')
      .eq('id', orderData.platform_id)
      .single()

    if (netError || !netOrder) {
      throw createError({ statusCode: 404, message: '找不到訂單明細' })
    }

    orderCategory = netOrder.platform_type === 1 ? 'Trip' : netOrder.platform_type === 2 ? 'Klook' : '合作'
    const contacts = netOrder.contacts as { name?: string, phone?: string } || {}
    lineName = contacts.name || '未提供'
    phone = contacts.phone || '未提供'
    pickupTime = netOrder.receive_time || '-'
  }
  else if (orderData.platform_type === 5) {
    orderCategory = 'KKday'
    const { data: kkdayOrder, error: kkdayError } = await supabase
      .from('kkday_orders')
      .select('contacts')
      .eq('id', orderData.platform_id)
      .single()

    if (kkdayError || !kkdayOrder) {
      throw createError({ statusCode: 404, message: '找不到 KKday 訂單明細' })
    }

    const contacts = kkdayOrder.contacts as { name?: string, phone?: string } || {}
    lineName = contacts.name || '未提供'
    phone = contacts.phone || '未提供'
  }

  const orderStatus = Array.isArray(orderData.order_status) ? orderData.order_status[0] : orderData.order_status
  const startPoint = Array.isArray(orderData.start_point) ? orderData.start_point[0] : orderData.start_point
  const endPoint = Array.isArray(orderData.end_point) ? orderData.end_point[0] : orderData.end_point

  return {
    id: orderData.id.toString(),
    orderNumber: orderData.order_number || '',
    voucherId: orderData.voucher_id,
    userId: orderData.user_id,
    category: orderCategory,
    lineName,
    phone,
    deliveryDate: orderData.departure_date,
    returnDate: orderData.return_date,
    pickupTime,
    luggageCount: orderData.luggage_count || 0,
    servicePlan: orderData.service_plan,
    paymentStatus: orderData.payment_status,
    recipientName: orderData.recipient_name,
    recipientPhone: orderData.recipient_phone,
    status: orderStatus?.status || 'pending',
    scheduleId: orderData.schedule_id?.toString() || null,
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
})

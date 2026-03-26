export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少訂單 ID' })
  }

  const body = await readBody(event)

  const numericId = Number.parseInt(id)
  if (Number.isNaN(numericId)) {
    throw createError({ statusCode: 400, message: '無效的訂單 ID' })
  }

  const { data: orderData, error: fetchError } = await supabase
    .from('orders')
    .select('id, platform_id, platform_type, notes')
    .eq('id', numericId)
    .single()

  if (fetchError || !orderData) {
    throw createError({ statusCode: 404, message: '找不到此訂單' })
  }

  // 更新 orders 主表欄位
  const orderUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.pickupLocationId !== undefined)
    orderUpdate.start_point = Number(body.pickupLocationId)
  if (body.deliveryLocationId !== undefined)
    orderUpdate.end_point = Number(body.deliveryLocationId)
  if (body.notes !== undefined)
    orderUpdate.notes = body.notes
  if (body.status !== undefined)
    orderUpdate.status = body.status
  if (body.servicePlan !== undefined)
    orderUpdate.service_plan = body.servicePlan
  if (body.paymentStatus !== undefined)
    orderUpdate.payment_status = body.paymentStatus
  if (body.returnDate !== undefined)
    orderUpdate.return_date = body.returnDate || null
  if (body.recipientName !== undefined)
    orderUpdate.recipient_name = body.recipientName || null
  if (body.recipientPhone !== undefined)
    orderUpdate.recipient_phone = body.recipientPhone || null
  if (body.luggageCount !== undefined)
    orderUpdate.luggage_count = body.luggageCount
  if (body.departureDate !== undefined)
    orderUpdate.departure_date = body.departureDate || null

  if (Object.keys(orderUpdate).length > 1) {
    const { error: updateError } = await supabase
      .from('orders')
      .update(orderUpdate)
      .eq('id', orderData.id)

    if (updateError) {
      throw createError({ statusCode: 500, message: `更新訂單失敗：${updateError.message}` })
    }
  }

  // 更新子表旅客資訊（contacts / quantity / departure_date）
  const hasSubUpdate = body.passengerName !== undefined
    || body.passengerPhone !== undefined
    || body.luggageCount !== undefined
    || body.departureDate !== undefined

  if (hasSubUpdate) {
    if (orderData.platform_type === 4) {
      // normal_orders
      const normalUpdate: Record<string, unknown> = {}
      if (body.passengerName !== undefined || body.passengerPhone !== undefined) {
        normalUpdate.contacts = { name: body.passengerName, phone: body.passengerPhone }
      }
      if (body.luggageCount !== undefined)
        normalUpdate.quantity = body.luggageCount
      if (body.departureDate !== undefined)
        normalUpdate.departure_date = body.departureDate || null

      if (Object.keys(normalUpdate).length > 0) {
        const { error } = await supabase
          .from('normal_orders')
          .update(normalUpdate)
          .eq('id', orderData.platform_id)
        if (error)
          throw createError({ statusCode: 500, message: `更新旅客資訊失敗：${error.message}` })
      }
    }
    else if (orderData.platform_type === 3) {
      // net_orders
      const netUpdate: Record<string, unknown> = {}
      if (body.passengerName !== undefined || body.passengerPhone !== undefined) {
        netUpdate.contacts = { name: body.passengerName, phone: body.passengerPhone }
      }
      if (body.luggageCount !== undefined)
        netUpdate.quantity = body.luggageCount
      if (body.departureDate !== undefined)
        netUpdate.departure_date = body.departureDate || null

      if (Object.keys(netUpdate).length > 0) {
        const { error } = await supabase
          .from('net_orders')
          .update(netUpdate)
          .eq('id', orderData.platform_id)
        if (error)
          throw createError({ statusCode: 500, message: `更新旅客資訊失敗：${error.message}` })
      }
    }
    else if (orderData.platform_type === 5) {
      // kkday_orders
      const kkdayUpdate: Record<string, unknown> = {}
      if (body.passengerName !== undefined || body.passengerPhone !== undefined) {
        kkdayUpdate.contacts = { name: body.passengerName, phone: body.passengerPhone }
      }
      if (body.luggageCount !== undefined)
        kkdayUpdate.quantity = body.luggageCount
      if (body.departureDate !== undefined)
        kkdayUpdate.departure_date = body.departureDate || null

      if (Object.keys(kkdayUpdate).length > 0) {
        const { error } = await supabase
          .from('kkday_orders')
          .update(kkdayUpdate)
          .eq('id', orderData.platform_id)
        if (error)
          throw createError({ statusCode: 500, message: `更新 KKday 旅客資訊失敗：${error.message}` })
      }
    }
  }

  return { success: true }
})

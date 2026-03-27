export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少訂單 ID' })
  }

  const body = await readBody(event)

  const numericAttempt = Number.parseInt(id)
  const fetchQuery = Number.isNaN(numericAttempt)
    ? supabase.from('orders').select('id, platform_id, platform_type, status, notes, service_plan, payment_status, return_date, recipient_name, recipient_phone, luggage_count, departure_date, start_point, end_point').eq('order_number', id).single()
    : supabase.from('orders').select('id, platform_id, platform_type, status, notes, service_plan, payment_status, return_date, recipient_name, recipient_phone, luggage_count, departure_date, start_point, end_point').eq('id', numericAttempt).single()

  const { data: orderData, error: fetchError } = await fetchQuery

  if (fetchError || !orderData) {
    throw createError({ statusCode: 404, message: '找不到此訂單' })
  }

  const numericId = orderData.id

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

  // 寫入修改紀錄
  const historyRecords: Array<{
    order_id: number
    field_name: string
    old_value: string | null
    new_value: string | null
  }> = []

  const fieldMap: Array<{ bodyKey: string, dbKey: keyof typeof orderData, label: string }> = [
    { bodyKey: 'status', dbKey: 'status', label: '訂單狀態' },
    { bodyKey: 'notes', dbKey: 'notes', label: '備註' },
    { bodyKey: 'servicePlan', dbKey: 'service_plan', label: '服務方案' },
    { bodyKey: 'paymentStatus', dbKey: 'payment_status', label: '付款狀態' },
    { bodyKey: 'returnDate', dbKey: 'return_date', label: '回程日期' },
    { bodyKey: 'recipientName', dbKey: 'recipient_name', label: '領件人' },
    { bodyKey: 'recipientPhone', dbKey: 'recipient_phone', label: '領件人電話' },
    { bodyKey: 'luggageCount', dbKey: 'luggage_count', label: '行李件數' },
    { bodyKey: 'departureDate', dbKey: 'departure_date', label: '去程日期' },
  ]

  for (const { bodyKey, dbKey, label } of fieldMap) {
    if (body[bodyKey] === undefined)
      continue
    const oldVal = orderData[dbKey]
    const newVal = body[bodyKey]
    if (String(oldVal ?? '') !== String(newVal ?? '')) {
      historyRecords.push({
        order_id: numericId,
        field_name: label,
        old_value: oldVal != null ? String(oldVal) : null,
        new_value: newVal != null ? String(newVal) : null,
      })
    }
  }

  if (body.pickupLocationId !== undefined && Number(body.pickupLocationId) !== orderData.start_point) {
    historyRecords.push({
      order_id: numericId,
      field_name: '起始點',
      old_value: orderData.start_point != null ? String(orderData.start_point) : null,
      new_value: String(body.pickupLocationId),
    })
  }

  if (body.deliveryLocationId !== undefined && Number(body.deliveryLocationId) !== orderData.end_point) {
    historyRecords.push({
      order_id: numericId,
      field_name: '送達點',
      old_value: orderData.end_point != null ? String(orderData.end_point) : null,
      new_value: String(body.deliveryLocationId),
    })
  }

  if (historyRecords.length > 0) {
    await supabase.from('order_history').insert(historyRecords)
  }

  // 更新費用明細（刪除舊資料後重新寫入）
  if (body.feeItems !== undefined) {
    await supabase.from('order_fees').delete().eq('order_id', numericId).in('item_type', ['plan', 'addon'])

    const newFees: Array<{
      order_id: number
      item_type: string
      item_name: string
      unit_price: number
      quantity: number
      subtotal: number
    }> = []

    const currentServicePlan = body.servicePlan ?? orderData.service_plan
    const currentLuggageCount = body.luggageCount ?? orderData.luggage_count

    if (currentServicePlan && currentServicePlan !== 'merchant') {
      const { data: deliveryPlans } = await supabase
        .from('service_plans')
        .select('name, unit_price')
        .eq('plan_type', 'delivery')
        .order('id', { ascending: true })

      const planIndex = currentServicePlan === 'round_trip' ? 0 : 1
      const plan = deliveryPlans?.[planIndex]

      if (plan) {
        newFees.push({
          order_id: numericId,
          item_type: 'plan',
          item_name: plan.name,
          unit_price: plan.unit_price,
          quantity: currentLuggageCount,
          subtotal: plan.unit_price * currentLuggageCount,
        })
      }
    }

    for (const item of body.feeItems as Array<{ name: string, unitPrice: number, count: number }>) {
      if (item.count > 0) {
        newFees.push({
          order_id: numericId,
          item_type: 'addon',
          item_name: item.name,
          unit_price: item.unitPrice,
          quantity: item.count,
          subtotal: item.unitPrice * item.count,
        })
      }
    }

    if (newFees.length > 0) {
      await supabase.from('order_fees').insert(newFees)
    }
  }

  return { success: true }
})

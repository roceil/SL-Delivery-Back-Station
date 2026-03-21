export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少訂單 ID',
    })
  }

  const body = await readBody(event)

  // 查詢現有訂單
  const { data: orderData, error: fetchError } = await supabase
    .from('orders')
    .select('id, platform_id, platform_type, notes')
    .eq('id', id)
    .single()

  if (fetchError || !orderData) {
    throw createError({
      statusCode: 404,
      message: '找不到此訂單',
    })
  }

  // 更新訂單基本資訊（起始/送達地點、備註）
  const orderUpdate: Record<string, unknown> = {}

  if (body.pickupLocationId !== undefined) {
    orderUpdate.start_point = Number(body.pickupLocationId)
  }
  if (body.deliveryLocationId !== undefined) {
    orderUpdate.end_point = Number(body.deliveryLocationId)
  }
  if (body.notes !== undefined) {
    orderUpdate.notes = body.notes
  }

  if (Object.keys(orderUpdate).length > 0) {
    const { error: updateError } = await supabase
      .from('orders')
      .update(orderUpdate)
      .eq('id', id)

    if (updateError) {
      throw createError({
        statusCode: 500,
        message: `更新訂單失敗：${updateError.message}`,
      })
    }
  }

  // 更新對應平台訂單的旅客資訊
  if (orderData.platform_type === 4 && orderData.platform_id) {
    const normalUpdate: Record<string, unknown> = {}

    if (body.passengerName !== undefined || body.passengerPhone !== undefined) {
      normalUpdate.contacts = {
        name: body.passengerName,
        phone: body.passengerPhone,
      }
    }
    if (body.luggageCount !== undefined) {
      normalUpdate.quantity = body.luggageCount
    }
    if (body.departureDate !== undefined) {
      normalUpdate.departure_date = body.departureDate || null
    }

    if (Object.keys(normalUpdate).length > 0) {
      const { error: normalError } = await supabase
        .from('normal_orders')
        .update(normalUpdate)
        .eq('id', orderData.platform_id)

      if (normalError) {
        throw createError({
          statusCode: 500,
          message: `更新旅客資訊失敗：${normalError.message}`,
        })
      }
    }
  }
  else if (orderData.platform_type === 3 && orderData.platform_id) {
    const netUpdate: Record<string, unknown> = {}

    if (body.passengerName !== undefined || body.passengerPhone !== undefined) {
      netUpdate.contacts = {
        name: body.passengerName,
        phone: body.passengerPhone,
      }
    }
    if (body.luggageCount !== undefined) {
      netUpdate.quantity = body.luggageCount
    }
    if (body.departureDate !== undefined) {
      netUpdate.departure_date = body.departureDate || null
    }

    if (Object.keys(netUpdate).length > 0) {
      const { error: netError } = await supabase
        .from('net_orders')
        .update(netUpdate)
        .eq('id', orderData.platform_id)

      if (netError) {
        throw createError({
          statusCode: 500,
          message: `更新旅客資訊失敗：${netError.message}`,
        })
      }
    }
  }

  return { success: true }
})

export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const body = await readBody(event)

  // 驗證必填欄位
  if (!body.deliveryDate || !body.pickupTime || !body.luggageCount || !body.pickupLocationId || !body.deliveryLocationId) {
    throw createError({
      statusCode: 400,
      message: '缺少必填欄位',
    })
  }

  // 將地點 ID 轉換為整數
  const pickupLocationId = Number.parseInt(body.pickupLocationId)
  const deliveryLocationId = Number.parseInt(body.deliveryLocationId)

  if (Number.isNaN(pickupLocationId) || Number.isNaN(deliveryLocationId)) {
    throw createError({
      statusCode: 400,
      message: '無效的地點 ID',
    })
  }

  // 驗證地點是否存在
  const { data: stations, error: stationsError } = await supabase
    .from('stations')
    .select('id, name, address, area')
    .in('id', [pickupLocationId, deliveryLocationId])

  if (stationsError || !stations || stations.length !== 2) {
    throw createError({
      statusCode: 400,
      message: '無效的地點 ID',
    })
  }

  try {
    // 1. 建立 normal_orders（第二層）
    const { data: normalOrder, error: normalError } = await supabase
      .from('normal_orders')
      .insert({
        status: 1, // 待確認
        product_id: 1, // 假設使用第一個產品（小琉球行李運送）
        departure_date: body.deliveryDate,
        receive_time: body.pickupTime,
        quantity: body.luggageCount,
        contacts: {
          name: body.lineName || '',
          phone: body.phone || '',
        },
      })
      .select('id')
      .single()

    if (normalError || !normalOrder) {
      throw createError({
        statusCode: 500,
        message: `建立訂單明細失敗: ${normalError?.message || '未知錯誤'}`,
      })
    }

    // 2. 建立 orders（第一層）
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        platform_type: 4, // Normal 散客
        platform_id: normalOrder.id.toString(),
        start_point: pickupLocationId,
        end_point: deliveryLocationId,
        status: 1, // pending 待確認
        notes: body.notes || '',
      })
      .select(`
        id,
        platform_id,
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
      .single()

    if (orderError || !order) {
      // 如果建立 orders 失敗，刪除已建立的 normal_orders
      await supabase
        .from('normal_orders')
        .delete()
        .eq('id', normalOrder.id)

      throw createError({
        statusCode: 500,
        message: `建立訂單失敗: ${orderError?.message || '未知錯誤'}`,
      })
    }

    // 返回完整的訂單資料
    const orderStatus = Array.isArray(order.order_status) ? order.order_status[0] : order.order_status
    const startPoint = Array.isArray(order.start_point) ? order.start_point[0] : order.start_point
    const endPoint = Array.isArray(order.end_point) ? order.end_point[0] : order.end_point

    return {
      id: order.id.toString(),
      category: '散客',
      lineName: body.lineName || '未提供',
      phone: body.phone || '未提供',
      deliveryDate: body.deliveryDate,
      pickupTime: body.pickupTime,
      luggageCount: body.luggageCount,
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
      updatedAt: order.updated_at,
    }
  }
  catch (error) {
    console.error('建立訂單錯誤:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : '建立訂單失敗',
    })
  }
})

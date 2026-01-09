export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const lineUserId = getRouterParam(event, 'lineUserId')

  if (!lineUserId) {
    throw createError({
      statusCode: 400,
      message: '缺少 LINE 使用者 ID',
    })
  }

  try {
    // 1. 根據 line_user_id 查詢 user_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('line_user_id', lineUserId)
      .single()

    if (userError) {
      if (userError.code === 'PGRST116') {
        // 使用者不存在，返回空陣列
        return []
      }

      throw createError({
        statusCode: 500,
        message: `查詢使用者失敗: ${userError.message}`,
      })
    }

    // 2. 查詢該使用者的所有訂單
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        platform_id,
        platform_type,
        voucher_id,
        user_id,
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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (ordersError) {
      throw createError({
        statusCode: 500,
        message: `查詢訂單失敗: ${ordersError.message}`,
      })
    }

    // 3. 分別取得散客訂單和平台訂單的 ID
    const normalOrderIds = orders.filter(o => o.platform_type === 4).map(o => Number.parseInt(o.platform_id))
    const netOrderIds = orders.filter(o => o.platform_type === 3).map(o => Number.parseInt(o.platform_id))

    // 4. 查詢散客訂單明細
    let normalOrders: any[] = []
    if (normalOrderIds.length > 0) {
      const { data, error: normalError } = await supabase
        .from('normal_orders')
        .select('id, departure_date, receive_time, quantity, contacts')
        .in('id', normalOrderIds)

      if (normalError) {
        throw createError({
          statusCode: 500,
          message: `查詢散客訂單明細失敗: ${normalError.message}`,
        })
      }
      normalOrders = data || []
    }

    // 5. 查詢平台訂單明細
    let netOrders: any[] = []
    if (netOrderIds.length > 0) {
      const { data, error: netError } = await supabase
        .from('net_orders')
        .select('id, platform_type, departure_date, receive_time, quantity, contacts')
        .in('id', netOrderIds)

      if (netError) {
        throw createError({
          statusCode: 500,
          message: `查詢平台訂單明細失敗: ${netError.message}`,
        })
      }
      netOrders = data || []
    }

    // 6. 組合訂單資料
    const result = orders.map((order) => {
      const orderStatus = Array.isArray(order.order_status) ? order.order_status[0] : order.order_status
      const startPoint = Array.isArray(order.start_point) ? order.start_point[0] : order.start_point
      const endPoint = Array.isArray(order.end_point) ? order.end_point[0] : order.end_point

      let category = '未知'
      let lineName = '未提供'
      let phone = '未提供'
      let deliveryDate = ''
      let pickupTime = ''
      let luggageCount = 0

      if (order.platform_type === 4) {
        // 散客訂單
        const normalOrder = normalOrders.find(no => no.id === Number.parseInt(order.platform_id))
        category = '散客'
        lineName = normalOrder?.contacts?.name || '未提供'
        phone = normalOrder?.contacts?.phone || '未提供'
        deliveryDate = normalOrder?.departure_date || ''
        pickupTime = normalOrder?.receive_time || ''
        luggageCount = normalOrder?.quantity || 0
      }
      else if (order.platform_type === 3) {
        // 平台訂單
        const netOrder = netOrders.find(no => no.id === Number.parseInt(order.platform_id))
        if (netOrder?.platform_type === 1) {
          category = 'Trip'
        }
        else if (netOrder?.platform_type === 2) {
          category = 'Klook'
        }
        else {
          category = '合作'
        }
        lineName = netOrder?.contacts?.name || '未提供'
        phone = netOrder?.contacts?.phone || '未提供'
        deliveryDate = netOrder?.departure_date || ''
        pickupTime = netOrder?.receive_time || ''
        luggageCount = netOrder?.quantity || 0
      }

      return {
        id: order.id.toString(),
        voucherId: order.voucher_id,
        userId: order.user_id,
        category,
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
        notes: order.notes || '',
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      }
    })

    return result
  }
  catch (error) {
    console.error('查詢使用者訂單錯誤:', error)

    // 如果是已經處理過的錯誤，直接拋出
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: '查詢訂單失敗',
    })
  }
})

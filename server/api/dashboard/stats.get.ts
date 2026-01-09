export default defineEventHandler(async (_event) => {
  const supabase = useServiceRoleClient()

  try {
    // 查詢訂單統計
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('status')

    if (ordersError) {
      console.error('查詢訂單統計失敗:', ordersError)
    }

    const totalOrders = orders?.length || 0
    const pendingOrders = orders?.filter(o => o.status === 1).length || 0 // pending
    const inDeliveryOrders = orders?.filter(o => o.status === 4).length || 0 // in_delivery
    const deliveredOrders = orders?.filter(o => o.status === 5).length || 0 // delivered

    // 查詢活躍配送員數量
    const { data: couriers, error: couriersError } = await supabase
      .from('couriers')
      .select('id')
      .eq('is_available', true)

    if (couriersError) {
      console.error('查詢配送員數量失敗:', couriersError)
    }

    const activeCouriers = couriers?.length || 0

    // 查詢商家數量
    const { data: merchants, error: merchantsError } = await supabase
      .from('merchants')
      .select('id')
      .eq('is_active', true)

    if (merchantsError) {
      console.error('查詢商家數量失敗:', merchantsError)
    }

    const totalMerchants = merchants?.length || 0

    return {
      totalOrders,
      pendingOrders,
      inDeliveryOrders,
      deliveredOrders,
      activeCouriers,
      totalMerchants,
    }
  }
  catch (error) {
    console.error('查詢統計數據錯誤:', error)
    return {
      totalOrders: 0,
      pendingOrders: 0,
      inDeliveryOrders: 0,
      deliveredOrders: 0,
      activeCouriers: 0,
      totalMerchants: 0,
    }
  }
})

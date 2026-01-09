export default defineEventHandler(async (_event) => {
  const supabase = useServiceRoleClient()

  try {
    // 查詢狀態為已派發的行程
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select(`
        id,
        name,
        scheduled_date,
        courier:couriers (
          id,
          name
        ),
        status:schedules_status (
          status
        )
      `)
      .eq('status', 2) // dispatched
      .order('scheduled_date', { ascending: true })

    if (error) {
      console.error('查詢運送中行程失敗:', error)
      return []
    }

    if (!schedules || schedules.length === 0) {
      return []
    }

    // 為每個行程查詢訂單資料
    const tripsWithDetails = await Promise.all(
      schedules.map(async (schedule) => {
        // 查詢該行程的訂單數量
        const { data: scheduleOrders, error: ordersError } = await supabase
          .from('schedule_orders')
          .select('order_id')
          .eq('schedule_id', schedule.id)

        if (ordersError) {
          console.error('查詢行程訂單失敗:', ordersError)
        }

        const ordersCount = scheduleOrders?.length || 0

        // 如果有訂單，查詢訂單詳情以獲取起點和終點
        let route = '尚未設定路線'
        if (ordersCount > 0 && scheduleOrders) {
          const orderIds = scheduleOrders.map(so => so.order_id)
          const { data: orders, error: orderDetailsError } = await supabase
            .from('orders')
            .select(`
              start_point:stations!orders_start_point_fkey (name),
              end_point:stations!orders_end_point_fkey (name)
            `)
            .in('id', orderIds)

          if (!orderDetailsError && orders && orders.length > 0) {
            // 收集所有起點和終點
            const startPoints = new Set<string>()
            const endPoints = new Set<string>()

            orders.forEach((order: any) => {
              if (order.start_point?.name) {
                startPoints.add(order.start_point.name)
              }
              if (order.end_point?.name) {
                endPoints.add(order.end_point.name)
              }
            })

            const startPointsArray = Array.from(startPoints)
            const endPointsArray = Array.from(endPoints)

            if (startPointsArray.length > 0 && endPointsArray.length > 0) {
              const startText = startPointsArray.length > 1
                ? `${startPointsArray[0]} 等 ${startPointsArray.length} 站`
                : startPointsArray[0]
              const endText = endPointsArray.length > 1
                ? `${endPointsArray[0]} 等 ${endPointsArray.length} 站`
                : endPointsArray[0]
              route = `${startText} → ${endText}`
            }
          }
        }

        const courier = Array.isArray(schedule.courier) ? schedule.courier[0] : schedule.courier

        return {
          id: schedule.id.toString(),
          courier: courier?.name || '未指派',
          route,
          ordersCount,
          progress: 0, // 目前沒有追蹤進度，預設為 0
          estimatedTime: '-', // 目前沒有預計抵達時間
          status: 'in_transit',
        }
      }),
    )

    return tripsWithDetails
  }
  catch (error) {
    console.error('查詢運送中行程錯誤:', error)
    return []
  }
})

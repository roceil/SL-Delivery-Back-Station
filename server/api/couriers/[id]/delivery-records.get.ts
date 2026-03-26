export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少夥伴 ID' })
  }

  const { data, error } = await supabase
    .from('schedules')
    .select(`
      id,
      name,
      scheduled_date,
      schedule_orders (
        orders (
          luggage_count
        )
      )
    `)
    .eq('courier_id', id)
    .order('scheduled_date', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, message: `查詢配送紀錄失敗: ${error.message}` })
  }

  return (data ?? []).map((schedule) => {
    const scheduleOrders = Array.isArray(schedule.schedule_orders) ? schedule.schedule_orders : []
    const luggageCount = scheduleOrders.reduce((sum, so) => {
      const order = Array.isArray(so.orders) ? so.orders[0] : so.orders
      return sum + (order?.luggage_count || 0)
    }, 0)

    return {
      id: schedule.id,
      deliveryDate: schedule.scheduled_date,
      tripNumber: schedule.name,
      orderCount: scheduleOrders.length,
      luggageCount,
    }
  })
})

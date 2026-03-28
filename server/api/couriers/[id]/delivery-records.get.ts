export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少夥伴 ID' })
  }

  const { data: schedules, error } = await supabase
    .from('schedules')
    .select('id, name, scheduled_date')
    .eq('courier_id', id)
    .order('scheduled_date', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, message: `查詢配送紀錄失敗: ${error.message}` })
  }

  if (!schedules || schedules.length === 0)
    return []

  const scheduleIds = schedules.map(s => s.id)

  // 查詢所有行程的去程任務（含訂單行李數）
  const { data: tasks } = await supabase
    .from('order_tasks')
    .select(`
      schedule_id,
      order:orders (
        luggage_count
      )
    `)
    .in('schedule_id', scheduleIds)
    .eq('leg', 'outbound')

  // 建立 scheduleId → tasks 的 map
  const tasksBySchedule = new Map<number, Array<{ luggage_count: number }>>()
  tasks?.forEach((task: any) => {
    const order = Array.isArray(task.order) ? task.order[0] : task.order
    if (!tasksBySchedule.has(task.schedule_id))
      tasksBySchedule.set(task.schedule_id, [])
    tasksBySchedule.get(task.schedule_id)!.push({ luggage_count: order?.luggage_count || 0 })
  })

  return schedules.map((schedule) => {
    const scheduleTasks = tasksBySchedule.get(schedule.id) || []
    const luggageCount = scheduleTasks.reduce((sum, t) => sum + t.luggage_count, 0)

    return {
      id: schedule.id,
      deliveryDate: schedule.scheduled_date,
      tripNumber: schedule.name,
      orderCount: scheduleTasks.length,
      luggageCount,
    }
  })
})

export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const tripId = getRouterParam(event, 'id')

  if (!tripId) {
    throw createError({
      statusCode: 400,
      message: '缺少行程 ID',
    })
  }

  const scheduleId = Number.parseInt(tripId)
  if (Number.isNaN(scheduleId)) {
    throw createError({
      statusCode: 400,
      message: '無效的行程 ID',
    })
  }

  // 查詢行程資料
  const { data: schedule, error } = await supabase
    .from('schedules')
    .select(`
      id,
      name,
      description,
      scheduled_date,
      dispatched_at,
      completed_at,
      tracking_url,
      notes,
      created_at,
      updated_at,
      courier:couriers (
        id,
        name,
        employee_number,
        phone
      ),
      status:schedules_status (
        id,
        status,
        explanation
      )
    `)
    .eq('id', scheduleId)
    .single()

  if (error || !schedule) {
    throw createError({
      statusCode: 404,
      message: '找不到該行程',
    })
  }

  // 查詢該行程的所有訂單
  const { data: scheduleOrders, error: scheduleOrdersError } = await supabase
    .from('schedule_orders')
    .select('order_id')
    .eq('schedule_id', scheduleId)

  const orderIds = scheduleOrders?.map((so: any) => so.order_id) || []

  const courier = Array.isArray(schedule.courier) ? schedule.courier[0] : schedule.courier
  const status = Array.isArray(schedule.status) ? schedule.status[0] : schedule.status

  return {
    id: schedule.id.toString(),
    name: schedule.name,
    description: schedule.description || '',
    courierId: courier?.id?.toString() || '',
    courierName: courier?.name || '未分配',
    courierPhone: courier?.phone || '',
    courierEmployeeNumber: courier?.employee_number || '',
    scheduledDate: schedule.scheduled_date,
    status: status?.status || 'pending',
    statusId: status?.id || 1,
    statusExplanation: status?.explanation || '',
    createdAt: schedule.created_at,
    updatedAt: schedule.updated_at,
    dispatchedAt: schedule.dispatched_at,
    completedAt: schedule.completed_at,
    trackingUrl: schedule.tracking_url,
    notes: schedule.notes,
    orderIds: orderIds.map((id: any) => id.toString()),
  }
})

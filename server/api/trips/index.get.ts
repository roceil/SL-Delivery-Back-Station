import type { SupabaseCourier, SupabaseScheduleStatus, TripResponse } from '../../utils/trips.types'

interface ScheduleRow {
  id: number
  name: string
  description: string | null
  scheduled_date: string
  dispatched_at: string | null
  completed_at: string | null
  tracking_url: string | null
  notes: string | null
  created_at: string
  courier: SupabaseCourier | null
  status: SupabaseScheduleStatus | null
}

export default defineEventHandler(async (_event) => {
  const supabase = useServiceRoleClient()

  // 查詢所有行程資料
  const { data: schedulesData, error } = await supabase
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
      courier:couriers (
        id,
        name,
        employee_number
      ),
      status:schedules_status (
        status
      )
    `)
    .order('created_at', { ascending: false })
    .returns<ScheduleRow[]>()

  if (error) {
    throw createError({
      statusCode: 500,
      message: `查詢行程失敗: ${error.message}`,
    })
  }

  if (!schedulesData || schedulesData.length === 0) {
    return []
  }

  // 查詢每個行程的訂單統計資訊
  const tripsWithStats = await Promise.all(
    schedulesData.map(async (schedule): Promise<TripResponse> => {
      interface TaskRow {
        order_id: number
        leg: string
        order: {
          id: number
          luggage_count: number
          start_point: { area: string } | null
          end_point: { area: string } | null
        } | null
      }

      // 查詢此行程的所有任務（去程 + 回程）
      const { data: tasksData, error: tasksError } = await supabase
        .from('order_tasks')
        .select(`
          order_id,
          leg,
          order:orders (
            id,
            luggage_count,
            start_point:stations!orders_start_point_fkey (area),
            end_point:stations!orders_end_point_fkey (area)
          )
        `)
        .eq('schedule_id', schedule.id)
        .returns<TaskRow[]>()

      if (tasksError) {
        console.error('查詢行程任務失敗:', tasksError)
        return {
          id: schedule.id.toString(),
          name: schedule.name,
          description: schedule.description || '',
          courierId: schedule.courier?.id?.toString() || '',
          courierName: schedule.courier?.name || '未分配',
          scheduledDate: schedule.scheduled_date,
          status: schedule.status?.status || 'pending',
          createdAt: schedule.created_at,
          dispatchedAt: schedule.dispatched_at,
          completedAt: schedule.completed_at,
          trackingUrl: schedule.tracking_url,
          orderCount: 0,
          totalLuggage: 0,
          areas: [],
        }
      }

      const tasks = tasksData || []
      const areas: string[] = []
      let totalLuggage = 0

      tasks.forEach((task) => {
        const order = task.order
        if (!order)
          return

        // 依 leg 決定送達地區：inbound 送達的是 start_point，outbound 是 end_point
        const deliveryArea = task.leg === 'inbound'
          ? order.start_point?.area
          : order.end_point?.area

        if (deliveryArea && !areas.includes(deliveryArea))
          areas.push(deliveryArea)

        totalLuggage += order.luggage_count || 0
      })

      return {
        id: schedule.id.toString(),
        name: schedule.name,
        description: schedule.description || '',
        courierId: schedule.courier?.id?.toString() || '',
        courierName: schedule.courier?.name || '未分配',
        scheduledDate: schedule.scheduled_date,
        status: schedule.status?.status || 'pending',
        createdAt: schedule.created_at,
        dispatchedAt: schedule.dispatched_at,
        completedAt: schedule.completed_at,
        trackingUrl: schedule.tracking_url,
        orderCount: tasks.length,
        totalLuggage,
        areas: areas.sort(),
      }
    }),
  )

  return tripsWithStats
})

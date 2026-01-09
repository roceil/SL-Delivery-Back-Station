import type { TripResponse, SupabaseCourier, SupabaseScheduleStatus } from '../../utils/trips.types'

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
      interface ScheduleOrderRow {
        order: {
          id: number
          end_point: {
            area: string
          } | null
        } | null
      }

      // 查詢該行程的所有訂單
      const { data: scheduleOrders, error: scheduleOrdersError } = await supabase
        .from('schedule_orders')
        .select(`
          order:orders (
            id,
            end_point:stations!orders_end_point_fkey (
              area
            )
          )
        `)
        .eq('schedule_id', schedule.id)
        .returns<ScheduleOrderRow[]>()

      if (scheduleOrdersError) {
        console.error('查詢行程訂單失敗:', scheduleOrdersError)
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

      const orders = scheduleOrders || []

      // 獲取訂單 IDs
      const orderIds = orders
        .map(so => so.order?.id)
        .filter((id): id is number => id !== null && id !== undefined)

      // 如果有訂單，查詢訂單詳情以獲取行李數量
      let totalLuggage = 0
      const areas: string[] = []

      if (orderIds.length > 0) {
        interface OrderRow {
          id: number
          platform_type: number
          platform_id: string
          end_point: {
            area: string
          } | null
        }

        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            platform_type,
            platform_id,
            end_point:stations!orders_end_point_fkey (
              area
            )
          `)
          .in('id', orderIds)
          .returns<OrderRow[]>()

        if (!ordersError && ordersData) {
          // 收集所有的 platform_id 並按類型分組
          const normalOrderIds: string[] = []
          const netOrderIds: string[] = []

          ordersData.forEach((order) => {
            // 收集區域
            if (order.end_point?.area && !areas.includes(order.end_point.area)) {
              areas.push(order.end_point.area)
            }

            // 分類訂單 ID
            if (order.platform_type === 4) {
              normalOrderIds.push(order.platform_id)
            }
            else if (order.platform_type === 3) {
              netOrderIds.push(order.platform_id)
            }
          })

          // 查詢 normal_orders 的數量
          if (normalOrderIds.length > 0) {
            const { data: normalOrders, error: normalError } = await supabase
              .from('normal_orders')
              .select('quantity')
              .in('id', normalOrderIds)

            if (!normalError && normalOrders) {
              totalLuggage += normalOrders.reduce((sum, no) => sum + (no.quantity || 0), 0)
            }
          }

          // 查詢 net_orders 的數量
          if (netOrderIds.length > 0) {
            const { data: netOrders, error: netError } = await supabase
              .from('net_orders')
              .select('quantity')
              .in('id', netOrderIds)

            if (!netError && netOrders) {
              totalLuggage += netOrders.reduce((sum, no) => sum + (no.quantity || 0), 0)
            }
          }
        }
      }

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
        orderCount: orders.length,
        totalLuggage,
        areas: areas.sort(),
      }
    }),
  )

  return tripsWithStats
})

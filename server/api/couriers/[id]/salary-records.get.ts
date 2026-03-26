export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少夥伴 ID' })
  }

  const { data: courier, error: courierError } = await supabase
    .from('couriers')
    .select('courier_type')
    .eq('id', id)
    .single()

  if (courierError) {
    throw createError({ statusCode: 500, message: `查詢夥伴失敗: ${courierError.message}` })
  }

  const { data: rateData } = await supabase
    .from('courier_type_rates')
    .select('rate_per_delivery')
    .eq('courier_type', courier?.courier_type ?? '')
    .single()

  const ratePerDelivery = rateData?.rate_per_delivery ?? 0

  const { data: schedules, error: schedulesError } = await supabase
    .from('schedules')
    .select('scheduled_date')
    .eq('courier_id', id)

  if (schedulesError) {
    throw createError({ statusCode: 500, message: `查詢行程失敗: ${schedulesError.message}` })
  }

  const monthCounts: Record<string, number> = {}
  for (const s of schedules ?? []) {
    const period = s.scheduled_date.substring(0, 7)
    monthCounts[period] = (monthCounts[period] ?? 0) + 1
  }

  const { data: salaryRecords, error: salaryError } = await supabase
    .from('salary_records')
    .select('period, status, paid_at')
    .eq('courier_id', id)

  if (salaryError) {
    throw createError({ statusCode: 500, message: `查詢薪資紀錄失敗: ${salaryError.message}` })
  }

  const statusMap: Record<string, { status: string, paidAt: string | null }> = {}
  for (const r of salaryRecords ?? []) {
    const periodKey = (r.period as string).substring(0, 7)
    statusMap[periodKey] = { status: r.status as string, paidAt: r.paid_at as string | null }
  }

  return Object.entries(monthCounts)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([period, deliveryCount]) => ({
      period,
      deliveryCount,
      amount: deliveryCount * ratePerDelivery,
      status: statusMap[period]?.status ?? 'unpaid',
      paidAt: statusMap[period]?.paidAt ?? null,
    }))
})

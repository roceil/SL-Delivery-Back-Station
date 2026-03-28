export default defineEventHandler(async (_event) => {
  const supabase = useServiceRoleClient()

  const { data, error } = await supabase
    .from('service_plans')
    .select('id, name, unit_price, is_active, is_round_trip')
    .eq('plan_type', 'delivery')
    .order('id', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      message: `查詢運送方案失敗: ${error.message}`,
    })
  }

  return (data ?? []).map(row => ({
    id: row.id,
    name: row.name,
    price: row.unit_price,
    isRoundTrip: row.is_round_trip,
    enableStatus: row.is_active ? 'active' : 'inactive',
  }))
})

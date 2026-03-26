export default defineEventHandler(async (_event) => {
  const supabase = useServiceRoleClient()

  const { data, error } = await supabase
    .from('service_plans')
    .select('id, item_type, name, unit_price, is_active')
    .eq('plan_type', 'addon')
    .order('id', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      message: `查詢加值服務失敗: ${error.message}`,
    })
  }

  return (data ?? []).map(row => ({
    id: row.id,
    type: row.item_type as '服務' | '商品',
    name: row.name,
    unitPrice: row.unit_price,
    enableStatus: row.is_active ? 'active' : 'inactive',
  }))
})

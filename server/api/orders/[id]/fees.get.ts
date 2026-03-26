export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少訂單 ID' })
  }

  const numericId = Number.parseInt(id)
  if (Number.isNaN(numericId)) {
    throw createError({ statusCode: 400, message: '無效的訂單 ID' })
  }

  const { data, error } = await supabase
    .from('order_fees')
    .select('id, item_type, item_name, unit_price, quantity, subtotal')
    .eq('order_id', numericId)
    .order('id', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, message: `查詢費用明細失敗: ${error.message}` })
  }

  return data ?? []
})

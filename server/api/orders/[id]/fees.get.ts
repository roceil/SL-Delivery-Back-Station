export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const voucherId = getRouterParam(event, 'id')

  if (!voucherId) {
    throw createError({ statusCode: 400, message: '缺少訂單 ID' })
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id')
    .eq('order_number', voucherId)
    .single()

  if (orderError || !order) {
    throw createError({ statusCode: 404, message: '找不到此訂單' })
  }

  const { data, error } = await supabase
    .from('order_fees')
    .select('id, item_type, item_name, unit_price, quantity, subtotal')
    .eq('order_id', order.id)
    .order('id', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, message: `查詢費用明細失敗: ${error.message}` })
  }

  return data ?? []
})

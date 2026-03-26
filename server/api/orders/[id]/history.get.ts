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
    .from('order_history')
    .select('id, field_name, old_value, new_value, changed_at')
    .eq('order_id', order.id)
    .order('changed_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, message: `查詢修改紀錄失敗: ${error.message}` })
  }

  return data ?? []
})

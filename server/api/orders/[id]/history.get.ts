export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少訂單 ID' })
  }

  const numericAttempt = Number.parseInt(id)
  let numericId: number
  if (!Number.isNaN(numericAttempt)) {
    numericId = numericAttempt
  }
  else {
    const { data: orderRow } = await supabase.from('orders').select('id').eq('order_number', id).single()
    if (!orderRow)
      throw createError({ statusCode: 404, message: '找不到此訂單' })
    numericId = orderRow.id
  }

  const { data, error } = await supabase
    .from('order_history')
    .select('id, field_name, old_value, new_value, changed_at')
    .eq('order_id', numericId)
    .order('changed_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, message: `查詢修改紀錄失敗: ${error.message}` })
  }

  return data ?? []
})

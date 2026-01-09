export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const voucherId = getRouterParam(event, 'voucherId')

  if (!voucherId) {
    throw createError({
      statusCode: 400,
      message: '缺少憑證號碼',
    })
  }

  // 根據 voucher_id 查詢訂單
  const { data: order, error } = await supabase
    .from('orders')
    .select('id')
    .eq('voucher_id', voucherId)
    .single()

  if (error || !order) {
    throw createError({
      statusCode: 404,
      message: '找不到此訂單',
    })
  }

  return {
    id: order.id.toString(),
  }
})

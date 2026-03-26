export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const recordId = getRouterParam(event, 'recordId')

  if (!recordId) {
    throw createError({ statusCode: 400, message: '缺少紀錄 ID' })
  }

  const { error } = await supabase
    .from('merchant_ticket_records')
    .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', recordId)

  if (error) {
    throw createError({ statusCode: 500, message: `更新付款狀態失敗: ${error.message}` })
  }

  return { success: true }
})

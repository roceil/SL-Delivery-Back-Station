export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ period: string }>(event)

  if (!id || !body?.period) {
    throw createError({ statusCode: 400, message: '缺少必要參數' })
  }

  const periodDate = `${body.period}-01`

  const { error } = await supabase
    .from('salary_records')
    .upsert(
      { courier_id: Number(id), period: periodDate, status: 'paid', paid_at: new Date().toISOString() },
      { onConflict: 'courier_id,period' },
    )

  if (error) {
    throw createError({ statusCode: 500, message: `更新薪資紀錄失敗: ${error.message}` })
  }

  return { success: true }
})

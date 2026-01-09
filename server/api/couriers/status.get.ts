export default defineEventHandler(async (_event) => {
  const supabase = useServiceRoleClient()

  const { data, error } = await supabase
    .from('couriers_status')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      message: `取得狀態列表失敗: ${error.message}`,
    })
  }

  return data
})

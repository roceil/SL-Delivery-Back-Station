export default defineEventHandler(async (_event) => {
  const supabase = useServiceRoleClient()

  const { data: types, error } = await supabase
    .from('stations_types')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      message: `查詢類型失敗: ${error.message}`,
    })
  }

  return types || []
})

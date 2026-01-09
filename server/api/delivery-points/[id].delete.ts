export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const supabase = useServiceRoleClient()

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少運送點 ID',
    })
  }

  // 從 stations 表刪除
  const { error } = await supabase
    .from('stations')
    .delete()
    .eq('id', id)

  if (error) {
    throw createError({
      statusCode: 500,
      message: `刪除運送點失敗: ${error.message}`,
    })
  }

  return {
    success: true,
    message: '運送點刪除成功',
  }
})

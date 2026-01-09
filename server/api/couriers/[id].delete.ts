export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const supabase = useServiceRoleClient()

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少夥伴 ID',
    })
  }

  // 刪除夥伴
  const { error } = await supabase
    .from('couriers')
    .delete()
    .eq('id', id)

  if (error) {
    // 檢查是否有外鍵約束錯誤（如果此夥伴已被分配到行程）
    if (error.code === '23503') {
      throw createError({
        statusCode: 409,
        message: '此夥伴已被分配到行程，無法刪除',
      })
    }

    throw createError({
      statusCode: 500,
      message: `刪除夥伴失敗: ${error.message}`,
    })
  }

  return {
    success: true,
    message: '夥伴刪除成功',
  }
})

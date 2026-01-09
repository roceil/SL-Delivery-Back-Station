export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const supabase = useServiceRoleClient()

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少運送點 ID',
    })
  }

  // 驗證必填欄位
  if (!body.name || !body.address) {
    throw createError({
      statusCode: 400,
      message: '名稱和地址為必填欄位',
    })
  }

  // 更新 stations 表
  const { data, error } = await supabase
    .from('stations')
    .update({
      name: body.name,
      address: body.address,
      area: body.area || null,
      type: body.type || null,
      latitude: body.latitude ? Number.parseFloat(body.latitude) : null,
      longitude: body.longitude ? Number.parseFloat(body.longitude) : null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw createError({
        statusCode: 404,
        message: '找不到此運送點',
      })
    }
    throw createError({
      statusCode: 500,
      message: `更新運送點失敗: ${error.message}`,
    })
  }

  return {
    success: true,
    data,
    message: '運送點更新成功',
  }
})

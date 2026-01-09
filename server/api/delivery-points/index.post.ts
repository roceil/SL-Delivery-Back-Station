export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const supabase = useServiceRoleClient()

  // 驗證必填欄位
  if (!body.name || !body.address) {
    throw createError({
      statusCode: 400,
      message: '名稱和地址為必填欄位',
    })
  }

  // 新增到 stations 表
  const { data, error } = await supabase
    .from('stations')
    .insert({
      name: body.name,
      address: body.address,
      area: body.area || null,
      type: body.type || null,
      latitude: body.latitude ? Number.parseFloat(body.latitude) : null,
      longitude: body.longitude ? Number.parseFloat(body.longitude) : null,
    })
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      message: `新增運送點失敗: ${error.message}`,
    })
  }

  return {
    success: true,
    data,
    message: '運送點新增成功',
  }
})

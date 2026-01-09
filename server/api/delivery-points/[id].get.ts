export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const supabase = useServiceRoleClient()

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少運送點 ID',
    })
  }

  const { data, error } = await supabase
    .from('stations')
    .select(`
      id,
      name,
      address,
      area,
      type,
      latitude,
      longitude,
      created_at,
      stations_types!inner (
        name
      )
    `)
    .eq('id', id)
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
      message: `取得運送點失敗: ${error.message}`,
    })
  }

  // 轉換資料格式
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    typeName: (data.stations_types as any)?.name || '未分類',
    address: data.address,
    area: data.area,
    latitude: data.latitude,
    longitude: data.longitude,
    createdAt: data.created_at,
  }
})

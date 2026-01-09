export default defineEventHandler(async (_event) => {
  const supabase = useServiceRoleClient()

  // 從 stations 表取得所有運送點，並 join stations_types 取得類型名稱
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
      stations_types (
        name
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      message: `取得運送點失敗: ${error.message}`,
    })
  }

  // 轉換資料格式以符合前端需求
  return data.map((station) => {
    const stationType = Array.isArray(station.stations_types) ? station.stations_types[0] : station.stations_types

    return {
      id: station.id,
      name: station.name,
      type: stationType?.name || '未分類',
      typeId: station.type,
      address: station.address,
      area: station.area,
      latitude: station.latitude,
      longitude: station.longitude,
      createdAt: station.created_at,
    }
  })
})

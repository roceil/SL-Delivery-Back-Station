export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const supabase = useServiceRoleClient()

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少商家 ID',
    })
  }

  // 驗證必填欄位
  if (!body.name || !body.address) {
    throw createError({
      statusCode: 400,
      message: '名稱和地址為必填欄位',
    })
  }

  // 先取得原商家資料
  const { data: oldMerchant, error: fetchError } = await supabase
    .from('merchants')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !oldMerchant) {
    throw createError({
      statusCode: 404,
      message: '找不到此商家',
    })
  }

  // 更新商家資料
  // 注意：voucher_id 和 used_counts 不應該被手動修改
  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .update({
      name: body.name,
      contact_person: body.contactPerson || null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      types: body.type || null,
      is_active: body.isActive !== undefined ? body.isActive : true,
      is_collaborate: body.isCollaborate !== undefined ? body.isCollaborate : false,
      max_usage_counts: body.maxUsageCounts || null,
      remarks: body.remarks || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (merchantError) {
    throw createError({
      statusCode: 500,
      message: `更新商家失敗: ${merchantError.message}`,
    })
  }

  // 查找對應的運送點（根據原本的名稱和地址）
  const { data: stations } = await supabase
    .from('stations')
    .select('*')
    .eq('name', oldMerchant.name)
    .eq('address', oldMerchant.address)
    .limit(1)

  // 如果找到對應的運送點，同步更新基本資訊
  // 注意：經緯度應該在運送點管理頁面中單獨編輯
  if (stations && stations.length > 0) {
    const station = stations[0]
    const { error: stationError } = await supabase
      .from('stations')
      .update({
        name: body.name,
        address: body.address,
        area: body.area || null,
        type: body.type || null,
      })
      .eq('id', station.id)

    if (stationError) {
      console.error('同步更新運送點失敗:', stationError)
    }
  }

  return {
    success: true,
    data: merchant,
    message: '商家更新成功',
  }
})

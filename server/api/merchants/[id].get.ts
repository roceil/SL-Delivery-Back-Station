export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const supabase = useServiceRoleClient()

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少商家 ID',
    })
  }

  // 查詢商家，並加載類型資訊
  const { data: merchant, error } = await supabase
    .from('merchants')
    .select(`
      *,
      merchants_types (
        id,
        name
      )
    `)
    .eq('id', id)
    .single()

  if (error || !merchant) {
    throw createError({
      statusCode: 404,
      message: '找不到此商家',
    })
  }

  // 格式化回傳資料
  return {
    id: merchant.id,
    name: merchant.name,
    contactPerson: merchant.contact_person,
    phone: merchant.phone,
    email: merchant.email,
    address: merchant.address,
    type: merchant.types,
    typeName: merchant.merchants_types?.name || '',
    area: merchant.address?.includes('A') ? 'A' : merchant.address?.includes('B') ? 'B' : merchant.address?.includes('C') ? 'C' : 'D',
    isActive: merchant.is_active,
    isCollaborate: merchant.is_collaborate,
    voucherId: merchant.voucher_id,
    usedCounts: merchant.used_counts,
    maxUsageCounts: merchant.max_usage_counts,
    remarks: merchant.remarks,
    createdAt: merchant.created_at,
    updatedAt: merchant.updated_at,
  }
})

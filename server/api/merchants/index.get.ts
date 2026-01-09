export default defineEventHandler(async (_event) => {
  const supabase = useServiceRoleClient()

  // 查詢所有商家，並加載類型資訊
  const { data: merchants, error } = await supabase
    .from('merchants')
    .select(`
      *,
      merchants_types (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      message: `查詢商家失敗: ${error.message}`,
    })
  }

  // 格式化回傳資料
  const formattedMerchants = (merchants || []).map(merchant => ({
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
  }))

  return formattedMerchants
})

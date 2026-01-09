import { nanoid } from 'nanoid'

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

  // 生成唯一的 voucher_id
  const voucherId = nanoid(12)

  // 新增商家到 merchants 表
  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .insert({
      name: body.name,
      contact_person: body.contactPerson || null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      types: body.type || null,
      is_active: body.isActive !== undefined ? body.isActive : true,
      is_collaborate: body.isCollaborate !== undefined ? body.isCollaborate : false,
      voucher_id: voucherId,
      used_counts: 0,
      max_usage_counts: body.maxUsageCounts || null,
      remarks: body.remarks || null,
    })
    .select()
    .single()

  if (merchantError) {
    throw createError({
      statusCode: 500,
      message: `新增商家失敗: ${merchantError.message}`,
    })
  }

  // 自動新增對應的運送點到 stations 表
  const { data: station, error: stationError } = await supabase
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

  if (stationError) {
    console.error('自動新增運送點失敗:', stationError)
  }

  return {
    success: true,
    data: merchant,
    station: station || null,
    message: '商家新增成功',
  }
})

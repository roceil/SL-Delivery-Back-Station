export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.name || !body.unitPrice || !body.type) {
    throw createError({ statusCode: 400, message: '缺少必填欄位: name, unitPrice, type' })
  }

  const supabase = useServiceRoleClient()

  const { data, error } = await supabase
    .from('service_plans')
    .insert({
      plan_type: 'addon',
      item_type: body.type,
      name: body.name,
      unit_price: body.unitPrice,
      is_active: body.enableStatus !== 'inactive',
    })
    .select('id, item_type, name, unit_price, is_active')
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      message: `新增加值服務失敗: ${error.message}`,
    })
  }

  return {
    id: data.id,
    type: data.item_type as '服務' | '商品',
    name: data.name,
    unitPrice: data.unit_price,
    enableStatus: data.is_active ? 'active' : 'inactive',
  }
})

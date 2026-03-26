export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.name || body.price === undefined) {
    throw createError({ statusCode: 400, message: '缺少必填欄位: name, price' })
  }

  const supabase = useServiceRoleClient()

  const { data, error } = await supabase
    .from('service_plans')
    .insert({
      plan_type: 'delivery',
      name: body.name,
      unit_price: body.price,
      is_active: body.enableStatus !== 'inactive',
    })
    .select('id, name, unit_price, is_active')
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      message: `新增運送方案失敗: ${error.message}`,
    })
  }

  return {
    id: data.id,
    name: data.name,
    price: data.unit_price,
    enableStatus: data.is_active ? 'active' : 'inactive',
  }
})

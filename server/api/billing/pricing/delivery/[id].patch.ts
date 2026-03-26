export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const supabase = useServiceRoleClient()

  const updates: Record<string, unknown> = {}
  if (body.name !== undefined)
    updates.name = body.name
  if (body.price !== undefined)
    updates.unit_price = body.price
  if (body.enableStatus !== undefined)
    updates.is_active = body.enableStatus === 'active'

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: '未提供任何更新欄位' })
  }

  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('service_plans')
    .update(updates)
    .eq('id', id)
    .eq('plan_type', 'delivery')
    .select('id, name, unit_price, is_active')
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      message: `更新運送方案失敗: ${error.message}`,
    })
  }

  return {
    id: data.id,
    name: data.name,
    price: data.unit_price,
    enableStatus: data.is_active ? 'active' : 'inactive',
  }
})

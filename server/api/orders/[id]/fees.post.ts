export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const id = getRouterParam(event, 'id')

  if (!id)
    throw createError({ statusCode: 400, message: '缺少訂單 ID' })

  const numericAttempt = Number.parseInt(id)
  let numericId: number
  if (!Number.isNaN(numericAttempt)) {
    numericId = numericAttempt
  }
  else {
    const { data: orderRow } = await supabase.from('orders').select('id').eq('order_number', id).single()
    if (!orderRow)
      throw createError({ statusCode: 404, message: '找不到此訂單' })
    numericId = orderRow.id
  }

  const body = await readBody(event)

  if (!Array.isArray(body.items) || body.items.length === 0)
    throw createError({ statusCode: 400, message: '缺少加值服務項目' })

  const rows = body.items.map((item: { name: string, unitPrice: number, quantity: number }) => ({
    order_id: numericId,
    item_type: 'addon',
    item_name: item.name,
    unit_price: item.unitPrice,
    quantity: item.quantity,
    subtotal: item.unitPrice * item.quantity,
  }))

  const { error } = await supabase.from('order_fees').insert(rows)
  if (error)
    throw createError({ statusCode: 500, message: `新增費用失敗: ${error.message}` })

  // 寫入修改紀錄
  const summary = body.items
    .map((item: { name: string, unitPrice: number, quantity: number }) => `${item.name} × ${item.quantity}`)
    .join('、')

  await supabase.from('order_history').insert({
    order_id: numericId,
    field_name: '加值服務',
    old_value: null,
    new_value: summary,
  })

  return { success: true }
})

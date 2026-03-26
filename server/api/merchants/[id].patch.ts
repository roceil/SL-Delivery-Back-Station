export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ unitPrice?: number, stockToAdd?: number, hasCollected?: boolean }>(event)
  const supabase = useServiceRoleClient()

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少商家 ID' })
  }

  const updates: Record<string, unknown> = {}

  if (body.unitPrice !== undefined) {
    updates.unit_price = body.unitPrice
  }

  if (body.stockToAdd !== undefined && body.stockToAdd > 0) {
    const { data: current, error: fetchError } = await supabase
      .from('merchants')
      .select('max_usage_counts, unit_price')
      .eq('id', id)
      .single()

    if (fetchError) {
      throw createError({ statusCode: 500, message: `查詢商家失敗: ${fetchError.message}` })
    }

    updates.max_usage_counts = (current.max_usage_counts ?? 0) + body.stockToAdd

    // 計算此次批次編號
    const { count } = await supabase
      .from('merchant_ticket_records')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', id)

    const unitPrice = body.unitPrice ?? current.unit_price ?? 0
    const quantity = body.stockToAdd
    const paymentStatus = body.hasCollected ? 'paid' : 'unpaid'

    const { error: recordError } = await supabase
      .from('merchant_ticket_records')
      .insert({
        merchant_id: Number(id),
        batch_number: (count ?? 0) + 1,
        quantity,
        unit_price: unitPrice,
        total: unitPrice * quantity,
        payment_status: paymentStatus,
        paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
      })

    if (recordError) {
      throw createError({ statusCode: 500, message: `建立給票紀錄失敗: ${recordError.message}` })
    }
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from('merchants')
      .update(updates)
      .eq('id', id)

    if (error) {
      throw createError({ statusCode: 500, message: `更新商家失敗: ${error.message}` })
    }
  }

  return { success: true }
})

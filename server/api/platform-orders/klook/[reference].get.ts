export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const reference = getRouterParam(event, 'reference')

  if (!reference) {
    throw createError({
      statusCode: 400,
      message: '缺少訂單參考編號',
    })
  }

  try {
    // 查詢 klook_orders 並關聯狀態表
    const { data: klookOrder, error } = await supabase
      .from('klook_orders')
      .select(`
        *,
        klook_status!inner(id, status, code)
      `)
      .eq('reseller_reference', reference)
      .single()

    if (error) {
      throw createError({
        statusCode: 404,
        message: '找不到對應的 Klook 訂單',
      })
    }

    // 計算剩餘可用數量
    const availableQuantity = klookOrder.quantity - klookOrder.use_quantity - klookOrder.cancel_quantity

    // 驗證訂單狀態
    // 可用狀態: 1=待確認(ON_HOLD), 2=已確認(CONFIRMED)
    const validStatuses = [1, 2]
    if (!validStatuses.includes(klookOrder.status)) {
      throw createError({
        statusCode: 400,
        message: `訂單狀態為「${klookOrder.klook_status.status}」,無法建立配送預約`,
      })
    }

    // 驗證剩餘數量
    if (availableQuantity <= 0) {
      throw createError({
        statusCode: 400,
        message: '此訂單已無剩餘可用數量',
      })
    }

    // 轉換為前端格式
    return {
      id: klookOrder.id,
      resellerReference: klookOrder.reseller_reference,
      status: klookOrder.status,
      statusText: klookOrder.klook_status.status,
      statusCode: klookOrder.klook_status.code,
      productId: klookOrder.product_id,
      departureDate: klookOrder.departure_date,
      quantity: klookOrder.quantity,
      useQuantity: klookOrder.use_quantity,
      cancelQuantity: klookOrder.cancel_quantity,
      availableQuantity,
      contacts: klookOrder.contacts,
      unitItems: klookOrder.unit_items,
      notes: klookOrder.notes,
      optionId: klookOrder.option_id,
      uuid: klookOrder.uuid,
      createdAt: klookOrder.created_at,
      updatedAt: klookOrder.updated_at,
    }
  }
  catch (err: any) {
    console.error('查詢 Klook 訂單失敗:', err)

    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      message: '查詢訂單失敗',
    })
  }
})

export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const voucherCode = getRouterParam(event, 'voucherCode')

  if (!voucherCode) {
    throw createError({
      statusCode: 400,
      message: '缺少憑證號碼',
    })
  }

  try {
    // 查詢 trip_orders 並關聯狀態表 (使用 vouchers 欄位查詢)
    const { data: tripOrder, error } = await supabase
      .from('trip_orders')
      .select(`
        *,
        trip_status!inner(id, status)
      `)
      .eq('vouchers', voucherCode)
      .single()

    if (error) {
      throw createError({
        statusCode: 404,
        message: '找不到對應的 Trip 訂單',
      })
    }

    // 計算剩餘可用數量
    const availableQuantity = tripOrder.quantity - tripOrder.use_quantity - tripOrder.cancel_quantity

    // 驗證訂單狀態
    // 可用狀態: 1=新訂待確認, 2=新訂已確認, 4=部份取消, 6=已取物品, 7=部份使用
    const validStatuses = [1, 2, 4, 6, 7]
    if (!validStatuses.includes(tripOrder.status)) {
      throw createError({
        statusCode: 400,
        message: `訂單狀態為「${tripOrder.trip_status.status}」,無法建立配送預約`,
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
      id: tripOrder.id,
      orderNumber: tripOrder.order_number,
      productId: tripOrder.product_id,
      status: tripOrder.status,
      statusText: tripOrder.trip_status.status,
      departureDate: tripOrder.departure_date,
      quantity: tripOrder.quantity,
      useQuantity: tripOrder.use_quantity,
      cancelQuantity: tripOrder.cancel_quantity,
      availableQuantity,
      contacts: tripOrder.contacts,
      vouchers: tripOrder.vouchers,
      itemId: tripOrder.item_id,
      sequenceId: tripOrder.sequence_id,
      createdAt: tripOrder.created_at,
      updatedAt: tripOrder.updated_at,
    }
  }
  catch (err: any) {
    console.error('查詢 Trip 訂單失敗:', err)

    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      message: '查詢訂單失敗',
    })
  }
})

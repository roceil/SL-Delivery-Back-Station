import { nanoid } from 'nanoid'

export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const body = await readBody(event)

  // 驗證必填欄位
  if (!body.deliveryDate || !body.luggageCount || !body.pickupLocationId || !body.deliveryLocationId) {
    throw createError({
      statusCode: 400,
      message: '缺少必填欄位',
    })
  }

  // 將地點 ID 轉換為整數
  const pickupLocationId = Number.parseInt(body.pickupLocationId)
  const deliveryLocationId = Number.parseInt(body.deliveryLocationId)

  if (Number.isNaN(pickupLocationId) || Number.isNaN(deliveryLocationId)) {
    throw createError({
      statusCode: 400,
      message: '無效的地點 ID',
    })
  }

  // 驗證地點是否存在
  const { data: stations, error: stationsError } = await supabase
    .from('stations')
    .select('id, name, address, area')
    .in('id', [pickupLocationId, deliveryLocationId])

  if (stationsError || !stations || stations.length !== 2) {
    throw createError({
      statusCode: 400,
      message: '無效的地點 ID',
    })
  }

  try {
    // 0. 處理 User（僅當有 lineUserId 時，表示來自 LIFF）
    let userId: number | null = null

    if (body.lineUserId) {
      // 查詢是否已存在該 LINE 使用者
      const { data: existingUser, error: userQueryError } = await supabase
        .from('users')
        .select('id, phone, email')
        .eq('line_user_id', body.lineUserId)
        .single()

      if (userQueryError && userQueryError.code !== 'PGRST116') {
        // PGRST116 = 找不到資料，這是預期的情況
        throw createError({
          statusCode: 500,
          message: `查詢使用者失敗: ${userQueryError.message}`,
        })
      }

      if (existingUser) {
        // 使用者已存在，取得 ID
        userId = existingUser.id

        // 如果有提供新的 phone 或 email，更新使用者資料
        const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
        if (body.phone && body.phone !== existingUser.phone)
          updateData.phone = body.phone
        if (body.email && body.email !== existingUser.email)
          updateData.email = body.email

        if (Object.keys(updateData).length > 1) {
          // 有資料需要更新
          const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)

          if (updateError) {
            console.error('更新使用者資料失敗:', updateError)
            // 不中斷流程，繼續建立訂單
          }
        }
      }
      else {
        // 使用者不存在，建立新使用者
        const { data: newUser, error: createUserError } = await supabase
          .from('users')
          .insert({
            line_user_id: body.lineUserId,
            display_name: body.displayName || body.lineName || '',
            phone: body.phone || null,
            email: body.email || null,
            member_level: 1,
          })
          .select('id')
          .single()

        if (createUserError || !newUser) {
          throw createError({
            statusCode: 500,
            message: `建立使用者失敗: ${createUserError?.message || '未知錯誤'}`,
          })
        }

        userId = newUser.id
      }
    }

    // 判斷是平台訂單還是散客訂單
    let platformType: number
    let platformId: string
    let orderCategory: string

    if (body.platformType && body.platformOrderId) {
      // 平台訂單流程（三層）：建立 net_orders → orders
      const platformTypeMap: Record<string, number> = {
        trip: 1,
        klook: 2,
      }

      const sourcePlatformType = platformTypeMap[body.platformType]
      if (!sourcePlatformType) {
        throw createError({
          statusCode: 400,
          message: '無效的平台類型',
        })
      }

      // 1. 建立 net_orders（第二層）
      const { data: netOrder, error: netError } = await supabase
        .from('net_orders')
        .insert({
          status: 1, // 待確認
          platform_type: sourcePlatformType, // 1=Trip, 2=Klook
          platform_id: body.platformOrderId, // trip_orders.id 或 klook_orders.id
          product_id: 1, // 假設使用第一個產品
          departure_date: body.deliveryDate,
          receive_time: body.pickupTime, // 收貨時間
          quantity: body.luggageCount,
          contacts: {
            name: body.lineName || body.displayName || '',
            phone: body.phone || '',
          },
        })
        .select('id')
        .single()

      if (netError || !netOrder) {
        throw createError({
          statusCode: 500,
          message: `建立同業訂單明細失敗: ${netError?.message || '未知錯誤'}`,
        })
      }

      platformType = 3 // Net
      platformId = netOrder.id.toString()
      orderCategory = body.platformType === 'trip' ? 'Trip' : 'Klook'
    }
    else {
      // 散客訂單流程（兩層）：建立 normal_orders → orders
      // 1. 建立 normal_orders（第二層）
      const { data: normalOrder, error: normalError } = await supabase
        .from('normal_orders')
        .insert({
          status: 1, // 待確認
          product_id: 1, // 假設使用第一個產品（小琉球行李運送）
          departure_date: body.deliveryDate,
          receive_time: body.pickupTime,
          quantity: body.luggageCount,
          contacts: {
            name: body.lineName || body.displayName || '',
            phone: body.phone || '',
          },
        })
        .select('id')
        .single()

      if (normalError || !normalOrder) {
        throw createError({
          statusCode: 500,
          message: `建立訂單明細失敗: ${normalError?.message || '未知錯誤'}`,
        })
      }

      platformType = 4 // Normal
      platformId = normalOrder.id.toString()
      orderCategory = '散客'
    }

    // 2. 建立 orders（第一層）
    const orderNumber = await generateOrderNumber(supabase)

    // 以 servicePlan key 判斷是否為雙程，決定是否建立回程任務
    const isRoundTrip = body.servicePlan === 'round_trip'

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        platform_type: platformType,
        platform_id: platformId,
        user_id: userId,
        order_number: orderNumber,
        voucher_id: nanoid(10),
        start_point: pickupLocationId,
        end_point: deliveryLocationId,
        status: 1, // pending 待確認
        service_plan: body.servicePlan || null,
        payment_status: 'unpaid',
        luggage_count: body.luggageCount,
        recipient_name: body.recipientName || null,
        recipient_phone: body.recipientPhone || null,
        notes: body.notes || '',
        is_round_trip: isRoundTrip,
      })
      .select(`
        id,
        platform_id,
        user_id,
        order_number,
        voucher_id,
        status,
        notes,
        created_at,
        updated_at,
        start_point:stations!orders_start_point_fkey (
          id,
          name,
          address,
          area
        ),
        end_point:stations!orders_end_point_fkey (
          id,
          name,
          address,
          area
        ),
        order_status:orders_status (
          status
        )
      `)
      .single()

    if (orderError || !order) {
      // 如果建立 orders 失敗，刪除已建立的第二層訂單
      if (platformType === 3) {
        await supabase.from('net_orders').delete().eq('id', Number.parseInt(platformId))
      }
      else {
        await supabase.from('normal_orders').delete().eq('id', Number.parseInt(platformId))
      }

      throw createError({
        statusCode: 500,
        message: `建立訂單失敗: ${orderError?.message || '未知錯誤'}`,
      })
    }

    // 3. 建立任務（order_tasks）
    const tasksToInsert: Array<{
      order_id: number
      leg: string
      status: number
      start_point: number
      end_point: number
      task_date: string | null
    }> = [
      {
        order_id: order.id,
        leg: 'outbound',
        status: 1, // pending
        start_point: pickupLocationId,
        end_point: deliveryLocationId,
        task_date: body.deliveryDate,
      },
    ]

    if (isRoundTrip) {
      tasksToInsert.push({
        order_id: order.id,
        leg: 'inbound',
        status: 1, // pending
        start_point: deliveryLocationId,
        end_point: pickupLocationId,
        task_date: body.returnDate,
      })
    }

    const { error: tasksError } = await supabase.from('order_tasks').insert(tasksToInsert)
    if (tasksError) {
      console.error('建立訂單任務失敗:', tasksError)
    }

    // 4. 建立費用明細
    const feeRows: Array<{
      order_id: number
      item_type: string
      item_name: string
      unit_price: number
      quantity: number
      subtotal: number
    }> = []

    // 服務方案費用（非商家代售）
    if (body.servicePlan && body.servicePlan !== 'merchant') {
      const { data: deliveryPlans } = await supabase
        .from('service_plans')
        .select('name, unit_price')
        .eq('plan_type', 'delivery')
        .order('id', { ascending: true })

      const planIndex = body.servicePlan === 'round_trip' ? 0 : 1
      const plan = deliveryPlans?.[planIndex]

      if (plan) {
        feeRows.push({
          order_id: order.id,
          item_type: 'plan',
          item_name: plan.name,
          unit_price: plan.unit_price,
          quantity: body.luggageCount,
          subtotal: plan.unit_price * body.luggageCount,
        })
      }
    }

    // 加值服務費用
    if (Array.isArray(body.addonItems)) {
      for (const addon of body.addonItems) {
        if (addon.count > 0) {
          feeRows.push({
            order_id: order.id,
            item_type: 'addon',
            item_name: addon.name,
            unit_price: addon.unitPrice,
            quantity: addon.count,
            subtotal: addon.unitPrice * addon.count,
          })
        }
      }
    }

    if (feeRows.length > 0) {
      const { error: feesError } = await supabase.from('order_fees').insert(feeRows)
      if (feesError) {
        console.error('建立費用明細失敗:', feesError)
      }
    }

    // 5. 商家代售：扣除票券數量（used_counts += luggageCount）
    if (body.merchantStore && body.luggageCount) {
      const merchantId = Number.parseInt(body.merchantStore)
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('used_counts')
        .eq('id', merchantId)
        .single()

      if (merchantData) {
        const { error: merchantUpdateError } = await supabase
          .from('merchants')
          .update({ used_counts: merchantData.used_counts + body.luggageCount })
          .eq('id', merchantId)

        if (merchantUpdateError) {
          console.error('更新商家票券數量失敗:', merchantUpdateError)
        }
      }
    }

    // 返回完整的訂單資料
    const orderStatus = Array.isArray(order.order_status) ? order.order_status[0] : order.order_status
    const startPoint = Array.isArray(order.start_point) ? order.start_point[0] : order.start_point
    const endPoint = Array.isArray(order.end_point) ? order.end_point[0] : order.end_point

    return {
      id: order.order_number ?? order.id.toString(),
      voucherId: order.voucher_id,
      userId: order.user_id,
      category: orderCategory,
      lineName: body.lineName || body.displayName || '未提供',
      phone: body.phone || '未提供',
      deliveryDate: body.deliveryDate,
      returnDate: body.returnDate || null,
      pickupTime: body.pickupTime,
      luggageCount: body.luggageCount,
      servicePlan: body.servicePlan || null,
      paymentStatus: 'unpaid',
      recipientName: body.recipientName || null,
      recipientPhone: body.recipientPhone || null,
      status: orderStatus?.status || 'pending',
      scheduleId: null,
      pickupLocation: {
        id: startPoint?.id?.toString() || '',
        name: startPoint?.name || '',
        address: startPoint?.address || '',
        area: startPoint?.area || '',
      },
      deliveryLocation: {
        id: endPoint?.id?.toString() || '',
        name: endPoint?.name || '',
        address: endPoint?.address || '',
        area: endPoint?.area || '',
      },
      notes: order.notes || '',
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }
  }
  catch (error) {
    console.error('建立訂單錯誤:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : '建立訂單失敗',
    })
  }
})

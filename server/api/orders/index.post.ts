export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 驗證必填欄位
  if (!body.lineName || !body.phone || !body.deliveryDate || !body.pickupTime || !body.luggageCount || !body.pickupLocationId || !body.deliveryLocationId) {
    throw createError({
      statusCode: 400,
      message: '缺少必填欄位',
    })
  }

  // 獲取地點資訊
  const deliveryPoints = [
    {
      id: 'donggang-pier',
      name: '東港碼頭',
      address: '屏東縣東港鎮朝安里朝隆路43-5號',
      area: 'A',
    },
    {
      id: 'baisha-pier',
      name: '白沙尾港',
      address: '屏東縣琉球鄉白沙尾觀光港',
      area: 'A',
    },
    {
      id: 'hostel-beachfront',
      name: '海景民宿',
      address: '屏東縣琉球鄉忠孝路18號',
      area: 'C',
    },
    {
      id: 'hostel-coral',
      name: '珊瑚礁民宿',
      address: '屏東縣琉球鄉和平路56號',
      area: 'C',
    },
    {
      id: 'dive-shop-ocean',
      name: '小琉球海洋潛水',
      address: '屏東縣琉球鄉中山路156號',
      area: 'B',
    },
    {
      id: 'dive-shop-blue',
      name: '小琉球藍海潛水',
      address: '屏東縣琉球鄉三民路85號',
      area: 'B',
    },
    {
      id: 'beauty-cave',
      name: '美人洞風景區',
      address: '屏東縣琉球鄉環島公路美人洞',
      area: 'D',
    },
  ]

  const pickupLocation = deliveryPoints.find(p => p.id === body.pickupLocationId)
  const deliveryLocation = deliveryPoints.find(p => p.id === body.deliveryLocationId)

  if (!pickupLocation || !deliveryLocation) {
    throw createError({
      statusCode: 400,
      message: '無效的地點 ID',
    })
  }

  // 建立新訂單（實際應該儲存到資料庫）
  const newOrder = {
    id: `order${Date.now()}`,
    lineName: body.lineName,
    phone: body.phone,
    deliveryDate: body.deliveryDate,
    pickupTime: body.pickupTime,
    luggageCount: body.luggageCount,
    status: 'pending' as const,
    pickupLocation: {
      id: pickupLocation.id,
      name: pickupLocation.name,
      address: pickupLocation.address,
      area: pickupLocation.area,
    },
    deliveryLocation: {
      id: deliveryLocation.id,
      name: deliveryLocation.name,
      address: deliveryLocation.address,
      area: deliveryLocation.area,
    },
    notes: body.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return newOrder
})

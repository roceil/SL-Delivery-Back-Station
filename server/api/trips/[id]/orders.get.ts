export default defineEventHandler(async (event) => {
  const tripId = getRouterParam(event, 'id')

  // 獲取行程資料（實際應該從資料庫查詢）
  const mockTrips = [
    {
      id: 'trip1',
      orderIds: ['order2', 'order3'],
    },
  ]

  const trip = mockTrips.find(t => t.id === tripId)

  if (!trip) {
    throw createError({
      statusCode: 404,
      message: '找不到該行程',
    })
  }

  // 獲取所有訂單資料（實際應該從資料庫查詢）
  const mockOrders = [
    {
      id: 'order2',
      lineName: '李小華',
      phone: '0923-456-789',
      deliveryDate: '2026-01-07',
      pickupTime: '10:00',
      luggageCount: 1,
      status: 'confirmed',
      pickupLocation: {
        id: 'baisha-pier',
        name: '白沙尾港',
        address: '屏東縣琉球鄉白沙尾觀光港',
        area: 'A',
      },
      deliveryLocation: {
        id: 'dive-shop-ocean',
        name: '小琉球海洋潛水',
        address: '屏東縣琉球鄉中山路156號',
        area: 'B',
      },
      notes: '請小心輕放',
      createdAt: '2026-01-07T11:20:00Z',
    },
    {
      id: 'order3',
      lineName: '張小美',
      phone: '0934-567-890',
      deliveryDate: '2026-01-07',
      pickupTime: '16:00',
      luggageCount: 3,
      status: 'confirmed',
      pickupLocation: {
        id: 'donggang-pier',
        name: '東港碼頭',
        address: '屏東縣東港鎮朝安里朝隆路43-5號',
        area: 'A',
      },
      deliveryLocation: {
        id: 'hostel-coral',
        name: '珊瑚礁民宿',
        address: '屏東縣琉球鄉和平路56號',
        area: 'C',
      },
      notes: '',
      createdAt: '2026-01-06T15:45:00Z',
    },
  ]

  // 根據 orderIds 篩選訂單
  const tripOrders = mockOrders.filter(order => trip.orderIds.includes(order.id))

  return tripOrders
})

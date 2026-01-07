export default defineEventHandler(async (_event) => {
  // Mock 訂單資料
  const mockOrders = [
    {
      id: 'order2',
      luggageCount: 1,
      deliveryLocation: { area: 'B' },
    },
    {
      id: 'order3',
      luggageCount: 3,
      deliveryLocation: { area: 'C' },
    },
    {
      id: 'order4',
      luggageCount: 2,
      deliveryLocation: { area: 'D' },
    },
    {
      id: 'order5',
      luggageCount: 1,
      deliveryLocation: { area: 'C' },
    },
  ]

  const mockTrips = [
    {
      id: 'trip1',
      name: '2026-01-07-10-30',
      description: '小琉球行李運送 - 區域 B, C',
      courierId: 'courier1',
      orderIds: ['order2', 'order3'],
      scheduledDate: '2026-01-07',
      status: 'dispatched',
      createdAt: '2026-01-07T10:30:00Z',
      dispatchedAt: '2026-01-07T11:00:00Z',
      completedAt: null,
      // @ts-expect-error - process is available in Nitro runtime
      trackingUrl: `${process.env.APP_URL || 'http://localhost:3000'}/trips/track/trip1`,
    },
    {
      id: 'trip2',
      name: '2026-01-07-14-15',
      description: '小琉球行李運送 - 區域 C, D',
      courierId: 'courier2',
      orderIds: ['order4', 'order5'],
      scheduledDate: '2026-01-07',
      status: 'completed',
      createdAt: '2026-01-07T14:15:00Z',
      dispatchedAt: '2026-01-07T14:30:00Z',
      completedAt: '2026-01-07T17:20:00Z',
      // @ts-expect-error - process is available in Nitro runtime
      trackingUrl: `${process.env.APP_URL || 'http://localhost:3000'}/trips/track/trip2`,
    },
    {
      id: 'trip3',
      name: '2026-01-08-09-00',
      description: '小琉球行李運送 - 區域 B',
      courierId: 'courier3',
      orderIds: [],
      scheduledDate: '2026-01-08',
      status: 'pending',
      createdAt: '2026-01-07T16:00:00Z',
      dispatchedAt: null,
      completedAt: null,
      trackingUrl: null,
    },
  ]

  // 為每個行程添加統計資訊
  const tripsWithStats = mockTrips.map((trip) => {
    const tripOrders = mockOrders.filter(order => trip.orderIds.includes(order.id))

    // 計算總行李數
    const totalLuggage = tripOrders.reduce((sum, order) => sum + order.luggageCount, 0)

    // 獲取所有區域（去重）
    const areas = [...new Set(tripOrders.map(order => order.deliveryLocation.area))].sort()

    return {
      ...trip,
      orderCount: trip.orderIds.length,
      totalLuggage,
      areas,
    }
  })

  return tripsWithStats
})

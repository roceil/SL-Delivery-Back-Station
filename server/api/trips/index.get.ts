export default defineEventHandler(async (event) => {
  const mockTrips = [
    {
      id: 'trip1',
      name: '台北-台中路線',
      description: '3C產品配送',
      courierId: 'courier1',
      itemIds: ['item2'],
      scheduledDate: '2024-01-20',
      status: 'dispatched',
      createdAt: '2024-01-15T08:00:00Z',
      dispatchedAt: '2024-01-16T09:00:00Z',
      completedAt: null,
      trackingUrl: `${process.env.APP_URL || 'http://localhost:3000'}/trips/track/trip1`,
    },
    {
      id: 'trip2',
      name: '桃園-新竹路線',
      description: '書籍配送',
      courierId: 'courier2',
      itemIds: ['item3'],
      scheduledDate: '2024-01-18',
      status: 'completed',
      createdAt: '2024-01-13T10:00:00Z',
      dispatchedAt: '2024-01-14T08:30:00Z',
      completedAt: '2024-01-18T16:20:00Z',
      trackingUrl: `${process.env.APP_URL || 'http://localhost:3000'}/trips/track/trip2`,
    },
    {
      id: 'trip3',
      name: '高雄市區配送',
      description: '多點配送路線',
      courierId: 'courier3',
      itemIds: ['item6', 'item7'],
      scheduledDate: '2024-01-22',
      status: 'pending',
      createdAt: '2024-01-16T14:30:00Z',
      dispatchedAt: null,
      completedAt: null,
      trackingUrl: null,
    },
  ]

  return mockTrips
})

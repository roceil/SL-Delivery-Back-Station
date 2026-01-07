export default defineEventHandler(async (event) => {
  const tripId = getRouterParam(event, 'id')

  const mockTrip = {
    id: tripId,
    name: '台北-台中路線',
    description: '3C產品配送',
    courierId: 'courier1',
    itemIds: ['item1', 'item4'],
    scheduledDate: '2024-01-20',
    status: 'dispatched',
    createdAt: '2024-01-15T08:00:00Z',
    dispatchedAt: '2024-01-16T09:00:00Z',
    completedAt: null,
    trackingUrl: `${process.env.APP_URL || 'http://localhost:3000'}/trips/track/${tripId}`,
  }

  return mockTrip
})

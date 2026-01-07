export default defineEventHandler(async (_event) => {
  const mockStats = {
    totalItems: 156,
    pendingItems: 23,
    inTransitItems: 18,
    totalRevenue: 125600,
  }

  return mockStats
})

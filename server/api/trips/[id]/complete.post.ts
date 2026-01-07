export default defineEventHandler(async (event) => {
  const tripId = getRouterParam(event, 'id')

  return {
    success: true,
    data: {
      id: tripId,
      status: 'completed',
      completedAt: new Date().toISOString(),
    },
  }
})

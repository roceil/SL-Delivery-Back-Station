export default defineEventHandler(async (event) => {
  const tripId = getRouterParam(event, 'id')

  return {
    success: true,
    data: {
      id: tripId,
      status: 'dispatched',
      dispatchedAt: new Date().toISOString(),
      // @ts-expect-error - process is available in Nitro runtime
      trackingUrl: `${process.env.APP_URL || 'http://localhost:3000'}/trips/track/${tripId}`,
    },
  }
})

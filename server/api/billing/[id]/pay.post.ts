export default defineEventHandler(async (event) => {
  const billingId = getRouterParam(event, 'id')

  return {
    success: true,
    data: {
      id: billingId,
      status: 'paid',
      paidAt: new Date().toISOString(),
    },
  }
})

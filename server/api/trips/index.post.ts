export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const newTrip = {
    id: Math.random().toString(36).substr(2, 9),
    name: body.name,
    description: body.description,
    courierId: body.courierId,
    itemIds: body.selectedItems,
    scheduledDate: body.scheduledDate,
    status: 'pending',
    createdAt: new Date().toISOString(),
    dispatchedAt: null,
    completedAt: null,
    trackingUrl: null,
  }

  return {
    success: true,
    data: newTrip,
  }
})

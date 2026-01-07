export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required',
    })
  }

  // 模擬收件地詳情
  const deliveryPoint = {
    id,
    name: '台北車站門市',
    type: '7-11',
    storeId: 'TW001',
    address: '台北市中正區北平西路3號1樓',
    phone: '02-2312-1234',
    openHours: '06:00-24:00',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
  }

  return deliveryPoint
})

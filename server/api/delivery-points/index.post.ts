export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // 模擬新增收件地
  const newDeliveryPoint = {
    id: Date.now().toString(),
    name: body.name,
    type: body.type,
    storeId: body.storeId,
    address: body.address,
    phone: body.phone,
    openHours: body.openHours,
    status: body.status || 'active',
    createdAt: new Date().toISOString(),
  }
  
  return {
    success: true,
    data: newDeliveryPoint,
    message: '收件地新增成功',
  }
})
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const newMerchant = {
    id: Math.random().toString(36).substr(2, 9),
    name: body.name,
    phone: body.phone,
    address: body.address,
    type: body.type,
    createdAt: new Date().toISOString(),
  }

  return {
    success: true,
    data: newMerchant,
  }
})

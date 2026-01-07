export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const newItem = {
    id: Math.random().toString(36).substr(2, 9),
    name: body.name,
    description: body.description,
    dimensions: {
      length: Number.parseFloat(body.length),
      width: Number.parseFloat(body.width),
      height: Number.parseFloat(body.height),
    },
    weight: Number.parseFloat(body.weight),
    senderAddress: body.senderAddress,
    receiverAddress: body.receiverAddress,
    merchantId: body.merchantId,
    customMerchant: body.isCustomMerchant ? body.customMerchant : null,
    status: 'pending',
    createdAt: new Date().toISOString(),
    tripId: null,
  }

  return {
    success: true,
    data: newItem,
  }
})

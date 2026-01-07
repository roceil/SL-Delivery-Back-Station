export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  // In a real application, this would update the database
  // For now, we'll just validate and return the updated merchant

  const updatedMerchant = {
    id,
    name: body.name,
    address: body.address,
    type: body.type,
    area: body.area,
    phone: body.phone,
    openingHours: body.openingHours,
    description: body.description,
    features: body.features || [],
    notes: body.notes || '',
    partnerSince: body.partnerSince,
    voucherStock: body.voucherStock,
  }

  // TODO: Update in database
  // Validate that the merchant exists before updating

  return updatedMerchant
})

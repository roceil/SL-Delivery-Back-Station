export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const id = getRouterParam(event, 'id')
  const query = getQuery(event)
  const year = query.year ? Number(query.year) : null
  const month = query.month ? Number(query.month) : null

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少商家 ID' })
  }

  let dbQuery = supabase
    .from('merchant_ticket_records')
    .select('id, batch_number, quantity, unit_price, total, payment_status, issued_at, paid_at')
    .eq('merchant_id', id)
    .order('issued_at', { ascending: false })

  if (year && month) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = new Date(year, month, 0).toISOString().slice(0, 10)
    dbQuery = dbQuery.gte('issued_at', start).lte('issued_at', end)
  }

  const { data, error } = await dbQuery

  if (error) {
    throw createError({ statusCode: 500, message: `查詢給票紀錄失敗: ${error.message}` })
  }

  return (data ?? []).map(r => ({
    id: r.id,
    batchNumber: r.batch_number,
    quantity: r.quantity,
    unitPrice: r.unit_price,
    total: r.total,
    paymentStatus: r.payment_status as 'paid' | 'unpaid',
    issuedAt: r.issued_at,
    paidAt: r.paid_at,
  }))
})

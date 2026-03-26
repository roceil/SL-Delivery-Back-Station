function buildDatePrefix(date: Date): string {
  const yy = date.getFullYear().toString().slice(2)
  const mm = (date.getMonth() + 1).toString().padStart(2, '0')
  const dd = date.getDate().toString().padStart(2, '0')
  return `LQP${yy}${mm}${dd}`
}

export async function generateOrderNumber(
  supabase: ReturnType<typeof useServiceRoleClient>,
  date: Date = new Date(),
): Promise<string> {
  const prefix = buildDatePrefix(date)

  // 查詢今日已有幾筆，取下一個序號
  const { count } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .like('order_number', `${prefix}%`)

  const seq = ((count ?? 0) + 1).toString().padStart(3, '0')
  return `${prefix}${seq}`
}

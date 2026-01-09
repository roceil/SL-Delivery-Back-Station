export default defineEventHandler(async (_event) => {
  const supabase = useServiceRoleClient()

  // 取得所有以 C 開頭的員工編號
  const { data, error } = await supabase
    .from('couriers')
    .select('employee_number')
    .like('employee_number', 'C%')
    .order('employee_number', { ascending: false })
    .limit(1)

  if (error) {
    throw createError({
      statusCode: 500,
      message: `取得員工編號失敗: ${error.message}`,
    })
  }

  // 如果沒有任何員工編號，從 C001 開始
  if (!data || data.length === 0 || !data[0]?.employee_number) {
    return { employeeNumber: 'C001' }
  }

  // 解析最後一個員工編號
  const lastNumber = data[0].employee_number
  const match = lastNumber?.match(/^C(\d+)$/)

  if (!match) {
    // 如果格式不符，從 C001 開始
    return { employeeNumber: 'C001' }
  }

  // 產生下一個編號
  const nextNumber = Number.parseInt(match[1], 10) + 1
  const nextEmployeeNumber = `C${nextNumber.toString().padStart(3, '0')}`

  return { employeeNumber: nextEmployeeNumber }
})

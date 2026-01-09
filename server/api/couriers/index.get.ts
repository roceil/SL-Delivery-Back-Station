export default defineEventHandler(async (_event) => {
  const supabase = useServiceRoleClient()

  // 從 couriers 表取得所有夥伴，並 join couriers_status 取得狀態名稱
  const { data, error } = await supabase
    .from('couriers')
    .select(`
      id,
      employee_number,
      name,
      phone,
      status,
      is_available,
      total_deliveries,
      hire_date,
      created_at,
      updated_at,
      couriers_status (
        status,
        explanation
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      message: `取得夥伴失敗: ${error.message}`,
    })
  }

  // 轉換資料格式以符合前端需求
  return data.map((courier) => {
    const courierStatus = Array.isArray(courier.couriers_status) ? courier.couriers_status[0] : courier.couriers_status

    return {
      id: courier.id,
      employeeNumber: courier.employee_number,
      name: courier.name,
      phone: courier.phone,
      statusId: courier.status,
      status: courierStatus?.status || '未設定',
      statusExplanation: courierStatus?.explanation || '',
      isAvailable: courier.is_available,
      totalDeliveries: courier.total_deliveries,
      hireDate: courier.hire_date,
      createdAt: courier.created_at,
      updatedAt: courier.updated_at,
    }
  })
})

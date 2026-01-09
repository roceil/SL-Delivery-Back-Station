export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const supabase = useServiceRoleClient()

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少夥伴 ID',
    })
  }

  // 從 couriers 表取得單一夥伴資料
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
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw createError({
        statusCode: 404,
        message: '找不到此夥伴',
      })
    }
    throw createError({
      statusCode: 500,
      message: `取得夥伴失敗: ${error.message}`,
    })
  }

  // 轉換資料格式
  const courierStatus = Array.isArray(data.couriers_status) ? data.couriers_status[0] : data.couriers_status

  return {
    id: data.id,
    employeeNumber: data.employee_number,
    name: data.name,
    phone: data.phone,
    statusId: data.status,
    status: courierStatus?.status || '未設定',
    statusExplanation: courierStatus?.explanation || '',
    isAvailable: data.is_available,
    totalDeliveries: data.total_deliveries,
    hireDate: data.hire_date,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
})

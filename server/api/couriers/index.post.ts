export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const supabase = useServiceRoleClient()

  // 驗證必填欄位
  if (!body.name) {
    throw createError({
      statusCode: 400,
      message: '姓名為必填欄位',
    })
  }

  // 新增到 couriers 表
  const { data, error } = await supabase
    .from('couriers')
    .insert({
      employee_number: body.employeeNumber || null,
      name: body.name,
      phone: body.phone || null,
      status: body.status || 1, // 預設為雇用中
      is_available: body.isAvailable !== undefined ? body.isAvailable : true,
      hire_date: body.hireDate || null,
    })
    .select()
    .single()

  if (error) {
    // 處理員工編號重複的錯誤
    if (error.code === '23505' && error.message.includes('employee_number')) {
      throw createError({
        statusCode: 409,
        message: '員工編號已存在，請使用其他編號',
      })
    }

    throw createError({
      statusCode: 500,
      message: `新增夥伴失敗: ${error.message}`,
    })
  }

  return {
    success: true,
    data,
    message: '夥伴新增成功',
  }
})

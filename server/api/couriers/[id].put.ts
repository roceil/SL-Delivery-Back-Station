export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const supabase = useServiceRoleClient()

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少夥伴 ID',
    })
  }

  // 驗證必填欄位
  if (!body.name) {
    throw createError({
      statusCode: 400,
      message: '姓名為必填欄位',
    })
  }

  // 更新 couriers 表
  const { data, error } = await supabase
    .from('couriers')
    .update({
      employee_number: body.employeeNumber || null,
      name: body.name,
      phone: body.phone || null,
      status: body.status || null,
      is_available: body.isAvailable !== undefined ? body.isAvailable : true,
      hire_date: body.hireDate || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw createError({
        statusCode: 404,
        message: '找不到此夥伴',
      })
    }

    // 處理員工編號重複的錯誤
    if (error.code === '23505' && error.message.includes('employee_number')) {
      throw createError({
        statusCode: 409,
        message: '員工編號已存在，請使用其他編號',
      })
    }

    throw createError({
      statusCode: 500,
      message: `更新夥伴失敗: ${error.message}`,
    })
  }

  return {
    success: true,
    data,
    message: '夥伴更新成功',
  }
})

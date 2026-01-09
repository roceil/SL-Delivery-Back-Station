export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const lineUserId = getRouterParam(event, 'lineUserId')
  const body = await readBody(event)

  if (!lineUserId) {
    throw createError({
      statusCode: 400,
      message: '缺少 LINE 使用者 ID',
    })
  }

  try {
    // 先查詢使用者是否存在
    const { data: existingUser, error: queryError } = await supabase
      .from('users')
      .select('id')
      .eq('line_user_id', lineUserId)
      .single()

    if (queryError) {
      if (queryError.code === 'PGRST116') {
        throw createError({
          statusCode: 404,
          message: '使用者不存在',
        })
      }

      throw createError({
        statusCode: 500,
        message: `查詢使用者失敗: ${queryError.message}`,
      })
    }

    // 準備更新資料（只更新提供的欄位）
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (body.phone !== undefined)
      updateData.phone = body.phone || null
    if (body.email !== undefined)
      updateData.email = body.email || null

    // 更新使用者資料
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('line_user_id', lineUserId)
      .select('id, line_user_id, display_name, phone, email, member_level, created_at, updated_at')
      .single()

    if (updateError || !updatedUser) {
      throw createError({
        statusCode: 500,
        message: `更新使用者失敗: ${updateError?.message || '未知錯誤'}`,
      })
    }

    return {
      userId: updatedUser.id,
      lineUserId: updatedUser.line_user_id,
      displayName: updatedUser.display_name,
      phone: updatedUser.phone,
      email: updatedUser.email,
      memberLevel: updatedUser.member_level,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at,
    }
  }
  catch (error) {
    console.error('更新使用者錯誤:', error)

    // 如果是已經處理過的錯誤，直接拋出
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    // 其他錯誤
    throw createError({
      statusCode: 500,
      message: '更新使用者失敗',
    })
  }
})

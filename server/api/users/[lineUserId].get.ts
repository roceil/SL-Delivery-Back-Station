export default defineEventHandler(async (event) => {
  const supabase = useServiceRoleClient()
  const lineUserId = getRouterParam(event, 'lineUserId')

  if (!lineUserId) {
    throw createError({
      statusCode: 400,
      message: '缺少 LINE 使用者 ID',
    })
  }

  try {
    // 查詢使用者資料
    const { data: user, error } = await supabase
      .from('users')
      .select('id, line_user_id, display_name, phone, email, member_level, created_at, updated_at')
      .eq('line_user_id', lineUserId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 使用者不存在
        throw createError({
          statusCode: 404,
          message: '使用者不存在',
        })
      }

      throw createError({
        statusCode: 500,
        message: `查詢使用者失敗: ${error.message}`,
      })
    }

    return {
      userId: user.id,
      lineUserId: user.line_user_id,
      displayName: user.display_name,
      phone: user.phone,
      email: user.email,
      memberLevel: user.member_level,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }
  }
  catch (error) {
    console.error('查詢使用者錯誤:', error)

    // 如果是已經處理過的錯誤，直接拋出
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    // 其他錯誤
    throw createError({
      statusCode: 500,
      message: '查詢使用者失敗',
    })
  }
})

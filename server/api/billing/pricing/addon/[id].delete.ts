export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const supabase = useServiceRoleClient()

  const { error } = await supabase
    .from('service_plans')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('plan_type', 'addon')

  if (error) {
    throw createError({
      statusCode: 500,
      message: `停用加值服務失敗: ${error.message}`,
    })
  }

  return { success: true }
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required',
    })
  }

  // 模擬刪除收件地
  return {
    success: true,
    message: '收件地刪除成功',
  }
})

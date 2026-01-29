// 列印 API - 代理到獨立列印服務
const PRINT_SERVICE_URL = 'http://localhost:9100'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  try {
    // 轉發請求到獨立列印服務
    const response = await $fetch(`${PRINT_SERVICE_URL}/api/print`, {
      method: 'POST',
      body,
    })

    return response
  }
  catch (error: any) {
    logger.error('轉發列印請求失敗', { error: error.message })
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '列印服務連線失敗',
    })
  }
})

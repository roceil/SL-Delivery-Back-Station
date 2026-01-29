// 健康檢查 API - 代理到獨立列印服務
const PRINT_SERVICE_URL = 'http://localhost:9100'

export default defineEventHandler(async () => {
  try {
    // 轉發請求到獨立列印服務
    const response = await $fetch(`${PRINT_SERVICE_URL}/api/print/health`)

    return response
  }
  catch (error: any) {
    throw createError({
      statusCode: 503,
      message: '列印服務未啟動',
    })
  }
})

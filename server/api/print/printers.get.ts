// 印表機列表 API - 代理到獨立列印服務
const PRINT_SERVICE_URL = 'http://localhost:9100'

export default defineEventHandler(async () => {
  try {
    // 轉發請求到獨立列印服務
    const response = await $fetch(`${PRINT_SERVICE_URL}/api/print/printers`)

    return response
  }
  catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '無法獲取印表機列表',
    })
  }
})

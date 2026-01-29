// ⚠️ 此 API 已廢棄
// 列印功能已改為前端直接連接本地列印服務 (localhost:9100)
// Cloud Run 無法訪問用戶本地的印表機，因此此代理 API 無法正常工作
//
// 如果未來需要恢復此功能，請考慮：
// 1. 使用 WebSocket 讓用戶機器上的服務主動連接 Cloud Run
// 2. 或使用完全本地部署的方案

export default defineEventHandler(async () => {
  throw createError({
    statusCode: 410,
    message: '此 API 已廢棄。列印功能請確保本地列印服務 (localhost:9100) 正在運行。',
  })
})

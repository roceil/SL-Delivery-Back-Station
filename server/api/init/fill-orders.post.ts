import { google } from 'googleapis'

export default defineEventHandler(async (_event) => {
  const config = useRuntimeConfig()

  if (!config.googleServiceAccountEmail || !config.googlePrivateKey || !config.googleSheetsId) {
    throw createError({
      statusCode: 500,
      message: '缺少 Google Sheets 設定',
    })
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.googleServiceAccountEmail,
        private_key: config.googlePrivateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    // 讀取現有的 Orders 資料
    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId: config.googleSheetsId,
      range: 'Orders!A2:K5',
    })

    const existingRows = currentData.data.values || []

    // 為每筆訂單補充新欄位的資料
    // 欄位順序：id, platformType, platformId, userId, merchantId, voucherId, scanCounts, startPoint, endPoint, created_at, updated_at,
    //          scheduleId, deliveryDate, deliveryTime, luggageCount, status, notes
    const updatedRows = existingRows.map((row, index) => {
      const orderId = row[0]
      const scheduleId = index < 2 ? '1' : 'null' // 前 2 筆訂單分配到行程 1，後面的訂單未分配
      const deliveryDate = '2026-01-09'
      const deliveryTime = index === 0 ? '09:00' : index === 1 ? '10:30' : index === 2 ? '14:00' : '15:30'
      const luggageCount = String(Math.floor(Math.random() * 3) + 1) // 1-3 件行李
      const status = scheduleId !== 'null' ? '3' : '2' // 3=已分配行程, 2=已確認
      const notes = index === 3 ? '請小心搬運' : ''

      // 補充原有的 11 個欄位 + 新增的 6 個欄位
      return [
        ...row, // 原有資料
        scheduleId,
        deliveryDate,
        deliveryTime,
        luggageCount,
        status,
        notes,
      ]
    })

    // 更新 Orders 資料
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.googleSheetsId,
      range: 'Orders!A2:Q5',
      valueInputOption: 'RAW',
      requestBody: {
        values: updatedRows,
      },
    })

    return {
      success: true,
      message: '成功填充 Orders 測試資料',
      rowsUpdated: updatedRows.length,
      summary: {
        total: updatedRows.length,
        assigned: updatedRows.filter(r => r[11] !== 'null').length,
        pending: updatedRows.filter(r => r[11] === 'null').length,
      },
    }
  }
  catch (error) {
    console.error('填充 Orders 資料錯誤:', error)
    throw createError({
      statusCode: 500,
      message: `填充失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
    })
  }
})

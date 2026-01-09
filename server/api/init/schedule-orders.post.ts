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

    // Schedule_Orders 表的欄位定義（移除 sequence，使用 Google Maps 規劃路線）
    const headers = [
      'id',
      'scheduleId',
      'orderId',
      'isCompleted',
      'completedAt',
      'created_at',
    ]

    // 寫入欄位標題
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.googleSheetsId,
      range: 'Schedule_Orders!A1:F1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers],
      },
    })

    return {
      success: true,
      message: '成功初始化 Schedule_Orders 表欄位',
      headers,
      totalColumns: headers.length,
    }
  }
  catch (error) {
    console.error('寫入試算表錯誤:', error)
    throw createError({
      statusCode: 500,
      message: `寫入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
    })
  }
})

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

    // Schedule_Orders 測試資料
    // 欄位：id, scheduleId, orderId, isCompleted, completedAt, created_at
    const scheduleOrdersData = [
      [
        '1',
        '1', // scheduleId = 1
        '1', // orderId = 1
        'FALSE',
        '',
        '2026-01-08T10:00:00Z',
      ],
      [
        '2',
        '1', // scheduleId = 1
        '2', // orderId = 2
        'FALSE',
        '',
        '2026-01-08T10:00:00Z',
      ],
    ]

    // 寫入 Schedule_Orders 資料
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.googleSheetsId,
      range: 'Schedule_Orders!A2:F3',
      valueInputOption: 'RAW',
      requestBody: {
        values: scheduleOrdersData,
      },
    })

    return {
      success: true,
      message: '成功填充 Schedule_Orders 測試資料',
      rowsCreated: scheduleOrdersData.length,
      relations: scheduleOrdersData.map(row => ({
        scheduleId: row[1],
        orderId: row[2],
        isCompleted: row[3],
      })),
    }
  }
  catch (error) {
    console.error('填充 Schedule_Orders 資料錯誤:', error)
    throw createError({
      statusCode: 500,
      message: `填充失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
    })
  }
})

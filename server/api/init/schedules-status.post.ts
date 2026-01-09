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

    // Schedules_Status 表的欄位定義和初始資料
    const data = [
      ['id', 'status', 'explanation', 'created_at'],
      ['1', 'pending', '待派發'],
      ['2', 'dispatched', '已派發'],
      ['3', 'completed', '已完成'],
    ]

    // 寫入資料
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.googleSheetsId,
      range: 'Schedules_Status!A1:D4',
      valueInputOption: 'RAW',
      requestBody: {
        values: data,
      },
    })

    return {
      success: true,
      message: '成功初始化 Schedules_Status 表',
      rows: data.length - 1,
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

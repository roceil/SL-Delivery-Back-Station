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

    // Orders_Status 表的欄位定義和初始資料
    const data = [
      ['id', 'status', 'explanation', 'created_at'],
      ['1', 'pending', '待確認'],
      ['2', 'confirmed', '已確認'],
      ['3', 'assigned', '已分配行程'],
      ['4', 'in_delivery', '配送中'],
      ['5', 'delivered', '已送達'],
      ['6', 'cancelled', '已取消'],
    ]

    // 寫入資料
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.googleSheetsId,
      range: 'Orders_Status!A1:D7',
      valueInputOption: 'RAW',
      requestBody: {
        values: data,
      },
    })

    return {
      success: true,
      message: '成功初始化 Orders_Status 表',
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

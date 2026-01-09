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
    // 建立 Google Sheets API 認證（需要寫入權限）
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.googleServiceAccountEmail,
        private_key: config.googlePrivateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    // Merchants 表的欄位定義
    const headers = [
      'id',
      'merchantCode',
      'name',
      'contactPerson',
      'phone',
      'email',
      'address',
      'category',
      'status',
      'qrCodeToken',
      'qrCodeUrl',
      'qrCodeStatus',
      'usedCount',
      'maxUsageCount',
      'qrCodeGeneratedAt',
      'qrCodeExpiresAt',
      'qrCodeLastUsedAt',
      'remarks',
      'created_at',
      'updated_at',
    ]

    // 寫入欄位標題到 Merchants 工作表的第一行
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.googleSheetsId,
      range: 'Merchants!A1:T1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers],
      },
    })

    return {
      success: true,
      message: '成功初始化 Merchants 表欄位',
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

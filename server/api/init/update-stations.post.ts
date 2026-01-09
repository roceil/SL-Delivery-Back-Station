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

    // 讀取目前的標題行
    const currentHeaders = await sheets.spreadsheets.values.get({
      spreadsheetId: config.googleSheetsId,
      range: 'Stations!A1:Z1',
    })

    const existingHeaders = currentHeaders.data.values?.[0] || []

    // 要新增的欄位
    const newColumns = [
      'address',
      'area',
      'type',
      'latitude',
      'longitude',
    ]

    // 合併欄位（避免重複）
    const allHeaders = [...existingHeaders]
    newColumns.forEach((col) => {
      if (!allHeaders.includes(col)) {
        allHeaders.push(col)
      }
    })

    // 更新標題行
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.googleSheetsId,
      range: `Stations!A1:${String.fromCharCode(64 + allHeaders.length)}1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [allHeaders],
      },
    })

    return {
      success: true,
      message: '成功更新 Stations 表欄位',
      previousColumns: existingHeaders.length,
      currentColumns: allHeaders.length,
      addedColumns: newColumns.filter(col => !existingHeaders.includes(col)),
      allHeaders,
    }
  }
  catch (error) {
    console.error('更新 Stations 表錯誤:', error)
    throw createError({
      statusCode: 500,
      message: `更新失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
    })
  }
})

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

    // 先取得現有的工作表
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: config.googleSheetsId,
    })

    const existingSheets = spreadsheet.data.sheets?.map(s => s.properties?.title) || []

    // 要建立的工作表清單
    const sheetsToCreate = [
      'Schedule_Orders',
      'Schedules_Status',
      'Orders_Status',
    ]

    // 過濾出尚未建立的工作表
    const newSheets = sheetsToCreate.filter(name => !existingSheets.includes(name))

    if (newSheets.length === 0) {
      return {
        success: true,
        message: '所有工作表都已存在',
        existingSheets: sheetsToCreate,
      }
    }

    // 建立工作表的請求
    const requests = newSheets.map(title => ({
      addSheet: {
        properties: {
          title,
          gridProperties: {
            rowCount: 1000,
            columnCount: 26,
          },
        },
      },
    }))

    // 批次建立工作表
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: config.googleSheetsId,
      requestBody: {
        requests,
      },
    })

    return {
      success: true,
      message: `成功建立 ${newSheets.length} 個工作表`,
      createdSheets: newSheets,
      skippedSheets: sheetsToCreate.filter(name => existingSheets.includes(name)),
    }
  }
  catch (error) {
    console.error('建立工作表錯誤:', error)
    throw createError({
      statusCode: 500,
      message: `建立失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
    })
  }
})

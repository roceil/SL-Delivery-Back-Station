import { google } from 'googleapis'

export default defineEventHandler(async (_event) => {
  const config = useRuntimeConfig()

  // 檢查必要的環境變數
  if (!config.googleServiceAccountEmail || !config.googlePrivateKey || !config.googleSheetsId) {
    throw createError({
      statusCode: 500,
      message: '缺少 Google Sheets 設定，請檢查環境變數',
    })
  }

  try {
    // 建立 Google Sheets API 認證
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.googleServiceAccountEmail,
        private_key: config.googlePrivateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    // 建立 Sheets API 客戶端
    const sheets = google.sheets({ version: 'v4', auth })

    // 取得試算表的基本資訊（包含所有工作表）
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: config.googleSheetsId,
    })

    const sheetsInfo = spreadsheet.data.sheets?.map(sheet => ({
      title: sheet.properties?.title,
      sheetId: sheet.properties?.sheetId,
      index: sheet.properties?.index,
      rowCount: sheet.properties?.gridProperties?.rowCount,
      columnCount: sheet.properties?.gridProperties?.columnCount,
    })) || []

    // 讀取每個工作表的前幾行資料作為預覽
    const sheetsData = await Promise.all(
      sheetsInfo.map(async (sheetInfo) => {
        try {
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: config.googleSheetsId,
            range: `${sheetInfo.title}!A1:Z10`, // 讀取前 10 行
          })

          return {
            ...sheetInfo,
            dataPreview: response.data.values || [],
            hasData: (response.data.values?.length || 0) > 0,
          }
        }
        catch (error) {
          return {
            ...sheetInfo,
            dataPreview: [],
            hasData: false,
            error: error instanceof Error ? error.message : '讀取失敗',
          }
        }
      }),
    )

    return {
      success: true,
      message: '成功讀取試算表資訊',
      spreadsheetTitle: spreadsheet.data.properties?.title,
      totalSheets: sheetsInfo.length,
      sheets: sheetsData,
    }
  }
  catch (error) {
    console.error('Google Sheets API 錯誤:', error)
    throw createError({
      statusCode: 500,
      message: `讀取試算表失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
    })
  }
})

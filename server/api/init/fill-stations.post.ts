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

    // Stations 測試資料（更新現有的 6 筆資料）
    // 格式：id, name, created_at, address, area, type, latitude, longitude
    const stationsData = [
      ['1', '碼頭門市', '', '屏東縣東港鎮新生三路290號', 'A', '碼頭', '22.4645', '120.4517'],
      ['2', 'A 民宿', '', '屏東縣琉球鄉中福村', 'C', '民宿', '22.3385', '120.3732'],
      ['3', 'B 民宿', '', '屏東縣琉球鄉本福村', 'C', '民宿', '22.3456', '120.3689'],
      ['4', 'C 民宿', '', '屏東縣琉球鄉杉福村', 'D', '民宿', '22.3298', '120.3621'],
      ['5', 'D 民宿', '', '屏東縣琉球鄉漁福村', 'D', '民宿', '22.3267', '120.3578'],
      ['6', 'E 民宿', '', '屏東縣琉球鄉上福村', 'C', '民宿', '22.3512', '120.3745'],
    ]

    // 更新 Stations 資料（從第 2 行開始，因為第 1 行是標題）
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.googleSheetsId,
      range: 'Stations!A2:H7',
      valueInputOption: 'RAW',
      requestBody: {
        values: stationsData,
      },
    })

    return {
      success: true,
      message: '成功填充 Stations 測試資料',
      rowsUpdated: stationsData.length,
      areas: {
        A: '碼頭',
        C: '民宿集中區',
        D: '外圍民宿區',
      },
    }
  }
  catch (error) {
    console.error('填充 Stations 資料錯誤:', error)
    throw createError({
      statusCode: 500,
      message: `填充失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
    })
  }
})

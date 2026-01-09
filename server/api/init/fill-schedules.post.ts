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

    // Schedules 測試資料
    // 欄位：id, name, description, courierId, scheduledDate, status, dispatchedAt, completedAt, trackingUrl, notes, created_at, updated_at
    const schedulesData = [
      [
        '1',
        '2026-01-09-09-00',
        '上午配送行程 - 碼頭到民宿',
        '1', // courierId = 1 (林呈昕)
        '2026-01-09',
        '2', // status = 2 (dispatched 已派發)
        '2026-01-09T08:00:00Z',
        '',
        'http://localhost:3000/trips/track/1',
        '請注意行李數量',
        '2026-01-08T10:00:00Z',
        '2026-01-08T10:00:00Z',
      ],
      [
        '2',
        '2026-01-09-14-00',
        '下午配送行程',
        '2', // courierId = 2 (林正一)
        '2026-01-09',
        '1', // status = 1 (pending 待派發)
        '',
        '',
        '',
        '',
        '2026-01-08T11:00:00Z',
        '2026-01-08T11:00:00Z',
      ],
    ]

    // 寫入 Schedules 資料
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.googleSheetsId,
      range: 'Schedules!A2:L3',
      valueInputOption: 'RAW',
      requestBody: {
        values: schedulesData,
      },
    })

    return {
      success: true,
      message: '成功填充 Schedules 測試資料',
      rowsCreated: schedulesData.length,
      schedules: schedulesData.map(row => ({
        id: row[0],
        name: row[1],
        courier: row[3],
        status: row[5] === '1' ? 'pending' : row[5] === '2' ? 'dispatched' : 'completed',
      })),
    }
  }
  catch (error) {
    console.error('填充 Schedules 資料錯誤:', error)
    throw createError({
      statusCode: 500,
      message: `填充失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
    })
  }
})

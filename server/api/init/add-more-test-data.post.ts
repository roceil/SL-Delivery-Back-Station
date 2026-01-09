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

    // === 1. 新增更多 Orders ===
    // 欄位：id, platformType, platformId, userId, merchantId, voucherId, scanCounts,
    //       startPoint, endPoint, created_at, updated_at, scheduleId, deliveryDate,
    //       deliveryTime, luggageCount, status, notes
    const newOrders = [
      // 訂單 5: 碼頭 → B 民宿 (分配到行程 3)
      ['5', '4', '2', '1', 'null', 'p9o8i7u6y5', '0', '1', '3', '', '', '3', '2026-01-10', '09:00', '2', '3', ''],
      // 訂單 6: 碼頭 → A 民宿 (分配到行程 3)
      ['6', '4', '3', '2', 'null', 't5r4e3w2q1', '0', '1', '2', '', '', '3', '2026-01-10', '09:30', '1', '3', ''],
      // 訂單 7: 碼頭 → D 民宿 (分配到行程 3)
      ['7', '3', '4', '1', 'null', 'a9s8d7f6g5', '0', '1', '5', '', '', '3', '2026-01-10', '10:00', '3', '3', ''],
      // 訂單 8: E 民宿 → 碼頭 (分配到行程 4 - 回程)
      ['8', '4', '4', '2', 'null', 'z8x7c6v5b4', '0', '6', '1', '', '', '4', '2026-01-10', '14:00', '2', '3', ''],
      // 訂單 9: C 民宿 → 碼頭 (分配到行程 4 - 回程)
      ['9', '3', '5', '1', 'null', 'n3m2l1k0j9', '0', '4', '1', '', '', '4', '2026-01-10', '14:30', '1', '3', ''],
      // 訂單 10: D 民宿 → 碼頭 (分配到行程 4 - 回程)
      ['10', '4', '5', '2', 'null', 'h8g7f6d5s4', '0', '5', '1', '', '', '4', '2026-01-10', '15:00', '2', '3', ''],
      // 訂單 11: 碼頭 → E 民宿 (未分配)
      ['11', '3', '6', '1', 'null', 'q1w2e3r4t5', '0', '1', '6', '', '', 'null', '2026-01-11', '09:00', '1', '2', ''],
      // 訂單 12: A 民宿 → B 民宿 (未分配 - 民宿間轉送)
      ['12', '4', '6', '2', 'null', 'y6u7i8o9p0', '0', '2', '3', '', '', 'null', '2026-01-11', '10:00', '1', '2', '特殊需求：易碎物品'],
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId: config.googleSheetsId,
      range: 'Orders!A6:Q13',
      valueInputOption: 'RAW',
      requestBody: {
        values: newOrders,
      },
    })

    // === 2. 新增更多 Schedules ===
    // 欄位：id, name, description, courierId, scheduledDate, status, dispatchedAt,
    //       completedAt, trackingUrl, notes, created_at, updated_at
    const newSchedules = [
      // 行程 3: 上午大量配送 (林呈昕)
      [
        '3',
        '2026-01-10-09-00',
        '上午配送行程 - 碼頭到多個民宿',
        '1', // 林呈昕
        '2026-01-10',
        '2', // 已派發
        '2026-01-10T08:00:00Z',
        '',
        'http://localhost:3000/trips/track/3',
        '大量行李，需要大車',
        '2026-01-09T10:00:00Z',
        '2026-01-09T10:00:00Z',
      ],
      // 行程 4: 下午回程 (林正一)
      [
        '4',
        '2026-01-10-14-00',
        '下午回程 - 民宿到碼頭',
        '2', // 林正一
        '2026-01-10',
        '2', // 已派發
        '2026-01-10T13:00:00Z',
        '',
        'http://localhost:3000/trips/track/4',
        '回程集中收件',
        '2026-01-09T11:00:00Z',
        '2026-01-09T11:00:00Z',
      ],
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId: config.googleSheetsId,
      range: 'Schedules!A4:L5',
      valueInputOption: 'RAW',
      requestBody: {
        values: newSchedules,
      },
    })

    // === 3. 新增 Schedule_Orders 關聯 ===
    // 欄位：id, scheduleId, orderId, isCompleted, completedAt, created_at
    const newScheduleOrders = [
      // 行程 3 的訂單
      ['3', '3', '5', 'FALSE', '', '2026-01-09T10:00:00Z'], // 碼頭 → B 民宿
      ['4', '3', '6', 'FALSE', '', '2026-01-09T10:00:00Z'], // 碼頭 → A 民宿
      ['5', '3', '7', 'FALSE', '', '2026-01-09T10:00:00Z'], // 碼頭 → D 民宿

      // 行程 4 的訂單 (回程)
      ['6', '4', '8', 'FALSE', '', '2026-01-09T11:00:00Z'], // E 民宿 → 碼頭
      ['7', '4', '9', 'FALSE', '', '2026-01-09T11:00:00Z'], // C 民宿 → 碼頭
      ['8', '4', '10', 'FALSE', '', '2026-01-09T11:00:00Z'], // D 民宿 → 碼頭
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId: config.googleSheetsId,
      range: 'Schedule_Orders!A4:F9',
      valueInputOption: 'RAW',
      requestBody: {
        values: newScheduleOrders,
      },
    })

    return {
      success: true,
      message: '成功新增更多測試資料',
      summary: {
        ordersAdded: newOrders.length,
        schedulesAdded: newSchedules.length,
        scheduleOrdersAdded: newScheduleOrders.length,
        totalOrders: 12,
        totalSchedules: 4,
        scenarios: [
          '行程 1: 上午配送 - 2 筆訂單 (已建立)',
          '行程 2: 下午配送 - 0 筆訂單 (待派發)',
          '行程 3: 上午大量配送 - 3 筆訂單 (新增)',
          '行程 4: 下午回程 - 3 筆訂單 (新增)',
          '未分配訂單: 4 筆',
        ],
      },
    }
  }
  catch (error) {
    console.error('新增測試資料錯誤:', error)
    throw createError({
      statusCode: 500,
      message: `新增失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
    })
  }
})

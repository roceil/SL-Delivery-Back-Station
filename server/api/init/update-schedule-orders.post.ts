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

    // 讀取現有資料
    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId: config.googleSheetsId,
      range: 'Schedule_Orders!A1:G20',
    })

    const rows = currentData.data.values || []

    if (rows.length === 0) {
      throw new Error('Schedule_Orders 表沒有資料')
    }

    // 移除 sequence 欄位（原本是第 4 欄）
    // 新結構：id, scheduleId, orderId, isCompleted, completedAt, created_at
    const newHeaders = ['id', 'scheduleId', 'orderId', 'isCompleted', 'completedAt', 'created_at']

    const updatedRows = rows.map((row, index) => {
      if (index === 0) {
        // 第一行是標題
        return newHeaders
      }

      // 資料行：移除 sequence (index 3)
      // 原本：id, scheduleId, orderId, sequence, isCompleted, completedAt, created_at
      // 新的：id, scheduleId, orderId, isCompleted, completedAt, created_at
      return [
        row[0], // id
        row[1], // scheduleId
        row[2], // orderId
        row[4], // isCompleted (跳過 sequence)
        row[5], // completedAt
        row[6], // created_at
      ]
    })

    // 清空原有資料
    await sheets.spreadsheets.values.clear({
      spreadsheetId: config.googleSheetsId,
      range: 'Schedule_Orders!A1:G20',
    })

    // 寫入新資料
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.googleSheetsId,
      range: 'Schedule_Orders!A1:F20',
      valueInputOption: 'RAW',
      requestBody: {
        values: updatedRows,
      },
    })

    return {
      success: true,
      message: '成功更新 Schedule_Orders 表結構（移除 sequence 欄位）',
      oldColumns: 7,
      newColumns: 6,
      removedColumn: 'sequence',
      newStructure: newHeaders,
      rowsUpdated: updatedRows.length - 1,
    }
  }
  catch (error) {
    console.error('更新 Schedule_Orders 錯誤:', error)
    throw createError({
      statusCode: 500,
      message: `更新失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
    })
  }
})

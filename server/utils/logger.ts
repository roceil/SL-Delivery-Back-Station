import fs from 'node:fs'
import path from 'node:path'

// 在生產環境中，Cloud Run 會自動從 stdout/stderr 收集日誌
const isProduction = process.env.NODE_ENV === 'production'
const logsDir = path.join(process.cwd(), 'logs')

// 只在開發環境創建 logs 目錄
if (!isProduction) {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
  }
}

function formatLogMessage(level: string, message: string, data?: any): string {
  const timestamp = new Date().toISOString()
  const dataStr = data ? ` ${JSON.stringify(data)}` : ''
  return `[${timestamp}] [${level}] ${message}${dataStr}`
}

function writeLog(level: string, message: string, data?: any) {
  const logMessage = formatLogMessage(level, message, data)

  // 在開發環境寫入檔案，生產環境只輸出到 console
  if (!isProduction) {
    const logFile = path.join(logsDir, `print-service-${new Date().toISOString().split('T')[0]}.log`)
    fs.appendFile(logFile, logMessage + '\n', (err) => {
      if (err) {
        console.error('寫入日誌失敗:', err)
      }
    })
  }

  // 輸出到 console（Cloud Run 會自動收集）
  if (level === 'ERROR') {
    console.error(logMessage, data)
  }
  else {
    console.log(logMessage, data)
  }
}

export const logger = {
  info: (message: string, data?: any) => writeLog('INFO', message, data),
  error: (message: string, data?: any) => writeLog('ERROR', message, data),
  warn: (message: string, data?: any) => writeLog('WARN', message, data),
}

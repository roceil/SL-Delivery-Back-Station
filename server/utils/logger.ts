import fs from 'node:fs'
import path from 'node:path'

const logsDir = path.join(process.cwd(), 'logs')

// 確保 logs 目錄存在
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

function formatLogMessage(level: string, message: string, data?: any): string {
  const timestamp = new Date().toISOString()
  const dataStr = data ? ` ${JSON.stringify(data)}` : ''
  return `[${timestamp}] [${level}] ${message}${dataStr}\n`
}

function writeLog(level: string, message: string, data?: any) {
  const logMessage = formatLogMessage(level, message, data)
  const logFile = path.join(logsDir, `print-service-${new Date().toISOString().split('T')[0]}.log`)

  // 寫入檔案
  fs.appendFile(logFile, logMessage, (err) => {
    if (err) {
      console.error('寫入日誌失敗:', err)
    }
  })

  // 同時輸出到 console
  if (level === 'ERROR') {
    console.error(message, data)
  }
  else {
    console.log(message, data)
  }
}

export const logger = {
  info: (message: string, data?: any) => writeLog('INFO', message, data),
  error: (message: string, data?: any) => writeLog('ERROR', message, data),
  warn: (message: string, data?: any) => writeLog('WARN', message, data),
}

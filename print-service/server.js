// 本地列印服務
// 使用方式：node server.js
// 然後從前端呼叫 http://localhost:9100/print

const { exec } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const cors = require('cors')
const express = require('express')

const app = express()
const PORT = 9100

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// 列印端點
app.post('/print', async (req, res) => {
  try {
    const { dataUrl, printerName, width, height } = req.body

    if (!dataUrl) {
      return res.status(400).json({ error: '缺少 dataUrl' })
    }

    // 將 base64 圖片儲存為臨時檔案
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const tempFile = path.join(__dirname, `temp-${Date.now()}.png`)

    fs.writeFileSync(tempFile, buffer)

    // 根據作業系統執行列印指令
    let printCommand

    if (process.platform === 'darwin') {
      // macOS - 使用 lp 指令
      printCommand = `lp ${printerName ? `-d "${printerName}"` : ''} -o fit-to-page "${tempFile}"`
    }
    else if (process.platform === 'win32') {
      // Windows - 需要安裝 SumatraPDF 或使用其他工具
      // 或使用 Node 套件如 'printer' 或 'pdf-to-printer'
      printCommand = `mspaint /pt "${tempFile}"`
    }
    else {
      // Linux - 使用 lp 指令
      printCommand = `lp ${printerName ? `-d "${printerName}"` : ''} "${tempFile}"`
    }

    // 執行列印
    exec(printCommand, (error, stdout, stderr) => {
      // 刪除臨時檔案
      try {
        fs.unlinkSync(tempFile)
      }
      catch (e) {
        console.error('刪除臨時檔案失敗:', e)
      }

      if (error) {
        console.error('列印錯誤:', error)
        return res.status(500).json({ error: '列印失敗', details: stderr })
      }

      res.json({ success: true, message: '列印成功' })
    })
  }
  catch (error) {
    console.error('處理列印請求時發生錯誤:', error)
    res.status(500).json({ error: '處理失敗', details: error.message })
  }
})

// 獲取可用的印表機列表
app.get('/printers', (req, res) => {
  let command

  if (process.platform === 'darwin') {
    command = 'lpstat -p -d'
  }
  else if (process.platform === 'win32') {
    command = 'wmic printer get name'
  }
  else {
    command = 'lpstat -p -d'
  }

  exec(command, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: '無法獲取印表機列表', details: stderr })
    }

    res.json({ printers: stdout })
  })
})

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', platform: process.platform })
})

app.listen(PORT, () => {
  console.log(`🖨️  列印服務運行於 http://localhost:${PORT}`)
  console.log(`平台: ${process.platform}`)
})

// 靜默列印功能
// 需要搭配本地列印服務 (print-service/server.js)

export function useSilentPrint() {
  const PRINT_SERVICE_URL = 'http://localhost:9100'

  /**
   * 檢查列印服務是否運行
   */
  async function checkPrintService(): Promise<boolean> {
    try {
      const response = await fetch(`${PRINT_SERVICE_URL}/health`, {
        method: 'GET',
      })
      return response.ok
    }
    catch {
      return false
    }
  }

  /**
   * 取得可用的印表機列表
   */
  async function getPrinters(): Promise<string[]> {
    try {
      const response = await fetch(`${PRINT_SERVICE_URL}/printers`)
      const data = await response.json()
      return data.printers ? data.printers.split('\n').filter(Boolean) : []
    }
    catch (error) {
      console.error('獲取印表機列表失敗:', error)
      return []
    }
  }

  /**
   * 將 Canvas 元素轉換為 DataURL 並發送到列印服務
   */
  async function printCanvas(
    canvas: HTMLCanvasElement,
    options?: {
      printerName?: string
      width?: number
      height?: number
    },
  ): Promise<boolean> {
    try {
      // 檢查列印服務是否可用
      const isServiceRunning = await checkPrintService()
      if (!isServiceRunning) {
        throw new Error('列印服務未運行。請先啟動 print-service。')
      }

      // 將 canvas 轉換為 base64 圖片
      const dataUrl = canvas.toDataURL('image/png')

      // 發送列印請求
      const response = await fetch(`${PRINT_SERVICE_URL}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataUrl,
          printerName: options?.printerName,
          width: options?.width,
          height: options?.height,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '列印失敗')
      }

      return true
    }
    catch (error) {
      console.error('靜默列印失敗:', error)
      throw error
    }
  }

  /**
   * 使用 PrintCanvas 元件進行靜默列印
   */
  async function printTemplate(
    template: any,
    orderData: any,
    printerName?: string,
  ): Promise<boolean> {
    try {
      // 建立臨時 canvas 進行渲染
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx)
        throw new Error('無法建立 canvas context')

      // 設定 canvas 尺寸（根據模板尺寸）
      const scale = 3.7795275591 // 1mm = 3.78px at 96 DPI
      canvas.width = template.width * scale
      canvas.height = template.height * scale

      // 這裡需要實作繪製邏輯，或重用 PrintCanvas 的繪製函數
      // 簡化示例：直接使用現有的 PrintCanvas
      const existingCanvas = document.querySelector('.print-canvas canvas') as HTMLCanvasElement
      if (!existingCanvas) {
        throw new Error('找不到列印 canvas')
      }

      // 發送列印請求
      return await printCanvas(existingCanvas, {
        printerName,
        width: template.width,
        height: template.height,
      })
    }
    catch (error) {
      console.error('列印模板失敗:', error)
      throw error
    }
  }

  return {
    checkPrintService,
    getPrinters,
    printCanvas,
    printTemplate,
  }
}

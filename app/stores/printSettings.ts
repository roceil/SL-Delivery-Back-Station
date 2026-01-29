import { acceptHMRUpdate, defineStore } from 'pinia'

export interface PrintElement {
  id: string
  type: 'qrcode' | 'text' | 'divider'
  x: number // mm
  y: number // mm
  width?: number // mm
  height?: number // mm
  fontSize?: number // pt
  fontWeight?: 'normal' | 'bold' | 'semibold'
  color?: string
  align?: 'left' | 'center' | 'right'
  field?: string // 對應的資料欄位，如 'id', 'lineName', 'pickupLocation.name'
  label?: string // 固定文字標籤
  labelPosition?: 'before' | 'after' // 標籤位置：在欄位值之前或之後，預設為 'before'
  badge?: boolean // 是否顯示為膠囊徽章樣式
  badgeColor?: string // 膠囊背景顏色（選填，會根據 field 自動判斷）
}

export interface PrintTemplate {
  id: string
  name: string
  width: number // mm
  height: number // mm
  elements: PrintElement[]
  createdAt: string
  updatedAt: string
}

export const usePrintSettingsStore = defineStore('printSettings', () => {
  // 預設模板：100mm x 50mm 橫向卡片
  const defaultTemplate: PrintTemplate = {
    id: 'default',
    name: '預設名片模板',
    width: 100,
    height: 50,
    elements: [
      // QR Code
      {
        id: 'qrcode',
        type: 'qrcode',
        x: 4,
        y: 4,
        width: 40,
        height: 40,
        field: 'id',
      },
      // 訂單編號
      {
        id: 'order-id',
        type: 'text',
        x: 54,
        y: 6,
        fontSize: 16,
        fontWeight: 'bold',
        field: 'id',
        label: '#',
      },
      // 狀態
      {
        id: 'status',
        type: 'text',
        x: 55.5,
        y: 13,
        fontSize: 16,
        field: 'status',
        badge: true,
      },
      // LINE 名稱
      {
        id: 'line-name',
        type: 'text',
        x: 54.5,
        y: 19,
        fontSize: 16,
        fontWeight: 'semibold',
        field: 'lineName',
      },
      // 電話
      {
        id: 'phone',
        type: 'text',
        x: 54.5,
        y: 25,
        fontSize: 14,
        field: 'phone',
      },
      // 起始點標籤
      {
        id: 'pickup-label',
        type: 'text',
        x: 54.5,
        y: 31,
        fontSize: 12,
        color: '#666',
        label: '起始',
      },
      // 起始點名稱
      {
        id: 'pickup-name',
        type: 'text',
        x: 54.5,
        y: 35,
        fontSize: 16,
        fontWeight: 'semibold',
        field: 'pickupLocation.name',
      },
      // 送達點標籤
      {
        id: 'delivery-label',
        type: 'text',
        x: 54.5,
        y: 40.5,
        fontSize: 12,
        color: '#666',
        label: '送達',
      },
      // 送達點名稱
      {
        id: 'delivery-name',
        type: 'text',
        x: 54.5,
        y: 44.5,
        fontSize: 16,
        fontWeight: 'semibold',
        field: 'deliveryLocation.name',
      },
      // 行李數量
      {
        id: 'luggage-count',
        type: 'text',
        x: 83.5,
        y: 48,
        fontSize: 14,
        fontWeight: 'bold',
        field: 'luggageCount',
        label: ' 件行李',
        labelPosition: 'after',
      },
      // 列印日期
      {
        id: 'print-date',
        type: 'text',
        x: 3.3,
        y: 48.6,
        fontSize: 10,
        color: '#666666',
        field: '_printDate',
        label: '列印日期：',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // 當前使用的模板（每次都從 defaultTemplate 深拷貝，用於即時預覽）
  const currentTemplate = ref<PrintTemplate>(JSON.parse(JSON.stringify(defaultTemplate)))

  // 選中的元素 ID
  const selectedElementId = ref<string | null>(null)

  // 重置為預設模板（用於重置預覽狀態）
  function resetToDefault() {
    currentTemplate.value = JSON.parse(JSON.stringify(defaultTemplate))
    selectedElementId.value = null
  }

  // 更新元素
  function updateElement(elementId: string, updates: Partial<PrintElement>) {
    const element = currentTemplate.value.elements.find(e => e.id === elementId)
    if (element) {
      Object.assign(element, updates)
      currentTemplate.value.updatedAt = new Date().toISOString()
    }
  }

  // 新增元素
  function addElement(element: Omit<PrintElement, 'id'>) {
    const newElement: PrintElement = {
      ...element,
      id: `element-${Date.now()}`,
    }
    currentTemplate.value.elements.push(newElement)
    currentTemplate.value.updatedAt = new Date().toISOString()
  }

  // 刪除元素
  function deleteElement(elementId: string) {
    const index = currentTemplate.value.elements.findIndex(e => e.id === elementId)
    if (index >= 0) {
      currentTemplate.value.elements.splice(index, 1)
      currentTemplate.value.updatedAt = new Date().toISOString()
      if (selectedElementId.value === elementId) {
        selectedElementId.value = null
      }
    }
  }

  // 選擇元素
  function selectElement(elementId: string | null) {
    selectedElementId.value = elementId
  }

  // 取得選中的元素
  const selectedElement = computed(() => {
    if (!selectedElementId.value)
      return null
    return currentTemplate.value.elements.find(e => e.id === selectedElementId.value)
  })

  return {
    currentTemplate,
    selectedElementId,
    selectedElement,
    resetToDefault,
    updateElement,
    addElement,
    deleteElement,
    selectElement,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePrintSettingsStore, import.meta.hot))
}

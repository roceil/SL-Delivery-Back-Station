<script lang="ts" setup>
import type { PrintTemplate } from '~/stores/printSettings'
import QRCode from 'qrcode'
import { usePrintSettingsStore } from '~/stores/printSettings'

interface Props {
  template: PrintTemplate
  sampleData: any
  scale?: number
  interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  scale: 3,
  interactive: false,
})

const emit = defineEmits<{
  elementClick: [elementId: string]
  elementMove: [elementId: string, x: number, y: number]
}>()

const canvasRef = ref<HTMLCanvasElement>()
const isDragging = ref(false)
const dragElementId = ref<string | null>(null)
const dragOffset = ref({ x: 0, y: 0 })

// Store 參照（僅在互動模式下使用）
let printSettingsStore: ReturnType<typeof usePrintSettingsStore> | null = null
if (props.interactive) {
  printSettingsStore = usePrintSettingsStore()
}

const mmToPx = (mm: number) => mm * props.scale * 3.7795275591 // 1mm = 3.78px at 96 DPI

const canvasWidth = computed(() => mmToPx(props.template.width))
const canvasHeight = computed(() => mmToPx(props.template.height))

// 狀態對應表
const statusMapping: Record<string, string> = {
  pending: '待確認',
  confirmed: '已確認',
  assigned: '已分配行程',
  in_delivery: '配送中',
  delivered: '已送達',
  cancelled: '已取消',
}

// 類別對應表
const categoryMapping: Record<string, string> = {
  散客: '散客',
  合作: '合作',
  Trip: 'Trip',
  Klook: 'Klook',
}

// 取得欄位值
function getFieldValue(field?: string, label?: string, labelPosition?: 'before' | 'after'): string {
  if (!field && label)
    return label

  if (!field)
    return ''

  // 處理特殊欄位：列印日期時間
  if (field === '_printDate') {
    const now = new Date()
    const displayValue = now.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

    if (label)
      return labelPosition === 'after' ? `${displayValue}${label}` : `${label}${displayValue}`

    return displayValue
  }

  const parts = field.split('.')
  let value = props.sampleData

  for (const part of parts) {
    value = value?.[part]
  }

  // 轉換為字串
  let displayValue = value?.toString() || ''

  // 對特定欄位進行 mapping 轉換
  if (field === 'status' && displayValue)
    displayValue = statusMapping[displayValue] || displayValue

  if (field === 'category' && displayValue)
    displayValue = categoryMapping[displayValue] || displayValue

  // 如果有 label，根據 labelPosition 組合
  if (label && displayValue)
    return labelPosition === 'after' ? `${displayValue}${label}` : `${label}${displayValue}`

  return displayValue
}

// 繪製 Canvas
async function drawCanvas() {
  if (!canvasRef.value)
    return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  // 清空畫布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 繪製白色背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 繪製邊框
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 2
  ctx.strokeRect(0, 0, canvas.width, canvas.height)

  // 繪製元素
  for (const element of props.template.elements) {
    const x = mmToPx(element.x)
    const y = mmToPx(element.y)

    // 如果是選中的元素，繪製高亮框
    if (props.interactive && printSettingsStore?.selectedElementId === element.id) {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])

      if (element.type === 'qrcode') {
        const width = mmToPx(element.width || 40)
        const height = mmToPx(element.height || 40)
        ctx.strokeRect(x - 2, y - 2, width + 4, height + 4)
      }
      else if (element.type === 'text') {
        const text = getFieldValue(element.field, element.label, element.labelPosition)
        const fontSize = (element.fontSize || 10) * props.scale
        ctx.font = `${element.fontWeight || 'normal'} ${fontSize}px sans-serif`
        const metrics = ctx.measureText(text)

        // 根據對齊方式計算高亮框位置
        let highlightX = x - 2
        if (element.align === 'right') {
          highlightX = x - metrics.width - 2
        }
        else if (element.align === 'center') {
          highlightX = x - metrics.width / 2 - 2
        }

        ctx.strokeRect(highlightX, y - fontSize - 2, metrics.width + 4, fontSize + 4)
      }
      else if (element.type === 'divider') {
        const width = mmToPx(element.width || 20)
        // 繪製一個較大的高亮框讓用戶知道選中了分隔線
        ctx.strokeRect(x - 2, y - 4, width + 4, 8)
      }

      ctx.setLineDash([])
    }

    if (element.type === 'qrcode') {
      // 繪製 QR Code
      const qrValue = getFieldValue(element.field)
      const width = mmToPx(element.width || 40)
      const height = mmToPx(element.height || 40)

      try {
        const qrDataUrl = await QRCode.toDataURL(qrValue || 'SAMPLE', {
          width,
          margin: 0,
          errorCorrectionLevel: 'H',
        })

        const img = new Image()
        img.src = qrDataUrl
        await new Promise((resolve) => {
          img.onload = resolve
        })

        ctx.drawImage(img, x, y, width, height)
      }
      catch (error) {
        console.error('QR Code generation failed:', error)
      }
    }
    else if (element.type === 'text') {
      // 繪製文字
      const text = getFieldValue(element.field, element.label, element.labelPosition)
      const fontSize = (element.fontSize || 10) * props.scale

      ctx.font = `${element.fontWeight || 'normal'} ${fontSize}px sans-serif`
      const metrics = ctx.measureText(text)

      // 如果不是徽章樣式，直接設定一般文字顏色
      if (!element.badge) {
        ctx.fillStyle = element.color || '#000000'
      }
      else {
        // 徽章樣式：先繪製圓角矩形背景
        const padding = mmToPx(2) // 左右各 2mm padding
        const verticalPadding = mmToPx(1) // 上下各 1mm padding
        const borderRadius = mmToPx(3) // 圓角半徑

        // 計算背景矩形位置和尺寸
        let badgeX = x - padding
        const badgeY = y - fontSize - verticalPadding
        const badgeWidth = metrics.width + padding * 2
        const badgeHeight = fontSize + verticalPadding * 2

        // 根據對齊方式調整背景位置
        if (element.align === 'right') {
          badgeX = x - metrics.width - padding
        }
        else if (element.align === 'center') {
          badgeX = x - metrics.width / 2 - padding
        }

        // 繪製圓角矩形背景（黑底）
        ctx.fillStyle = element.badgeColor || '#000000'
        ctx.beginPath()
        ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, borderRadius)
        ctx.fill()

        // 設定文字顏色（白字）
        ctx.fillStyle = '#ffffff'
      }

      // 設定文字對齊方式
      if (element.align === 'right') {
        ctx.textAlign = 'right'
      }
      else if (element.align === 'center') {
        ctx.textAlign = 'center'
      }
      else {
        ctx.textAlign = 'left'
      }

      // 設定文字基線對齊方式（徽章使用 middle 讓文字垂直置中）
      ctx.textBaseline = element.badge ? 'middle' : 'alphabetic'

      // 計算文字的 Y 位置（徽章模式下使用膠囊中心）
      const textY = element.badge
        ? y - fontSize / 2 // 徽章：使用文字高度的一半作為中心點
        : y // 一般文字：使用原始 baseline

      // 繪製文字
      ctx.fillText(text, x, textY)

      // 重置
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
    }
    else if (element.type === 'divider') {
      // 繪製分隔線
      const width = mmToPx(element.width || 20)
      ctx.strokeStyle = '#d1d5db'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + width, y)
      ctx.stroke()
    }
  }
}

// 處理滑鼠事件
function handleMouseDown(event: MouseEvent) {
  if (!props.interactive || !canvasRef.value)
    return

  const rect = canvasRef.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top

  // 反向查找點擊的元素（從上層到下層）
  for (let i = props.template.elements.length - 1; i >= 0; i--) {
    const element = props.template.elements[i]
    if (!element)
      continue

    const x = mmToPx(element.x)
    const y = mmToPx(element.y)

    let hit = false
    const hitTolerance = 5 // 點擊容差（像素）

    if (element.type === 'qrcode') {
      const width = mmToPx(element.width || 40)
      const height = mmToPx(element.height || 40)
      hit = clickX >= x - hitTolerance && clickX <= x + width + hitTolerance
        && clickY >= y - hitTolerance && clickY <= y + height + hitTolerance
    }
    else if (element.type === 'text') {
      const text = getFieldValue(element.field, element.label, element.labelPosition)
      const fontSize = (element.fontSize || 10) * props.scale
      const ctx = canvasRef.value.getContext('2d')
      if (ctx) {
        ctx.font = `${element.fontWeight || 'normal'} ${fontSize}px sans-serif`
        const metrics = ctx.measureText(text)

        // 根據對齊方式計算點擊區域
        let textStartX = x
        let textEndX = x + metrics.width

        if (element.align === 'right') {
          textStartX = x - metrics.width
          textEndX = x
        }
        else if (element.align === 'center') {
          textStartX = x - metrics.width / 2
          textEndX = x + metrics.width / 2
        }

        hit = clickX >= textStartX - hitTolerance && clickX <= textEndX + hitTolerance
          && clickY >= y - fontSize - hitTolerance && clickY <= y + hitTolerance
      }
    }
    else if (element.type === 'divider') {
      const width = mmToPx(element.width || 20)
      // 增加分隔線的點擊區域，上下各 5px
      const clickAreaHeight = 10
      hit = clickX >= x - hitTolerance && clickX <= x + width + hitTolerance
        && clickY >= y - clickAreaHeight / 2 && clickY <= y + clickAreaHeight / 2
    }

    if (!hit)
      continue

    emit('elementClick', element.id)
    isDragging.value = true
    dragElementId.value = element.id
    dragOffset.value = {
      x: clickX - x,
      y: clickY - y,
    }
    break
  }
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value || !dragElementId.value || !canvasRef.value)
    return

  const rect = canvasRef.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  const newX = (mouseX - dragOffset.value.x) / (props.scale * 3.7795275591)
  const newY = (mouseY - dragOffset.value.y) / (props.scale * 3.7795275591)

  emit('elementMove', dragElementId.value, newX, newY)
}

function handleMouseUp() {
  isDragging.value = false
  dragElementId.value = null
}

// 監聽模板變化
watch(
  () => [props.template, props.sampleData],
  () => {
    nextTick(() => {
      drawCanvas()
    })
  },
  { deep: true, immediate: true },
)

onMounted(() => {
  drawCanvas()
})
</script>

<template>
  <div
    class="relative inline-block print:m-0 print:block print:p-0"
    :style="{
      width: interactive ? 'auto' : `${canvasWidth}px`,
      height: interactive ? 'auto' : `${canvasHeight}px`,
    }"
  >
    <canvas
      ref="canvasRef"
      :width="canvasWidth"
      :height="canvasHeight"
      class="shadow-lg print:shadow-none"
      :class="{
        'cursor-move': interactive,
      }"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    ></canvas>
  </div>
</template>

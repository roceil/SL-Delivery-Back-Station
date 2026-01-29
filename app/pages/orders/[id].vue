<script lang="ts" setup>
import QrcodeVue from 'qrcode.vue'
import { usePrintSettingsStore } from '~/stores/printSettings'

interface Location {
  id: string
  name: string
  address: string
  area: string
}

interface Order {
  id: string
  category: string
  lineName: string
  phone: string
  deliveryDate: string | null
  pickupTime: string
  luggageCount: number
  status: string
  pickupLocation: Location
  deliveryLocation: Location
  notes: string
  createdAt: string
  updatedAt?: string
}

const route = useRoute()
const orderId = route.params.id as string

useHead({
  title: `訂單詳細 #${orderId} - 行李運送系統`,
})

const { data: order, error } = await useFetch<Order>(`/api/orders/${orderId}`)

if (error.value) {
  throw createError({
    statusCode: 404,
    message: '找不到此訂單',
  })
}

// 載入列印設定
const printSettingsStore = usePrintSettingsStore()
const { checkPrintService, printCanvas } = useSilentPrint()

// 檢查靜默列印服務狀態
const silentPrintAvailable = ref(false)

onMounted(async () => {
  // 檢查靜默列印服務是否可用
  silentPrintAvailable.value = await checkPrintService()
})

// 一般列印（顯示預覽）
function handlePrint() {
  // 動態設定列印樣式
  const template = printSettingsStore.currentTemplate

  // 計算精確的像素尺寸（與 PrintCanvas 組件的 mmToPx 一致）
  // Canvas 使用 scale=3 來提高解析度，但列印時要縮放回實際尺寸
  const displayScale = 1 // 列印時的實際顯示比例
  const mmToPx = 3.7795275591 // 1mm = 3.78px at 96 DPI

  // 列印時的顯示尺寸（實際物理尺寸）
  const displayWidthPx = template.width * displayScale * mmToPx
  const displayHeightPx = template.height * displayScale * mmToPx

  const style = document.createElement('style')
  style.id = 'dynamic-print-style'
  style.textContent = `
    @media print {
      @page {
        size: ${template.width}mm ${template.height}mm;
        margin: 0;
      }

      /* 確保頁面精確尺寸 */
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: ${displayWidthPx}px !important;
        height: ${displayHeightPx}px !important;
        max-width: ${displayWidthPx}px !important;
        max-height: ${displayHeightPx}px !important;
        overflow: hidden !important;
      }

      /* 確保 print-canvas 容器精確尺寸 */
      .print-canvas {
        width: ${displayWidthPx}px !important;
        height: ${displayHeightPx}px !important;
        max-width: ${displayWidthPx}px !important;
        max-height: ${displayHeightPx}px !important;
        overflow: hidden !important;
        transform-origin: top left;
      }

      /* Canvas 縮放：從高解析度縮放回實際尺寸 */
      .print-canvas canvas {
        width: ${displayWidthPx}px !important;
        height: ${displayHeightPx}px !important;
        max-width: ${displayWidthPx}px !important;
        max-height: ${displayHeightPx}px !important;
        transform-origin: top left;
      }
    }
  `

  // 移除舊的動態樣式（如果存在）
  const oldStyle = document.getElementById('dynamic-print-style')
  if (oldStyle) {
    oldStyle.remove()
  }

  // 添加新的動態樣式
  document.head.appendChild(style)

  // 延遲一下確保樣式已套用
  setTimeout(() => {
    window.print()
  }, 100)
}

// 靜默列印（跳過預覽）
async function handleSilentPrint() {
  try {
    // 取得 canvas 元素
    const canvas = document.querySelector('.print-canvas canvas') as HTMLCanvasElement

    if (!canvas) {
      // eslint-disable-next-line no-alert
      alert('找不到列印內容，請重新整理頁面')
      return
    }

    // 執行靜默列印
    await printCanvas(canvas, {
      width: printSettingsStore.currentTemplate.width,
      height: printSettingsStore.currentTemplate.height,
    })

    // eslint-disable-next-line no-alert
    alert('列印成功！')
  }
  catch (error: any) {
    console.error('靜默列印失敗:', error)
    // eslint-disable-next-line no-alert
    alert(`列印失敗：${error.message || '未知錯誤'}`)
  }
}

const statusConfig = {
  pending: { text: '待確認', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { text: '已確認', color: 'bg-blue-100 text-blue-800' },
  assigned: { text: '已分配行程', color: 'bg-purple-100 text-purple-800' },
  in_delivery: { text: '配送中', color: 'bg-indigo-100 text-indigo-800' },
  delivered: { text: '已送達', color: 'bg-green-100 text-green-800' },
  cancelled: { text: '已取消', color: 'bg-red-100 text-red-800' },
}

const categoryConfig = {
  散客: { color: 'bg-blue-100 text-blue-800' },
  合作: { color: 'bg-purple-100 text-purple-800' },
  Trip: { color: 'bg-green-100 text-green-800' },
  Klook: { color: 'bg-orange-100 text-orange-800' },
}

function getStatusText(status: string) {
  return statusConfig[status as keyof typeof statusConfig]?.text || status
}

function getStatusColor(status: string) {
  return statusConfig[status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'
}

function getCategoryColor(category: string) {
  return categoryConfig[category as keyof typeof categoryConfig]?.color || 'bg-gray-100 text-gray-800'
}

function formatDateTime(dateString?: string | null) {
  if (!dateString)
    return '-'

  return new Date(dateString).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(dateString?: string | null) {
  if (!dateString)
    return '-'

  return new Date(dateString).toLocaleDateString('zh-TW')
}

function formatTime(timeString?: string | null) {
  if (!timeString || timeString === '-')
    return '-'

  // 將 hh:mm:ss 格式轉換為 hh:mm
  return timeString.slice(0, 5)
}
</script>

<template>
  <div>
    <!-- Print Card Layout (Only visible when printing) -->
    <div
      v-if="order && printSettingsStore"
      class="
        print-canvas hidden
        print:m-0 print:block print:overflow-hidden print:p-0
      "
      :style="{
        maxWidth: '100vw',
        maxHeight: '100vh',
      }"
    >
      <PrintCanvas
        :template="printSettingsStore.currentTemplate"
        :sample-data="order"
        :scale="3"
      />
    </div>

    <!-- Screen Layout (Hidden when printing) -->
    <div class="space-y-6 print:hidden">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/orders"
            class="
              rounded-md border border-gray-300 bg-white px-4 py-2 text-sm
              font-medium text-gray-700 shadow-sm
              hover:bg-gray-50
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
            "
          >
            ← 返回列表
          </NuxtLink>
          <h1 class="text-2xl font-bold text-gray-900">
            訂單詳細 #{{ order?.id }}
          </h1>
        </div>
        <div class="flex items-center gap-3">
          <span
            v-if="order"
            :class="getStatusColor(order.status)"
            class="inline-flex rounded-full px-4 py-2 text-sm font-semibold"
          >
            {{ getStatusText(order.status) }}
          </span>
          <NuxtLink
            to="/print-settings"
            class="
              rounded-md border border-gray-300 bg-white px-4 py-2 text-sm
              font-medium text-gray-700 shadow-sm
              hover:bg-gray-50
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
            "
          >
            列印設定
          </NuxtLink>
          <button
            v-if="silentPrintAvailable"
            type="button"
            class="
              rounded-md border border-transparent bg-green-600 px-4 py-2
              text-sm font-medium text-white shadow-sm
              hover:bg-green-700
              focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              focus:outline-none
            "
            @click="handleSilentPrint"
          >
            快速列印
          </button>
          <button
            type="button"
            class="
              rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm
              font-medium text-white shadow-sm
              hover:bg-blue-700
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
            "
            @click="handlePrint"
          >
            {{ silentPrintAvailable ? '預覽列印' : '列印訂單' }}
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- QR Code Section -->
        <div class="rounded-lg bg-white p-6 shadow lg:col-span-2">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            訂單 QR Code
          </h2>
          <div class="flex justify-center">
            <QrcodeVue
              v-if="order"
              :value="order.id"
              :size="200"
              level="H"
            />
          </div>
          <p class="mt-2 text-center text-sm text-gray-500">
            掃描此 QR Code 查看訂單詳細
          </p>
        </div>

        <!-- Customer Information -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            客戶資訊
          </h2>
          <dl class="space-y-3">
            <div>
              <dt class="text-sm font-medium text-gray-500">
                訂單類別
              </dt>
              <dd class="mt-1">
                <span
                  v-if="order"
                  :class="getCategoryColor(order.category)"
                  class="
                    inline-flex rounded-full px-3 py-1 text-xs font-semibold
                  "
                >
                  {{ order.category }}
                </span>
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">
                LINE 名稱
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ order?.lineName }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">
                聯絡電話
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ order?.phone }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Delivery Information -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            配送資訊
          </h2>
          <dl class="space-y-3">
            <div>
              <dt class="text-sm font-medium text-gray-500">
                寄送日期
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ formatDate(order?.deliveryDate || '') }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">
                收貨時間
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ formatTime(order?.pickupTime || '') }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">
                行李數量
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ order?.luggageCount }} 件
              </dd>
            </div>
          </dl>
        </div>

        <!-- Pickup Location -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            起始點
          </h2>
          <dl class="space-y-3">
            <div>
              <dt class="text-sm font-medium text-gray-500">
                地點名稱
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ order?.pickupLocation.name }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">
                地址
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ order?.pickupLocation.address }}
              </dd>
            </div>
            <div v-if="order?.pickupLocation.area">
              <dt class="text-sm font-medium text-gray-500">
                區域
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                區域 {{ order?.pickupLocation.area }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Delivery Location -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            送達點
          </h2>
          <dl class="space-y-3">
            <div>
              <dt class="text-sm font-medium text-gray-500">
                地點名稱
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ order?.deliveryLocation.name }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">
                地址
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ order?.deliveryLocation.address }}
              </dd>
            </div>
            <div v-if="order?.deliveryLocation.area">
              <dt class="text-sm font-medium text-gray-500">
                區域
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                區域 {{ order?.deliveryLocation.area }}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Notes -->
      <div
        v-if="order?.notes"
        class="rounded-lg bg-white p-6 shadow"
      >
        <h2 class="mb-4 text-lg font-semibold text-gray-900">
          備註
        </h2>
        <p class="text-sm text-gray-700">
          {{ order.notes }}
        </p>
      </div>

      <!-- Timestamps -->
      <div class="rounded-lg bg-white p-6 shadow">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">
          時間記錄
        </h2>
        <dl class="grid gap-3 sm:grid-cols-2">
          <div>
            <dt class="text-sm font-medium text-gray-500">
              建立時間
            </dt>
            <dd class="mt-1 text-sm text-gray-900">
              {{ formatDateTime(order?.createdAt || '') }}
            </dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">
              最後更新
            </dt>
            <dd class="mt-1 text-sm text-gray-900">
              {{ formatDateTime(order?.updatedAt || '') }}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  /* 紙張尺寸會由 handlePrint() 動態設定 */

  /* 隱藏所有不需要列印的內容 */
  body * {
    visibility: hidden;
  }

  /* 只顯示列印區域 */
  .print-canvas,
  .print-canvas * {
    visibility: visible;
  }

  /* 確保列印區域在正確位置 */
  .print-canvas {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* 確保 Canvas 正確顯示 */
  canvas {
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
    page-break-after: avoid !important;
    page-break-before: avoid !important;
    page-break-inside: avoid !important;
  }

  /* 移除所有邊距和內距 */
  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
    overflow: hidden !important;
  }

  /* 強制單頁列印 */
  * {
    page-break-after: avoid !important;
    page-break-before: avoid !important;
  }
}
</style>

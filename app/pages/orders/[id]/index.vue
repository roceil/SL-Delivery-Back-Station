<script lang="ts" setup>
import {
  AlertCircle,
  ArrowLeftRight,
  Box,
  Calendar,
  Check,
  ChevronLeft,
  CircleDollarSign,
  ClipboardList,
  Copy,
  FileText,
  MapPin,
  Package,
  Pencil,
  Phone,
  User,
  X,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { usePrintSettingsStore } from '~/stores/printSettings'

interface Location {
  id: string
  name: string
  address: string
  area: string
}

interface FeeItem {
  plan: string
  type: string
  unitPrice: number
  quantity: number
  subtotal: number
}

interface Order {
  id: string
  category: string
  lineName: string
  phone: string
  deliveryDate: string | null
  returnDate?: string | null
  pickupTime: string
  luggageCount: number
  status: string
  pickupLocation: Location
  deliveryLocation: Location
  notes: string
  fees?: FeeItem[]
  recipientName?: string
  recipientPhone?: string
  createdAt: string
  updatedAt?: string
}

const route = useRoute()
const orderId = route.params.id as string
const { setBreadcrumb, clearBreadcrumb } = useBreadcrumb()

useHead({
  title: `訂單詳細 #${orderId} - 行李運送系統`,
})

onMounted(() => {
  setBreadcrumb({ label: orderId })
})

onBeforeRouteLeave(() => {
  clearBreadcrumb()
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

const silentPrintAvailable = ref(false)

onMounted(async () => {
  silentPrintAvailable.value = await checkPrintService()
})

// 一般列印（顯示預覽）
function handlePrint() {
  const canvas = document.querySelector('.print-canvas canvas') as HTMLCanvasElement

  if (!canvas) {
    // eslint-disable-next-line no-alert
    alert('找不到列印內容，請重新整理頁面')
    return
  }

  const dataUrl = canvas.toDataURL('image/png')

  const template = printSettingsStore.currentTemplate
  const mmToPx = 3.7795275591
  const displayWidthPx = template.width * mmToPx
  const displayHeightPx = template.height * mmToPx

  const style = document.createElement('style')
  style.id = 'dynamic-print-style'
  style.textContent = `
    @media print {
      @page {
        size: ${template.width}mm ${template.height}mm;
        margin: 0;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: ${displayWidthPx}px !important;
        height: ${displayHeightPx}px !important;
        overflow: hidden !important;
      }

      .print-canvas {
        display: none !important;
      }

      .print-image-container {
        display: block !important;
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        width: ${displayWidthPx}px !important;
        height: ${displayHeightPx}px !important;
      }

      .print-image-container img {
        display: block !important;
        width: ${displayWidthPx}px !important;
        height: ${displayHeightPx}px !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    }

    @media screen {
      .print-image-container {
        display: none !important;
      }
    }
  `

  const oldStyle = document.getElementById('dynamic-print-style')
  if (oldStyle) {
    oldStyle.remove()
  }

  document.head.appendChild(style)

  let imgContainer = document.getElementById('print-image-container')
  if (!imgContainer) {
    imgContainer = document.createElement('div')
    imgContainer.id = 'print-image-container'
    imgContainer.className = 'print-image-container'
    document.body.appendChild(imgContainer)
  }

  const img = document.createElement('img')
  img.src = dataUrl
  img.alt = 'Print Content'

  imgContainer.innerHTML = ''
  imgContainer.appendChild(img)

  img.onload = () => {
    setTimeout(() => {
      window.print()
    }, 100)
  }
}

// 靜默列印（跳過預覽）
async function handleSilentPrint() {
  try {
    const canvas = document.querySelector('.print-canvas canvas') as HTMLCanvasElement

    if (!canvas) {
      // eslint-disable-next-line no-alert
      alert('找不到列印內容，請重新整理頁面')
      return
    }

    await printCanvas(canvas)
  }
  catch (err: any) {
    console.error('靜默列印失敗:', err)
    // eslint-disable-next-line no-alert
    alert(`列印失敗：${err.message || '未知錯誤'}`)
  }
}

// 複製訂單編號
async function copyOrderId() {
  if (!order.value)
    return
  await navigator.clipboard.writeText(order.value.id)
}

const statusConfig = {
  pending: { text: '待確認', badgeType: 'orange' as const },
  confirmed: { text: '已確認', badgeType: 'blue' as const },
  assigned: { text: '已分配行程', badgeType: 'sky' as const },
  in_delivery: { text: '配送中', badgeType: 'light-sky' as const },
  delivered: { text: '已送達', badgeType: 'green' as const },
  cancelled: { text: '已取消', badgeType: 'red' as const },
}

const categoryConfig = {
  散客: { badgeType: 'blue' as const },
  合作: { badgeType: 'sky' as const },
  Trip: { badgeType: 'green' as const },
  Klook: { badgeType: 'peach' as const },
}

function getStatusText(status: string) {
  return statusConfig[status as keyof typeof statusConfig]?.text || status
}

function getStatusBadgeType(status: string) {
  return statusConfig[status as keyof typeof statusConfig]?.badgeType || 'gray'
}

function getCategoryBadgeType(category: string) {
  return categoryConfig[category as keyof typeof categoryConfig]?.badgeType || 'gray'
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

  return timeString.slice(0, 5)
}

function formatCurrency(amount: number) {
  return `NT$ ${amount.toLocaleString()}`
}
</script>

<template>
  <div class="bg-neutral-100">
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
        :scale="6"
      />
    </div>

    <!-- Screen Layout (Hidden when printing) -->
    <div
      v-if="order"
      class="flex flex-col gap-6 p-8 print:hidden"
    >
      <!-- Header -->
      <div class="flex items-center gap-3">
        <Button
          as-child
          variant="ghost"
          size="icon-sm"
        >
          <NuxtLink to="/orders">
            <ChevronLeft class="size-5" />
          </NuxtLink>
        </Button>
        <h1 class="text-2xl font-bold tracking-wider text-neutral-900">
          訂單編號 {{ order.id }}
        </h1>
        <button
          type="button"
          class="text-neutral-400 hover:text-neutral-600"
          @click="copyOrderId"
        >
          <Copy class="size-4" />
        </button>
        <UiBadge
          :type="getStatusBadgeType(order.status)"
          :label="getStatusText(order.status)"
          size="lg"
        />
        <!-- TODO: 等 API 支援後改為動態資料 -->
        <UiBadge
          type="sky"
          label="待交付"
          size="lg"
        />
        <UiBadge
          type="gray"
          label="已付款"
          size="lg"
        />
        <UiBadge
          type="amber"
          label="認領未分配"
          size="lg"
        />
      </div>

      <!-- Two-column layout -->
      <div class="grid gap-6 lg:grid-cols-[1fr_300px]">
        <!-- Main Content -->
        <div class="flex flex-col gap-4">
          <!-- 旅客資訊 -->
          <div class="rounded-md border border-neutral-200 bg-neutral-0 p-6">
            <div class="mb-4 flex items-center gap-2">
              <User class="size-5 text-neutral-900" />
              <h2
                class="text-base font-semibold tracking-wider text-neutral-900"
              >
                旅客資訊
              </h2>
            </div>
            <dl class="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3">
              <dt class="text-sm tracking-wider text-neutral-500">
                類別
              </dt>
              <dd>
                <UiBadge
                  :type="getCategoryBadgeType(order.category)"
                  :label="order.category"
                  size="sm"
                />
              </dd>
              <dt class="text-sm tracking-wider text-neutral-500">
                旅客姓名
              </dt>
              <dd class="text-sm tracking-wider text-neutral-900">
                {{ order.lineName }}
              </dd>
              <dt class="text-sm tracking-wider text-neutral-500">
                聯絡電話
              </dt>
              <dd class="text-sm tracking-wider text-neutral-900">
                {{ order.phone }}
              </dd>
            </dl>
          </div>

          <!-- 寄件日期 -->
          <div class="rounded-md border border-neutral-200 bg-neutral-0 p-6">
            <div class="mb-4 flex items-center gap-2">
              <Calendar class="size-5 text-neutral-900" />
              <h2
                class="text-base font-semibold tracking-wider text-neutral-900"
              >
                寄件日期
              </h2>
            </div>
            <dl class="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3">
              <dt class="text-sm tracking-wider text-neutral-500">
                去程
              </dt>
              <dd class="text-sm tracking-wider text-neutral-900">
                {{ formatDate(order.deliveryDate) }}
              </dd>
            </dl>
          </div>

          <!-- 起始點 / 送達點 -->
          <div class="flex items-stretch gap-2">
            <!-- 起始點 -->
            <div
              class="flex-1 rounded-md border border-neutral-200 bg-white p-6"
            >
              <div class="mb-4 flex items-center gap-2">
                <MapPin class="size-5 text-neutral-900" />
                <h2
                  class="
                    text-base font-semibold tracking-wider text-neutral-900
                  "
                >
                  起始點
                </h2>
              </div>
              <dl class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <dt
                    class="
                      min-w-[100px] shrink-0 text-sm tracking-wider
                      text-neutral-500
                    "
                  >
                    起始地點
                  </dt>
                  <dd class="text-sm tracking-wider text-neutral-900">
                    {{ order.pickupLocation.name }}
                  </dd>
                </div>
                <div class="flex items-center gap-2">
                  <dt
                    class="
                      min-w-[100px] shrink-0 text-sm tracking-wider
                      text-neutral-500
                    "
                  >
                    地址
                  </dt>
                  <dd class="text-sm tracking-wider text-neutral-900">
                    {{ order.pickupLocation.address }}
                  </dd>
                </div>
                <div
                  v-if="order.pickupLocation.area"
                  class="flex items-center gap-2"
                >
                  <dt
                    class="
                      min-w-[100px] shrink-0 text-sm tracking-wider
                      text-neutral-500
                    "
                  >
                    區域
                  </dt>
                  <dd class="text-sm tracking-wider text-neutral-900">
                    區域 {{ order.pickupLocation.area }}
                  </dd>
                </div>
              </dl>
            </div>

            <!-- 交換圖示 -->
            <div class="flex items-center justify-center">
              <ArrowLeftRight class="size-5 text-neutral-400" />
            </div>

            <!-- 送達點 -->
            <div
              class="flex-1 rounded-md border border-neutral-200 bg-white p-6"
            >
              <div class="mb-4 flex items-center gap-2">
                <MapPin class="size-5 text-neutral-900" />
                <h2
                  class="
                    text-base font-semibold tracking-wider text-neutral-900
                  "
                >
                  送達點
                </h2>
              </div>
              <dl class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <dt
                    class="
                      min-w-[100px] shrink-0 text-sm tracking-wider
                      text-neutral-500
                    "
                  >
                    送達地點
                  </dt>
                  <dd class="text-sm tracking-wider text-neutral-900">
                    {{ order.deliveryLocation.name }}
                  </dd>
                </div>
                <div class="flex items-center gap-2">
                  <dt
                    class="
                      min-w-[100px] shrink-0 text-sm tracking-wider
                      text-neutral-500
                    "
                  >
                    地址
                  </dt>
                  <dd class="text-sm tracking-wider text-neutral-900">
                    {{ order.deliveryLocation.address }}
                  </dd>
                </div>
                <div
                  v-if="order.deliveryLocation.area"
                  class="flex items-center gap-2"
                >
                  <dt
                    class="
                      min-w-[100px] shrink-0 text-sm tracking-wider
                      text-neutral-500
                    "
                  >
                    區域
                  </dt>
                  <dd class="text-sm tracking-wider text-neutral-900">
                    區域 {{ order.deliveryLocation.area }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- 備註 -->
          <div
            class="rounded-md border border-warning-200 bg-neutral-0 p-6"
          >
            <div class="mb-4 flex items-center gap-2">
              <ClipboardList class="size-5 text-neutral-900" />
              <h2
                class="text-base font-semibold tracking-wider text-neutral-900"
              >
                備註
              </h2>
            </div>
            <p class="text-sm tracking-wider text-neutral-900">
              內有易碎物品，運送時請小心。
            </p>
          </div>

          <!-- 費用明細 -->
          <div class="rounded-md border border-neutral-200 bg-neutral-0 p-6">
            <div class="mb-4 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <CircleDollarSign class="size-5 text-neutral-900" />
                <h2
                  class="
                    text-base font-semibold tracking-wider text-neutral-900
                  "
                >
                  費用明細
                </h2>
              </div>
              <!-- TODO: 等 API 支援後改為動態資料 -->
              <UiBadge
                type="green"
                label="已付款"
                size="sm"
              />
            </div>
            <table class="w-full">
              <thead>
                <tr class="border-b border-neutral-200">
                  <th
                    class="
                      px-4 py-3 text-left text-sm font-medium tracking-wider
                      text-neutral-500
                    "
                  >
                    方案
                  </th>
                  <th
                    class="
                      px-4 py-3 text-left text-sm font-medium tracking-wider
                      text-neutral-500
                    "
                  >
                    種類
                  </th>
                  <th
                    class="
                      px-4 py-3 text-left text-sm font-medium tracking-wider
                      text-neutral-500
                    "
                  >
                    單價
                  </th>
                  <th
                    class="
                      px-4 py-3 text-left text-sm font-medium tracking-wider
                      text-neutral-500
                    "
                  >
                    行李數量
                  </th>
                  <th
                    class="
                      px-4 py-3 text-right text-sm font-medium tracking-wider
                      text-neutral-500
                    "
                  >
                    小計
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-neutral-200">
                  <td
                    class="
                      h-[60px] px-4 text-sm tracking-wider text-neutral-900
                    "
                  >
                    雙程套票
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-sm tracking-wider text-neutral-500
                    "
                  >
                    -
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-sm tracking-wider text-neutral-900
                    "
                  >
                    NT$ 250
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-sm tracking-wider text-neutral-900
                    "
                  >
                    2
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-right text-sm tracking-wider
                      text-neutral-900
                    "
                  >
                    NT$ 500
                  </td>
                </tr>
                <tr class="border-b border-neutral-200">
                  <td
                    class="
                      h-[60px] px-4 text-sm tracking-wider text-neutral-900
                    "
                  >
                    加值服務
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-sm tracking-wider text-neutral-900
                    "
                  >
                    大型行李
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-sm tracking-wider text-neutral-900
                    "
                  >
                    NT$ 50
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-sm tracking-wider text-neutral-900
                    "
                  >
                    1
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-right text-sm tracking-wider
                      text-neutral-900
                    "
                  >
                    NT$ 50
                  </td>
                </tr>
                <tr class="border-b border-neutral-200">
                  <td
                    class="
                      h-[60px] px-4 text-sm tracking-wider text-neutral-900
                    "
                  >
                    加值服務
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-sm tracking-wider text-neutral-900
                    "
                  >
                    專業裝備
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-sm tracking-wider text-neutral-900
                    "
                  >
                    NT$ 100
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-sm tracking-wider text-neutral-900
                    "
                  >
                    2
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-right text-sm tracking-wider
                      text-neutral-900
                    "
                  >
                    NT$ 200
                  </td>
                </tr>
                <tr class="border-b border-neutral-200">
                  <td
                    class="
                      h-[60px] px-4 text-sm tracking-wider text-neutral-900
                    "
                  >
                    加值服務
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-sm tracking-wider text-neutral-900
                    "
                  >
                    <div>特殊物件</div>
                    <div class="text-xs text-neutral-500">
                      嬰兒車
                    </div>
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-sm tracking-wider text-neutral-900
                    "
                  >
                    NT$ 200
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-sm tracking-wider text-neutral-900
                    "
                  >
                    1
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-right text-sm tracking-wider
                      text-neutral-900
                    "
                  >
                    NT$ 200
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colspan="4"
                    class="
                      h-[60px] px-4 text-sm font-medium tracking-wider
                      text-neutral-900
                    "
                  >
                    總計
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-right text-xl font-bold tracking-wider
                      text-primary-300
                    "
                  >
                    NT$ 950
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- 領件資訊 -->
          <div class="rounded-md border border-neutral-200 bg-neutral-0 p-6">
            <div class="mb-4 flex items-center gap-2">
              <Box class="size-5 text-neutral-900" />
              <h2
                class="text-base font-semibold tracking-wider text-neutral-900"
              >
                領件資訊
              </h2>
            </div>
            <dl class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <dt
                  class="
                    min-w-[100px] shrink-0 text-sm tracking-wider
                    text-neutral-500
                  "
                >
                  領件人
                </dt>
                <dd class="text-sm tracking-wider text-neutral-900">
                  洗齒坦
                </dd>
              </div>
              <div class="flex items-center gap-2">
                <dt
                  class="
                    min-w-[100px] shrink-0 text-sm tracking-wider
                    text-neutral-500
                  "
                >
                  聯絡電話
                </dt>
                <dd class="text-sm tracking-wider text-neutral-900">
                  0912345678
                </dd>
              </div>
            </dl>
          </div>

          <!-- 訂單資訊 -->
          <div class="rounded-md border border-neutral-200 bg-neutral-0 p-6">
            <div class="mb-4 flex items-center gap-2">
              <FileText class="size-5 text-neutral-900" />
              <h2
                class="text-base font-semibold tracking-wider text-neutral-900"
              >
                訂單資訊
              </h2>
            </div>
            <dl class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <dt
                  class="
                    min-w-[100px] shrink-0 text-sm tracking-wider
                    text-neutral-500
                  "
                >
                  訂單編號
                </dt>
                <dd class="text-sm tracking-wider text-neutral-900">
                  LSE12345670
                </dd>
              </div>
              <div class="flex items-center gap-2">
                <dt
                  class="
                    min-w-[100px] shrink-0 text-sm tracking-wider
                    text-neutral-500
                  "
                >
                  建立時間
                </dt>
                <dd class="text-sm tracking-wider text-neutral-900">
                  2026/2/10 12:00
                </dd>
              </div>
              <div class="flex items-center gap-2">
                <dt
                  class="
                    min-w-[100px] shrink-0 text-sm tracking-wider
                    text-neutral-500
                  "
                >
                  最後更新
                </dt>
                <dd class="text-sm tracking-wider text-neutral-900">
                  2026/2/10 12:00
                </dd>
              </div>
              <div class="flex items-center gap-2">
                <dt
                  class="
                    min-w-[100px] shrink-0 text-sm tracking-wider
                    text-neutral-500
                  "
                >
                  修改紀錄
                </dt>
                <dd>
                  <a
                    href="#"
                    class="
                      text-sm tracking-wider text-primary-300
                      hover:underline
                    "
                  >
                    查看詳情
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="sticky top-8 flex flex-col gap-4 self-start">
          <!-- 待確認警告 -->
          <div
            v-if="order.status === 'pending'"
            class="
              flex items-start gap-2 rounded-md border border-info-200
              bg-info-100 p-3
            "
          >
            <AlertCircle class="mt-0.5 size-4 shrink-0 text-info-300" />
            <p class="text-sm font-medium tracking-wider text-info-300">
              訂單尚未確認，請儘快處理以利安排運送行程
            </p>
          </div>

          <!-- 快速操作 -->
          <div class="rounded-md border border-info-200 bg-neutral-0 p-6">
            <h3
              class="mb-2 text-lg font-bold tracking-wider text-neutral-900"
            >
              快速操作
            </h3>
            <div class="flex flex-col gap-2">
              <Button
                v-if="order.status === 'pending'"
                class="w-full justify-center"
              >
                <Check class="size-4" />
                確認訂單
              </Button>
              <Button
                variant="outline"
                class="w-full justify-center"
              >
                <Package class="size-4" />
                新增加值服務
              </Button>
            </div>
          </div>

          <!-- 其他 -->
          <div class="rounded-md border border-neutral-200 bg-neutral-0 p-6">
            <h3
              class="mb-2 text-lg font-bold tracking-wider text-neutral-900"
            >
              其他
            </h3>
            <div class="flex flex-col gap-2">
              <Button
                v-if="order.phone"
                as-child
                variant="outline"
                class="w-full justify-center"
              >
                <a :href="`tel:${order.phone}`">
                  <Phone class="size-4" />
                  聯絡旅客
                </a>
              </Button>
              <Button
                as-child
                variant="outline"
                class="w-full justify-center"
              >
                <NuxtLink :to="`/orders/${order.id}/edit`">
                  <Pencil class="size-4" />
                  編輯訂單
                </NuxtLink>
              </Button>
              <Button
                variant="outline"
                class="w-full justify-center"
              >
                <X class="size-4" />
                取消訂單
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }

  .print-canvas,
  .print-canvas * {
    visibility: visible;
  }

  .print-canvas {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  canvas {
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
    page-break-after: avoid !important;
    page-break-before: avoid !important;
    page-break-inside: avoid !important;
  }

  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
    overflow: hidden !important;
  }

  * {
    page-break-after: avoid !important;
    page-break-before: avoid !important;
  }
}
</style>

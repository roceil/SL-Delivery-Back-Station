<script lang="ts" setup>
import {
  AlertCircle,
  ArrowLeftRight,
  Box,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Copy,
  FileText,
  MapPin,
  Package,
  Pencil,
  Phone,
  Store,
  Ticket,
  Truck,
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
  orderNumber: string
  voucherId: string | null
  userId: number | null
  category: string
  lineName: string
  phone: string
  deliveryDate: string | null
  returnDate: string | null
  pickupTime: string
  luggageCount: number
  servicePlan: string | null
  paymentStatus: string | null
  recipientName: string | null
  recipientPhone: string | null
  status: string
  scheduleId: string | null
  pickupLocation: Location
  deliveryLocation: Location
  notes: string
  fees?: FeeItem[]
  createdAt: string
  updatedAt: string
}

const route = useRoute()
const orderId = route.params.id as string
const { setBreadcrumb, clearBreadcrumb } = useBreadcrumb()

useHead({
  title: `訂單詳細 #${orderId} - 行李運送系統`,
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
  setBreadcrumb({ label: order.value?.orderNumber || orderId })
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

const categoryConfig = {
  散客: { badgeType: 'sky' as const },
  合作: { badgeType: 'light-sky' as const },
  Trip: { badgeType: 'peach' as const },
  Klook: { badgeType: 'amber' as const },
  KKday: { badgeType: 'mint' as const },
}

const paymentStatusConfig = {
  paid: { text: '已付款', badgeType: 'green' as const },
  unpaid: { text: '待付款', badgeType: 'orange' as const },
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

// 是否為商家代售模式
const isReseller = computed(() => order.value?.servicePlan === 'merchant')

// 修改紀錄彈窗
const showHistoryModal = ref(false)
const selectedHistoryIndex = ref(0)

interface HistoryChange {
  field: string
  from: string
  to: string
}

interface HistoryItem {
  id: number
  datetime: string
  changes: HistoryChange[]
}

const { data: rawHistory } = await useFetch<Array<{
  id: number
  field_name: string
  old_value: string | null
  new_value: string | null
  changed_at: string
}>>(`/api/orders/${orderId}/history`)

const historyItems = computed<HistoryItem[]>(() => {
  if (!rawHistory.value?.length)
    return []
  return rawHistory.value.map(h => ({
    id: h.id,
    datetime: new Date(h.changed_at).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    changes: [{ field: h.field_name, from: h.old_value ?? '無', to: h.new_value ?? '無' }],
  }))
})

// 費用明細
const { data: fees } = await useFetch<Array<{
  id: number
  item_type: string
  item_name: string
  unit_price: number
  quantity: number
  subtotal: number
}>>(`/api/orders/${orderId}/fees`)

const totalFees = computed(() => fees.value?.reduce((sum, f) => sum + f.subtotal, 0) ?? 0)

// 去回程
const isRoundTrip = computed(() => order.value?.servicePlan === 'round_trip')

// 運送步驟進度（共 6 步）
const completedStepsCount = computed(() => {
  const map: Record<string, number> = {
    pending: 0,
    confirmed: 2,
    assigned: 2,
    in_delivery: 4,
    delivered: 6,
    cancelled: 0,
  }
  return map[order.value?.status ?? ''] ?? 0
})

function isStepDone(n: number) {
  return completedStepsCount.value >= n
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
          訂單編號 {{ order.orderNumber || order.id }}
        </h1>
        <button
          type="button"
          class="text-neutral-400 hover:text-neutral-600"
          @click="copyOrderId"
        >
          <Copy class="size-4" />
        </button>
        <Badge
          :type="getOrderStatusBadge(order.status, !!order.scheduleId).type"
          :label="getOrderStatusBadge(order.status, !!order.scheduleId).label"
          size="lg"
        />
        <Badge
          v-if="order.paymentStatus"
          :type="paymentStatusConfig[order.paymentStatus as keyof typeof paymentStatusConfig]?.badgeType ?? 'gray'"
          :label="paymentStatusConfig[order.paymentStatus as keyof typeof paymentStatusConfig]?.text ?? order.paymentStatus"
          size="lg"
        />
        <Badge
          v-if="order.scheduleId"
          type="sky"
          label="已分配行程"
          size="lg"
        />
        <Badge
          v-if="isReseller"
          type="light-sky"
          label="商家代售"
          size="lg"
        />
      </div>

      <!-- Two-column layout -->
      <div class="grid gap-6 lg:grid-cols-[1fr_300px]">
        <!-- Main Content -->
        <div class="flex flex-col gap-4">
          <!-- 商家代售資訊 -->
          <div
            v-if="isReseller"
            class="rounded-md border border-neutral-200 bg-neutral-0 p-6"
          >
            <div class="mb-4 flex items-center gap-2">
              <Store class="size-5 text-neutral-900" />
              <h2
                class="text-base font-semibold tracking-wider text-neutral-900"
              >
                商家代售
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
                  類別
                </dt>
                <dd>
                  <Badge
                    type="green"
                    label="代售"
                    size="sm"
                  />
                </dd>
              </div>
              <div class="flex items-center gap-2">
                <dt
                  class="
                    min-w-[100px] shrink-0 text-sm tracking-wider
                    text-neutral-500
                  "
                >
                  商家
                </dt>
                <dd class="text-sm tracking-wider text-neutral-900">
                  {{ order.lineName }}
                </dd>
              </div>
              <div class="flex items-center gap-2">
                <dt
                  class="
                    min-w-[100px] shrink-0 text-sm tracking-wider
                    text-neutral-500
                  "
                >
                  運送日期
                </dt>
                <dd class="text-sm tracking-wider text-neutral-900">
                  {{ formatDate(order.deliveryDate) }}
                </dd>
              </div>
            </dl>
          </div>

          <!-- 旅客資訊（一般訂單） -->
          <div
            v-if="!isReseller"
            class="rounded-md border border-neutral-200 bg-neutral-0 p-6"
          >
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
                <Badge
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

          <!-- 旅客資訊（商家代售） -->
          <div
            v-else
            class="rounded-md border border-neutral-200 bg-neutral-0 p-6"
          >
            <div class="mb-4 flex items-center gap-2">
              <User class="size-5 text-neutral-900" />
              <h2
                class="
                  flex-1 text-base font-semibold tracking-wider text-neutral-900
                "
              >
                旅客資訊
              </h2>
              <span class="text-sm tracking-wider text-neutral-500">
                {{ order.luggageCount }} 件行李
              </span>
            </div>
            <div class="flex-1 rounded-xl bg-neutral-100 p-4">
              <p class="mb-2 text-lg font-bold tracking-wider text-neutral-900">
                {{ order.lineName }}
              </p>
              <dl class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <dt
                    class="
                      min-w-[76px] shrink-0 text-base tracking-wider
                      text-neutral-600
                    "
                  >
                    行李件數
                  </dt>
                  <dd class="flex-1 text-base tracking-wider text-neutral-900">
                    {{ order.luggageCount }} 件
                  </dd>
                </div>
                <div class="flex items-center gap-2">
                  <dt
                    class="
                      min-w-[76px] shrink-0 text-base tracking-wider
                      text-neutral-600
                    "
                  >
                    聯絡電話
                  </dt>
                  <dd class="flex-1 text-base tracking-wider text-neutral-900">
                    {{ order.phone || '-' }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- 寄件日期（一般訂單） -->
          <div
            v-if="!isReseller"
            class="rounded-md border border-neutral-200 bg-neutral-0 p-6"
          >
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
              <template v-if="isRoundTrip">
                <dt class="text-sm tracking-wider text-neutral-500">
                  回程
                </dt>
                <dd class="text-sm tracking-wider text-neutral-900">
                  {{ formatDate(order.returnDate) }}
                </dd>
              </template>
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
              {{ order.notes || '無備註' }}
            </p>
          </div>

          <!-- 運送資訊 -->
          <div class="rounded-md border border-neutral-200 bg-neutral-0 p-6">
            <div class="mb-4 flex items-center gap-2">
              <Truck class="size-5 text-neutral-900" />
              <h2
                class="
                  flex-1 text-base font-semibold tracking-wider text-neutral-900
                "
              >
                運送狀態
              </h2>
            </div>

            <div class="flex items-stretch gap-2">
              <!-- 去程 -->
              <div class="flex-1 rounded-xl bg-neutral-100 p-3">
                <div
                  class="
                    flex flex-wrap items-center justify-between gap-2 border-b
                    border-neutral-200 pb-3
                  "
                >
                  <div class="flex items-center gap-2">
                    <Badge
                      type="green"
                      label="去程"
                      size="sm"
                    />
                    <div
                      class="
                        flex items-center gap-1 text-base font-medium
                        tracking-wider text-neutral-600
                      "
                    >
                      <span>{{ order.pickupLocation.name }}</span>
                      <ChevronRight class="size-4 shrink-0" />
                      <span>{{ order.deliveryLocation.name }}</span>
                    </div>
                  </div>
                  <NuxtLink
                    v-if="order.scheduleId"
                    :to="`/schedules/${order.scheduleId}`"
                    class="text-sm font-medium tracking-wider text-primary-300"
                  >
                    行程編號 {{ order.scheduleId }}
                  </NuxtLink>
                  <span
                    v-else
                    class="text-sm tracking-wider text-neutral-400"
                  >未分配行程</span>
                </div>

                <div class="mt-3">
                  <div
                    v-for="(step, i) in [
                      '訂單確認中',
                      '訂單成立，待交付行李',
                      '已收件',
                      '運送中',
                      '已送達',
                      '已完成',
                    ]"
                    :key="step"
                    class="flex gap-2"
                  >
                    <div class="flex flex-col items-center">
                      <div
                        :class="
                          isStepDone(i + 1)
                            ? 'bg-primary-300'
                            : 'bg-neutral-200'
                        "
                        class="
                          flex size-8 shrink-0 items-center justify-center
                          rounded-full
                        "
                      >
                        <Check
                          v-if="isStepDone(i + 1)"
                          class="size-4 text-white"
                        />
                      </div>
                      <div
                        v-if="i < 5"
                        :class="
                          isStepDone(i + 2)
                            ? 'bg-primary-300'
                            : 'bg-neutral-200'
                        "
                        class="w-px flex-1"
                      ></div>
                    </div>
                    <div
                      :class="i < 5 ? 'h-12' : ''"
                      class="flex flex-1 items-start pt-1"
                    >
                      <span
                        :class="
                          isStepDone(i + 1)
                            ? 'text-neutral-900'
                            : 'text-neutral-600'
                        "
                        class="text-base font-medium tracking-wider"
                      >{{ step }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 回程（僅雙程訂單） -->
              <div
                v-if="isRoundTrip"
                class="flex-1 rounded-xl bg-neutral-100 p-3"
              >
                <div
                  class="
                    flex flex-wrap items-center justify-between gap-2 border-b
                    border-neutral-200 pb-3
                  "
                >
                  <div class="flex items-center gap-2">
                    <Badge
                      type="gray"
                      label="回程"
                      size="sm"
                    />
                    <div
                      class="
                        flex items-center gap-1 text-base font-medium
                        tracking-wider text-neutral-600
                      "
                    >
                      <span>{{ order.deliveryLocation.name }}</span>
                      <ChevronRight class="size-4 shrink-0" />
                      <span>{{ order.pickupLocation.name }}</span>
                    </div>
                  </div>
                  <span class="text-sm tracking-wider text-neutral-400">
                    未分配行程
                  </span>
                </div>

                <div class="mt-3">
                  <div
                    v-for="(step, i) in [
                      '待交付行李',
                      '已收件',
                      '運送中',
                      '已送達',
                      '已完成',
                    ]"
                    :key="step"
                    class="flex gap-2"
                  >
                    <div class="flex flex-col items-center">
                      <div class="size-8 shrink-0 rounded-full bg-neutral-200"></div>
                      <div
                        v-if="i < 4"
                        class="w-px flex-1 bg-neutral-200"
                      ></div>
                    </div>
                    <div
                      :class="i < 4 ? 'h-12' : ''"
                      class="flex flex-1 items-start pt-1"
                    >
                      <span
                        class="
                          text-base font-medium tracking-wider text-neutral-600
                        "
                      >{{ step }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 費用明細（一般訂單） -->
          <div
            v-if="!isReseller"
            class="rounded-md border border-neutral-200 bg-neutral-0 p-6"
          >
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
              <Badge
                v-if="order.paymentStatus"
                :type="paymentStatusConfig[order.paymentStatus as keyof typeof paymentStatusConfig]?.badgeType ?? 'gray'"
                :label="paymentStatusConfig[order.paymentStatus as keyof typeof paymentStatusConfig]?.text ?? order.paymentStatus"
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
                <tr
                  v-if="!fees?.length"
                  class="border-b border-neutral-200"
                >
                  <td
                    colspan="5"
                    class="
                      h-[60px] px-4 text-center text-sm tracking-wider
                      text-neutral-400
                    "
                  >
                    尚無費用明細
                  </td>
                </tr>
                <tr
                  v-for="fee in fees"
                  :key="fee.id"
                  class="border-b border-neutral-200"
                >
                  <td
                    class="
                      h-[60px] px-4 text-sm tracking-wider text-neutral-900
                    "
                  >
                    {{ fee.item_type === 'plan' ? '方案' : '加值服務' }}
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-sm tracking-wider text-neutral-900
                    "
                  >
                    {{ fee.item_name }}
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-sm tracking-wider text-neutral-900
                    "
                  >
                    {{ formatCurrency(fee.unit_price) }}
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-sm tracking-wider text-neutral-900
                    "
                  >
                    {{ fee.quantity }}
                  </td>
                  <td
                    class="
                      h-[60px] px-4 text-right text-sm tracking-wider
                      text-neutral-900
                    "
                  >
                    {{ formatCurrency(fee.subtotal) }}
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
                    {{ formatCurrency(totalFees) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- 票券明細（商家代售） -->
          <div
            v-if="isReseller"
            class="rounded-md border border-neutral-200 bg-neutral-0 p-6"
          >
            <div class="mb-4 flex items-center gap-2">
              <Ticket class="size-5 text-neutral-900" />
              <h2
                class="text-base font-semibold tracking-wider text-neutral-900"
              >
                票券明細
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
                  本次使用
                </dt>
                <dd class="text-sm tracking-wider text-neutral-900">
                  {{ order.luggageCount }} 張
                </dd>
              </div>
            </dl>
          </div>

          <!-- 領件資訊（一般訂單） -->
          <div
            v-if="!isReseller && (order.recipientName || order.recipientPhone)"
            class="rounded-md border border-neutral-200 bg-neutral-0 p-6"
          >
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
                  {{ order.recipientName || '-' }}
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
                  {{ order.recipientPhone || '-' }}
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
                  {{ order.orderNumber || order.id }}
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
                  {{ formatDateTime(order.createdAt) }}
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
                  {{ formatDateTime(order.updatedAt) }}
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
                  <button
                    type="button"
                    class="
                      text-sm tracking-wider text-primary-300
                      hover:underline
                    "
                    @click="showHistoryModal = true"
                  >
                    查看詳情
                  </button>
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
                v-if="isReseller"
                variant="outline"
                class="w-full justify-center"
              >
                <Store class="size-4" />
                聯絡商家
              </Button>
              <Button
                v-if="!isReseller && order.phone"
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

  <!-- 修改紀錄彈窗 -->
  <Teleport to="body">
    <div
      v-if="showHistoryModal"
      class="
        fixed inset-0 z-50 flex items-center justify-center
        bg-[rgba(33,37,41,0.6)] backdrop-blur-[12px]
      "
      @click.self="showHistoryModal = false"
    >
      <div
        class="
          relative flex h-[760px] w-[1080px] overflow-hidden rounded-2xl border
          border-neutral-200 bg-white
          shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
        "
      >
        <!-- 關閉按鈕 -->
        <button
          type="button"
          class="
            absolute top-2 right-2 z-10 flex items-center justify-center
            rounded-full p-2
            hover:bg-neutral-100
          "
          @click="showHistoryModal = false"
        >
          <X class="size-4 text-neutral-600" />
        </button>

        <!-- 左側：訂單詳情 -->
        <div class="flex-1 overflow-y-auto bg-neutral-100 p-8">
          <h1 class="mb-6 text-2xl font-bold tracking-wider text-neutral-900">
            訂單編號 {{ order?.id }}
          </h1>

          <!-- 旅客資訊 -->
          <div
            class="
              mb-4 rounded-2xl border border-neutral-200 bg-white p-6
              shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <div class="mb-4 flex items-center gap-2">
              <User class="size-5 text-neutral-900" />
              <h2 class="text-lg font-bold tracking-wider text-neutral-900">
                旅客資訊
              </h2>
            </div>
            <dl class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <dt
                  class="
                    min-w-[100px] shrink-0 text-base tracking-wider
                    text-neutral-600
                  "
                >
                  類別
                </dt>
                <dd>
                  <Badge
                    :type="getCategoryBadgeType(order?.category ?? '')"
                    :label="order?.category ?? '-'"
                    size="sm"
                  />
                </dd>
              </div>
              <div class="flex items-center gap-2">
                <dt
                  class="
                    min-w-[100px] shrink-0 text-base tracking-wider
                    text-neutral-600
                  "
                >
                  旅客姓名
                </dt>
                <dd class="text-base tracking-wider text-neutral-900">
                  {{ order?.lineName }}
                </dd>
              </div>
              <div class="flex items-center gap-2">
                <dt
                  class="
                    min-w-[100px] shrink-0 text-base tracking-wider
                    text-neutral-600
                  "
                >
                  聯絡電話
                </dt>
                <dd class="text-base tracking-wider text-neutral-900">
                  {{ order?.phone }}
                </dd>
              </div>
            </dl>
          </div>

          <!-- 費用明細 -->
          <div
            class="
              mb-4 rounded-2xl border border-neutral-200 bg-white p-6
              shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <div class="mb-4 flex items-center gap-2">
              <CircleDollarSign class="size-5 text-neutral-900" />
              <h2 class="text-lg font-bold tracking-wider text-neutral-900">
                費用明細
              </h2>
            </div>
            <dl class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <dt
                  class="
                    min-w-[100px] shrink-0 text-base tracking-wider
                    text-neutral-600
                  "
                >
                  行李數量
                </dt>
                <dd class="text-base tracking-wider text-neutral-900">
                  {{ order?.luggageCount }} 件
                </dd>
              </div>
              <div class="flex items-center gap-2">
                <dt
                  class="
                    min-w-[100px] shrink-0 text-base tracking-wider
                    text-neutral-600
                  "
                >
                  總計
                </dt>
                <dd class="text-base tracking-wider text-neutral-900">
                  {{ formatCurrency(totalFees) }}
                </dd>
              </div>
              <div class="flex items-center gap-2">
                <dt
                  class="
                    min-w-[100px] shrink-0 text-base tracking-wider
                    text-neutral-600
                  "
                >
                  付款狀態
                </dt>
                <dd class="text-base tracking-wider text-neutral-900">
                  {{
                    order?.paymentStatus
                      ? (paymentStatusConfig[order.paymentStatus as keyof typeof paymentStatusConfig]?.text ?? order.paymentStatus)
                      : '-'
                  }}
                </dd>
              </div>
            </dl>
          </div>

          <!-- 起始點 / 送達點 -->
          <div class="mb-4 flex gap-4">
            <div
              class="
                flex-1 rounded-2xl border border-neutral-200 bg-white p-6
                shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
              "
            >
              <div class="mb-4 flex items-center gap-2">
                <MapPin class="size-5 text-neutral-900" />
                <h2 class="text-lg font-bold tracking-wider text-neutral-900">
                  起始點
                </h2>
              </div>
              <dl class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <dt
                    class="
                      min-w-[100px] shrink-0 text-base tracking-wider
                      text-neutral-600
                    "
                  >
                    起始地點
                  </dt>
                  <dd class="text-base tracking-wider text-neutral-900">
                    {{ order?.pickupLocation?.name }}
                  </dd>
                </div>
                <div class="flex items-center gap-2">
                  <dt
                    class="
                      min-w-[100px] shrink-0 text-base tracking-wider
                      text-neutral-600
                    "
                  >
                    地址
                  </dt>
                  <dd class="text-base tracking-wider text-neutral-900">
                    {{ order?.pickupLocation?.address }}
                  </dd>
                </div>
                <div
                  v-if="order?.pickupLocation?.area"
                  class="flex items-center gap-2"
                >
                  <dt
                    class="
                      min-w-[100px] shrink-0 text-base tracking-wider
                      text-neutral-600
                    "
                  >
                    區域
                  </dt>
                  <dd class="text-base tracking-wider text-neutral-900">
                    區域 {{ order?.pickupLocation?.area }}
                  </dd>
                </div>
              </dl>
            </div>

            <div
              class="
                flex-1 rounded-2xl border border-neutral-200 bg-white p-6
                shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
              "
            >
              <div class="mb-4 flex items-center gap-2">
                <MapPin class="size-5 text-neutral-900" />
                <h2 class="text-lg font-bold tracking-wider text-neutral-900">
                  送達點
                </h2>
              </div>
              <dl class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <dt
                    class="
                      min-w-[100px] shrink-0 text-base tracking-wider
                      text-neutral-600
                    "
                  >
                    送達地點
                  </dt>
                  <dd class="text-base tracking-wider text-neutral-900">
                    {{ order?.deliveryLocation?.name }}
                  </dd>
                </div>
                <div class="flex items-center gap-2">
                  <dt
                    class="
                      min-w-[100px] shrink-0 text-base tracking-wider
                      text-neutral-600
                    "
                  >
                    地址
                  </dt>
                  <dd class="text-base tracking-wider text-neutral-900">
                    {{ order?.deliveryLocation?.address }}
                  </dd>
                </div>
                <div
                  v-if="order?.deliveryLocation?.area"
                  class="flex items-center gap-2"
                >
                  <dt
                    class="
                      min-w-[100px] shrink-0 text-base tracking-wider
                      text-neutral-600
                    "
                  >
                    區域
                  </dt>
                  <dd class="text-base tracking-wider text-neutral-900">
                    區域 {{ order?.deliveryLocation?.area }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- 備註 -->
          <div
            class="
              mb-4 rounded-2xl border border-warning-200 bg-white p-6
              shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <div class="mb-4 flex items-center gap-2">
              <ClipboardList class="size-5 text-neutral-900" />
              <h2 class="text-lg font-bold tracking-wider text-neutral-900">
                備註
              </h2>
            </div>
            <p class="text-base tracking-wider text-neutral-900">
              {{ order?.notes || '無備註' }}
            </p>
          </div>

          <!-- 領件資訊 -->
          <div
            class="
              mb-4 rounded-2xl border border-neutral-200 bg-white p-6
              shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <div class="mb-4 flex items-center gap-2">
              <Box class="size-5 text-neutral-900" />
              <h2 class="text-lg font-bold tracking-wider text-neutral-900">
                領件資訊
              </h2>
            </div>
            <dl class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <dt
                  class="
                    min-w-[100px] shrink-0 text-base tracking-wider
                    text-neutral-600
                  "
                >
                  領件人
                </dt>
                <dd class="text-base tracking-wider text-neutral-900">
                  {{ order?.recipientName || '-' }}
                </dd>
              </div>
              <div class="flex items-center gap-2">
                <dt
                  class="
                    min-w-[100px] shrink-0 text-base tracking-wider
                    text-neutral-600
                  "
                >
                  聯絡電話
                </dt>
                <dd class="text-base tracking-wider text-neutral-900">
                  {{ order?.recipientPhone || '-' }}
                </dd>
              </div>
            </dl>
          </div>

          <!-- 訂單資訊 -->
          <div
            class="
              rounded-2xl border border-neutral-200 bg-white p-6
              shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <div class="mb-4 flex items-center gap-2">
              <FileText class="size-5 text-neutral-900" />
              <h2 class="text-lg font-bold tracking-wider text-neutral-900">
                訂單資訊
              </h2>
            </div>
            <dl class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <dt
                  class="
                    min-w-[100px] shrink-0 text-base tracking-wider
                    text-neutral-600
                  "
                >
                  訂單編號
                </dt>
                <dd class="text-base tracking-wider text-neutral-900">
                  {{ order?.id }}
                </dd>
              </div>
              <div class="flex items-center gap-2">
                <dt
                  class="
                    min-w-[100px] shrink-0 text-base tracking-wider
                    text-neutral-600
                  "
                >
                  建立時間
                </dt>
                <dd class="text-base tracking-wider text-neutral-900">
                  {{ formatDateTime(order?.createdAt) }}
                </dd>
              </div>
              <div class="flex items-center gap-2">
                <dt
                  class="
                    min-w-[100px] shrink-0 text-base tracking-wider
                    text-neutral-600
                  "
                >
                  最後更新
                </dt>
                <dd class="text-base tracking-wider text-neutral-900">
                  {{ formatDateTime(order?.updatedAt) }}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- 右側：歷史紀錄 -->
        <div
          class="flex w-60 shrink-0 flex-col border-l border-neutral-200 p-4"
        >
          <h2 class="mb-4 text-base font-bold tracking-wider text-neutral-900">
            歷史紀錄
          </h2>
          <div class="flex flex-col gap-1">
            <button
              v-for="(item, index) in historyItems"
              :key="item.id"
              type="button"
              class="
                flex flex-col gap-1 rounded-xl px-3 py-2 text-left
                transition-colors
              "
              :class="
                selectedHistoryIndex === index
                  ? 'bg-primary-200'
                  : 'hover:bg-neutral-100'
              "
              @click="selectedHistoryIndex = index"
            >
              <p class="text-sm tracking-wider text-neutral-900">
                {{ item.datetime }}
              </p>
              <p
                v-for="change in item.changes"
                :key="change.field"
                class="text-xs tracking-wider text-neutral-600"
              >
                {{ change.field }} {{ change.from }} → {{ change.to }}
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
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

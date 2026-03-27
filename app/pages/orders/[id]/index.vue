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
  Minus,
  Package,
  Pencil,
  Phone,
  Plus,
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

// 服務方案
interface DeliveryPlan {
  id: number
  name: string
  price: number
}

const { data: deliveryPlans } = await useFetch<DeliveryPlan[]>('/api/billing/pricing/delivery')

// 舊訂單可能沒有 service_plan，用 return_date 作為備援判斷
const isRoundTrip = computed(() =>
  order.value?.servicePlan === 'round_trip'
  || (order.value?.servicePlan == null && !!order.value?.returnDate),
)

const servicePlanLabel = computed(() => {
  const plan = order.value?.servicePlan
  if (plan === 'merchant')
    return '商家代售'
  if (plan === 'round_trip' || (plan == null && isRoundTrip.value)) {
    return deliveryPlans.value?.find(p => p.name.includes('雙程') || p.name.includes('來回'))?.name ?? '雙程套票'
  }
  if (plan === 'one_way') {
    return deliveryPlans.value?.find(p => p.name.includes('單程'))?.name ?? '單程運送'
  }
  return null
})

// 確認訂單
const isConfirming = ref(false)

// 取消訂單
const isCancelling = ref(false)

async function cancelOrder() {
  if (!order.value || isCancelling.value)
    return
  // eslint-disable-next-line no-alert
  if (!window.confirm('確定要取消此訂單嗎？此操作無法復原。'))
    return
  isCancelling.value = true
  try {
    // eslint-disable-next-line ts/no-explicit-any
    await ($fetch as any)(`/api/orders/${orderId}`, {
      method: 'PATCH',
      body: { status: 6 },
    })
    await refreshNuxtData()
  }
  catch (err) {
    console.error('取消訂單失敗:', err)
  }
  finally {
    isCancelling.value = false
  }
}

async function confirmOrder() {
  if (!order.value || isConfirming.value)
    return
  isConfirming.value = true
  try {
    await ($fetch as any)(`/api/orders/${orderId}`, {
      method: 'PATCH',
      body: { status: 2 },
    })
    await refreshNuxtData()
  }
  catch (err) {
    console.error('確認訂單失敗:', err)
  }
  finally {
    isConfirming.value = false
  }
}

// 運送步驟進度（共 6 步）
// 步驟：1=訂單確認中, 2=訂單成立待交付, 3=已收件, 4=運送中, 5=已送達, 6=已完成
const completedStepsCount = computed(() => {
  const map: Record<string, number> = {
    pending: 1,
    confirmed: 2,
    assigned: 3,
    in_delivery: 4,
    delivered: 5,
    completed: 6,
    cancelled: 0,
    overdue: 0,
  }
  return map[order.value?.status ?? ''] ?? 0
})

function isStepDone(n: number) {
  return completedStepsCount.value >= n
}

// 新增加值服務 modal
interface AddonPlan {
  id: number
  type: '服務' | '商品'
  name: string
  unitPrice: number
  enableStatus: 'active' | 'inactive'
}

const { data: addonPlans } = await useFetch<AddonPlan[]>('/api/billing/pricing/addon')

interface AddonSpecialItem {
  name: string
  unitPrice: number
  count: number
}

const showAddonModal = ref(false)
const addonCounts = ref<Record<number, number>>({})
const addonSpecialItems = ref<AddonSpecialItem[]>([])
const isSubmittingAddon = ref(false)

function getAddonCount(id: number) {
  return addonCounts.value[id] ?? 0
}

function setAddonCount(id: number, delta: number) {
  const next = (addonCounts.value[id] ?? 0) + delta
  if (next <= 0)
    delete addonCounts.value[id]
  else
    addonCounts.value[id] = next
}

function addAddonSpecialItem() {
  addonSpecialItems.value.push({ name: '', unitPrice: 0, count: 1 })
}

function removeAddonSpecialItem(i: number) {
  addonSpecialItems.value.splice(i, 1)
}

function closeAddonModal() {
  showAddonModal.value = false
  addonCounts.value = {}
  addonSpecialItems.value = []
}

const selectedAddonItems = computed(() =>
  (addonPlans.value ?? []).filter(p => getAddonCount(p.id) > 0),
)

const addonSubtotal = computed(() => {
  const planCost = (addonPlans.value ?? []).reduce((sum, p) => sum + p.unitPrice * getAddonCount(p.id), 0)
  const specialCost = addonSpecialItems.value.reduce((sum, item) => sum + item.unitPrice * item.count, 0)
  return planCost + specialCost
})

const hasAddonSelection = computed(() =>
  selectedAddonItems.value.length > 0
  || addonSpecialItems.value.some(item => item.name && item.count > 0),
)

async function submitAddon() {
  if (!hasAddonSelection.value || isSubmittingAddon.value)
    return
  isSubmittingAddon.value = true
  try {
    const planItems = selectedAddonItems.value.map(p => ({
      name: p.name,
      unitPrice: p.unitPrice,
      quantity: getAddonCount(p.id),
    }))
    const specialItemsList = addonSpecialItems.value
      .filter(item => item.name && item.count > 0)
      .map(item => ({
        name: item.name,
        unitPrice: item.unitPrice,
        quantity: item.count,
      }))
    await $fetch(`/api/orders/${orderId}/fees`, {
      method: 'POST',
      body: { items: [...planItems, ...specialItemsList] },
    })
    await refreshNuxtData()
    closeAddonModal()
  }
  catch (err) {
    console.error('新增加值服務失敗:', err)
  }
  finally {
    isSubmittingAddon.value = false
  }
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
              <template v-if="servicePlanLabel">
                <dt class="text-sm tracking-wider text-neutral-500">
                  服務方案
                </dt>
                <dd class="text-sm tracking-wider text-neutral-900">
                  {{ servicePlanLabel }}
                </dd>
              </template>
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
          <div
            v-if="order.status !== 'cancelled'"
            class="rounded-md border border-info-200 bg-neutral-0 p-6"
          >
            <h3
              class="mb-2 text-lg font-bold tracking-wider text-neutral-900"
            >
              快速操作
            </h3>
            <div class="flex flex-col gap-2">
              <Button
                v-if="order.status === 'pending'"
                class="w-full justify-center"
                :disabled="isConfirming"
                @click="confirmOrder"
              >
                <Check class="size-4" />
                {{ isConfirming ? '確認中...' : '確認訂單' }}
              </Button>
              <Button
                variant="outline"
                class="w-full justify-center"
                @click="showAddonModal = true"
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
                v-if="order.status !== 'cancelled'"
                as-child
                variant="outline"
                class="w-full justify-center"
              >
                <NuxtLink :to="`/orders/${order.orderNumber || order.id}/edit`">
                  <Pencil class="size-4" />
                  編輯訂單
                </NuxtLink>
              </Button>
              <Button
                v-if="order.status !== 'cancelled'"
                variant="outline"
                class="w-full justify-center"
                :disabled="isCancelling"
                @click="cancelOrder"
              >
                <X class="size-4" />
                {{ isCancelling ? '取消中...' : '取消訂單' }}
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
            訂單編號 {{ order?.orderNumber || order?.id }}
          </h1>

          <!-- 選取的變更詳情 -->
          <div
            v-if="historyItems[selectedHistoryIndex]"
            class="
              mb-4 rounded-2xl border border-neutral-200 bg-white p-6
              shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <p
              class="mb-3 text-sm tracking-wider text-primary-400"
            >
              {{ historyItems[selectedHistoryIndex]?.datetime }}
            </p>
            <div
              v-for="change in historyItems[selectedHistoryIndex]?.changes"
              :key="change.field"
              class="flex flex-col gap-1"
            >
              <p class="text-base font-bold tracking-wider text-neutral-900">
                {{ change.field }}
              </p>
              <div class="flex items-center gap-2 text-sm tracking-wider">
                <span class="text-neutral-500">{{ change.from === '無' ? '（無）' : change.from }}</span>
                <span class="text-neutral-400">→</span>
                <span class="font-medium text-neutral-900">{{ change.to === '無' ? '（無）' : change.to }}</span>
              </div>
            </div>
          </div>

          <!-- 旅客資訊 -->
          <div
            class="
              mb-4 hidden rounded-2xl border border-neutral-200 bg-white p-6
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
              mb-4 hidden rounded-2xl border border-neutral-200 bg-white p-6
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
          <div class="mb-4 flex hidden gap-4">
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
              mb-4 hidden rounded-2xl border border-warning-200 bg-white p-6
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
              mb-4 hidden rounded-2xl border border-neutral-200 bg-white p-6
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
              hidden rounded-2xl border border-neutral-200 bg-white p-6
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
                  {{ order?.orderNumber || order?.id }}
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

  <!-- 新增加值服務彈窗 -->
  <Teleport to="body">
    <div
      v-if="showAddonModal"
      class="
        fixed inset-0 z-50 flex items-center justify-center
        bg-[rgba(33,37,41,0.6)] backdrop-blur-[12px]
      "
      @click.self="closeAddonModal"
    >
      <div
        class="
          relative flex h-[760px] w-[1080px] flex-col overflow-hidden
          rounded-2xl border border-neutral-200 bg-white
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
          @click="closeAddonModal"
        >
          <X class="size-4 text-neutral-600" />
        </button>

        <!-- 主要內容區（左 + 右） -->
        <div class="grid flex-1 grid-cols-12 overflow-hidden">
          <!-- 左側：加值服務選擇 -->
          <div class="col-span-9 flex flex-col gap-6 overflow-y-auto p-8">
            <h4 class="text-2xl font-bold tracking-[1.2px] text-neutral-900">
              新增加值服務
            </h4>

            <div
              v-if="!addonPlans?.length"
              class="text-sm tracking-wider text-neutral-400"
            >
              目前沒有可用的加值服務
            </div>

            <div
              v-else
              class="grid grid-cols-2 gap-4"
            >
              <div
                v-for="plan in addonPlans"
                :key="plan.id"
                class="
                  flex flex-col gap-3 rounded-xl border border-neutral-200
                  bg-white p-4
                "
              >
                <div class="flex items-start gap-3">
                  <div class="flex flex-1 flex-col gap-1">
                    <div class="flex items-start gap-2">
                      <div
                        class="
                          mt-0.5 w-1 self-stretch rounded-xs bg-gradient-to-br
                          from-[#4090e8] to-[#306cf7]
                        "
                      ></div>
                      <span
                        class="
                          text-base font-bold tracking-[0.8px] text-neutral-900
                        "
                      >{{ plan.name }}</span>
                    </div>
                    <span class="text-sm tracking-[0.7px] text-neutral-600">
                      {{ plan.type }}
                    </span>
                  </div>
                  <span
                    class="text-sm font-bold tracking-[0.7px] text-primary-400"
                  >+NT$ {{ plan.unitPrice.toLocaleString() }} / 件</span>
                </div>
                <div
                  class="
                    flex h-10 items-center gap-3 rounded-xs bg-neutral-100 px-3
                    py-2
                  "
                >
                  <button
                    type="button"
                    class="
                      flex items-center rounded-full p-2 transition-colors
                      hover:bg-neutral-200
                    "
                    @click="setAddonCount(plan.id, -1)"
                  >
                    <Minus class="size-4 text-neutral-900" />
                  </button>
                  <span
                    class="
                      flex-1 text-center text-base tracking-[0.8px]
                      text-neutral-900
                    "
                  >{{ getAddonCount(plan.id) }}</span>
                  <button
                    type="button"
                    class="
                      flex items-center rounded-full p-2 transition-colors
                      hover:bg-neutral-200
                    "
                    @click="setAddonCount(plan.id, 1)"
                  >
                    <Plus class="size-4 text-neutral-900" />
                  </button>
                </div>
              </div>
            </div>

            <!-- 特殊物件 -->
            <div
              class="
                flex flex-col gap-3 rounded-sm border border-neutral-200 p-4
              "
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2">
                    <div
                      class="
                        w-1 self-stretch rounded-xs bg-gradient-to-br
                        from-[#4090e8] to-[#306cf7]
                      "
                    ></div>
                    <p
                      class="
                        text-base font-bold tracking-[0.8px] text-neutral-900
                      "
                    >
                      特殊物件
                    </p>
                  </div>
                  <p class="text-sm text-neutral-600">
                    如衝浪板、腳踏車、嬰兒推車等
                  </p>
                </div>
                <button
                  type="button"
                  class="
                    flex shrink-0 items-center gap-2 rounded-sm border
                    border-primary-300 px-4 py-2 text-sm font-medium
                    text-primary-300
                    hover:bg-primary-100
                  "
                  @click="addAddonSpecialItem"
                >
                  <Plus class="size-5" />
                  新增物件
                </button>
              </div>
              <template v-if="addonSpecialItems.length > 0">
                <div
                  class="
                    grid grid-cols-[1fr_1fr_1fr_40px] gap-3 text-sm font-medium
                    text-neutral-600
                  "
                >
                  <span>物件</span><span>單價 NTD</span><span>件數</span><span></span>
                </div>
                <div
                  v-for="(item, i) in addonSpecialItems"
                  :key="i"
                  class="grid grid-cols-[1fr_1fr_1fr_40px] items-center gap-3"
                >
                  <input
                    v-model="item.name"
                    type="text"
                    placeholder="物件名稱"
                    class="
                      min-w-0 rounded-xs border border-neutral-200 px-3 py-2
                      text-base outline-none
                      focus:border-primary-300
                    "
                  >
                  <input
                    v-model.number="item.unitPrice"
                    type="number"
                    min="0"
                    class="
                      min-w-0 rounded-xs border border-neutral-200 px-3 py-2
                      text-base outline-none
                      focus:border-primary-300
                    "
                  >
                  <div
                    class="
                      flex min-w-0 items-center gap-3 rounded-xs bg-neutral-100
                      px-3 py-1
                    "
                  >
                    <button
                      type="button"
                      class="
                        flex shrink-0 items-center justify-center rounded-full
                        p-2
                        hover:bg-neutral-200
                        disabled:cursor-not-allowed disabled:opacity-40
                      "
                      :disabled="item.count <= 1"
                      @click="item.count--"
                    >
                      <Minus class="size-6" />
                    </button>
                    <span
                      class="
                        flex-1 text-center text-base tracking-[0.8px]
                        text-neutral-900
                      "
                    >{{ item.count }}</span>
                    <button
                      type="button"
                      class="
                        flex shrink-0 items-center justify-center rounded-full
                        p-2
                        hover:bg-neutral-200
                      "
                      @click="item.count++"
                    >
                      <Plus class="size-6" />
                    </button>
                  </div>
                  <button
                    type="button"
                    class="
                      flex size-8 items-center justify-center rounded-full
                      text-neutral-400
                      hover:bg-neutral-100 hover:text-neutral-600
                    "
                    @click="removeAddonSpecialItem(i)"
                  >
                    <X class="size-4" />
                  </button>
                </div>
              </template>
            </div>
          </div>

          <!-- 右側：費用摘要 -->
          <div
            class="
              col-span-3 flex flex-col gap-4 border-l border-neutral-200 p-6
            "
          >
            <span
              class="text-base font-bold tracking-[0.8px] text-neutral-900"
            >費用摘要</span>

            <div class="flex flex-1 flex-col gap-3">
              <div
                v-if="!hasAddonSelection"
                class="text-sm tracking-[0.7px] text-neutral-400"
              >
                尚未選擇任何項目
              </div>
              <div
                v-for="item in selectedAddonItems"
                :key="item.id"
                class="flex flex-col gap-1 rounded-sm bg-neutral-100 p-4"
              >
                <span
                  class="text-sm tracking-[0.7px] text-neutral-600"
                >{{ item.name }} × {{ getAddonCount(item.id) }}</span>
                <span
                  class="
                    text-base font-medium tracking-[0.8px] text-neutral-900
                  "
                >NT$ {{ (item.unitPrice * getAddonCount(item.id)).toLocaleString() }}</span>
              </div>
              <template
                v-for="(item, i) in addonSpecialItems"
                :key="`special-${i}`"
              >
                <div
                  v-if="item.name && item.count > 0"
                  class="flex flex-col gap-1 rounded-sm bg-neutral-100 p-4"
                >
                  <span
                    class="text-sm tracking-[0.7px] text-neutral-600"
                  >{{ item.name }} × {{ item.count }}</span>
                  <span
                    class="
                      text-base font-medium tracking-[0.8px] text-neutral-900
                    "
                  >NT$ {{ (item.unitPrice * item.count).toLocaleString() }}</span>
                </div>
              </template>
            </div>

            <div
              v-if="hasAddonSelection"
              class="border-t border-neutral-200 pt-3"
            >
              <div class="flex items-center justify-between">
                <span
                  class="text-sm tracking-[0.7px] text-neutral-600"
                >小計</span>
                <span
                  class="text-base font-bold tracking-[0.8px] text-primary-300"
                >NT$ {{ addonSubtotal.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="
            flex shrink-0 gap-3 px-8 py-4
            shadow-[0px_-4px_20px_0px_rgba(32,78,184,0.12)]
          "
        >
          <button
            type="button"
            class="
              flex-1 rounded-sm border border-neutral-200 bg-white py-2.5
              text-base font-medium tracking-[0.8px] text-neutral-900
              transition-colors
              hover:bg-neutral-50
            "
            @click="closeAddonModal"
          >
            取消
          </button>
          <button
            type="button"
            :disabled="!hasAddonSelection || isSubmittingAddon"
            class="
              flex-1 rounded-sm bg-primary-400 py-2.5 text-base font-medium
              tracking-[0.8px] text-white transition-colors
              hover:bg-primary-500
              disabled:cursor-not-allowed disabled:opacity-50
            "
            @click="submitAddon"
          >
            {{ isSubmittingAddon ? '新增中...' : '確認新增' }}
          </button>
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

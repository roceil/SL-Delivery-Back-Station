<script lang="ts" setup>
import type { DateValue } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'
import { ArrowRight, CalendarIcon, ChevronRight, ClipboardList, MapPin, MessageSquare, Package, Route, Store, Truck, X } from 'lucide-vue-next'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Courier {
  id: string
  name: string
  employeeNumber: string
}

interface RouteStep {
  name: string
  pickups: AvailableOrder[]
  deliveries: AvailableOrder[]
}

interface AvailableOrder {
  id: string
  orderNumber: string
  lineName: string
  luggageCount: number
  area: string
  departureDate: string
  leg: 'outbound' | 'inbound'
  pickupLocation: { id: string, name: string }
  deliveryLocation: { id: string, name: string }
  notes?: string
}

useHead({ title: '新增行程 - 物流管理系統' })

const router = useRouter()

function generateTripName() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const h = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d}-${h}-${min}`
}

const form = ref({
  name: generateTripName(),
  courierId: '',
  scheduledDate: '',
  selectedOrders: [] as string[],
  notes: '',
})

const availableOrdersQuery = computed(() =>
  form.value.scheduledDate ? { date: form.value.scheduledDate } : {},
)
const { data: availableOrdersData } = await useFetch<AvailableOrder[]>('/api/orders/available', {
  query: availableOrdersQuery,
})
const availableOrders = computed(() => availableOrdersData.value ?? [])

// 彈窗狀態
const showModal = ref(false)
const tempSelected = ref<string[]>([])

watch(() => form.value.scheduledDate, () => {
  form.value.selectedOrders = []
  tempSelected.value = []
})
const modalKeyword = ref('')
const modalArea = ref('')
const modalDestination = ref('')

const areaListModal = computed<string[]>(() => [...new Set(availableOrders.value.map(o => o.area))].sort())
const destinationList = computed<string[]>(() => [...new Set(availableOrders.value.map(o => o.deliveryLocation.name))])

const hasModalActiveFilters = computed(() =>
  !!(modalKeyword.value || modalArea.value || modalDestination.value),
)

function resetModalFilters() {
  modalKeyword.value = ''
  modalArea.value = ''
  modalDestination.value = ''
}

const filteredMockOrders = computed(() => {
  return availableOrders.value.filter((o) => {
    if (modalKeyword.value) {
      const kw = modalKeyword.value.toLowerCase()
      if (!o.lineName.toLowerCase().includes(kw) && !o.orderNumber.toLowerCase().includes(kw))
        return false
    }
    if (modalArea.value && o.area !== modalArea.value)
      return false
    if (modalDestination.value && o.deliveryLocation.name !== modalDestination.value)
      return false
    return true
  })
})

const tempSelectedOrders = computed(() => availableOrders.value.filter(o => tempSelected.value.includes(o.id)))
const tempTotalLuggage = computed(() => tempSelectedOrders.value.reduce((sum, o) => sum + o.luggageCount, 0))

function openModal() {
  tempSelected.value = [...form.value.selectedOrders]
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  resetModalFilters()
}

function confirmModal() {
  form.value.selectedOrders = [...tempSelected.value]
  closeModal()
}

function toggleTempOrder(id: string) {
  const idx = tempSelected.value.indexOf(id)
  if (idx > -1)
    tempSelected.value.splice(idx, 1)
  else
    tempSelected.value.push(id)
}

// 表單摘要
const df = new DateFormatter('zh-TW', { dateStyle: 'medium' })

const scheduledDateValue = computed<DateValue | undefined>({
  get: () => form.value.scheduledDate ? parseDate(form.value.scheduledDate) : undefined,
  set: val => form.value.scheduledDate = val ? val.toString() : '',
})

const { data: couriers } = await useFetch<Courier[]>('/api/couriers')

const selectedOrdersData = computed(() => availableOrders.value.filter(o => form.value.selectedOrders.includes(o.id)))

const orderStats = computed(() => {
  const totalLuggage = selectedOrdersData.value.reduce((sum, o) => sum + o.luggageCount, 0)
  const areas = [...new Set(selectedOrdersData.value.map(o => o.area))].sort()
  return { count: selectedOrdersData.value.length, totalLuggage, areas }
})

const selectedCourier = computed(() => (couriers.value ?? []).find(c => c.id === form.value.courierId))

const hasPreviewData = computed(() => !!(form.value.courierId || form.value.scheduledDate))

const routeStops = computed(() => {
  const stops: string[] = []
  for (const order of selectedOrdersData.value) {
    if (!stops.includes(order.pickupLocation.name))
      stops.push(order.pickupLocation.name)
    if (!stops.includes(order.deliveryLocation.name))
      stops.push(order.deliveryLocation.name)
  }
  return stops
})

const routeStepsData = computed<RouteStep[]>(() => {
  return routeStops.value.map(stop => ({
    name: stop,
    pickups: selectedOrdersData.value.filter(o => o.pickupLocation.name === stop),
    deliveries: selectedOrdersData.value.filter(o => o.deliveryLocation.name === stop),
  }))
})

const isSubmitting = ref(false)

// 站點詳情彈窗
const showStopModal = ref(false)
const activeStop = ref<RouteStep | null>(null)
const activeStopIndex = ref(0)
const activeStopTab = ref<'pickup' | 'delivery'>('pickup')
const stopSearchKeyword = ref('')

function openStopModal(step: RouteStep, idx: number, tab: 'pickup' | 'delivery') {
  activeStop.value = step
  activeStopIndex.value = idx
  activeStopTab.value = tab
  stopSearchKeyword.value = ''
  showStopModal.value = true
}

function closeStopModal() {
  showStopModal.value = false
}

const filteredStopOrders = computed(() => {
  if (!activeStop.value)
    return []
  const orders = activeStopTab.value === 'pickup'
    ? activeStop.value.pickups
    : activeStop.value.deliveries
  if (!stopSearchKeyword.value)
    return orders
  const kw = stopSearchKeyword.value.toLowerCase()
  return orders.filter(o =>
    o.lineName.toLowerCase().includes(kw) || o.orderNumber.toLowerCase().includes(kw),
  )
})

async function submitForm() {
  if (!form.value.courierId) {
    // eslint-disable-next-line no-alert
    alert('請選擇快遞員')
    return
  }
  if (!form.value.scheduledDate) {
    // eslint-disable-next-line no-alert
    alert('請選擇運送日期')
    return
  }
  isSubmitting.value = true
  try {
    await $fetch('/api/trips', { method: 'POST', body: form.value })
    router.push('/trips')
  }
  catch (error: any) {
    // eslint-disable-next-line no-alert
    alert(error.data?.message || '建立行程失敗，請稍後再試')
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-full flex-col gap-4 bg-neutral-100 p-8">
    <!-- 標題列 -->
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="
          flex items-center justify-center rounded-full p-2
          hover:bg-neutral-200
        "
        @click="router.push('/trips')"
      >
        <svg
          class="size-4 text-neutral-900"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 18l-6-6 6-6"
          />
        </svg>
      </button>
      <h4 class="text-2xl font-bold tracking-[1.2px] text-neutral-900">
        新增行程
      </h4>
    </div>

    <!-- 主內容 -->
    <div class="grid grid-cols-12 items-start gap-4">
      <!-- 左欄 -->
      <div class="col-span-8 flex flex-col gap-4">
        <!-- Card 1：運送資訊 -->
        <div
          class="
            flex flex-col gap-4 rounded-md bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <div class="flex items-center gap-2">
            <Route class="size-5 text-neutral-900" />
            <span class="text-lg font-bold tracking-[0.9px] text-neutral-900">運送資訊</span>
          </div>

          <div class="flex flex-col gap-4">
            <!-- 快遞員 -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >快遞員</label>
              <Select v-model="form.courierId">
                <SelectTrigger class="w-full bg-white text-base">
                  <SelectValue placeholder="請選擇快遞員" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem
                      v-for="courier in couriers"
                      :key="courier.id"
                      :value="courier.id"
                    >
                      {{ courier.name }}（{{ courier.employeeNumber }}）
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <!-- 運送日期 -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >運送日期</label>
              <Popover>
                <PopoverTrigger as-child>
                  <button
                    type="button"
                    :class="cn(
                      `
                        flex w-full items-center gap-2 rounded-xs border
                        border-neutral-200 bg-white px-3 py-2 text-base
                        outline-none
                        hover:border-neutral-400
                      `,
                      scheduledDateValue ? 'text-neutral-900' : `
                        text-neutral-400
                      `,
                    )"
                  >
                    <CalendarIcon class="size-5 shrink-0 text-neutral-400" />
                    {{
                      scheduledDateValue
                        ? df.format(scheduledDateValue.toDate(getLocalTimeZone()))
                        : '請選擇運送日期'
                    }}
                  </button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0">
                  <Calendar
                    v-model="scheduledDateValue"
                    :initial-focus="true"
                    layout="month-and-year"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <!-- Card 2：運送任務 -->
        <div
          class="
            flex flex-col gap-4 rounded-md bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <ClipboardList class="size-5 text-neutral-900" />
              <span class="text-lg font-bold tracking-[0.9px] text-neutral-900">運送任務</span>
            </div>
            <button
              type="button"
              :disabled="!form.scheduledDate"
              class="
                flex items-center gap-1.5 rounded-sm border px-4 py-2 text-base
                font-medium tracking-[0.8px] transition-colors
              "
              :class="
                form.scheduledDate
                  ? 'border-primary-400 text-primary-400 hover:bg-neutral-50'
                  : 'cursor-not-allowed border-neutral-300 text-neutral-300'
              "
              @click="openModal"
            >
              <span class="text-lg leading-none">+</span>
              新增訂單
            </button>
          </div>

          <!-- 已選訂單列表 -->
          <template v-if="selectedOrdersData.length > 0">
            <div class="flex flex-col gap-3">
              <div
                v-for="(order, idx) in selectedOrdersData"
                :key="order.id"
                class="flex items-center gap-3"
              >
                <!-- 序號 Badge -->
                <div
                  class="
                    flex size-7 shrink-0 items-center justify-center
                    rounded-full bg-neutral-200 text-xs font-medium
                    text-neutral-600
                  "
                >
                  {{ idx + 1 }}
                </div>

                <!-- 訂單卡片 -->
                <div
                  class="
                    flex flex-1 flex-col gap-2 rounded-sm bg-neutral-50 p-4
                  "
                >
                  <!-- Header：姓名 + 方向 + 新增備註 + 刪除 -->
                  <div class="flex items-center gap-2">
                    <span
                      class="
                        text-lg font-bold tracking-[0.9px] text-neutral-900
                      "
                    >
                      {{ order.lineName }}
                    </span>
                    <span
                      class="
                        rounded-full px-2 py-0.5 text-xs font-medium
                        tracking-[0.6px]
                      "
                      :class="
                        order.leg === 'inbound'
                          ? 'bg-[#e9f4ef] text-[#229464]'
                          : 'bg-[#eaf5ff] text-[#3087db]'
                      "
                    >
                      {{ order.leg === 'inbound' ? '回程' : '去程' }}
                    </span>
                    <div class="flex flex-1 items-center justify-end gap-1">
                      <button
                        type="button"
                        class="
                          flex items-center gap-1 text-sm font-medium
                          tracking-[0.7px] text-neutral-600
                          hover:text-neutral-900
                        "
                      >
                        <svg
                          class="size-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        新增備註
                      </button>
                      <button
                        type="button"
                        class="
                          flex items-center justify-center rounded-full p-2
                          hover:bg-neutral-200
                        "
                        @click="form.selectedOrders.splice(form.selectedOrders.indexOf(order.id), 1)"
                      >
                        <X class="size-4 text-neutral-400" />
                      </button>
                    </div>
                  </div>

                  <!-- 欄位明細 -->
                  <div class="flex flex-col gap-1">
                    <div
                      class="flex items-start gap-2 text-base tracking-[0.8px]"
                    >
                      <span class="min-w-[76px] shrink-0 text-neutral-600">訂單編號</span>
                      <span class="text-neutral-900">{{ order.orderNumber }}</span>
                    </div>
                    <div
                      class="flex items-start gap-2 text-base tracking-[0.8px]"
                    >
                      <span class="min-w-[76px] shrink-0 text-neutral-600">行李件數</span>
                      <span class="text-neutral-900">{{ order.luggageCount }} 件</span>
                    </div>
                    <div
                      class="flex items-start gap-2 text-base tracking-[0.8px]"
                    >
                      <span class="min-w-[76px] shrink-0 text-neutral-600">運送路線</span>
                      <span class="text-neutral-900">
                        {{ order.pickupLocation.name }} → {{ order.deliveryLocation.name }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 空狀態 -->
          <template v-else>
            <div
              class="
                flex flex-col items-center gap-2 rounded-sm border
                border-neutral-200 bg-neutral-50 p-8
              "
            >
              <Package class="size-8 text-neutral-400" />
              <span class="text-lg font-bold tracking-[0.9px] text-neutral-900">尚無訂單</span>
              <span
                class="text-center text-sm tracking-[0.7px] text-neutral-600"
              >
                請點選「新增訂單」將待分配的訂單加入運送路線中
              </span>
            </div>
          </template>
        </div>

        <!-- Card 3：運送路線（有訂單時顯示） -->
        <div
          v-if="selectedOrdersData.length > 0"
          class="
            flex flex-col gap-4 rounded-md bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <div class="flex items-center gap-2">
            <MapPin class="size-5 text-neutral-900" />
            <span class="text-lg font-bold tracking-[0.9px] text-neutral-900">運送路線</span>
          </div>

          <!-- Stepper -->
          <div class="flex flex-col">
            <div
              v-for="(step, idx) in routeStepsData"
              :key="idx"
              class="flex gap-3"
            >
              <!-- 左側：圓圈 + 連接線 -->
              <div class="flex flex-col items-center">
                <div
                  class="
                    flex size-8 shrink-0 items-center justify-center
                    rounded-full bg-[#2449a0] text-xs font-bold text-white
                  "
                >
                  {{ idx + 1 }}
                </div>
                <div
                  v-if="idx < routeStepsData.length - 1"
                  class="w-px flex-1 bg-[#2449a0]"
                ></div>
              </div>

              <!-- 右側：站點卡片 -->
              <div
                class="flex-1"
                :class="idx < routeStepsData.length - 1 ? 'pb-6' : ''"
              >
                <div class="overflow-hidden rounded-xl border border-[#e9ecef]">
                  <!-- 卡片 Header -->
                  <div class="flex items-center gap-2 bg-[#f8f9fa] px-4 py-3">
                    <span
                      class="
                        flex-1 text-base font-bold tracking-[0.8px]
                        text-neutral-900
                      "
                    >{{ step.name }}</span>
                    <span class="text-sm tracking-[0.7px] text-neutral-600">
                      {{ step.pickups.reduce((s, o) => s + o.luggageCount, 0) + step.deliveries.reduce((s, o) => s + o.luggageCount, 0) }} 件
                    </span>
                    <span
                      class="
                        rounded-full bg-[#e9ecef] px-2 py-0.5 text-xs
                        font-medium text-[#6c757d]
                      "
                    >未開始</span>
                  </div>

                  <!-- 卡片 Body -->
                  <div class="flex flex-col gap-2 p-4">
                    <!-- 攬件 -->
                    <div
                      v-if="step.pickups.length > 0"
                      class="flex items-center gap-2"
                    >
                      <div class="size-1.5 shrink-0 rounded-full bg-[#3087db]"></div>
                      <span
                        class="
                          text-base font-medium tracking-[0.8px]
                          text-neutral-900
                        "
                      >攬件</span>
                      <span class="text-neutral-400">·</span>
                      <span
                        class="
                          flex-1 text-base tracking-[0.8px] text-neutral-600
                        "
                      >
                        {{ step.pickups.reduce((s, o) => s + o.luggageCount, 0) }} 件
                      </span>
                      <button
                        type="button"
                        class="
                          flex items-center justify-center rounded-full p-1
                          hover:bg-neutral-100
                        "
                        @click="openStopModal(step, idx, 'pickup')"
                      >
                        <ChevronRight class="size-4 text-neutral-400" />
                      </button>
                    </div>

                    <!-- 放置 -->
                    <div
                      v-if="step.deliveries.length > 0"
                      class="flex items-center gap-2"
                    >
                      <div class="size-1.5 shrink-0 rounded-full bg-[#229464]"></div>
                      <span
                        class="
                          text-base font-medium tracking-[0.8px]
                          text-neutral-900
                        "
                      >放置</span>
                      <span class="text-neutral-400">·</span>
                      <span
                        class="
                          flex-1 text-base tracking-[0.8px] text-neutral-600
                        "
                      >
                        {{ step.deliveries.reduce((s, o) => s + o.luggageCount, 0) }} 件
                      </span>
                      <button
                        type="button"
                        class="
                          flex items-center justify-center rounded-full p-1
                          hover:bg-neutral-100
                        "
                        @click="openStopModal(step, idx, 'delivery')"
                      >
                        <ChevronRight class="size-4 text-neutral-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 4：備註 -->
        <div
          class="
            flex flex-col gap-4 rounded-md bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <div class="flex items-center gap-2">
            <MessageSquare class="size-5 text-neutral-900" />
            <span class="text-lg font-bold tracking-[0.9px] text-neutral-900">備註</span>
          </div>
          <textarea
            v-model="form.notes"
            rows="4"
            placeholder="例如行李尺寸、易碎物品等"
            class="
              w-full resize-none rounded-xs border border-neutral-200 bg-white
              px-3 py-2 text-base tracking-[0.8px] text-neutral-900 outline-none
              placeholder:text-neutral-400
              focus:border-neutral-400
            "
          ></textarea>
        </div>
      </div>

      <!-- 右欄：行程摘要 -->
      <div
        class="
          col-span-4 flex flex-col gap-4 rounded-md bg-white p-6
          shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
        "
      >
        <div class="flex items-center gap-2">
          <Route class="size-5 text-neutral-900" />
          <span class="text-lg font-bold tracking-[0.9px] text-neutral-900">行程摘要</span>
        </div>

        <!-- 空狀態 -->
        <template v-if="!hasPreviewData">
          <div
            class="
              flex flex-col items-center gap-4 rounded-sm border
              border-neutral-200 bg-neutral-50 p-4
            "
          >
            <img
              src="/empty-trip.png"
              alt=""
              class="size-[120px] object-contain"
            >
            <span class="text-base tracking-[0.8px] text-neutral-600">尚未填寫資料</span>
          </div>
        </template>

        <!-- 有資料時的摘要 -->
        <template v-else>
          <div
            class="flex flex-col rounded-sm border border-neutral-200 bg-white"
          >
            <!-- 運送資訊 -->
            <div class="flex flex-col gap-2 p-4">
              <span
                class="text-base font-bold tracking-[0.8px] text-neutral-900"
              >運送資訊</span>
              <div class="flex flex-col gap-2">
                <div
                  v-if="selectedCourier"
                  class="flex items-start gap-2 text-base tracking-[0.8px]"
                >
                  <span class="min-w-[76px] shrink-0 text-neutral-600">快遞員</span>
                  <span class="text-neutral-900">{{ selectedCourier.name }}</span>
                </div>
                <div
                  v-if="scheduledDateValue"
                  class="flex items-start gap-2 text-base tracking-[0.8px]"
                >
                  <span class="min-w-[76px] shrink-0 text-neutral-600">運送日期</span>
                  <span class="text-neutral-900">
                    {{ df.format(scheduledDateValue.toDate(getLocalTimeZone())) }}
                  </span>
                </div>
                <div
                  v-if="orderStats.count > 0"
                  class="flex items-start gap-2 text-base tracking-[0.8px]"
                >
                  <span class="min-w-[76px] shrink-0 text-neutral-600">訂單筆數</span>
                  <span class="text-neutral-900">{{ orderStats.count }} 筆</span>
                </div>
                <div
                  v-if="orderStats.totalLuggage > 0"
                  class="flex items-start gap-2 text-base tracking-[0.8px]"
                >
                  <span class="min-w-[76px] shrink-0 text-neutral-600">行李件數</span>
                  <span class="text-neutral-900">{{ orderStats.totalLuggage }} 件</span>
                </div>
              </div>
            </div>

            <!-- 分隔線 -->
            <div
              v-if="routeStops.length > 0"
              class="border-t border-neutral-200"
            ></div>

            <!-- 運送路線 -->
            <div
              v-if="routeStops.length > 0"
              class="flex flex-col gap-2 p-4"
            >
              <span
                class="text-base font-bold tracking-[0.8px] text-neutral-900"
              >運送路線</span>
              <div class="flex flex-col gap-2">
                <div
                  v-for="(stop, idx) in routeStops"
                  :key="idx"
                  class="flex items-start gap-2 text-base tracking-[0.8px]"
                >
                  <span class="min-w-[76px] shrink-0 text-neutral-600">第 {{ idx + 1 }} 站</span>
                  <span class="text-neutral-900">{{ stop }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 立即新增按鈕 -->
        <button
          type="button"
          class="
            mt-auto w-full rounded-sm bg-primary-400 py-2 text-base font-medium
            tracking-[0.8px] text-white transition-colors
            hover:bg-primary-500
            disabled:cursor-not-allowed disabled:opacity-60
          "
          :disabled="isSubmitting"
          @click="submitForm"
        >
          {{ isSubmitting ? '建立中...' : '立即新增' }}
        </button>
      </div>
    </div>
  </div>

  <!-- 新增訂單彈窗 -->
  <Teleport to="body">
    <div
      v-if="showModal"
      class="
        fixed inset-0 z-50 flex items-center justify-center
        bg-[rgba(33,37,41,0.6)] backdrop-blur-sm
      "
      @click.self="closeModal"
    >
      <div
        class="
          relative grid h-[760px] w-[1080px] grid-cols-12 overflow-hidden
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
          @click="closeModal"
        >
          <X class="size-4 text-neutral-600" />
        </button>

        <!-- 左側面板：訂單列表 -->
        <div
          class="
            col-span-8 flex shrink-0 flex-col gap-4 overflow-y-auto
            bg-neutral-50 p-8
          "
        >
          <!-- 標題 -->
          <div class="flex flex-col gap-1">
            <h4 class="text-2xl font-bold tracking-[1.2px] text-neutral-900">
              新增訂單
            </h4>
            <span class="text-base tracking-[0.8px] text-neutral-600">
              {{ form.scheduledDate }} 共有 {{ availableOrders.length }} 筆任務可供分配
            </span>
          </div>

          <div class="border-b border-neutral-200"></div>

          <!-- 搜尋篩選列 -->
          <div class="flex items-center gap-4">
            <!-- 關鍵字 -->
            <div class="relative shrink-0">
              <svg
                class="
                  absolute top-1/2 left-3 size-4 -translate-y-1/2
                  text-neutral-400
                "
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
              <input
                v-model="modalKeyword"
                type="text"
                placeholder="旅客或訂單編號"
                class="
                  w-[200px] rounded-xs border border-neutral-200 bg-white py-2
                  pr-3 pl-9 text-base tracking-[0.8px] text-neutral-900
                  outline-none
                  placeholder:text-neutral-400
                  focus:border-neutral-400
                "
              >
            </div>

            <!-- 區域 -->
            <Select v-model="modalArea">
              <SelectTrigger class="flex-1 bg-white text-base">
                <SelectValue placeholder="請選擇區域類型" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem
                    v-for="area in areaListModal"
                    :key="area"
                    :value="area"
                  >
                    區域 {{ area }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <!-- 目的地 -->
            <Select v-model="modalDestination">
              <SelectTrigger class="flex-1 bg-white text-base">
                <SelectValue placeholder="請選擇目的地" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem
                    v-for="dest in destinationList"
                    :key="dest"
                    :value="dest"
                  >
                    {{ dest }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <!-- 清除篩選 -->
            <button
              type="button"
              class="shrink-0 text-sm tracking-wide transition-colors"
              :class="
                hasModalActiveFilters
                  ? 'cursor-pointer text-neutral-600 hover:text-neutral-900'
                  : 'cursor-not-allowed text-neutral-400'
              "
              :disabled="!hasModalActiveFilters"
              @click="resetModalFilters"
            >
              清除篩選條件
            </button>
          </div>

          <!-- 訂單卡片列表 -->
          <div class="flex flex-col gap-2">
            <!-- 卡片 -->
            <div
              v-for="order in filteredMockOrders"
              :key="order.id"
              class="
                group cursor-pointer rounded-sm border bg-white p-4
                shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)] transition-colors
              "
              :class="
                tempSelected.includes(order.id)
                  ? 'border-[#8cbcf1]'
                  : 'border-neutral-200 hover:border-neutral-500'
              "
              @click="toggleTempOrder(order.id)"
            >
              <!-- 第一行：路線 + 訂單號 -->
              <div class="flex items-center justify-between gap-4">
                <div
                  class="
                    flex items-center gap-1.5 text-base font-medium
                    tracking-[0.8px]
                  "
                >
                  <span
                    :class="tempSelected.includes(order.id) ? `text-primary-400` : `
                      text-neutral-900
                    `"
                  >
                    {{ order.pickupLocation.name }}
                  </span>
                  <ArrowRight class="size-4 shrink-0 text-neutral-400" />
                  <span
                    :class="tempSelected.includes(order.id) ? `text-primary-400` : `
                      text-neutral-900
                    `"
                  >
                    {{ order.deliveryLocation.name }}
                  </span>
                </div>
                <span class="shrink-0 text-xs tracking-wide text-neutral-600">{{ order.orderNumber }}</span>
              </div>
              <!-- 第二行：旅客 · 行李 · 區域 -->
              <div class="mt-1 text-sm tracking-[0.7px] text-neutral-600">
                {{ order.lineName }} · {{ order.luggageCount }} 件行李 · 區域 {{ order.area }}
              </div>
            </div>

            <div
              v-if="filteredMockOrders.length === 0"
              class="
                rounded-sm border border-neutral-200 bg-white p-8 text-center
              "
            >
              <span class="text-sm text-neutral-500">查無符合條件的訂單</span>
            </div>
          </div>
        </div>

        <!-- 右側面板：已選訂單 -->
        <div class="col-span-4 flex flex-1 flex-col gap-4 p-4">
          <!-- 標題 -->
          <div class="flex flex-col gap-0.5">
            <span class="text-base font-bold tracking-[0.8px] text-neutral-900">已選擇的訂單</span>
            <span class="text-xs tracking-[0.6px] text-neutral-600">
              已選 {{ tempSelectedOrders.length }} 筆，共 {{ tempTotalLuggage }} 件行李
            </span>
          </div>

          <!-- 已選列表 -->
          <div class="flex flex-1 flex-col gap-2 overflow-y-auto">
            <div
              v-for="order in tempSelectedOrders"
              :key="order.id"
              class="
                flex flex-col gap-1 rounded-sm border border-neutral-200 p-3
              "
            >
              <span class="text-xs tracking-wide text-neutral-600">{{ order.orderNumber }}</span>
              <div
                class="
                  flex items-center gap-1.5 text-sm font-medium tracking-[0.7px]
                  text-neutral-900
                "
              >
                <span>{{ order.pickupLocation.name }}</span>
                <ArrowRight class="size-3.5 shrink-0 text-neutral-400" />
                <span>{{ order.deliveryLocation.name }}</span>
              </div>
            </div>

            <div
              v-if="tempSelectedOrders.length === 0"
              class="
                flex flex-col items-center justify-center gap-2 rounded-sm
                border border-neutral-200 bg-neutral-50 p-8
              "
            >
              <span class="text-sm text-neutral-400">尚未選擇訂單</span>
            </div>
          </div>

          <!-- 確定新增 -->
          <button
            type="button"
            class="
              w-full rounded-sm bg-primary-400 py-2 text-sm font-medium
              tracking-[0.7px] text-white transition-colors
              hover:bg-primary-500
            "
            @click="confirmModal"
          >
            確定新增
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 站點詳情彈窗 -->
  <Teleport to="body">
    <div
      v-if="showStopModal"
      class="
        fixed inset-0 z-50 flex items-center justify-center
        bg-[rgba(33,37,41,0.6)] backdrop-blur-[12px]
      "
      @click.self="closeStopModal"
    >
      <div
        class="
          flex w-[800px] flex-col gap-4 rounded-2xl border border-neutral-200
          bg-neutral-100 p-8 shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
        "
      >
        <!-- 標題列 -->
        <div class="flex items-center justify-between">
          <h4 class="text-2xl font-bold tracking-[1.2px] text-neutral-900">
            第{{ activeStopIndex + 1 }}站｜{{ activeStop?.name }}
          </h4>
          <button
            type="button"
            class="
              flex items-center justify-center rounded-full p-2
              hover:bg-neutral-200
            "
            @click="closeStopModal"
          >
            <X class="size-4 text-neutral-600" />
          </button>
        </div>

        <!-- 內容卡片 -->
        <div
          class="
            flex min-h-[600px] flex-1 flex-col gap-4 overflow-hidden rounded-2xl
            bg-white p-6 shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <!-- 區塊 Header -->
          <div class="flex items-center gap-3">
            <component
              :is="activeStopTab === 'pickup' ? Truck : Store"
              class="size-5 shrink-0"
              :class="
                activeStopTab === 'pickup'
                  ? 'text-[#3087db]'
                  : 'text-[#229464]'
              "
            />
            <span
              class="text-lg font-bold tracking-[0.9px]"
              :class="
                activeStopTab === 'pickup'
                  ? 'text-[#3087db]'
                  : 'text-[#229464]'
              "
            >
              {{ activeStopTab === 'pickup' ? '攬件' : '放置' }}
            </span>
            <span class="text-sm tracking-[0.7px] text-neutral-600">
              共 {{
                (activeStopTab === 'pickup'
                  ? activeStop?.pickups
                  : activeStop?.deliveries
                )?.reduce((s, o) => s + o.luggageCount, 0)
              }} 件
            </span>
            <!-- 搜尋 + 狀態篩選 -->
            <div class="ml-auto flex items-center gap-2">
              <div class="relative">
                <svg
                  class="
                    absolute top-1/2 left-3 size-4 -translate-y-1/2
                    text-neutral-400
                  "
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                  />
                </svg>
                <input
                  v-model="stopSearchKeyword"
                  type="text"
                  placeholder="旅客姓名、民宿或訂單編號"
                  class="
                    w-[240px] rounded-xs border border-neutral-200 bg-white py-2
                    pr-3 pl-9 text-base tracking-[0.7px] text-neutral-900
                    outline-none
                    placeholder:text-neutral-500
                    focus:border-neutral-400
                  "
                >
              </div>
              <div class="relative">
                <select
                  class="
                    w-[169px] appearance-none rounded-xs border
                    border-neutral-200 bg-white py-2 pr-8 pl-3 text-base
                    tracking-[0.7px] text-neutral-500 outline-none
                    focus:border-neutral-400
                  "
                >
                  <option
                    value=""
                    disabled
                    selected
                  >
                    請選擇訂單狀態
                  </option>
                </select>
                <svg
                  class="
                    pointer-events-none absolute top-1/2 right-3 size-5
                    -translate-y-1/2 text-neutral-400
                  "
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <!-- 訂單列表 -->
          <div class="flex flex-1 flex-col gap-2 overflow-y-auto">
            <div
              v-for="order in filteredStopOrders"
              :key="order.id"
              class="flex flex-col gap-1 rounded-sm bg-neutral-100 p-3"
            >
              <div class="flex flex-col items-start gap-px">
                <span
                  class="
                    text-base font-medium tracking-[0.8px] text-neutral-900
                  "
                >
                  {{ order.lineName }}
                </span>

                <div class="">
                  <span class="text-sm tracking-[0.7px] text-neutral-600">
                    {{ order.luggageCount }} 件
                  </span>
                  <span class="text-sm text-neutral-400">·</span>
                  <span class="text-sm tracking-[0.7px] text-neutral-600">
                    {{ order.orderNumber }}
                  </span>
                </div>

                <p
                  v-if="order.notes"
                  class="text-sm tracking-[0.7px] text-neutral-600"
                >
                  備註：{{ order.notes }}
                </p>
              </div>
            </div>

            <div
              v-if="filteredStopOrders.length === 0"
              class="
                flex flex-1 items-center justify-center rounded-sm border
                border-neutral-200 bg-neutral-50 p-8 text-center
              "
            >
              <span class="text-neutral-900">查無符合條件的訂單</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

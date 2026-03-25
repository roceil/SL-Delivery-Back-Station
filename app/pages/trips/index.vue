<script lang="ts" setup>
import type { DateValue } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'
import { CalendarIcon, ChevronRight, Route } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Trip {
  id: string
  name: string
  description: string
  courierId: string
  courierName: string
  scheduledDate: string
  status: string
  createdAt: string
  dispatchedAt: string | null
  completedAt: string | null
  trackingUrl: string | null
  orderCount: number
  totalLuggage: number
  areas: string[]
}

useHead({
  title: '行程管理 - 物流管理系統',
})

const router = useRouter()

const { data: trips } = await useFetch<Trip[]>('/api/trips')

const df = new DateFormatter('zh-TW', { dateStyle: 'medium' })

// 統計概覽 Tab
const statTab = ref<'day' | 'week' | 'month'>('day')

function isInPeriod(dateStr: string) {
  if (!dateStr)
    return false
  const d = new Date(dateStr)
  const now = new Date()
  if (statTab.value === 'day') {
    return d.toDateString() === now.toDateString()
  }
  if (statTab.value === 'week') {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    return d >= weekStart && d < weekEnd
  }
  // month
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

const periodTrips = computed(() => (trips.value ?? []).filter(t => isInPeriod(t.scheduledDate)))

const stats = computed(() => ({
  total: periodTrips.value.length,
  unassigned: periodTrips.value.filter(t => !t.courierId).length,
  notDeparted: periodTrips.value.filter(t => t.status === 'pending').length,
  inTransit: periodTrips.value.filter(t => t.status === 'dispatched').length,
  delivered: periodTrips.value.filter(t => t.status === 'completed').length,
}))

// 搜尋與篩選
const filters = reactive({
  keyword: '',
  area: '',
  courier: '',
  status: '',
})

const filterDateStr = ref('')
const filterDate = computed<DateValue | undefined>({
  get: () => filterDateStr.value ? parseDate(filterDateStr.value) : undefined,
  set: val => filterDateStr.value = val ? val.toString() : '',
})

const hasActiveFilters = computed(() =>
  !!(filters.keyword || filters.area || filters.courier || filters.status || filterDateStr.value),
)

function resetFilters() {
  filters.keyword = ''
  filters.area = ''
  filters.courier = ''
  filters.status = ''
  filterDateStr.value = ''
}

// 篩選選項（從資料動態產生）
const areaList = computed(() => {
  const set = new Set<string>()
  for (const t of (trips.value ?? [])) {
    for (const a of (t.areas ?? [])) {
      if (a)
        set.add(a)
    }
  }
  return [...set].sort()
})

const courierList = computed(() => {
  const set = new Set<string>()
  for (const t of (trips.value ?? [])) {
    if (t.courierName)
      set.add(t.courierName)
  }
  return [...set].sort()
})

const filteredTrips = computed(() => {
  return (trips.value ?? []).filter((t) => {
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      if (!t.id.toLowerCase().includes(kw) && !t.courierName?.toLowerCase().includes(kw))
        return false
    }
    if (filters.area && !(t.areas ?? []).includes(filters.area))
      return false
    if (filters.courier && t.courierName !== filters.courier)
      return false
    if (filterDateStr.value) {
      const tripDate = t.scheduledDate?.slice(0, 10)
      if (tripDate !== filterDateStr.value)
        return false
    }
    if (filters.status && t.status !== filters.status)
      return false
    return true
  })
})

// 分頁
const pageSize = 10
const currentPage = ref(1)

watch(filteredTrips, () => {
  currentPage.value = 1
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredTrips.value.length / pageSize)))

const pagedTrips = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredTrips.value.slice(start, start + pageSize)
})

// Badge 狀態
interface StatusBadge { type: 'red' | 'blue' | 'green' | 'gray', label: string }

const statusBadgeMap: Record<string, StatusBadge> = {
  pending: { type: 'red', label: '尚未出發' },
  dispatched: { type: 'blue', label: '運送中' },
  completed: { type: 'green', label: '已送達' },
  cancelled: { type: 'gray', label: '已取消' },
}

function getStatusBadge(status: string): StatusBadge {
  return statusBadgeMap[status] ?? { type: 'gray', label: status }
}

function formatDate(dateStr: string) {
  if (!dateStr)
    return '-'
  return new Date(dateStr).toLocaleDateString('zh-TW')
}

// 地圖
async function viewTripMap(tripId: string) {
  try {
    const tripOrders = await $fetch<any[]>(`/api/trips/${tripId}/orders`)
    if (!tripOrders || tripOrders.length === 0)
      return
    const addresses: string[] = []
    tripOrders.forEach((order: any) => {
      if (order.pickupLocation?.address && !addresses.includes(order.pickupLocation.address))
        addresses.push(order.pickupLocation.address)
    })
    tripOrders.forEach((order: any) => {
      if (order.deliveryLocation?.address && !addresses.includes(order.deliveryLocation.address))
        addresses.push(order.deliveryLocation.address)
    })
    const waypoints = addresses.map(a => encodeURIComponent(a)).join('/')
    window.open(`https://www.google.com/maps/dir/${waypoints}`, '_blank', 'noopener,noreferrer')
  }
  catch {
    console.error('無法開啟地圖')
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 p-8">
    <!-- 標題列 -->
    <div class="flex items-center justify-between">
      <h4 class="text-2xl font-bold tracking-[1.2px] text-neutral-900">
        行程管理
      </h4>
      <NuxtLink
        to="/trips/new"
        class="
          flex items-center gap-2 rounded-sm border border-primary-400 px-4 py-2
          text-base font-medium tracking-[0.8px] text-primary-400
          transition-colors
          hover:bg-neutral-50
        "
      >
        <span class="text-lg leading-none">+</span>
        新增行程
      </NuxtLink>
    </div>

    <!-- 統計概覽 -->
    <div class="flex flex-col items-start">
      <!-- Tabs -->
      <div class="flex items-center">
        <button
          v-for="tab in [{ key: 'day', label: '本日' }, { key: 'week', label: '本週' }, { key: 'month', label: '本月' }]"
          :key="tab.key"
          type="button"
          class="
            rounded-tl-sm rounded-tr-sm px-6 py-2 text-base font-medium
            tracking-[0.8px] transition-colors
          "
          :class="
            statTab === tab.key
              ? `
                border border-b-0 border-primary-200 bg-neutral-100
                text-neutral-900
              `
              : 'text-neutral-600 hover:text-neutral-900'
          "
          @click="statTab = tab.key as 'day' | 'week' | 'month'"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 統計卡片 -->
      <div
        class="
          w-full rounded-tr-md rounded-br-md rounded-bl-md bg-neutral-100 p-6
        "
      >
        <div class="grid grid-cols-5 gap-3">
          <div
            v-for="card in [
              { label: '總行程數', value: stats.total },
              { label: '待分配訂單', value: stats.unassigned },
              { label: '尚未出發', value: stats.notDeparted },
              { label: '運送中訂單', value: stats.inTransit },
              { label: '已送達訂單', value: stats.delivered },
            ]"
            :key="card.label"
            class="
              flex flex-col gap-1 rounded-sm border border-primary-200 bg-white
              p-4 shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <span class="text-sm font-medium tracking-[0.7px] text-neutral-600">{{ card.label }}</span>
            <span class="text-2xl font-bold tracking-[1.2px] text-neutral-900">{{ card.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 行程列表標題 -->
    <div class="flex items-center gap-2">
      <span class="text-base font-bold tracking-[0.8px] text-neutral-900">行程列表</span>
      <span class="text-xs tracking-wide text-neutral-600">共 {{ filteredTrips.length }} 趟行程</span>
    </div>

    <!-- 篩選列 -->
    <div class="flex items-center gap-3">
      <!-- 關鍵字搜尋 -->
      <div class="relative">
        <svg
          class="
            absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400
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
          v-model="filters.keyword"
          type="text"
          placeholder="快遞員、行程或訂單編號"
          class="
            w-[236px] rounded-xs border border-neutral-200 bg-white py-2 pr-3
            pl-9 text-sm tracking-wide text-neutral-900 outline-none
            placeholder:text-neutral-400
            focus:border-neutral-400
          "
        >
      </div>

      <!-- 區域 -->
      <Select v-model="filters.area">
        <SelectTrigger class="flex-1 bg-white text-sm">
          <SelectValue placeholder="請選擇區域類型" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem
              v-for="area in areaList"
              :key="area"
              :value="area"
            >
              區域 {{ area }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <!-- 快遞員 -->
      <Select v-model="filters.courier">
        <SelectTrigger class="flex-1 bg-white text-sm">
          <SelectValue placeholder="請選擇快遞員" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem
              v-for="courier in courierList"
              :key="courier"
              :value="courier"
            >
              {{ courier }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <!-- 日期篩選 -->
      <Popover>
        <PopoverTrigger as-child>
          <button
            type="button"
            :class="cn(
              `
                flex flex-1 items-center gap-2 rounded-xs border
                border-neutral-200 bg-white px-3 py-2 text-sm outline-none
                hover:border-neutral-400
              `,
              filterDate ? 'text-neutral-900' : 'text-neutral-400',
            )"
          >
            <CalendarIcon class="size-4 shrink-0 text-neutral-400" />
            {{ filterDate ? df.format(filterDate.toDate(getLocalTimeZone())) : '請選擇運送日期' }}
          </button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0">
          <Calendar
            v-model="filterDate"
            :initial-focus="true"
            layout="month-and-year"
          />
        </PopoverContent>
      </Popover>

      <!-- 運送狀態 -->
      <Select v-model="filters.status">
        <SelectTrigger class="flex-1 bg-white text-sm">
          <SelectValue placeholder="請選擇運送狀態" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="pending">
              尚未出發
            </SelectItem>
            <SelectItem value="dispatched">
              運送中
            </SelectItem>
            <SelectItem value="completed">
              已送達
            </SelectItem>
            <SelectItem value="cancelled">
              已取消
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <!-- 清除篩選條件 -->
      <button
        type="button"
        class="px-3 py-2 text-sm tracking-wide transition-colors"
        :class="[
          hasActiveFilters
            ? 'cursor-pointer text-neutral-600 hover:text-neutral-900'
            : 'cursor-not-allowed text-neutral-400',
        ]"
        :disabled="!hasActiveFilters"
        @click="resetFilters"
      >
        清除篩選條件
      </button>
    </div>

    <!-- 表格 -->
    <div class="flex flex-col gap-3">
      <template v-if="pagedTrips.length > 0">
        <div
          class="rounded-sm bg-white"
        >
          <!-- 表頭 -->
          <div
            class="grid border-b border-neutral-200"
            style="grid-template-columns: 52px repeat(8, 1fr)"
          >
            <div class="flex items-center py-3 pl-4">
              <input
                type="checkbox"
                class="size-4 cursor-pointer accent-primary-300"
              >
            </div>
            <div
              v-for="col in ['行程編號', '運送日期', '快遞員', '訂單資訊', '行李數量', '區域', '運送狀態', '操作']"
              :key="col"
              class="
                px-4 py-3 text-sm font-medium tracking-wider text-neutral-600
              "
            >
              {{ col }}
            </div>
          </div>

          <!-- 資料列 -->
          <div class="divide-y divide-neutral-200">
            <div
              v-for="trip in pagedTrips"
              :key="trip.id"
              class="grid min-h-[60px] items-center border-b border-neutral-200"
              style="grid-template-columns: 52px repeat(8, 1fr)"
            >
              <!-- Checkbox -->
              <div class="flex items-center py-3 pl-4">
                <input
                  type="checkbox"
                  class="size-4 cursor-pointer accent-primary-300"
                >
              </div>

              <!-- 行程編號 -->
              <span class="px-4 text-sm tracking-[0.7px] text-neutral-900">{{ trip.id }}</span>

              <!-- 運送日期 -->
              <span class="px-4 text-sm tracking-[0.7px] text-neutral-900">{{ formatDate(trip.scheduledDate) }}</span>

              <!-- 快遞員 -->
              <span class="px-4 text-sm tracking-[0.7px] text-neutral-900">{{ trip.courierName || '-' }}</span>

              <!-- 訂單資訊 -->
              <span class="px-4 text-sm tracking-[0.7px] text-neutral-900">{{ trip.orderCount }} 筆訂單</span>

              <!-- 行李數量 -->
              <span class="px-4 text-sm tracking-[0.7px] text-neutral-900">{{ trip.totalLuggage }} 件</span>

              <!-- 區域 -->
              <span class="px-4 text-sm tracking-[0.7px] text-neutral-900">{{ trip.areas?.join('、') || '-' }}</span>

              <!-- 運送狀態 -->
              <div class="px-4">
                <Badge
                  :type="getStatusBadge(trip.status).type"
                  :label="getStatusBadge(trip.status).label"
                  size="sm"
                />
              </div>

              <!-- 操作 -->
              <div class="flex items-center justify-between px-4">
                <button
                  type="button"
                  class="
                    text-sm font-medium tracking-[0.7px] text-primary-400
                    hover:text-primary-500
                  "
                  @click="viewTripMap(trip.id)"
                >
                  查看地圖
                </button>
                <button
                  type="button"
                  class="
                    flex items-center justify-center rounded-full p-2
                    hover:bg-neutral-100
                  "
                  @click="router.push(`/trips/${trip.id}`)"
                >
                  <ChevronRight class="size-4 text-neutral-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 分頁 -->
        <div
          v-if="totalPages > 1"
          class="flex items-center justify-center gap-1 py-3"
        >
          <button
            type="button"
            class="
              flex items-center justify-center rounded-full p-2
              hover:bg-neutral-200
              disabled:cursor-not-allowed disabled:opacity-40
            "
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <svg
              class="size-6 text-neutral-900"
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

          <button
            v-for="page in totalPages"
            :key="page"
            type="button"
            class="
              flex size-10 items-center justify-center rounded-sm text-base
              font-bold tracking-[0.8px] transition-colors
            "
            :class="
              page === currentPage
                ? 'text-primary-400'
                : 'text-neutral-400 hover:text-neutral-600'
            "
            @click="currentPage = page"
          >
            {{ page }}
          </button>

          <button
            type="button"
            class="
              flex items-center justify-center rounded-full p-2
              hover:bg-neutral-200
              disabled:cursor-not-allowed disabled:opacity-40
            "
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            <svg
              class="size-6 text-neutral-900"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 18l6-6-6-6"
              />
            </svg>
          </button>
        </div>
      </template>

      <!-- 無資料 -->
      <template v-else>
        <div
          class="flex flex-col items-center gap-3 rounded-sm bg-white p-12"
        >
          <Route class="size-10 text-neutral-400" />
          <div class="flex flex-col items-center gap-1">
            <span class="text-base font-bold tracking-wider text-neutral-900">查無行程</span>
            <span class="text-xs tracking-wide text-neutral-600">請嘗試調整篩選條件</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

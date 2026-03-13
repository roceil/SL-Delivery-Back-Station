<script lang="ts" setup>
import { ChevronRight, Luggage } from 'lucide-vue-next'
import { Checkbox } from '@/components/ui/checkbox'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'

interface Location {
  id: string
  name: string
  address: string
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
  tripAssignment?: string
  pickupLocation: Location
  deliveryLocation: Location
  notes: string
  createdAt: string
}

useHead({
  title: '訂單總覽 - 行李運送系統',
})

const { data: orders } = await useFetch<Order[]>('/api/orders')

const router = useRouter()

const filters = reactive({
  keyword: '',
  customerType: '',
  orderStatus: '',
  tripAssignment: '',
  dateFrom: '',
  dateTo: '',
})

const hasActiveFilters = computed(() => Object.values(filters).some(v => !!v))

const filteredOrders = computed(() => {
  if (!orders.value)
    return []

  return orders.value.filter((order) => {
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      const matchName = order.lineName?.toLowerCase().includes(kw)
      const matchPhone = order.phone?.toLowerCase().includes(kw)
      const matchId = order.id?.toLowerCase().includes(kw)
      if (!matchName && !matchPhone && !matchId)
        return false
    }

    if (filters.customerType && order.category !== filters.customerType)
      return false

    if (filters.orderStatus && order.status !== filters.orderStatus)
      return false

    if (filters.tripAssignment && order.tripAssignment !== filters.tripAssignment)
      return false

    if (filters.dateFrom) {
      if (!order.deliveryDate)
        return false
      if (new Date(order.deliveryDate) < new Date(filters.dateFrom))
        return false
    }

    if (filters.dateTo) {
      if (!order.returnDate)
        return false
      if (new Date(order.returnDate) > new Date(filters.dateTo))
        return false
    }

    return true
  })
})

const selectedOrders = reactive(new Set<string>())

const isAllSelected = computed(
  () => filteredOrders.value.length > 0 && filteredOrders.value.every(o => selectedOrders.has(o.id)),
)

const isIndeterminate = computed(
  () => filteredOrders.value.some(o => selectedOrders.has(o.id)) && !isAllSelected.value,
)

function toggleAll() {
  if (isAllSelected.value) {
    filteredOrders.value.forEach(o => selectedOrders.delete(o.id))
  }
  else {
    filteredOrders.value.forEach(o => selectedOrders.add(o.id))
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.customerType = ''
  filters.orderStatus = ''
  filters.tripAssignment = ''
  filters.dateFrom = ''
  filters.dateTo = ''
}

function goToOrderDetail(orderId: string) {
  router.push(`/orders/${orderId}`)
}

function formatDate(dateString?: string | null) {
  if (!dateString)
    return '-'
  return new Date(dateString).toLocaleDateString('zh-TW')
}

type CategoryBadgeType = 'gray' | 'sky' | 'light-sky' | 'amber' | 'peach' | 'mint'
type StatusBadgeType = 'gray' | 'red' | 'blue' | 'orange'
type TripBadgeType = 'gray' | 'red' | 'blue'

const categoryBadgeMap: Record<string, { type: CategoryBadgeType, label: string }> = {
  散客: { type: 'sky', label: '散客' },
  代售: { type: 'light-sky', label: '代售' },
  Klook: { type: 'amber', label: 'Klook' },
  Trip: { type: 'peach', label: 'Trip' },
  KKday: { type: 'mint', label: 'KKday' },
}

const statusBadgeMap: Record<string, { type: StatusBadgeType, label: string }> = {
  confirmed: { type: 'gray', label: '已確認' },
  pending: { type: 'red', label: '待確認' },
  outbound: { type: 'blue', label: '去程' },
  in_transit: { type: 'blue', label: '運送中' },
  received: { type: 'orange', label: '已收件' },
  delivered: { type: 'gray', label: '已送達' },
}

const tripBadgeMap: Record<string, { type: TripBadgeType, label: string }> = {
  assigned: { type: 'gray', label: '已分配' },
  unassigned: { type: 'red', label: '尚未分配' },
  outbound_unassigned: { type: 'blue', label: '去程未分配' },
}

function getCategoryBadge(category?: string) {
  return categoryBadgeMap[category ?? ''] ?? { type: 'gray' as const, label: category ?? '-' }
}

function getStatusBadge(status?: string) {
  return statusBadgeMap[status ?? ''] ?? { type: 'gray' as const, label: status ?? '-' }
}

function getTripBadge(tripAssignment?: string) {
  return tripBadgeMap[tripAssignment ?? ''] ?? { type: 'red' as const, label: '尚未分配' }
}

const tableColumns = [
  { key: 'checkbox', label: '', width: '52px' },
  { key: 'category', label: '類別', width: '84px' },
  { key: 'customer', label: '旅客/商家', width: '104px' },
  { key: 'deliveryDate', label: '寄件日期(去)', width: '117px' },
  { key: 'returnDate', label: '寄件日期(回)', width: '117px' },
  { key: 'pickupLocation', label: '起始點', width: '1fr' },
  { key: 'deliveryLocation', label: '送達點', width: '1fr' },
  { key: 'luggageCount', label: '行李數量', width: '91px' },
  { key: 'status', label: '訂單狀態', width: '123px' },
  { key: 'tripAssignment', label: '行程分配', width: '111px' },
  { key: 'action', label: '', width: '66px' },
]

const gridTemplateColumns = tableColumns.map(col => col.width).join(' ')
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 標題列 -->
    <div class="flex items-center justify-between">
      <h4 class="text-2xl font-bold tracking-wider text-neutral-900">
        訂單總覽
      </h4>
      <button
        type="button"
        class="
          rounded-xs border px-4 py-2 text-sm font-medium tracking-wider
          transition-colors
        "
        :class="[
          hasActiveFilters
            ? 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'
            : 'cursor-not-allowed border-neutral-200 text-neutral-400',
        ]"
        :disabled="!hasActiveFilters"
        @click="resetFilters"
      >
        清除篩選條件
      </button>
    </div>

    <!-- 篩選區 -->
    <div class="rounded-md bg-neutral-100 p-6">
      <!-- Row 1 -->
      <div class="grid grid-cols-3 gap-4">
        <!-- 關鍵字 -->
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium tracking-wider text-neutral-600">關鍵字</label>
          <input
            v-model="filters.keyword"
            type="text"
            placeholder="旅客姓名、電話或訂單編號"
            class="
              rounded-xs border border-neutral-200 bg-white px-3 py-2 text-sm
              tracking-wide text-neutral-900 outline-none
              placeholder:text-neutral-400
              focus:border-neutral-400
            "
          >
        </div>

        <!-- 旅客類型 -->
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium tracking-wider text-neutral-600">旅客類型</label>
          <Select v-model="filters.customerType">
            <SelectTrigger class="bg-white text-sm">
              <SelectValue placeholder="全部類型" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="散客">
                  散客
                </SelectItem>
                <SelectItem value="Klook">
                  Klook
                </SelectItem>
                <SelectItem value="代售">
                  代售
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <!-- 訂單狀態 -->
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium tracking-wider text-neutral-600">訂單狀態</label>
          <Select v-model="filters.orderStatus">
            <SelectTrigger class="bg-white text-sm">
              <SelectValue placeholder="全部狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="confirmed">
                  已確認
                </SelectItem>
                <SelectItem value="pending">
                  待確認
                </SelectItem>
                <SelectItem value="outbound">
                  去程
                </SelectItem>
                <SelectItem value="in_transit">
                  運送中
                </SelectItem>
                <SelectItem value="received">
                  已收件
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <!-- Row 2 -->
      <div class="mt-4 grid grid-cols-3 gap-4">
        <!-- 行程分配狀態 -->
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium tracking-wider text-neutral-600">行程分配狀態</label>
          <Select v-model="filters.tripAssignment">
            <SelectTrigger class="bg-white text-sm">
              <SelectValue placeholder="全部狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="assigned">
                  已分配
                </SelectItem>
                <SelectItem value="unassigned">
                  尚未分配
                </SelectItem>
                <SelectItem value="outbound_unassigned">
                  去程未分配
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <!-- 寄件日期(去) -->
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium tracking-wider text-neutral-600">寄件日期(去)</label>
          <input
            v-model="filters.dateFrom"
            type="date"
            class="
              rounded-xs border border-neutral-200 bg-white px-3 py-2 text-sm
              tracking-wide text-neutral-900 outline-none
              focus:border-neutral-400
            "
          >
        </div>

        <!-- 寄件日期(回) -->
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium tracking-wider text-neutral-600">寄件日期(回)</label>
          <input
            v-model="filters.dateTo"
            type="date"
            class="
              rounded-xs border border-neutral-200 bg-white px-3 py-2 text-sm
              tracking-wide text-neutral-900 outline-none
              focus:border-neutral-400
            "
          >
        </div>
      </div>
    </div>

    <!-- 結果區 -->
    <div class="flex flex-col gap-3">
      <!-- State 1.1.1: 有結果 -->
      <template v-if="filteredOrders.length > 0">
        <!-- 搜尋結果標題 -->
        <div class="flex items-center gap-2">
          <span class="text-base font-bold tracking-wider text-neutral-900">搜尋結果</span>
          <span class="text-xs tracking-wide text-neutral-600">共 {{ filteredOrders.length }} 筆訂單</span>
        </div>

        <!-- 表格 -->
        <div
          class="rounded-sm bg-white"
        >
          <!-- 表頭 -->
          <div
            class="grid gap-x-4 border-b border-neutral-200 px-4 py-3"
            :style="{ gridTemplateColumns }"
          >
            <!-- 全選 Checkbox -->
            <div>
              <Checkbox
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="toggleAll"
              />
            </div>
            <!-- 其餘欄位標題 -->
            <div
              v-for="header in tableColumns.slice(1)"
              :key="header.key"
              class="text-sm font-medium tracking-[0.7px] text-neutral-600"
            >
              {{ header.label }}
            </div>
          </div>

          <!-- 表格列 -->
          <div class="divide-y divide-neutral-200">
            <div
              v-for="order in filteredOrders"
              :key="order.id"
              class="
                grid min-h-[60px] cursor-pointer items-center gap-x-4 px-4 py-3
                hover:bg-neutral-50
              "
              :style="{ gridTemplateColumns }"
              @click="goToOrderDetail(order.id)"
            >
              <!-- Checkbox -->
              <div
                @click.stop
              >
                <Checkbox
                  :checked="selectedOrders.has(order.id)"
                  @change="selectedOrders.has(order.id) ? selectedOrders.delete(order.id) : selectedOrders.add(order.id)"
                />
              </div>

              <!-- 類別 -->
              <div>
                <Badge
                  :type="getCategoryBadge(order.category).type"
                  :label="getCategoryBadge(order.category).label"
                  size="lg"
                />
              </div>

              <!-- 旅客/商家 -->
              <div class="flex flex-col whitespace-nowrap">
                <HoverCard :open-delay="100">
                  <HoverCardTrigger
                    class="
                      block truncate text-sm font-medium tracking-[0.7px]
                      text-neutral-900
                    "
                  >
                    {{ order.lineName }}
                  </HoverCardTrigger>
                  <HoverCardContent
                    class="
                      w-auto rounded-full border-none bg-primary-200 px-3 py-1
                      text-sm font-medium tracking-wide text-info-300
                    "
                  >
                    {{ order.lineName }}
                  </HoverCardContent>
                </HoverCard>
                <span class="text-xs tracking-[0.6px] text-neutral-600">{{ order.phone }}</span>
              </div>

              <!-- 寄件日期(去) -->
              <div
                class="
                  text-sm tracking-[0.7px] whitespace-nowrap text-neutral-900
                "
              >
                {{ formatDate(order.deliveryDate) }}
              </div>

              <!-- 寄件日期(回) -->
              <div
                class="
                  text-sm tracking-[0.7px] whitespace-nowrap text-neutral-900
                "
              >
                {{ formatDate(order.returnDate) }}
              </div>

              <!-- 起始點 -->
              <div
                class="
                  overflow-hidden text-sm tracking-[0.7px] text-neutral-900
                "
              >
                <HoverCard :open-delay="100">
                  <HoverCardTrigger class="block truncate">
                    {{ order.pickupLocation?.name || '-' }}
                  </HoverCardTrigger>
                  <HoverCardContent
                    class="
                      w-auto rounded-full border-none bg-primary-200 px-3 py-1
                      text-sm font-medium tracking-wide text-info-300
                    "
                  >
                    {{ order.pickupLocation?.name }}
                  </HoverCardContent>
                </HoverCard>
              </div>

              <!-- 送達點 -->
              <div
                class="
                  overflow-hidden text-sm tracking-[0.7px] text-neutral-900
                "
              >
                <HoverCard :open-delay="100">
                  <HoverCardTrigger class="block truncate">
                    {{ order.deliveryLocation?.name || '-' }}
                  </HoverCardTrigger>
                  <HoverCardContent
                    class="
                      w-auto rounded-full border-none bg-primary-200 px-3 py-1
                      text-sm font-medium tracking-wide text-info-300
                    "
                  >
                    {{ order.deliveryLocation?.name }}
                  </HoverCardContent>
                </HoverCard>
              </div>

              <!-- 行李數量 -->
              <div
                class="
                  text-sm tracking-[0.7px] whitespace-nowrap text-neutral-900
                "
              >
                {{ order.luggageCount }} 件
              </div>

              <!-- 訂單狀態 -->
              <div>
                <Badge
                  :type="getStatusBadge(order.status).type"
                  :label="getStatusBadge(order.status).label"
                  size="lg"
                />
              </div>

              <!-- 行程分配 -->
              <div>
                <Badge
                  :type="getTripBadge(order.tripAssignment).type"
                  :label="getTripBadge(order.tripAssignment).label"
                  size="lg"
                />
              </div>

              <!-- 前往 -->
              <div class="flex justify-center">
                <ChevronRight class="size-4 text-neutral-400" />
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- State 1.1.2: 無篩選條件且無訂單 -->
      <template v-else-if="!hasActiveFilters">
        <div
          class="flex flex-col items-center gap-3 rounded-md bg-neutral-100 p-8"
        >
          <Luggage class="size-10 text-neutral-400" />
          <div class="flex flex-col items-center gap-1">
            <span class="text-base font-bold tracking-wider text-neutral-900">尚無訂單</span>
            <span class="text-xs tracking-wide text-neutral-600">請先新增訂單</span>
          </div>
        </div>
      </template>

      <!-- State 1.1.3: 有篩選條件但無結果 -->
      <template v-else>
        <div
          class="flex flex-col items-center gap-3 rounded-md bg-neutral-100 p-8"
        >
          <Luggage class="size-10 text-neutral-400" />
          <div class="flex flex-col items-center gap-1">
            <span class="text-base font-bold tracking-wider text-neutral-900">查無訂單</span>
            <span class="text-xs tracking-wide text-neutral-600">請重新輸入篩選條件</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

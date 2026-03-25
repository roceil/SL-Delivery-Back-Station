<script lang="ts" setup>
import { ChevronRight, Search } from 'lucide-vue-next'
import { Checkbox } from '@/components/ui/checkbox'

useHead({
  title: '結帳總覽 - 物流管理系統',
})

// ── 統計卡片期間 Tab ───────────────────────────────────────────────────────────

type PeriodTab = 'today' | 'month' | 'year'
const activePeriod = ref<PeriodTab>('today')

const periodTabs: { key: PeriodTab, label: string }[] = [
  { key: 'today', label: '本日' },
  { key: 'month', label: '本月' },
  { key: 'year', label: '今年' },
]

const statsData: Record<PeriodTab, {
  revenue: { amount: number, count: number }
  collected: { amount: number, count: number }
  pending: { amount: number, count: number }
  refund: { amount: number, count: number }
}> = {
  today: {
    revenue: { amount: 13340, count: 47 },
    collected: { amount: 12450, count: 44 },
    pending: { amount: 500, count: 2 },
    refund: { amount: 890, count: 1 },
  },
  month: {
    revenue: { amount: 320000, count: 1200 },
    collected: { amount: 300000, count: 1150 },
    pending: { amount: 15000, count: 40 },
    refund: { amount: 5000, count: 10 },
  },
  year: {
    revenue: { amount: 3800000, count: 14500 },
    collected: { amount: 3600000, count: 13800 },
    pending: { amount: 150000, count: 500 },
    refund: { amount: 50000, count: 200 },
  },
}

const currentStats = computed(() => statsData[activePeriod.value])

// ── 帳務列表 Tab ───────────────────────────────────────────────────────────────

type ListTab = 'billing' | 'merchant'
const activeListTab = ref<ListTab>('billing')

const listTabs: { key: ListTab, label: string }[] = [
  { key: 'billing', label: '帳務列表' },
  { key: 'merchant', label: '商家代售' },
]

// ── 篩選條件 ───────────────────────────────────────────────────────────────────

const filters = reactive({
  keyword: '',
  paymentStatus: '',
  destination: '',
  revenueSource: '',
})

const hasActiveFilters = computed(() => Object.values(filters).some(v => !!v))

function resetFilters() {
  filters.keyword = ''
  filters.paymentStatus = ''
  filters.destination = ''
  filters.revenueSource = ''
}

// ── 帳務資料 ───────────────────────────────────────────────────────────────────

interface BillingItem {
  id: string
  category: string
  orderId: string
  passenger: string
  amount: number
  from: string
  to: string
  paymentStatus: 'paid' | 'pending_refund' | 'pending_payment'
}

// TODO: 替換為實際 API 呼叫 /api/billing
const billingItems: BillingItem[] = [
  {
    id: '1',
    category: '散客',
    orderId: 'LSE12345670',
    passenger: '池昌旭',
    amount: 500,
    from: '碼頭門市',
    to: '小琉球樂嶼海景民宿',
    paymentStatus: 'paid',
  },
  {
    id: '2',
    category: 'Klook',
    orderId: 'LSE12345671',
    passenger: 'John Smith',
    amount: 890,
    from: '台北車站',
    to: '松山機場',
    paymentStatus: 'pending_refund',
  },
  {
    id: '3',
    category: '散客',
    orderId: 'LSE12345672',
    passenger: '李美華',
    amount: 500,
    from: '高雄車站',
    to: '高雄機場',
    paymentStatus: 'pending_payment',
  },
  {
    id: '4',
    category: 'Klook',
    orderId: 'LSE12345673',
    passenger: '陳大文',
    amount: 1200,
    from: '桃園機場',
    to: '台北車站',
    paymentStatus: 'paid',
  },
  {
    id: '5',
    category: '散客',
    orderId: 'LSE12345674',
    passenger: '林小芬',
    amount: 750,
    from: '高鐵左營站',
    to: '高雄機場',
    paymentStatus: 'paid',
  },
]

const filteredItems = computed(() => {
  return billingItems.filter((item) => {
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      if (!item.passenger.toLowerCase().includes(kw) && !item.orderId.toLowerCase().includes(kw))
        return false
    }
    if (filters.paymentStatus && item.paymentStatus !== filters.paymentStatus)
      return false
    if (filters.destination && item.to !== filters.destination)
      return false
    if (filters.revenueSource && item.category !== filters.revenueSource)
      return false
    return true
  })
})

// ── 多選 ───────────────────────────────────────────────────────────────────────

const selectedItems = reactive(new Set<string>())

const isAllSelected = computed(
  () => filteredItems.value.length > 0 && filteredItems.value.every(i => selectedItems.has(i.id)),
)
const isIndeterminate = computed(
  () => filteredItems.value.some(i => selectedItems.has(i.id)) && !isAllSelected.value,
)

function toggleAll() {
  if (isAllSelected.value) {
    filteredItems.value.forEach(i => selectedItems.delete(i.id))
  }
  else {
    filteredItems.value.forEach(i => selectedItems.add(i.id))
  }
}

// ── Badge 配置 ─────────────────────────────────────────────────────────────────

type PaymentBadgeType = 'green' | 'orange' | 'red'
const paymentStatusConfig: Record<string, { type: PaymentBadgeType, label: string }> = {
  paid: { type: 'green', label: '已付款' },
  pending_refund: { type: 'orange', label: '待退款' },
  pending_payment: { type: 'red', label: '待補款' },
}

function getPaymentBadge(status: string) {
  return paymentStatusConfig[status] ?? { type: 'red' as const, label: status }
}

type CategoryBadgeType = 'gray' | 'blue'
const categoryConfig: Record<string, { type: CategoryBadgeType, label: string }> = {
  散客: { type: 'gray', label: '散客' },
  Klook: { type: 'blue', label: 'Klook' },
}

function getCategoryBadge(category: string) {
  return categoryConfig[category] ?? { type: 'gray' as const, label: category }
}

// ── 帳務列表表格欄位 ──────────────────────────────────────────────────────────

const billingTableColumns = [
  { key: 'checkbox', label: '', width: '52px' },
  { key: 'category', label: '類別', width: '84px' },
  { key: 'orderId', label: '訂單編號', width: '139px' },
  { key: 'passenger', label: '旅客', width: '82px' },
  { key: 'amount', label: '金額', width: '98px' },
  { key: 'route', label: '路線', width: '1fr' },
  { key: 'paymentStatus', label: '付款狀態', width: '91px' },
  { key: 'action', label: '操作', width: '132px' },
  { key: 'expand', label: '', width: '66px' },
]

const billingGridColumns = billingTableColumns.map(col => col.width).join(' ')

// ── 商家代售資料 ───────────────────────────────────────────────────────────────

interface MerchantItem {
  id: string
  name: string
  type: '餐廳' | '民宿'
  totalTickets: number
  usedTickets: number
  remainingTickets: number
  totalRevenue: number
  status: 'low_stock' | 'sufficient'
}

// TODO: 替換為實際 API 呼叫 /api/billing/merchants
const merchantItems: MerchantItem[] = [
  {
    id: 'm1',
    name: '小本愛玉',
    type: '餐廳',
    totalTickets: 80,
    usedTickets: 70,
    remainingTickets: 10,
    totalRevenue: 11700,
    status: 'low_stock',
  },
  {
    id: 'm2',
    name: '小琉球樂嶼海景民宿',
    type: '民宿',
    totalTickets: 80,
    usedTickets: 20,
    remainingTickets: 60,
    totalRevenue: 11700,
    status: 'sufficient',
  },
  {
    id: 'm3',
    name: '嶼景6.8',
    type: '民宿',
    totalTickets: 80,
    usedTickets: 20,
    remainingTickets: 60,
    totalRevenue: 11700,
    status: 'sufficient',
  },
  {
    id: 'm4',
    name: '小琉球寮寓',
    type: '民宿',
    totalTickets: 80,
    usedTickets: 20,
    remainingTickets: 60,
    totalRevenue: 11700,
    status: 'sufficient',
  },
  {
    id: 'm5',
    name: '蘇宅旅店',
    type: '民宿',
    totalTickets: 80,
    usedTickets: 20,
    remainingTickets: 60,
    totalRevenue: 11700,
    status: 'sufficient',
  },
]

// ── 商家代售篩選 ───────────────────────────────────────────────────────────────

const merchantFilters = reactive({
  keyword: '',
  merchantType: '',
  ticketStatus: '',
})

const hasMerchantFilters = computed(() => Object.values(merchantFilters).some(v => !!v))

function resetMerchantFilters() {
  merchantFilters.keyword = ''
  merchantFilters.merchantType = ''
  merchantFilters.ticketStatus = ''
}

const filteredMerchants = computed(() => {
  return merchantItems.filter((item) => {
    if (merchantFilters.keyword && !item.name.toLowerCase().includes(merchantFilters.keyword.toLowerCase()))
      return false
    if (merchantFilters.merchantType && item.type !== merchantFilters.merchantType)
      return false
    if (merchantFilters.ticketStatus && item.status !== merchantFilters.ticketStatus)
      return false
    return true
  })
})

// ── 商家代售 Badge 配置 ────────────────────────────────────────────────────────

type MerchantTypeBadge = 'orange' | 'green'
const merchantTypeConfig: Record<string, { type: MerchantTypeBadge, label: string }> = {
  餐廳: { type: 'orange', label: '餐廳' },
  民宿: { type: 'green', label: '民宿' },
}

function getMerchantTypeBadge(type: string) {
  return merchantTypeConfig[type] ?? { type: 'gray' as const, label: type }
}

type MerchantStatusBadge = 'red' | 'gray'
const merchantStatusConfig: Record<string, { type: MerchantStatusBadge, label: string }> = {
  low_stock: { type: 'red', label: '庫存量低' },
  sufficient: { type: 'gray', label: '餘額充裕' },
}

function getMerchantStatusBadge(status: string) {
  return merchantStatusConfig[status] ?? { type: 'gray' as const, label: status }
}

// ── 商家代售表格欄位 ───────────────────────────────────────────────────────────

const merchantTableColumns = [
  { key: 'name', label: '商家名稱', width: '183px' },
  { key: 'type', label: '類型', width: '1fr' },
  { key: 'totalTickets', label: '累計給票數', width: '1fr' },
  { key: 'usedTickets', label: '已核銷', width: '1fr' },
  { key: 'remainingTickets', label: '剩餘票券', width: '1fr' },
  { key: 'totalRevenue', label: '總營收', width: '1fr' },
  { key: 'status', label: '狀態', width: '1fr' },
  { key: 'action', label: '操作', width: '99px' },
]

const merchantGridColumns = merchantTableColumns.map(col => col.width).join(' ')

function formatCurrency(amount: number) {
  return `NT$ ${amount.toLocaleString()}`
}
</script>

<template>
  <div class="flex flex-col gap-8 p-8">
    <!-- ── 統計卡片區 ───────────────────────────────────────────────────────── -->
    <div class="flex flex-col gap-4">
      <!-- 標題 -->
      <h4 class="text-2xl font-bold tracking-[1.2px] text-neutral-900">
        結帳總覽
      </h4>

      <!-- Tab + 卡片（直接相連，無間距） -->
      <div>
        <!-- Tab 列 -->
        <div class="flex items-end">
          <button
            v-for="tab in periodTabs"
            :key="tab.key"
            type="button"
            class="
              px-6 py-2 text-base font-medium tracking-[0.8px] transition-colors
            "
            :class="activePeriod === tab.key
              ? `
                rounded-tl-xl rounded-tr-xl border border-b-0 border-[#8cbcf1]
                bg-neutral-100 text-neutral-900
              `
              : 'text-neutral-600 hover:text-neutral-900'"
            @click="activePeriod = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- 統計卡片容器（左上角直角接續作用中頁籤） -->
        <div
          class="
            flex divide-x divide-neutral-200 overflow-hidden rounded-tr-2xl
            rounded-br-2xl rounded-bl-2xl bg-neutral-100
          "
        >
          <!-- 總營收 -->
          <div class="flex flex-1 flex-col gap-2 p-5">
            <span
              class="text-base font-medium tracking-[0.8px] text-neutral-900"
            >總營收</span>
            <div class="flex flex-col gap-1">
              <span
                class="text-2xl font-bold tracking-[1.2px]"
                style="background: linear-gradient(166.98deg, #4090E8 16.25%, #306CF7 61.77%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;"
              >{{ formatCurrency(currentStats.revenue.amount) }}</span>
              <span class="text-sm tracking-[0.7px] text-neutral-600">{{ currentStats.revenue.count }} 筆訂單</span>
            </div>
          </div>

          <!-- 已收款 -->
          <div class="flex flex-1 flex-col gap-2 p-5">
            <span
              class="text-base font-medium tracking-[0.8px] text-neutral-900"
            >已收款</span>
            <div class="flex flex-col gap-1">
              <span
                class="text-2xl font-bold tracking-[1.2px] text-[#229464]"
              >{{ formatCurrency(currentStats.collected.amount) }}</span>
              <span class="text-sm tracking-[0.7px] text-neutral-600">{{ currentStats.collected.count }} 筆訂單</span>
            </div>
          </div>

          <!-- 待收款 -->
          <div class="flex flex-1 flex-col gap-2 p-5">
            <span
              class="text-base font-medium tracking-[0.8px] text-neutral-900"
            >待收款</span>
            <div class="flex flex-col gap-1">
              <span
                class="text-2xl font-bold tracking-[1.2px] text-[#d74f4f]"
              >{{ formatCurrency(currentStats.pending.amount) }}</span>
              <span class="text-sm tracking-[0.7px] text-neutral-600">{{ currentStats.pending.count }} 筆訂單</span>
            </div>
          </div>

          <!-- 待退款 -->
          <div class="flex flex-1 flex-col gap-2 p-5">
            <span
              class="text-base font-medium tracking-[0.8px] text-neutral-900"
            >待退款</span>
            <div class="flex flex-col gap-1">
              <span
                class="text-2xl font-bold tracking-[1.2px] text-[#d87500]"
              >{{ formatCurrency(currentStats.refund.amount) }}</span>
              <span class="text-sm tracking-[0.7px] text-neutral-600">{{ currentStats.refund.count }} 筆訂單</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 帳務列表區 ───────────────────────────────────────────────────────── -->
    <div>
      <!-- Tab 列 -->
      <div class="flex items-end">
        <button
          v-for="tab in listTabs"
          :key="tab.key"
          type="button"
          class="
            px-6 py-2 text-base font-medium tracking-[0.8px] transition-colors
          "
          :class="activeListTab === tab.key
            ? `
              rounded-tl-xl rounded-tr-xl border border-b-0 border-[#8cbcf1]
              bg-neutral-100 text-neutral-900
            `
            : 'text-neutral-600 hover:text-neutral-900'"
          @click="activeListTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 主容器（左上角直角接頁籤） -->
      <div
        class="
          flex flex-col gap-4 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl
          bg-neutral-100 p-6
        "
      >
        <!-- ── 帳務列表 Tab 內容 ──────────────────────────────────────────── -->
        <template v-if="activeListTab === 'billing'">
          <!-- 篩選列 -->
          <div class="flex items-center gap-4">
            <!-- 搜尋輸入 -->
            <div class="relative w-[315px] shrink-0">
              <Search
                class="
                  absolute top-1/2 left-3 size-5 -translate-y-1/2
                  text-neutral-500
                "
              />
              <input
                v-model="filters.keyword"
                type="text"
                placeholder="輸入旅客姓名、訂單編號或商家"
                class="
                  w-full rounded-lg border border-neutral-200 bg-white py-2 pr-3
                  pl-10 text-base tracking-[0.8px] text-neutral-900 outline-none
                  placeholder:text-neutral-500
                  focus:border-neutral-400
                "
              >
            </div>

            <!-- 付款狀態 -->
            <Select
              v-model="filters.paymentStatus"
              class="flex-1"
            >
              <SelectTrigger
                class="
                  rounded-lg border-neutral-200 bg-white text-base
                  tracking-[0.8px]
                "
              >
                <SelectValue placeholder="請選擇付款狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="paid">
                    已付款
                  </SelectItem>
                  <SelectItem value="pending_refund">
                    待退款
                  </SelectItem>
                  <SelectItem value="pending_payment">
                    待補款
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <!-- 目的地 -->
            <Select
              v-model="filters.destination"
              class="flex-1"
            >
              <SelectTrigger
                class="
                  rounded-lg border-neutral-200 bg-white text-base
                  tracking-[0.8px]
                "
              >
                <SelectValue placeholder="請選擇目的地" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="桃園機場">
                    桃園機場
                  </SelectItem>
                  <SelectItem value="松山機場">
                    松山機場
                  </SelectItem>
                  <SelectItem value="高雄機場">
                    高雄機場
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <!-- 營收來源 -->
            <Select
              v-model="filters.revenueSource"
              class="flex-1"
            >
              <SelectTrigger
                class="
                  rounded-lg border-neutral-200 bg-white text-base
                  tracking-[0.8px]
                "
              >
                <SelectValue placeholder="請選擇營收來源" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="散客">
                    散客
                  </SelectItem>
                  <SelectItem value="Klook">
                    Klook
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <!-- 清除篩選條件 -->
            <button
              type="button"
              class="
                shrink-0 rounded-xl px-4 py-2 text-base font-medium
                tracking-[0.8px] text-neutral-600 transition-colors
                hover:text-neutral-900
                disabled:cursor-not-allowed disabled:text-neutral-400
              "
              :disabled="!hasActiveFilters"
              @click="resetFilters"
            >
              清除篩選條件
            </button>
          </div>

          <!-- 白色圓角表格容器 -->
          <div class="overflow-hidden rounded-2xl bg-white">
            <!-- 表頭 -->
            <div
              class="
                grid min-h-[45px] items-center gap-x-4 border-b
                border-neutral-200 px-4 py-3
              "
              :style="{ gridTemplateColumns: billingGridColumns }"
            >
              <div>
                <Checkbox
                  :checked="isAllSelected"
                  :indeterminate="isIndeterminate"
                  @change="toggleAll"
                />
              </div>
              <div
                v-for="col in billingTableColumns.slice(1)"
                :key="col.key"
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >
                {{ col.label }}
              </div>
            </div>

            <!-- 資料列 -->
            <div class="divide-y divide-neutral-200">
              <div
                v-for="item in filteredItems"
                :key="item.id"
                class="
                  grid h-[60px] items-center gap-x-4 px-4
                  hover:bg-neutral-50
                "
                :style="{ gridTemplateColumns: billingGridColumns }"
              >
                <!-- Checkbox -->
                <div @click.stop>
                  <Checkbox
                    :checked="selectedItems.has(item.id)"
                    @change="selectedItems.has(item.id) ? selectedItems.delete(item.id) : selectedItems.add(item.id)"
                  />
                </div>

                <!-- 類別 -->
                <div>
                  <Badge
                    :type="getCategoryBadge(item.category).type"
                    :label="getCategoryBadge(item.category).label"
                    size="lg"
                  />
                </div>

                <!-- 訂單編號 -->
                <div class="text-base tracking-[0.8px] text-neutral-900">
                  {{ item.orderId }}
                </div>

                <!-- 旅客 -->
                <div class="text-base tracking-[0.8px] text-neutral-900">
                  {{ item.passenger }}
                </div>

                <!-- 金額 -->
                <div class="text-base tracking-[0.8px] text-neutral-900">
                  {{ formatCurrency(item.amount) }}
                </div>

                <!-- 路線 -->
                <div
                  class="
                    flex items-center gap-2 overflow-hidden text-base
                    tracking-[0.8px] text-neutral-900
                  "
                >
                  <span class="truncate">{{ item.from }}</span>
                  <span class="shrink-0 text-neutral-500">→</span>
                  <span class="truncate">{{ item.to }}</span>
                </div>

                <!-- 付款狀態 -->
                <div>
                  <Badge
                    :type="getPaymentBadge(item.paymentStatus).type"
                    :label="getPaymentBadge(item.paymentStatus).label"
                    size="lg"
                  />
                </div>

                <!-- 操作 -->
                <div class="text-base tracking-[0.8px]">
                  <template v-if="item.paymentStatus === 'pending_refund'">
                    <button
                      type="button"
                      class="text-primary-400 hover:underline"
                    >
                      進行退款
                    </button>
                  </template>
                  <template v-else-if="item.paymentStatus === 'pending_payment'">
                    <button
                      type="button"
                      class="text-primary-400 hover:underline"
                    >
                      標示為已付款
                    </button>
                  </template>
                  <template v-else>
                    <span class="text-neutral-500">-</span>
                  </template>
                </div>

                <!-- 展開 -->
                <div class="flex justify-center">
                  <NuxtLink
                    :to="`/billing/${item.id}`"
                    class="
                      rounded-full p-2 text-neutral-400
                      hover:bg-neutral-100
                    "
                  >
                    <ChevronRight class="size-4" />
                  </NuxtLink>
                </div>
              </div>
            </div>

            <!-- 空狀態 -->
            <div
              v-if="filteredItems.length === 0"
              class="py-12 text-center text-sm text-neutral-500"
            >
              {{ hasActiveFilters ? '查無符合條件的帳務記錄' : '尚無帳務記錄' }}
            </div>
          </div>
        </template>

        <!-- ── 商家代售 Tab 內容 ──────────────────────────────────────────── -->
        <template v-else-if="activeListTab === 'merchant'">
          <!-- 篩選列 -->
          <div class="flex items-center gap-4">
            <!-- 搜尋輸入 -->
            <div class="relative w-[315px] shrink-0">
              <Search
                class="
                  absolute top-1/2 left-3 size-5 -translate-y-1/2
                  text-neutral-500
                "
              />
              <input
                v-model="merchantFilters.keyword"
                type="text"
                placeholder="輸入商家名稱"
                class="
                  w-full rounded-lg border border-neutral-200 bg-white py-2 pr-3
                  pl-10 text-base tracking-[0.8px] text-neutral-900 outline-none
                  placeholder:text-neutral-500
                  focus:border-neutral-400
                "
              >
            </div>

            <!-- 商家類型 -->
            <Select
              v-model="merchantFilters.merchantType"
              class="flex-1"
            >
              <SelectTrigger
                class="
                  rounded-lg border-neutral-200 bg-white text-base
                  tracking-[0.8px]
                "
              >
                <SelectValue placeholder="請選擇商家類型" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="餐廳">
                    餐廳
                  </SelectItem>
                  <SelectItem value="民宿">
                    民宿
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <!-- 票券狀態 -->
            <Select
              v-model="merchantFilters.ticketStatus"
              class="flex-1"
            >
              <SelectTrigger
                class="
                  rounded-lg border-neutral-200 bg-white text-base
                  tracking-[0.8px]
                "
              >
                <SelectValue placeholder="請選擇票券狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="low_stock">
                    庫存量低
                  </SelectItem>
                  <SelectItem value="sufficient">
                    餘額充裕
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <!-- 清除篩選條件 -->
            <button
              type="button"
              class="
                shrink-0 rounded-xl px-4 py-2 text-base font-medium
                tracking-[0.8px] text-neutral-600 transition-colors
                hover:text-neutral-900
                disabled:cursor-not-allowed disabled:text-neutral-400
              "
              :disabled="!hasMerchantFilters"
              @click="resetMerchantFilters"
            >
              清除篩選條件
            </button>
          </div>

          <!-- 白色圓角表格容器 -->
          <div class="overflow-hidden rounded-2xl bg-white">
            <!-- 表頭 -->
            <div
              class="
                grid min-h-[45px] items-center gap-x-3 border-b
                border-neutral-200 px-4 py-3
              "
              :style="{ gridTemplateColumns: merchantGridColumns }"
            >
              <div
                v-for="col in merchantTableColumns"
                :key="col.key"
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >
                {{ col.label }}
              </div>
            </div>

            <!-- 資料列 -->
            <div class="divide-y divide-neutral-200">
              <div
                v-for="item in filteredMerchants"
                :key="item.id"
                class="
                  grid h-[60px] items-center gap-x-3 px-4
                  hover:bg-neutral-50
                "
                :style="{ gridTemplateColumns: merchantGridColumns }"
              >
                <!-- 商家名稱 -->
                <div
                  class="
                    overflow-hidden text-base tracking-[0.8px] text-neutral-900
                  "
                >
                  <span class="block truncate">{{ item.name }}</span>
                </div>

                <!-- 類型 -->
                <div>
                  <Badge
                    :type="getMerchantTypeBadge(item.type).type"
                    :label="getMerchantTypeBadge(item.type).label"
                    size="lg"
                  />
                </div>

                <!-- 累計給票數 -->
                <div class="text-base tracking-[0.8px] text-neutral-900">
                  {{ item.totalTickets }} 張
                </div>

                <!-- 已核銷 -->
                <div class="text-base tracking-[0.8px] text-neutral-900">
                  {{ item.usedTickets }} 張
                </div>

                <!-- 剩餘票券 -->
                <div class="text-base tracking-[0.8px] text-neutral-900">
                  {{ item.remainingTickets }} 張
                </div>

                <!-- 總營收 -->
                <div class="text-base tracking-[0.8px] text-neutral-900">
                  {{ formatCurrency(item.totalRevenue) }}
                </div>

                <!-- 狀態 -->
                <div>
                  <Badge
                    :type="getMerchantStatusBadge(item.status).type"
                    :label="getMerchantStatusBadge(item.status).label"
                    size="lg"
                  />
                </div>

                <!-- 操作 -->
                <div>
                  <button
                    type="button"
                    class="
                      text-base font-medium tracking-[0.8px] text-primary-400
                      hover:underline
                    "
                  >
                    聯絡商家
                  </button>
                </div>
              </div>
            </div>

            <!-- 空狀態 -->
            <div
              v-if="filteredMerchants.length === 0"
              class="py-12 text-center text-sm text-neutral-500"
            >
              {{ hasMerchantFilters ? '查無符合條件的商家' : '尚無商家代售資料' }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

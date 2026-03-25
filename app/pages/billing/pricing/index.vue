<script lang="ts" setup>
import { Pencil, Trash2 } from 'lucide-vue-next'

useHead({
  title: '售價設定 - 物流管理系統',
})

// ── Tab ────────────────────────────────────────────────────────────────────────

type PricingTab = 'merchant' | 'addon' | 'delivery'
const activeTab = ref<PricingTab>('merchant')

const tabs: { key: PricingTab, label: string }[] = [
  { key: 'merchant', label: '商家代售' },
  { key: 'addon', label: '加值服務' },
  { key: 'delivery', label: '運送價格' },
]

// ── 商家代售 篩選條件 ───────────────────────────────────────────────────────────

const filters = reactive({
  keyword: '',
  merchantType: '',
  cooperationStatus: '',
  ticketStatus: '',
})

const hasActiveFilters = computed(() => Object.values(filters).some(v => !!v))

function resetFilters() {
  filters.keyword = ''
  filters.merchantType = ''
  filters.cooperationStatus = ''
  filters.ticketStatus = ''
}

// ── 加值服務 篩選條件 ───────────────────────────────────────────────────────────

const addonFilters = reactive({
  keyword: '',
  itemType: '',
  enableStatus: '',
})

const hasAddonFilters = computed(() => Object.values(addonFilters).some(v => !!v))

function resetAddonFilters() {
  addonFilters.keyword = ''
  addonFilters.itemType = ''
  addonFilters.enableStatus = ''
}

// ── 資料 ───────────────────────────────────────────────────────────────────────

interface PricingItem {
  id: string
  type: '餐廳' | '民宿'
  name: string
  unitPrice: number
  remainingTickets: number
  ticketStatus: 'out_of_stock' | 'low_stock' | 'sufficient'
  paymentStatus: 'paid' | 'unpaid'
  cooperationStatus: 'active' | 'suspended'
}

// TODO: 替換為實際 API 呼叫 /api/billing/pricing
const pricingItems: PricingItem[] = [
  {
    id: '1',
    type: '餐廳',
    name: '小琉球美食館',
    unitPrice: 250,
    remainingTickets: 0,
    ticketStatus: 'out_of_stock',
    paymentStatus: 'paid',
    cooperationStatus: 'active',
  },
  {
    id: '2',
    type: '民宿',
    name: '樂嶼海景民宿',
    unitPrice: 800,
    remainingTickets: 12,
    ticketStatus: 'low_stock',
    paymentStatus: 'unpaid',
    cooperationStatus: 'active',
  },
  {
    id: '3',
    type: '餐廳',
    name: '碼頭海鮮餐廳',
    unitPrice: 350,
    remainingTickets: 58,
    ticketStatus: 'sufficient',
    paymentStatus: 'paid',
    cooperationStatus: 'suspended',
  },
  {
    id: '4',
    type: '民宿',
    name: '珊瑚礁度假村',
    unitPrice: 1200,
    remainingTickets: 30,
    ticketStatus: 'sufficient',
    paymentStatus: 'paid',
    cooperationStatus: 'active',
  },
  {
    id: '5',
    type: '餐廳',
    name: '漁港風味小館',
    unitPrice: 180,
    remainingTickets: 5,
    ticketStatus: 'low_stock',
    paymentStatus: 'unpaid',
    cooperationStatus: 'active',
  },
]

const filteredItems = computed(() => {
  return pricingItems.filter((item) => {
    if (filters.keyword && !item.name.toLowerCase().includes(filters.keyword.toLowerCase()))
      return false
    if (filters.merchantType && item.type !== filters.merchantType)
      return false
    if (filters.cooperationStatus && item.cooperationStatus !== filters.cooperationStatus)
      return false
    if (filters.ticketStatus && item.ticketStatus !== filters.ticketStatus)
      return false
    return true
  })
})

// ── Badge 配置 ─────────────────────────────────────────────────────────────────

const merchantTypeConfig: Record<string, { type: 'orange' | 'green', label: string }> = {
  餐廳: { type: 'orange', label: '餐廳' },
  民宿: { type: 'green', label: '民宿' },
}

const ticketStatusConfig: Record<string, { type: 'orange' | 'red' | 'gray', label: string }> = {
  out_of_stock: { type: 'orange', label: '無庫存' },
  low_stock: { type: 'red', label: '庫存量低' },
  sufficient: { type: 'gray', label: '餘額充裕' },
}

const paymentStatusConfig: Record<string, { type: 'gray' | 'red', label: string }> = {
  paid: { type: 'gray', label: '已付款' },
  unpaid: { type: 'red', label: '未付款' },
}

const cooperationStatusConfig: Record<string, { type: 'green' | 'gray', label: string }> = {
  active: { type: 'green', label: '合作中' },
  suspended: { type: 'gray', label: '暫停合作' },
}

// ── 表格欄位 ───────────────────────────────────────────────────────────────────

const tableColumns = [
  { key: 'type', label: '類型', width: '73px' },
  { key: 'name', label: '商家名稱', width: '1fr' },
  { key: 'unitPrice', label: '票券單價', width: '1fr' },
  { key: 'remainingTickets', label: '剩餘票券', width: '1fr' },
  { key: 'ticketStatus', label: '票券狀態', width: '1fr' },
  { key: 'paymentStatus', label: '付款狀態', width: '1fr' },
  { key: 'cooperationStatus', label: '合作狀態', width: '98px' },
  { key: 'action', label: '操作', width: '66px' },
]

const gridColumns = tableColumns.map(col => col.width).join(' ')

// ── 加值服務 資料 ──────────────────────────────────────────────────────────────

interface AddonItem {
  id: string
  type: '服務' | '商品'
  name: string
  unitPrice: number
  enableStatus: 'active' | 'inactive'
}

// TODO: 替換為實際 API 呼叫 /api/billing/pricing/addon
const addonItems: AddonItem[] = [
  { id: '1', type: '服務', name: '大型行李', unitPrice: 50, enableStatus: 'active' },
  { id: '2', type: '服務', name: '專業裝備', unitPrice: 100, enableStatus: 'active' },
  { id: '3', type: '服務', name: '冷凍寄存', unitPrice: 100, enableStatus: 'active' },
  { id: '4', type: '商品', name: '手機防水袋', unitPrice: 100, enableStatus: 'inactive' },
]

const filteredAddonItems = computed(() => {
  return addonItems.filter((item) => {
    if (addonFilters.keyword && !item.name.toLowerCase().includes(addonFilters.keyword.toLowerCase()))
      return false
    if (addonFilters.itemType && item.type !== addonFilters.itemType)
      return false
    if (addonFilters.enableStatus && item.enableStatus !== addonFilters.enableStatus)
      return false
    return true
  })
})

// ── 加值服務 Badge 配置 ────────────────────────────────────────────────────────

const addonTypeConfig: Record<string, { type: 'orange' | 'blue', label: string }> = {
  服務: { type: 'orange', label: '服務' },
  商品: { type: 'blue', label: '商品' },
}

const enableStatusConfig: Record<string, { type: 'green' | 'gray', label: string }> = {
  active: { type: 'green', label: '啟用中' },
  inactive: { type: 'gray', label: '停用中' },
}

// ── 加值服務 表格欄位 ──────────────────────────────────────────────────────────

const addonTableColumns = [
  { key: 'type', label: '類型', width: '73px' },
  { key: 'name', label: '品項', width: '1fr' },
  { key: 'unitPrice', label: '單價', width: '1fr' },
  { key: 'enableStatus', label: '啟用狀態', width: '1fr' },
  { key: 'action', label: '操作', width: '100px' },
]

const addonGridColumns = addonTableColumns.map(col => col.width).join(' ')

// ── 運送方案 資料 ──────────────────────────────────────────────────────────────

interface DeliveryPlan {
  id: string
  name: string
  price: number
  enableStatus: 'active' | 'inactive'
}

// TODO: 替換為實際 API 呼叫 /api/billing/pricing/delivery
const deliveryPlans: DeliveryPlan[] = [
  { id: '1', name: '雙程套票', price: 250, enableStatus: 'active' },
  { id: '2', name: '單程運送', price: 130, enableStatus: 'active' },
]

function formatCurrency(amount: number) {
  return `NT$ ${amount.toLocaleString()}`
}
</script>

<template>
  <div class="flex flex-col gap-4 p-8">
    <!-- 標題 -->
    <h4 class="text-2xl font-bold tracking-[1.2px] text-neutral-900">
      售價設定
    </h4>

    <!-- Tab + 卡片 -->
    <div>
      <!-- Tab 列 -->
      <div class="flex items-end">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="
            px-6 py-2 text-base font-medium tracking-[0.8px] transition-colors
          "
          :class="activeTab === tab.key
            ? `
              rounded-tl-xl rounded-tr-xl border border-b-0 border-[#8cbcf1]
              bg-neutral-100 text-neutral-900
            `
            : 'text-neutral-600 hover:text-neutral-900'"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 主容器 -->
      <div
        class="
          flex flex-col gap-4 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl
          bg-neutral-100 p-6
        "
      >
        <!-- ── 商家代售 ────────────────────────────────────────────────────── -->
        <template v-if="activeTab === 'merchant'">
          <!-- 篩選列 -->
          <div class="flex items-start gap-4">
            <!-- 搜尋輸入 -->
            <div class="w-[315px] shrink-0">
              <input
                v-model="filters.keyword"
                type="text"
                placeholder="輸入商家名稱"
                class="
                  w-full rounded-xs border border-neutral-200 bg-white px-3 py-2
                  text-base tracking-[0.8px] text-neutral-900 outline-none
                  placeholder:text-neutral-500
                  focus:border-neutral-400
                "
              >
            </div>

            <!-- 商家類型 -->
            <Select
              v-model="filters.merchantType"
              class="flex-1"
            >
              <SelectTrigger
                class="
                  rounded-xs border-neutral-200 bg-white text-base
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

            <!-- 合作狀態 -->
            <Select
              v-model="filters.cooperationStatus"
              class="flex-1"
            >
              <SelectTrigger
                class="
                  rounded-xs border-neutral-200 bg-white text-base
                  tracking-[0.8px]
                "
              >
                <SelectValue placeholder="請選擇合作狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="active">
                    合作中
                  </SelectItem>
                  <SelectItem value="suspended">
                    暫停合作
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <!-- 票券狀態 -->
            <Select
              v-model="filters.ticketStatus"
              class="flex-1"
            >
              <SelectTrigger
                class="
                  rounded-xs border-neutral-200 bg-white text-base
                  tracking-[0.8px]
                "
              >
                <SelectValue placeholder="請選擇票券狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="out_of_stock">
                    無庫存
                  </SelectItem>
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
                shrink-0 rounded-xs px-4 py-2 text-base font-medium
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

          <!-- 表格 -->
          <div class="overflow-hidden rounded-2xl bg-white">
            <!-- 表頭 -->
            <div
              class="
                grid min-h-[45px] items-center gap-x-4 border-b
                border-neutral-200 px-4 py-3
              "
              :style="{ gridTemplateColumns: gridColumns }"
            >
              <div
                v-for="col in tableColumns"
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
                :style="{ gridTemplateColumns: gridColumns }"
              >
                <!-- 類型 -->
                <div>
                  <Badge
                    :type="merchantTypeConfig[item.type]?.type ?? 'gray'"
                    :label="merchantTypeConfig[item.type]?.label ?? item.type"
                    size="sm"
                  />
                </div>

                <!-- 商家名稱 -->
                <div class="text-sm tracking-[0.7px] text-neutral-900">
                  {{ item.name }}
                </div>

                <!-- 票券單價 -->
                <div class="text-sm tracking-[0.7px] text-neutral-900">
                  {{ formatCurrency(item.unitPrice) }}
                </div>

                <!-- 剩餘票券 -->
                <div class="text-sm tracking-[0.7px] text-neutral-900">
                  {{ item.remainingTickets }}
                </div>

                <!-- 票券狀態 -->
                <div>
                  <Badge
                    :type="ticketStatusConfig[item.ticketStatus]?.type ?? 'gray'"
                    :label="ticketStatusConfig[item.ticketStatus]?.label ?? item.ticketStatus"
                    size="sm"
                  />
                </div>

                <!-- 付款狀態 -->
                <div>
                  <Badge
                    :type="paymentStatusConfig[item.paymentStatus]?.type ?? 'gray'"
                    :label="paymentStatusConfig[item.paymentStatus]?.label ?? item.paymentStatus"
                    size="sm"
                  />
                </div>

                <!-- 合作狀態 -->
                <div>
                  <Badge
                    :type="cooperationStatusConfig[item.cooperationStatus]?.type ?? 'gray'"
                    :label="cooperationStatusConfig[item.cooperationStatus]?.label ?? item.cooperationStatus"
                    size="sm"
                  />
                </div>

                <!-- 操作 -->
                <div class="flex items-center">
                  <NuxtLink
                    :to="`/billing/pricing/merchant/${item.id}`"
                    class="
                      flex size-8 items-center justify-center rounded-lg
                      text-neutral-600 transition-colors
                      hover:bg-neutral-100 hover:text-neutral-900
                    "
                  >
                    <Pencil class="size-4" />
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ── 加值服務 ────────────────────────────────────────────────────── -->
        <template v-else-if="activeTab === 'addon'">
          <!-- 篩選列 -->
          <div class="flex items-start gap-4">
            <!-- 搜尋輸入 -->
            <div class="w-[315px] shrink-0">
              <input
                v-model="addonFilters.keyword"
                type="text"
                placeholder="輸入品項名稱"
                class="
                  w-full rounded-xs border border-neutral-200 bg-white px-3 py-2
                  text-base tracking-[0.8px] text-neutral-900 outline-none
                  placeholder:text-neutral-500
                  focus:border-neutral-400
                "
              >
            </div>

            <!-- 品項類型 -->
            <Select
              v-model="addonFilters.itemType"
              class="flex-1"
            >
              <SelectTrigger
                class="
                  rounded-xs border-neutral-200 bg-white text-base
                  tracking-[0.8px]
                "
              >
                <SelectValue placeholder="請選擇品項類型" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="服務">
                    服務
                  </SelectItem>
                  <SelectItem value="商品">
                    商品
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <!-- 啟用狀態 -->
            <Select
              v-model="addonFilters.enableStatus"
              class="flex-1"
            >
              <SelectTrigger
                class="
                  rounded-xs border-neutral-200 bg-white text-base
                  tracking-[0.8px]
                "
              >
                <SelectValue placeholder="請選擇啟用狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="active">
                    啟用中
                  </SelectItem>
                  <SelectItem value="inactive">
                    停用中
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <!-- 清除篩選條件 -->
            <button
              type="button"
              class="
                shrink-0 rounded-xs px-4 py-2 text-base font-medium
                tracking-[0.8px] text-neutral-600 transition-colors
                hover:text-neutral-900
                disabled:cursor-not-allowed disabled:text-neutral-400
              "
              :disabled="!hasAddonFilters"
              @click="resetAddonFilters"
            >
              清除篩選條件
            </button>
          </div>

          <!-- 表格 -->
          <div class="overflow-hidden rounded-2xl bg-white">
            <!-- 表頭 -->
            <div
              class="
                grid min-h-[45px] items-center gap-x-4 border-b
                border-neutral-200 px-4 py-3
              "
              :style="{ gridTemplateColumns: addonGridColumns }"
            >
              <div
                v-for="col in addonTableColumns"
                :key="col.key"
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >
                {{ col.label }}
              </div>
            </div>

            <!-- 資料列 -->
            <div class="divide-y divide-neutral-200">
              <div
                v-for="item in filteredAddonItems"
                :key="item.id"
                class="
                  grid h-[60px] items-center gap-x-4 px-4
                  hover:bg-neutral-50
                "
                :style="{ gridTemplateColumns: addonGridColumns }"
              >
                <!-- 類型 -->
                <div>
                  <Badge
                    :type="addonTypeConfig[item.type]?.type ?? 'gray'"
                    :label="addonTypeConfig[item.type]?.label ?? item.type"
                    size="sm"
                  />
                </div>

                <!-- 品項 -->
                <div class="text-sm tracking-[0.7px] text-neutral-900">
                  {{ item.name }}
                </div>

                <!-- 單價 -->
                <div class="text-sm tracking-[0.7px] text-neutral-900">
                  {{ formatCurrency(item.unitPrice) }}
                </div>

                <!-- 啟用狀態 -->
                <div>
                  <Badge
                    :type="enableStatusConfig[item.enableStatus]?.type ?? 'gray'"
                    :label="enableStatusConfig[item.enableStatus]?.label ?? item.enableStatus"
                    size="sm"
                  />
                </div>

                <!-- 操作 -->
                <div class="flex items-center gap-3">
                  <NuxtLink
                    :to="`/billing/pricing/addon/${item.id}/edit`"
                    class="
                      text-sm font-medium tracking-[0.7px] text-primary-400
                      hover:underline
                    "
                  >
                    編輯
                  </NuxtLink>
                  <button
                    type="button"
                    class="
                      text-sm font-medium tracking-[0.7px] text-danger-300
                      hover:underline
                    "
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ── 運送價格 ────────────────────────────────────────────────────── -->
        <template v-else-if="activeTab === 'delivery'">
          <div class="grid grid-cols-3 gap-4">
            <div
              v-for="plan in deliveryPlans"
              :key="plan.id"
              class="flex flex-col gap-2.5 rounded-xl bg-white p-4"
              style="box-shadow: 0px 4px 12px rgba(32,78,184,0.04);"
            >
              <!-- 方案名稱 + 狀態 -->
              <div class="flex items-end gap-2">
                <h3 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
                  {{ plan.name }}
                </h3>
                <Badge
                  :type="plan.enableStatus === 'active' ? 'green' : 'gray'"
                  :label="plan.enableStatus === 'active' ? '啟用中' : '停用中'"
                  size="sm"
                />
              </div>

              <!-- 價格 -->
              <p class="text-sm tracking-[0.7px] text-neutral-600">
                {{ formatCurrency(plan.price) }}
              </p>

              <!-- 操作按鈕 -->
              <div class="flex items-center justify-end gap-4">
                <button
                  type="button"
                  class="
                    flex items-center gap-1 text-sm font-medium tracking-[0.7px]
                    text-danger-300
                    hover:underline
                  "
                >
                  <Trash2 class="size-5" />
                  刪除
                </button>
                <NuxtLink
                  :to="`/billing/pricing/delivery/${plan.id}/edit`"
                  class="
                    flex items-center gap-1 text-sm font-medium tracking-[0.7px]
                    text-primary-400
                    hover:underline
                  "
                >
                  <Pencil class="size-5" />
                  編輯
                </NuxtLink>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

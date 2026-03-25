<script lang="ts" setup>
/**
 * 以下為假資料欄位，尚未對應至資料庫，待後續補充 DB 欄位與 API：
 *
 * - courierType (夥伴類型)：DB 欄位 `courier_type` VARCHAR，值為 'long_term' | 'short_term'
 * - salaryStatus (薪資結算)：DB 欄位 `salary_status` VARCHAR，值為 'paid' | 'unpaid'
 *
 * 補齊後請將 mockCouriers 假資料替換為真實 API 資料（useFetch('/api/couriers')）
 */
import { ChevronRight, Users } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

interface Courier {
  id: number
  employeeNumber: string
  name: string
  phone: string
  statusId: number
  status: string
  statusExplanation: string
  isAvailable: boolean
  totalDeliveries: number
  hireDate: string
  createdAt: string
  updatedAt: string
  courierType?: 'long_term' | 'short_term'
  salaryStatus?: 'paid' | 'unpaid' | null
}

useHead({
  title: '夥伴總覽 - 物流管理系統',
})

// 假資料（暫用，待 API 補上 courierType / salaryStatus 欄位後替換）
const mockCouriers: Courier[] = [
  {
    id: 1,
    employeeNumber: 'C001',
    name: '林呈昕',
    phone: '0912345678',
    statusId: 1,
    status: 'hire',
    statusExplanation: '',
    isAvailable: true,
    totalDeliveries: 2,
    hireDate: '2024-01-01',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    courierType: 'short_term',
    salaryStatus: 'paid',
  },
  {
    id: 2,
    employeeNumber: 'C002',
    name: '朱姓碼農',
    phone: '0912345678',
    statusId: 1,
    status: 'hire',
    statusExplanation: '',
    isAvailable: true,
    totalDeliveries: 2,
    hireDate: '2024-01-01',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    courierType: 'long_term',
    salaryStatus: null,
  },
  {
    id: 3,
    employeeNumber: 'C003',
    name: '長樂公主',
    phone: '0912345678',
    statusId: 2,
    status: 'fire',
    statusExplanation: '',
    isAvailable: false,
    totalDeliveries: 2,
    hireDate: '2023-06-01',
    createdAt: '2023-06-01',
    updatedAt: '2024-01-01',
    courierType: 'long_term',
    salaryStatus: null,
  },
]

const couriers = ref<Courier[]>(mockCouriers)

const router = useRouter()

const filters = reactive({
  keyword: '',
  courierType: '',
  hireStatus: '',
  salaryStatus: '',
})

const hasActiveFilters = computed(() => Object.values(filters).some(v => !!v))

const totalDeliveries = computed(() =>
  couriers.value.reduce((sum, c) => sum + (c.totalDeliveries || 0), 0),
)

const filteredCouriers = computed(() => {
  return couriers.value.filter((courier) => {
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      const matchName = courier.name?.toLowerCase().includes(kw)
      const matchEmployee = courier.employeeNumber?.toLowerCase().includes(kw)
      if (!matchName && !matchEmployee)
        return false
    }

    if (filters.hireStatus && courier.status !== filters.hireStatus)
      return false

    if (filters.courierType && courier.courierType !== filters.courierType)
      return false

    if (filters.salaryStatus && courier.salaryStatus !== filters.salaryStatus)
      return false

    return true
  })
})

function resetFilters() {
  filters.keyword = ''
  filters.courierType = ''
  filters.hireStatus = ''
  filters.salaryStatus = ''
}

function goToCourierDetail(id: number) {
  router.push(`/couriers/${id}`)
}

interface BadgeInfo { type: 'gray' | 'blue' | 'green' | 'orange', label: string }

const hireStatusBadgeMap: Record<string, BadgeInfo> = {
  hire: { type: 'green', label: '雇用中' },
  fire: { type: 'gray', label: '已離職' },
}

function getHireStatusBadge(status: string): BadgeInfo {
  return hireStatusBadgeMap[status] ?? { type: 'gray', label: status || '-' }
}

const courierTypeBadgeMap: Record<string, BadgeInfo> = {
  long_term: { type: 'blue', label: '長期合作' },
  short_term: { type: 'orange', label: '短期支援' },
}

function getCourierTypeBadge(type?: string): BadgeInfo | null {
  if (!type)
    return null
  return courierTypeBadgeMap[type] ?? null
}

const salaryStatusBadgeMap: Record<string, BadgeInfo> = {
  paid: { type: 'green', label: '已支付' },
  unpaid: { type: 'orange', label: '未支付' },
}

function getSalaryStatusBadge(status?: string | null): BadgeInfo | null {
  if (!status)
    return null
  return salaryStatusBadgeMap[status] ?? null
}

const tableColumns = [
  { key: 'type', label: '類型', width: '1fr' },
  { key: 'name', label: '夥伴名稱', width: '1fr' },
  { key: 'employeeNumber', label: '員工編號', width: '1fr' },
  { key: 'phone', label: '聯絡方式', width: '1fr' },
  { key: 'hireStatus', label: '雇用狀態', width: '1fr' },
  { key: 'totalDeliveries', label: '配送次數', width: '1fr' },
  { key: 'salaryStatus', label: '薪資結算', width: '1fr' },
  { key: 'action', label: '', width: '44px' },
]

const gridTemplateColumns = tableColumns.map(col => col.width).join(' ')
</script>

<template>
  <div class="flex flex-col gap-4 p-8">
    <!-- 標題列 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h4 class="text-2xl font-bold tracking-wider text-neutral-900">
          夥伴總覽
        </h4>
        <div
          class="flex items-center gap-1 text-sm tracking-wide text-neutral-600"
        >
          <span>總配送次數</span>
          <span class="font-medium text-primary-400">{{ totalDeliveries }} 次</span>
        </div>
      </div>
      <NuxtLink
        to="/couriers/new"
        class="
          hover:bg-primary-50
          rounded-xs border border-primary-400 px-4 py-2 text-sm font-medium
          tracking-wider text-primary-400 transition-colors
        "
      >
        + 新增夥伴
      </NuxtLink>
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
          placeholder="輸入夥伴名稱或員工編號"
          class="
            w-[315px] rounded-xs border border-neutral-200 bg-white py-2 pr-3
            pl-9 text-sm tracking-wide text-neutral-900 outline-none
            placeholder:text-neutral-400
            focus:border-neutral-400
          "
        >
      </div>

      <!-- 夥伴類型 -->
      <Select v-model="filters.courierType">
        <SelectTrigger class="w-[160px] bg-white text-sm">
          <SelectValue placeholder="請選擇夥伴類型" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="long_term">
              長期合作
            </SelectItem>
            <SelectItem value="short_term">
              短期支援
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <!-- 雇用狀態 -->
      <Select v-model="filters.hireStatus">
        <SelectTrigger class="w-[160px] bg-white text-sm">
          <SelectValue placeholder="請選擇雇用狀態" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="hire">
              雇用中
            </SelectItem>
            <SelectItem value="fire">
              已離職
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <!-- 薪資結算狀態 -->
      <Select v-model="filters.salaryStatus">
        <SelectTrigger class="w-[180px] bg-white text-sm">
          <SelectValue placeholder="請選擇薪資結算狀態" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="paid">
              已支付
            </SelectItem>
            <SelectItem value="unpaid">
              未支付
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <!-- 清除篩選條件 -->
      <button
        type="button"
        class="px-3 py-2 text-sm tracking-wider transition-colors"
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
      <!-- 有資料 -->
      <template v-if="filteredCouriers.length > 0">
        <div class="rounded-sm bg-white">
          <!-- 表頭 -->
          <div
            class="grid gap-x-4 border-b border-neutral-200 px-4 py-3"
            :style="{ gridTemplateColumns }"
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
              v-for="courier in filteredCouriers"
              :key="courier.id"
              class="
                grid min-h-[60px] cursor-pointer items-center gap-x-4 px-4 py-3
                hover:bg-neutral-50
              "
              :style="{ gridTemplateColumns }"
              @click="goToCourierDetail(courier.id)"
            >
              <!-- 類型 -->
              <div class="">
                <Badge
                  v-if="getCourierTypeBadge(courier.courierType)"
                  :type="getCourierTypeBadge(courier.courierType)!.type"
                  :label="getCourierTypeBadge(courier.courierType)!.label"
                  size="lg"
                />
                <span
                  v-else
                  class="text-sm text-neutral-400"
                >-</span>
              </div>

              <!-- 夥伴名稱 -->
              <div
                class="
                  truncate text-sm font-medium tracking-[0.7px] text-neutral-900
                "
              >
                {{ courier.name || '-' }}
              </div>

              <!-- 員工編號 -->
              <div class="text-sm tracking-[0.7px] text-neutral-900">
                {{ courier.employeeNumber || '-' }}
              </div>

              <!-- 聯絡方式 -->
              <div class="text-sm tracking-[0.7px] text-neutral-900">
                {{ courier.phone || '-' }}
              </div>

              <!-- 雇用狀態 -->
              <div class="flex flex-col gap-0.5">
                <Badge
                  :type="getHireStatusBadge(courier.status).type"
                  :label="getHireStatusBadge(courier.status).label"
                  size="lg"
                  class="self-start"
                />
                <span
                  class="text-[12px] tracking-[0.6px]"
                  :class="courier.isAvailable ? 'text-neutral-900' : `
                    text-neutral-500
                  `"
                >
                  {{ courier.isAvailable ? '可執行任務' : '無法執行任務' }}
                </span>
              </div>

              <!-- 配送次數 -->
              <div class="text-sm tracking-[0.7px] text-neutral-900">
                {{ courier.totalDeliveries || 0 }} 次
              </div>

              <!-- 薪資結算 -->
              <div class="">
                <Badge
                  v-if="getSalaryStatusBadge(courier.salaryStatus)"
                  :type="getSalaryStatusBadge(courier.salaryStatus)!.type"
                  :label="getSalaryStatusBadge(courier.salaryStatus)!.label"
                  size="lg"
                />
                <span
                  v-else
                  class="text-sm text-neutral-400"
                >-</span>
              </div>

              <!-- 操作 -->
              <div class="flex justify-center">
                <ChevronRight class="size-4 text-neutral-400" />
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 無篩選條件且無夥伴 -->
      <template v-else-if="!hasActiveFilters">
        <div
          class="flex flex-col items-center gap-3 rounded-md bg-neutral-100 p-8"
        >
          <Users class="size-10 text-neutral-400" />
          <div class="flex flex-col items-center gap-1">
            <span class="text-base font-bold tracking-wider text-neutral-900">尚無夥伴</span>
            <span class="text-xs tracking-wide text-neutral-600">請先新增夥伴</span>
          </div>
        </div>
      </template>

      <!-- 有篩選條件但無結果 -->
      <template v-else>
        <div
          class="flex flex-col items-center gap-3 rounded-md bg-neutral-100 p-8"
        >
          <Users class="size-10 text-neutral-400" />
          <div class="flex flex-col items-center gap-1">
            <span class="text-base font-bold tracking-wider text-neutral-900">查無夥伴</span>
            <span class="text-xs tracking-wide text-neutral-600">請重新輸入篩選條件</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

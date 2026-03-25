<script lang="ts" setup>
/**
 * 以下為假資料欄位，尚未對應至資料庫，待後續補充 DB 欄位與 API：
 *
 * - courierType (夥伴類型)：
 *     DB 欄位 `courier_type` VARCHAR，值為 'long_term' | 'short_term'
 *     目前以假資料 'long_term' 顯示，補齊後請從 API 回傳值取用
 *
 * - deliveryRecords (配送紀錄)：
 *     待串接 GET `/api/couriers/${id}/delivery-records`
 *     目前以 mockDeliveryRecords 假資料顯示
 *
 * - salaryRecords (薪資明細，僅短期支援夥伴)：
 *     待串接 GET `/api/couriers/${id}/salary-records`
 *     需補充的 DB 欄位：
 *       - `delivery_rate` NUMERIC：每筆紀錄的運送單價（目前從夥伴層級 delivery_rate 假設）
 *       - `salary_status` VARCHAR：值為 'paid' | 'unpaid'，每筆薪資結算狀態
 *     目前以 mockSalaryRecords 假資料顯示
 */
import type { DateValue } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'
import { ArrowLeft, CalendarIcon, CircleDollarSign, Package, Pencil, Phone, Trash2, UserRound } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

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
  courierType?: string
  deliveryRate?: number
}

interface DeliveryRecord {
  id: number
  deliveryDate: string
  tripNumber: string
  orderCount: number
  luggageCount: number
}

interface SalaryRecord {
  id: number
  deliveryDate: string
  // 假資料欄位，待 DB 補齊：delivery_rate NUMERIC
  deliveryRate: number
  luggageCount: number
  amount: number
  // 假資料欄位，待 DB 補齊：salary_status VARCHAR ('paid' | 'unpaid')
  salaryStatus: 'paid' | 'unpaid'
}

useHead({
  title: '夥伴詳細資訊 - 物流管理系統',
})

const { setBreadcrumb, clearBreadcrumb } = useBreadcrumb()

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const { data: courierData } = await useFetch<Courier>(`/api/couriers/${id}`)

if (!courierData.value) {
  throw createError({ statusCode: 404, message: '找不到此夥伴' })
}

const courier = courierData as Ref<Courier>

onMounted(() => {
  setBreadcrumb({ label: courier.value.name || '夥伴詳細資訊' })
})

onBeforeRouteLeave(() => {
  clearBreadcrumb()
})

// 假資料（待串接配送紀錄 API）
const mockDeliveryRecords: DeliveryRecord[] = [
  { id: 1, deliveryDate: '2026-01-19', tripNumber: '20260119-1', orderCount: 2, luggageCount: 4 },
  { id: 2, deliveryDate: '2026-01-19', tripNumber: '20260119-2', orderCount: 2, luggageCount: 4 },
  { id: 3, deliveryDate: '2026-01-19', tripNumber: '20260119-3', orderCount: 2, luggageCount: 4 },
  { id: 4, deliveryDate: '2026-01-19', tripNumber: '20260119-4', orderCount: 2, luggageCount: 4 },
  { id: 5, deliveryDate: '2026-01-19', tripNumber: '20260119-5', orderCount: 2, luggageCount: 4 },
]

const deliveryRecords = ref<DeliveryRecord[]>(mockDeliveryRecords)

const dfDate = new DateFormatter('zh-TW', { dateStyle: 'medium' })

// 配送紀錄日期篩選（使用 computed 以修正 Calendar v-model 型別）
const filterDateStr = ref('')
const filterDate = computed<DateValue | undefined>({
  get: () => filterDateStr.value ? parseDate(filterDateStr.value) : undefined,
  set: val => filterDateStr.value = val ? val.toString() : '',
})

const filteredDeliveryRecords = computed(() => {
  if (!filterDateStr.value)
    return deliveryRecords.value
  return deliveryRecords.value.filter(r => r.deliveryDate === filterDateStr.value)
})

// 假資料（待串接薪資明細 API）
const mockSalaryRecords: SalaryRecord[] = [
  { id: 1, deliveryDate: '2026-01-19', deliveryRate: 100, luggageCount: 20, amount: 2000, salaryStatus: 'unpaid' },
  { id: 2, deliveryDate: '2026-01-18', deliveryRate: 100, luggageCount: 4, amount: 400, salaryStatus: 'unpaid' },
  { id: 3, deliveryDate: '2025-12-19', deliveryRate: 80, luggageCount: 10, amount: 800, salaryStatus: 'unpaid' },
]

const salaryRecords = ref<SalaryRecord[]>(mockSalaryRecords)

// 薪資明細篩選
const salaryFilterDateStr = ref('')
const salaryFilterDate = computed<DateValue | undefined>({
  get: () => salaryFilterDateStr.value ? parseDate(salaryFilterDateStr.value) : undefined,
  set: val => salaryFilterDateStr.value = val ? val.toString() : '',
})

const salaryFilterStatus = ref<'paid' | 'unpaid' | ''>('')

const filteredSalaryRecords = computed(() => {
  return salaryRecords.value.filter((r) => {
    if (salaryFilterDateStr.value && r.deliveryDate !== salaryFilterDateStr.value)
      return false
    if (salaryFilterStatus.value && r.salaryStatus !== salaryFilterStatus.value)
      return false
    return true
  })
})

const overallSalaryStatus = computed(() => {
  const hasUnpaid = salaryRecords.value.some(r => r.salaryStatus === 'unpaid')
  return hasUnpaid ? 'unpaid' : 'paid'
})

function markAsPaid(record: SalaryRecord) {
  record.salaryStatus = 'paid'
  // TODO: 串接 PATCH /api/couriers/${id}/salary-records/${record.id}
}

const df = new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium' })

const hireDateLabel = computed(() => {
  if (!courier.value.hireDate)
    return '-'
  return df.format(new Date(courier.value.hireDate))
})

const totalLuggageCount = computed(() =>
  deliveryRecords.value.reduce((sum, r) => sum + r.luggageCount, 0),
)

interface BadgeInfo { type: 'gray' | 'blue' | 'green' | 'orange', label: string }

const hireStatusBadge = computed<BadgeInfo>(() => {
  const statusMap: Record<string, BadgeInfo> = {
    hire: { type: 'green', label: '雇用中' },
    fire: { type: 'gray', label: '已離職' },
  }
  return statusMap[courier.value.status] ?? { type: 'gray', label: courier.value.status || '-' }
})

const availabilityBadge = computed<BadgeInfo>(() => {
  return courier.value.isAvailable
    ? { type: 'green', label: '可執行任務' }
    : { type: 'gray', label: '無法執行任務' }
})

// 假資料：courierType 待 DB 補齊後從 courier.value.courierType 取值
const mockCourierType = courier.value.courierType ?? 'long_term'

const courierTypeBadge = computed<BadgeInfo>(() => {
  const typeMap: Record<string, BadgeInfo> = {
    long_term: { type: 'blue', label: '長期合作' },
    short_term: { type: 'orange', label: '短期支援' },
  }
  return typeMap[mockCourierType] ?? { type: 'blue', label: '長期合作' }
})

function goToEdit() {
  router.push(`/couriers/${id}/edit`)
}

function callCourier() {
  if (courier.value.phone) {
    window.location.href = `tel:${courier.value.phone}`
  }
}

function deleteCourier() {
  // TODO: 串接刪除 API
}
</script>

<template>
  <div class="flex flex-col gap-4 bg-neutral-100 p-8">
    <!-- 頁面標題 -->
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="
          flex items-center justify-center rounded-full p-2
          hover:bg-neutral-200
        "
        @click="router.push('/couriers')"
      >
        <ArrowLeft class="size-5 text-neutral-900" />
      </button>
      <h4 class="text-2xl font-bold tracking-[1.2px] text-neutral-900">
        {{ courier.name }}
      </h4>
      <div class="flex items-center gap-2">
        <Badge
          :type="hireStatusBadge.type"
          :label="hireStatusBadge.label"
          size="lg"
        />
        <Badge
          :type="availabilityBadge.type"
          :label="availabilityBadge.label"
          size="lg"
        />
      </div>
    </div>

    <!-- 主要內容 -->
    <div class="grid grid-cols-12 items-start gap-4">
      <!-- 左欄：詳細資訊 -->
      <div class="col-span-8 flex flex-col gap-4">
        <!-- 夥伴資訊 -->
        <div
          class="
            rounded-md bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <div class="mb-4 flex items-center gap-2">
            <UserRound class="size-5 text-neutral-600" />
            <h2
              class="flex-1 text-lg font-bold tracking-[0.9px] text-neutral-900"
            >
              夥伴資訊
            </h2>
            <Badge
              :type="courierTypeBadge.type"
              :label="courierTypeBadge.label"
              size="lg"
            />
          </div>

          <!-- Overview 統計卡片 -->
          <div class="grid grid-cols-4 gap-2">
            <div class="flex flex-col gap-1 rounded-sm bg-neutral-100 p-4">
              <span class="text-sm tracking-[0.7px] text-neutral-600">姓名</span>
              <span
                class="text-base font-medium tracking-[0.8px] text-neutral-900"
              >
                {{ courier.name || '-' }}
              </span>
            </div>

            <div class="flex flex-col gap-1 rounded-sm bg-neutral-100 p-4">
              <span class="text-sm tracking-[0.7px] text-neutral-600">員工編號</span>
              <span
                class="text-base font-medium tracking-[0.8px] text-neutral-900"
              >
                {{ courier.employeeNumber || '-' }}
              </span>
            </div>

            <div class="flex flex-col gap-1 rounded-sm bg-neutral-100 p-4">
              <span class="text-sm tracking-[0.7px] text-neutral-600">聯絡電話</span>
              <span
                class="text-base font-medium tracking-[0.8px] text-neutral-900"
              >
                {{ courier.phone || '-' }}
              </span>
            </div>

            <div class="flex flex-col gap-1 rounded-sm bg-neutral-100 p-4">
              <span class="text-sm tracking-[0.7px] text-neutral-600">雇用日期</span>
              <span
                class="text-base font-medium tracking-[0.8px] text-neutral-900"
              >
                {{ hireDateLabel }}
              </span>
            </div>

            <div class="flex flex-col gap-1 rounded-sm bg-neutral-100 p-4">
              <span class="text-sm tracking-[0.7px] text-neutral-600">總配送次數</span>
              <span
                class="text-base font-medium tracking-[0.8px] text-neutral-900"
              >
                {{ courier.totalDeliveries || 0 }} 次
              </span>
            </div>
          </div>
        </div>

        <!-- 薪資明細（僅短期支援夥伴顯示） -->
        <div
          class="
            rounded-md bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <!-- 薪資明細標頭 -->
          <div class="mb-4 flex items-center gap-2">
            <CircleDollarSign class="size-5 text-neutral-600" />
            <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
              薪資明細
            </h2>
            <div class="flex flex-1 items-center">
              <Badge
                v-if="overallSalaryStatus === 'unpaid'"
                type="red"
                label="待支付"
                size="lg"
              />
              <Badge
                v-else
                type="green"
                label="已支付"
                size="lg"
              />
            </div>
            <!-- 薪資明細篩選 -->
            <div class="flex items-center gap-2">
              <!-- 日期篩選 -->
              <Popover>
                <PopoverTrigger as-child>
                  <button
                    type="button"
                    :class="cn(
                      `
                        flex items-center gap-2 rounded-xs border
                        border-neutral-200 px-3 py-2 text-base outline-none
                        hover:border-neutral-400
                      `,
                      salaryFilterDate ? 'text-neutral-900' : 'text-neutral-400',
                    )"
                  >
                    {{ salaryFilterDate ? dfDate.format(salaryFilterDate.toDate(getLocalTimeZone())) : '請選擇日期' }}
                    <CalendarIcon class="size-4 shrink-0 text-neutral-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0">
                  <Calendar
                    v-model="salaryFilterDate"
                    :initial-focus="true"
                    layout="month-and-year"
                  />
                </PopoverContent>
              </Popover>

              <!-- 薪資結算狀態篩選 -->
              <Select v-model="salaryFilterStatus">
                <SelectTrigger class="w-[152px] bg-white text-base">
                  <SelectValue placeholder="薪資結算狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="unpaid">
                      待支付
                    </SelectItem>
                    <SelectItem value="paid">
                      已支付
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- 薪資明細表格 -->
          <div
            v-if="filteredSalaryRecords.length > 0"
            class="rounded-sm shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]"
          >
            <!-- 表頭 -->
            <div
              class="grid grid-cols-5 border-b border-neutral-200 px-4 py-3"
            >
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >運送日期</span>
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >運送單價</span>
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >行李數量</span>
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >應付薪資</span>
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >操作</span>
            </div>

            <!-- 資料列 -->
            <div class="divide-y divide-neutral-200">
              <div
                v-for="record in filteredSalaryRecords"
                :key="record.id"
                class="grid min-h-[60px] grid-cols-5 items-center px-4 py-3"
              >
                <span class="text-sm tracking-[0.7px] text-neutral-900">
                  {{ dfDate.format(parseDate(record.deliveryDate).toDate(getLocalTimeZone())) }}
                </span>
                <span class="text-sm tracking-[0.7px] text-neutral-900">
                  NT$ {{ record.deliveryRate }}
                </span>
                <span class="text-sm tracking-[0.7px] text-neutral-900">
                  {{ record.luggageCount }} 件
                </span>
                <span class="text-sm tracking-[0.7px] text-neutral-900">
                  NT$ {{ record.amount.toLocaleString() }}
                </span>
                <div>
                  <button
                    v-if="record.salaryStatus === 'unpaid'"
                    type="button"
                    class="
                      text-sm font-medium tracking-[0.8px] text-primary-400
                      hover:text-primary-500
                    "
                    @click="markAsPaid(record)"
                  >
                    標記為已支付
                  </button>
                  <span
                    v-else
                    class="text-sm tracking-[0.7px] text-neutral-400"
                  >已支付</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 無薪資紀錄 -->
          <div
            v-else
            class="
              flex flex-col items-center gap-3 rounded-sm bg-neutral-100 p-8
            "
          >
            <CircleDollarSign class="size-10 text-neutral-400" />
            <span class="text-sm tracking-wide text-neutral-600">尚無薪資紀錄</span>
          </div>
        </div>

        <!-- 配送紀錄 -->
        <div
          class="
            rounded-md bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <!-- 配送紀錄標頭 -->
          <div class="mb-4 flex items-center gap-2">
            <Package class="size-5 text-neutral-600" />
            <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
              配送紀錄
            </h2>
            <div
              class="
                flex flex-1 items-center gap-1 text-sm tracking-[0.7px]
                text-neutral-600
              "
            >
              <span>{{ filteredDeliveryRecords.length }} 筆</span>
              <span>．</span>
              <span>共 {{ totalLuggageCount }} 件</span>
            </div>
            <!-- 日期篩選 -->
            <Popover>
              <PopoverTrigger as-child>
                <button
                  type="button"
                  :class="cn(
                    `
                      flex items-center gap-2 rounded-xs border
                      border-neutral-200 px-3 py-2 text-base outline-none
                      hover:border-neutral-400
                    `,
                    filterDate ? 'text-neutral-900' : 'text-neutral-400',
                  )"
                >
                  {{ filterDate ? dfDate.format(filterDate.toDate(getLocalTimeZone())) : '選擇日期' }}
                  <CalendarIcon class="size-4 shrink-0 text-neutral-400" />
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
          </div>

          <!-- 配送紀錄表格 -->
          <div
            v-if="filteredDeliveryRecords.length > 0"
            class="rounded-sm shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]"
          >
            <!-- 表頭 -->
            <div
              class="grid grid-cols-4 border-b border-neutral-200 px-4 py-3"
            >
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >運送日期</span>
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >行程編號</span>
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >訂單資訊</span>
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >行李數量</span>
            </div>

            <!-- 資料列 -->
            <div class="divide-y divide-neutral-200">
              <div
                v-for="record in filteredDeliveryRecords"
                :key="record.id"
                class="grid min-h-[60px] grid-cols-4 items-center px-4 py-3"
              >
                <span class="text-sm tracking-[0.7px] text-neutral-900">
                  {{ new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium' }).format(new Date(record.deliveryDate)) }}
                </span>
                <span class="text-sm tracking-[0.7px] text-neutral-900">
                  {{ record.tripNumber }}
                </span>
                <span class="text-sm tracking-[0.7px] text-neutral-900">
                  {{ record.orderCount }} 筆訂單
                </span>
                <span class="text-sm tracking-[0.7px] text-neutral-900">
                  {{ record.luggageCount }} 件
                </span>
              </div>
            </div>
          </div>

          <!-- 無配送紀錄 -->
          <div
            v-else
            class="
              flex flex-col items-center gap-3 rounded-sm bg-neutral-100 p-8
            "
          >
            <Package class="size-10 text-neutral-400" />
            <span class="text-sm tracking-wide text-neutral-600">尚無配送紀錄</span>
          </div>
        </div>
      </div>

      <!-- 右欄：快速操作 -->
      <div
        class="
          sticky top-8 col-span-4 rounded-md border border-primary-200 bg-white
          p-6 shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
        "
      >
        <h2 class="mb-4 text-lg font-bold tracking-[0.9px] text-neutral-900">
          快速操作
        </h2>

        <div class="flex flex-col gap-2">
          <!-- 聯絡夥伴 -->
          <button
            type="button"
            class="
              flex items-center justify-center gap-2 rounded-sm border
              border-neutral-200 px-4 py-2 text-sm font-medium tracking-[0.7px]
              text-neutral-900 transition-colors
              hover:bg-neutral-50
            "
            @click="callCourier"
          >
            <Phone class="size-5 text-neutral-600" />
            聯絡夥伴
          </button>

          <!-- 編輯夥伴資訊 -->
          <button
            type="button"
            class="
              flex items-center justify-center gap-2 rounded-sm border
              border-neutral-200 px-4 py-2 text-sm font-medium tracking-[0.7px]
              text-neutral-900 transition-colors
              hover:bg-neutral-50
            "
            @click="goToEdit"
          >
            <Pencil class="size-5 text-neutral-600" />
            編輯夥伴資訊
          </button>

          <!-- 刪除夥伴 -->
          <button
            type="button"
            class="
              flex items-center justify-center gap-2 rounded-sm border
              border-neutral-200 px-4 py-2 text-sm font-medium tracking-[0.7px]
              text-neutral-900 transition-colors
              hover:bg-neutral-50
            "
            @click="deleteCourier"
          >
            <Trash2 class="size-5 text-neutral-600" />
            刪除夥伴
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

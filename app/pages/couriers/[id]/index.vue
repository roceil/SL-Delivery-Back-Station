<script lang="ts" setup>
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
}

interface DeliveryRecord {
  id: number
  deliveryDate: string
  tripNumber: string
  orderCount: number
  luggageCount: number
}

interface SalaryRecord {
  period: string
  deliveryCount: number
  amount: number
  status: 'paid' | 'unpaid'
  paidAt: string | null
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

const { data: deliveryRecordsData } = await useFetch<DeliveryRecord[]>(`/api/couriers/${id}/delivery-records`)
const deliveryRecords = computed(() => deliveryRecordsData.value ?? [])

const { data: salaryRecordsData, refresh: refreshSalaryRecords } = await useFetch<SalaryRecord[]>(`/api/couriers/${id}/salary-records`)
const salaryRecords = computed(() => salaryRecordsData.value ?? [])

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

// 薪資明細篩選
const salaryFilterStatus = ref<'paid' | 'unpaid' | ''>('')

const filteredSalaryRecords = computed(() => {
  return salaryRecords.value.filter((r) => {
    if (salaryFilterStatus.value && r.status !== salaryFilterStatus.value)
      return false
    return true
  })
})

const overallSalaryStatus = computed(() => {
  const hasUnpaid = salaryRecords.value.some(r => r.status === 'unpaid')
  return hasUnpaid ? 'unpaid' : 'paid'
})

async function markAsPaid(record: SalaryRecord) {
  await $fetch(`/api/couriers/${id}/salary-records/mark-paid`, {
    method: 'PATCH',
    body: { period: record.period },
  })
  await refreshSalaryRecords()
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

const courierTypeBadge = computed<BadgeInfo | null>(() => {
  const typeMap: Record<string, BadgeInfo> = {
    long_term: { type: 'blue', label: '長期合作' },
    short_term: { type: 'orange', label: '短期支援' },
  }
  return courier.value.courierType ? (typeMap[courier.value.courierType] ?? null) : null
})

function goToEdit() {
  router.push(`/couriers/${id}/edit`)
}

function callCourier() {
  if (courier.value.phone) {
    window.location.href = `tel:${courier.value.phone}`
  }
}

async function deleteCourier() {
  if (!confirm(`確定要刪除夥伴「${courier.value.name}」嗎？此操作無法復原。`))
    return

  await $fetch(`/api/couriers/${id}`)
  router.push('/couriers')
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
              v-if="courierTypeBadge"
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
              class="grid grid-cols-4 border-b border-neutral-200 px-4 py-3"
            >
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >結算週期</span>
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >配送次數</span>
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
                :key="record.period"
                class="grid min-h-[60px] grid-cols-4 items-center px-4 py-3"
              >
                <span class="text-sm tracking-[0.7px] text-neutral-900">
                  {{ new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'long' }).format(new Date(`${record.period}-01`)) }}
                </span>
                <span class="text-sm tracking-[0.7px] text-neutral-900">
                  {{ record.deliveryCount }} 次
                </span>
                <span class="text-sm tracking-[0.7px] text-neutral-900">
                  NT$ {{ record.amount.toLocaleString() }}
                </span>
                <div>
                  <button
                    v-if="record.status === 'unpaid'"
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

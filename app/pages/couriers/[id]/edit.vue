<script lang="ts" setup>
/**
 * 以下欄位為假資料，尚未對應至資料庫，待後續補充 DB 欄位與 API：
 *
 * - courierType (夥伴類型)：DB 欄位 `courier_type` VARCHAR，值為 'long_term' | 'short_term'
 * - deliveryRate (運送單價)：DB 欄位 `delivery_rate` NUMERIC，單位為 NT$
 */

import type { DateValue } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'
import { ArrowLeft, CalendarIcon, ClipboardList, UserRound, Users } from 'lucide-vue-next'
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
  // 假資料欄位（待補 DB）
  courierType?: string
  deliveryRate?: number
}

useHead({
  title: '編輯夥伴 - 物流管理系統',
})

const { setBreadcrumb, clearBreadcrumb } = useBreadcrumb()

onMounted(() => {
  setBreadcrumb({ label: '編輯夥伴' })
})

onBeforeRouteLeave(() => {
  clearBreadcrumb()
})

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const { data: courier } = await useFetch<Courier>(`/api/couriers/${id}`)

if (!courier.value) {
  throw createError({ statusCode: 404, message: '找不到此夥伴' })
}

const { data: courierStatuses } = await useFetch('/api/couriers/status')

const form = ref({
  name: courier.value.name || '',
  employeeNumber: courier.value.employeeNumber || '',
  phone: courier.value.phone || '',
  hireDate: courier.value.hireDate || '',
  status: courier.value.statusId || 1,
  isAvailable: courier.value.isAvailable ? 'true' : 'false',
  // 假資料：courierType / deliveryRate 待 DB 補齊後從 courier.value 取值
  courierType: courier.value.courierType || 'long_term',
  deliveryRate: courier.value.deliveryRate ?? 100,
})

const df = new DateFormatter('zh-TW', { dateStyle: 'medium' })

const hireDateValue = computed<DateValue | undefined>({
  get: () => form.value.hireDate ? parseDate(form.value.hireDate) : undefined,
  set: val => form.value.hireDate = val ? val.toString() : '',
})

const courierTypeLabel = computed(() => {
  if (form.value.courierType === 'long_term')
    return '長期合作'
  if (form.value.courierType === 'short_term')
    return '短期支援'
  return '-'
})

const hireStatusLabel = computed(() => {
  const found = courierStatuses.value?.find(s => s.id === form.value.status)
  return found?.explanation || found?.status || '-'
})

const isAvailableLabel = computed(() =>
  form.value.isAvailable === 'true' ? '可執行任務' : '無法執行任務',
)

const hireDateLabel = computed(() =>
  hireDateValue.value
    ? df.format(hireDateValue.value.toDate(getLocalTimeZone()))
    : '-',
)

async function submitForm() {
  try {
    await fetch(`/api/couriers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form.value,
        isAvailable: form.value.isAvailable === 'true',
      }),
    })
    router.push('/couriers')
  }
  catch (error) {
    console.error('更新夥伴失敗:', error)
  }
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
          hover:bg-neutral-100
        "
        @click="router.push(`/couriers/${id}`)"
      >
        <ArrowLeft class="size-5 text-neutral-900" />
      </button>
      <h4 class="text-2xl font-bold tracking-[1.2px] text-neutral-900">
        編輯夥伴
      </h4>
    </div>

    <!-- 主要內容 -->
    <form
      class="grid grid-cols-12 items-start gap-4"
      @submit.prevent="submitForm"
    >
      <!-- 左欄：表單 -->
      <div class="col-span-8 flex flex-1 flex-col gap-4">
        <!-- 夥伴資訊 -->
        <div
          class="
            rounded-md bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <div class="mb-4 flex items-center gap-2">
            <UserRound class="size-5 text-neutral-600" />
            <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
              夥伴資訊
            </h2>
          </div>

          <div class="flex flex-col gap-4">
            <!-- 夥伴類型（假資料） -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >夥伴類型</label>
              <Select v-model="form.courierType">
                <SelectTrigger
                  class="
                    rounded-xs border-neutral-200 bg-white text-neutral-900
                  "
                >
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
            </div>

            <!-- 姓名 -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >
                姓名 <span class="text-danger-300">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="請輸入夥伴姓名"
                class="
                  rounded-xs border border-neutral-200 px-3 py-2 text-base
                  text-neutral-900 outline-none
                  placeholder:text-neutral-400
                  focus:border-primary-300
                "
              >
            </div>

            <!-- 員工編號 -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >員工編號</label>
              <input
                v-model="form.employeeNumber"
                type="text"
                placeholder="C001"
                class="
                  rounded-xs border border-neutral-200 px-3 py-2 text-base
                  text-neutral-900 outline-none
                  placeholder:text-neutral-400
                  focus:border-primary-300
                "
              >
            </div>

            <!-- 聯絡電話 -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >聯絡電話</label>
              <input
                v-model="form.phone"
                type="tel"
                placeholder="0912345678"
                class="
                  rounded-xs border border-neutral-200 px-3 py-2 text-base
                  text-neutral-900 outline-none
                  placeholder:text-neutral-400
                  focus:border-primary-300
                "
              >
            </div>
          </div>
        </div>

        <!-- 雇用資訊 -->
        <div
          class="
            rounded-md bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <div class="mb-4 flex items-center gap-2">
            <ClipboardList class="size-5 text-neutral-600" />
            <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
              雇用資訊
            </h2>
          </div>

          <div class="flex flex-col gap-4">
            <!-- 雇用日期 -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >雇用日期</label>
              <Popover>
                <PopoverTrigger as-child>
                  <button
                    type="button"
                    :class="cn(
                      `
                        flex w-full items-center gap-2 rounded-xs border
                        border-neutral-200 px-3 py-2 text-base outline-none
                        hover:border-neutral-400
                      `,
                      hireDateValue ? 'text-neutral-900' : 'text-neutral-400',
                    )"
                  >
                    <CalendarIcon class="size-4 shrink-0 text-neutral-400" />
                    {{ hireDateValue ? df.format(hireDateValue.toDate(getLocalTimeZone())) : '請選擇日期' }}
                  </button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0">
                  <Calendar
                    v-model="hireDateValue"
                    :initial-focus="true"
                    layout="month-and-year"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <!-- 狀態 -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >狀態</label>
              <Select v-model="form.status">
                <SelectTrigger
                  class="
                    rounded-xs border-neutral-200 bg-white text-neutral-900
                  "
                >
                  <SelectValue placeholder="請選擇狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem
                      v-for="s in courierStatuses"
                      :key="s.id"
                      :value="s.id"
                    >
                      {{ s.explanation || s.status }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <!-- 可否執行任務 -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >可否執行任務</label>
              <Select v-model="form.isAvailable">
                <SelectTrigger
                  class="
                    rounded-xs border-neutral-200 bg-white text-neutral-900
                  "
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="true">
                      可執行任務
                    </SelectItem>
                    <SelectItem value="false">
                      無法執行任務
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <!-- 運送單價（假資料） -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >運送單價</label>
              <div class="relative">
                <span
                  class="
                    absolute top-1/2 left-3 -translate-y-1/2 text-base
                    text-neutral-400
                  "
                >NT$</span>
                <input
                  v-model.number="form.deliveryRate"
                  type="number"
                  min="0"
                  placeholder="請輸入價格"
                  class="
                    w-full rounded-xs border border-neutral-200 py-2 pr-3 pl-12
                    text-base text-neutral-900 outline-none
                    placeholder:text-neutral-400
                    focus:border-primary-300
                  "
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右欄：預覽 -->
      <div
        class="
          sticky top-8 col-span-4 shrink-0 rounded-md bg-white p-6
          shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
        "
      >
        <div class="mb-4 flex items-center gap-2">
          <Users class="size-5 text-neutral-600" />
          <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
            預覽
          </h2>
        </div>

        <!-- 預覽資訊 -->
        <div
          class="flex flex-col gap-4 rounded-sm border border-neutral-200 p-4"
        >
          <!-- 姓名標題 -->
          <p class="text-lg font-bold tracking-[0.9px] text-primary-300">
            {{ form.name || '-' }}
          </p>

          <!-- 夥伴資訊小節 -->
          <div class="flex flex-col gap-3">
            <p class="text-base font-bold tracking-[0.8px] text-neutral-900">
              夥伴資訊
            </p>
            <div class="h-px bg-neutral-200"></div>
            <div class="flex flex-col gap-2">
              <div class="flex gap-4">
                <span
                  class="
                    min-w-[100px] text-base tracking-[0.8px] text-neutral-500
                  "
                >夥伴類型</span>
                <span class="text-base tracking-[0.8px] text-neutral-900">{{ courierTypeLabel }}</span>
              </div>
              <div class="flex gap-4">
                <span
                  class="
                    min-w-[100px] text-base tracking-[0.8px] text-neutral-500
                  "
                >員工編號</span>
                <span class="text-base tracking-[0.8px] text-neutral-900">{{ form.employeeNumber || '-' }}</span>
              </div>
              <div class="flex gap-4">
                <span
                  class="
                    min-w-[100px] text-base tracking-[0.8px] text-neutral-500
                  "
                >聯絡電話</span>
                <span class="text-base tracking-[0.8px] text-neutral-900">{{ form.phone || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- 雇用資訊小節 -->
          <div class="flex flex-col gap-3">
            <p class="text-base font-bold tracking-[0.8px] text-neutral-900">
              雇用資訊
            </p>
            <div class="h-px bg-neutral-200"></div>
            <div class="flex flex-col gap-2">
              <div class="flex gap-4">
                <span
                  class="
                    min-w-[100px] text-base tracking-[0.8px] text-neutral-500
                  "
                >雇用日期</span>
                <span class="text-base tracking-[0.8px] text-neutral-900">{{ hireDateLabel }}</span>
              </div>
              <div class="flex gap-4">
                <span
                  class="
                    min-w-[100px] text-base tracking-[0.8px] text-neutral-500
                  "
                >狀態</span>
                <span class="text-base tracking-[0.8px] text-neutral-900">{{ hireStatusLabel }}</span>
              </div>
              <div class="flex gap-4">
                <span
                  class="
                    min-w-[100px] text-base tracking-[0.8px] text-neutral-500
                  "
                >可否執行任務</span>
                <span class="text-base tracking-[0.8px] text-neutral-900">{{ isAvailableLabel }}</span>
              </div>
              <div class="flex gap-4">
                <span
                  class="
                    min-w-[100px] text-base tracking-[0.8px] text-neutral-500
                  "
                >運送單價</span>
                <span class="text-base tracking-[0.8px] text-neutral-900">
                  NT$ {{ form.deliveryRate ?? '-' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 儲存變更 -->
        <button
          type="submit"
          class="
            mt-4 w-full rounded-sm bg-primary-300 py-2 text-base font-medium
            tracking-[0.8px] text-white
            hover:bg-primary-400
          "
        >
          儲存變更
        </button>
      </div>
    </form>
  </div>
</template>

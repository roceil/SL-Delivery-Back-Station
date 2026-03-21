<script lang="ts" setup>
import type { DateValue } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'
import { CalendarIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

useHead({
  title: '新增夥伴 - 物流管理系統',
})

const router = useRouter()

// 從 API 取得狀態列表
const { data: courierStatuses } = await useFetch('/api/couriers/status')

// 從 API 取得下一個員工編號
const { data: nextEmployeeNumber } = await useFetch('/api/couriers/next-employee-number')

const form = ref({
  employeeNumber: nextEmployeeNumber.value?.employeeNumber || '',
  name: '',
  phone: '',
  status: courierStatuses.value?.[0]?.id || 1, // 預設為第一個狀態（通常是雇用中）
  isAvailable: true,
  hireDate: '',
})

const df = new DateFormatter('zh-TW', { dateStyle: 'medium' })

const hireDateValue = computed<DateValue | undefined>({
  get: () => form.value.hireDate ? parseDate(form.value.hireDate) : undefined,
  set: val => form.value.hireDate = val ? val.toString() : '',
})

// 重新生成員工編號
async function regenerateEmployeeNumber() {
  try {
    const response = await $fetch('/api/couriers/next-employee-number')
    form.value.employeeNumber = response.employeeNumber
  }
  catch (error) {
    console.error('生成員工編號失敗:', error)
    alert('生成員工編號失敗，請稍後再試')
  }
}

async function submitForm() {
  try {
    await $fetch('/api/couriers', {
      method: 'POST',
      body: form.value,
    })
    router.push('/couriers')
  }
  catch (error) {
    console.error('新增夥伴失敗:', error)
    alert('新增失敗，請稍後再試')
  }
}
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <h1 class="mb-6 text-2xl font-bold text-gray-900">
        新增夥伴
      </h1>

      <form
        class="space-y-6"
        @submit.prevent="submitForm"
      >
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              for="name"
              class="block text-sm font-medium text-gray-700"
            >姓名 <span class="text-red-500">*</span></label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="
                mt-1 block w-full rounded-md border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
              "
              placeholder="例：張小明"
            >
          </div>

          <div>
            <label
              for="employeeNumber"
              class="block text-sm font-medium text-gray-700"
            >員工編號</label>
            <div class="mt-1 flex gap-2">
              <input
                id="employeeNumber"
                v-model="form.employeeNumber"
                type="text"
                readonly
                class="
                  block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500
                "
                placeholder="自動生成"
              >
              <button
                type="button"
                class="
                  rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                  font-medium whitespace-nowrap text-gray-700
                  hover:bg-gray-50
                  focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  focus:outline-none
                "
                @click="regenerateEmployeeNumber"
              >
                重新生成
              </button>
            </div>
            <p class="mt-1 text-sm text-gray-500">
              系統自動生成，格式：C001、C002...
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              for="phone"
              class="block text-sm font-medium text-gray-700"
            >聯絡電話</label>
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              class="
                mt-1 block w-full rounded-md border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
              "
              placeholder="例：0912-345-678"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">雇用日期</label>
            <Popover>
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  :class="cn(
                    'mt-1 w-full justify-start rounded-md border-gray-300 px-3 py-2 text-sm font-normal shadow-sm',
                    !hireDateValue && 'text-gray-400',
                  )"
                >
                  <CalendarIcon class="mr-2 size-4" />
                  {{ hireDateValue ? df.format(hireDateValue.toDate(getLocalTimeZone())) : '選擇日期' }}
                </Button>
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
        </div>

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              for="status"
              class="block text-sm font-medium text-gray-700"
            >狀態</label>
            <select
              id="status"
              v-model="form.status"
              required
              class="
                mt-1 block w-full rounded-md border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
              "
            >
              <option
                v-for="courierStatus in courierStatuses"
                :key="courierStatus.id"
                :value="courierStatus.id"
              >
                {{ courierStatus.explanation || courierStatus.status }}
              </option>
            </select>
          </div>

          <div>
            <label
              for="isAvailable"
              class="block text-sm font-medium text-gray-700"
            >執行任務狀態</label>
            <select
              id="isAvailable"
              v-model="form.isAvailable"
              class="
                mt-1 block w-full rounded-md border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
              "
            >
              <option :value="true">
                可執行任務
              </option>
              <option :value="false">
                無法執行任務
              </option>
            </select>
            <p class="mt-1 text-sm text-gray-500">
              是否可以執行配送任務
            </p>
          </div>
        </div>

        <!-- 預覽區域 -->
        <div class="border-t pt-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">
            預覽
          </h3>
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div class="space-y-2 text-sm text-gray-600">
              <div class="text-base font-medium text-gray-900">
                {{ form.name || '未填寫姓名' }}
              </div>
              <div v-if="form.employeeNumber">
                👤 員工編號：{{ form.employeeNumber }}
              </div>
              <div v-if="form.phone">
                📞 電話：{{ form.phone }}
              </div>
              <div v-if="form.hireDate">
                📅 雇用日期：{{ new Date(form.hireDate).toLocaleDateString('zh-TW') }}
              </div>
              <div>
                📊 狀態：{{ courierStatuses?.find(s => s.id === form.status)?.explanation || '未設定' }}
              </div>
              <div>
                ✓ 任務狀態：{{ form.isAvailable ? '可執行任務' : '無法執行任務' }}
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-4 border-t pt-6">
          <NuxtLink
            to="/couriers"
            class="
              rounded-md border border-gray-300 bg-white px-4 py-2 text-sm
              font-medium text-gray-700
              hover:bg-gray-50
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
            "
          >
            取消
          </NuxtLink>
          <button
            type="submit"
            class="
              rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm
              font-medium text-white
              hover:bg-blue-700
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
            "
          >
            新增夥伴
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

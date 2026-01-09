<script lang="ts" setup>
useHead({
  title: '編輯夥伴 - 物流管理系統',
})

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
}

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

// 取得夥伴資料
const { data: courier } = await useFetch<Courier>(`/api/couriers/${id}`)

if (!courier.value) {
  throw createError({
    statusCode: 404,
    message: '找不到此夥伴',
  })
}

// 從 API 取得狀態列表
const { data: courierStatuses } = await useFetch('/api/couriers/status')

const form = ref({
  employeeNumber: courier.value.employeeNumber || '',
  name: courier.value.name,
  phone: courier.value.phone || '',
  status: courier.value.statusId || 1,
  isAvailable: courier.value.isAvailable !== undefined ? courier.value.isAvailable : true,
  hireDate: courier.value.hireDate || '',
})

async function submitForm() {
  try {
    await fetch(`/api/couriers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form.value),
    })
    router.push('/couriers')
  }
  catch (error) {
    console.error('更新夥伴失敗:', error)
    alert('更新失敗，請稍後再試')
  }
}
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <h1 class="mb-6 text-2xl font-bold text-gray-900">
        編輯夥伴
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
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="例：張小明"
            >
          </div>

          <div>
            <label
              for="employeeNumber"
              class="block text-sm font-medium text-gray-700"
            >員工編號</label>
            <input
              id="employeeNumber"
              v-model="form.employeeNumber"
              type="text"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="例：EMP001"
            >
            <p class="mt-1 text-sm text-gray-500">
              員工編號必須唯一（選填）
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
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="例：0912-345-678"
            >
          </div>

          <div>
            <label
              for="hireDate"
              class="block text-sm font-medium text-gray-700"
            >雇用日期</label>
            <input
              id="hireDate"
              v-model="form.hireDate"
              type="date"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
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
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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

        <!-- 統計資訊 -->
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 class="mb-3 text-sm font-medium text-gray-900">
            統計資訊
          </h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">總配送次數：</span>
              <span class="font-medium text-gray-900">{{ courier?.totalDeliveries || 0 }} 次</span>
            </div>
            <div>
              <span class="text-gray-500">建立時間：</span>
              <span class="font-medium text-gray-900">
                {{ courier?.createdAt ? new Date(courier.createdAt).toLocaleDateString('zh-TW') : '-' }}
              </span>
            </div>
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
            儲存變更
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

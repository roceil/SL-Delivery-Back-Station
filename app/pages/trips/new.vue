<script lang="ts" setup>
useHead({
  title: '新建行程 - 物流管理系統',
})

const router = useRouter()

// 自動產生行程名稱（格式：yyyy-mm-dd-hh-mm）
function generateTripName() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}-${hours}-${minutes}`
}

const selectedArea = ref('')
const form = ref({
  name: generateTripName(),
  description: '',
  courierId: '',
  selectedOrders: [] as string[],
  scheduledDate: '',
})

const { data: couriers } = await useFetch('/api/couriers')

// 根據選擇的區域動態獲取可用訂單
const { data: availableOrders } = await useFetch('/api/orders/available', {
  query: {
    area: selectedArea,
  },
  watch: [selectedArea],
})

// 區域選項
const areaOptions = [
  { value: 'A', label: '區域 A - 碼頭' },
  { value: 'B', label: '區域 B - 潛水店' },
  { value: 'C', label: '區域 C - 民宿' },
  { value: 'D', label: '區域 D - 景點' },
]

function toggleOrderSelection(orderId: string) {
  const index = form.value.selectedOrders.indexOf(orderId)
  if (index > -1) {
    form.value.selectedOrders.splice(index, 1)
  }
  else {
    form.value.selectedOrders.push(orderId)
  }
}

async function submitForm() {
  if (form.value.selectedOrders.length === 0) {
    // eslint-disable-next-line no-alert
    alert('請至少選擇一個訂單')
    return
  }

  try {
    await $fetch('/api/trips', {
      method: 'POST',
      body: {
        ...form.value,
        selectedOrders: form.value.selectedOrders,
      },
    })
    router.push('/trips')
  }
  catch (error) {
    console.error('建立行程失敗:', error)
  }
}
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <h1 class="mb-6 text-2xl font-bold text-gray-900">
        新建行程
      </h1>

      <form
        class="space-y-6"
        @submit.prevent="submitForm"
      >
        <!-- 基本資訊 -->
        <div class="border-b pb-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">
            基本資訊
          </h3>
          <div class="grid grid-cols-1 gap-6">
            <div>
              <label
                for="name"
                class="block text-sm font-medium text-gray-700"
              >行程名稱</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                required
                class="mt-1 block w-full"
                placeholder="自動產生，可修改"
              >
            </div>
          </div>

          <div class="mt-6">
            <label
              for="description"
              class="block text-sm font-medium text-gray-700"
            >行程描述</label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              class="mt-1 block w-full"
              placeholder="請輸入行程描述（選填）"
            ></textarea>
          </div>
        </div>

        <!-- 快遞員指派 -->
        <div class="border-b pb-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">
            快遞員指派
          </h3>
          <div>
            <label
              for="courierId"
              class="block text-sm font-medium text-gray-700"
            >指派快遞員</label>
            <select
              id="courierId"
              v-model="form.courierId"
              required
              class="mt-1 block w-full"
            >
              <option value="">
                請選擇快遞員
              </option>
              <option
                v-for="courier in couriers"
                :key="courier.id"
                :value="courier.id"
              >
                {{ courier.name }} - {{ courier.phone }}
              </option>
            </select>
          </div>
        </div>

        <!-- 選擇訂單 -->
        <div class="border-b pb-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">
            選擇訂單
          </h3>

          <!-- 區域選擇 -->
          <div class="mb-6">
            <label
              for="area"
              class="block text-sm font-medium text-gray-700"
            >選擇區域</label>
            <select
              id="area"
              v-model="selectedArea"
              class="mt-1 block w-full"
            >
              <option value="">
                全部區域
              </option>
              <option
                v-for="area in areaOptions"
                :key="area.value"
                :value="area.value"
              >
                {{ area.label }}
              </option>
            </select>
            <p class="mt-1 text-xs text-gray-500">
              選擇區域後，會顯示今天且該區域的已確認訂單
            </p>
          </div>

          <!-- 訂單列表 -->
          <div
            v-if="!availableOrders || availableOrders.length === 0"
            class="py-8 text-center text-gray-500"
          >
            <svg
              class="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p class="mt-2">沒有符合條件的訂單</p>
            <p class="mt-1 text-xs">
              請選擇其他區域或確認今天有已確認的訂單
            </p>
          </div>

          <div
            v-else
            class="space-y-4"
          >
            <div
              v-for="order in availableOrders"
              :key="order.id"
              class="
                flex items-start space-x-3 rounded-lg border p-4
                hover:bg-gray-50
              "
            >
              <input
                :id="order.id"
                type="checkbox"
                :value="order.id"
                class="mt-1"
                @change="toggleOrderSelection(order.id)"
              >
              <label
                :for="order.id"
                class="flex-1 cursor-pointer"
              >
                <div class="flex justify-between">
                  <div class="flex-1">
                    <h4 class="text-sm font-medium text-gray-900">
                      {{ order.lineName }} - {{ order.phone }}
                    </h4>
                    <div class="mt-2 space-y-1 text-sm text-gray-600">
                      <div class="flex items-center">
                        <span class="w-16 text-gray-500">起點：</span>
                        <span>{{ order.pickupLocation.name }}</span>
                      </div>
                      <div class="flex items-center">
                        <span class="w-16 text-gray-500">終點：</span>
                        <span>{{ order.deliveryLocation.name }}</span>
                      </div>
                      <div class="flex items-center">
                        <span class="w-16 text-gray-500">時間：</span>
                        <span>{{ order.pickupTime }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="ml-4 text-right">
                    <span
                      class="
                        inline-flex items-center rounded-full bg-blue-100 px-2.5
                        py-0.5 text-xs font-medium text-blue-800
                      "
                    >
                      {{ order.luggageCount }} 件行李
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div
            v-if="form.selectedOrders.length > 0"
            class="mt-4 rounded-lg bg-blue-50 p-4"
          >
            <p class="text-sm text-blue-800">
              已選擇 {{ form.selectedOrders.length }} 個訂單
            </p>
          </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="flex justify-end space-x-4">
          <NuxtLink
            to="/trips"
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
            :disabled="form.selectedOrders.length === 0"
            class="
              rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm
              font-medium text-white
              hover:bg-blue-700
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
              disabled:cursor-not-allowed disabled:bg-gray-300
            "
          >
            建立行程
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

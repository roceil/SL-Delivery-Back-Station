<script lang="ts" setup>
interface TripDetail {
  id: string
  name: string
  description: string
  courierId: string
  courierName: string
  courierPhone: string
  courierEmployeeNumber: string
  scheduledDate: string
  status: string
  statusId: number
  statusExplanation: string
  createdAt: string
  updatedAt: string
  dispatchedAt: string | null
  completedAt: string | null
  trackingUrl: string | null
  notes: string
  orderIds: string[]
}

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

interface Order {
  id: string
  category: string
  lineName: string
  phone: string
  deliveryDate: string | null
  pickupTime: string
  luggageCount: number
  status: string
  pickupLocation: {
    id: string
    name: string
    address: string
    area?: string
  }
  deliveryLocation: {
    id: string
    name: string
    address: string
    area?: string
  }
}

const route = useRoute()
const router = useRouter()
const tripId = route.params.id as string

useHead({
  title: '編輯行程 - 物流管理系統',
})

// 獲取行程資料
const { data: trip, error: tripError } = await useFetch<TripDetail>(`/api/trips/${tripId}`)

if (tripError.value || !trip.value) {
  // eslint-disable-next-line no-alert
  alert('找不到該行程')
  router.push('/trips')
  throw new Error('Trip not found')
}

const tripData = trip.value

const form = ref({
  name: tripData.name,
  description: tripData.description,
  courierId: tripData.courierId,
  scheduledDate: tripData.scheduledDate,
  selectedOrders: tripData.orderIds,
  notes: tripData.notes,
})

// 獲取配送員列表
const { data: couriers } = await useFetch<Courier[]>('/api/couriers')

// 獲取可用訂單列表（已確認但未分配行程的訂單）
const { data: orders } = await useFetch<Order[]>('/api/orders')

const availableOrders = computed(() => {
  if (!orders.value)
    return []

  // 包含已確認且未分配行程的訂單，以及已經在這個行程中的訂單
  return orders.value.filter(order =>
    order.status === 'confirmed' || form.value.selectedOrders.includes(order.id),
  )
})

// 計算選擇的訂單統計
const orderStats = computed(() => {
  if (!orders.value || form.value.selectedOrders.length === 0) {
    return {
      count: 0,
      totalLuggage: 0,
      areas: [] as string[],
    }
  }

  const selectedOrdersData = orders.value.filter(order =>
    form.value.selectedOrders.includes(order.id),
  )

  const totalLuggage = selectedOrdersData.reduce(
    (sum, order) => sum + (order.luggageCount || 0),
    0,
  )

  const areas = [
    ...new Set(
      selectedOrdersData
        .map(order => order.deliveryLocation?.area)
        .filter((area): area is string => typeof area === 'string'),
    ),
  ].sort()

  return {
    count: selectedOrdersData.length,
    totalLuggage,
    areas,
  }
})

async function submitForm() {
  if (!form.value.name) {
    // eslint-disable-next-line no-alert
    alert('請輸入行程名稱')
    return
  }

  if (!form.value.scheduledDate) {
    // eslint-disable-next-line no-alert
    alert('請選擇預計日期')
    return
  }

  try {
    await $fetch(`/api/trips/${tripId}`, {
      method: 'PUT',
      body: form.value,
    })
    router.push('/trips')
  }
  catch (error: any) {
    console.error('更新行程失敗:', error)
    // eslint-disable-next-line no-alert
    alert(error.data?.message || '更新行程失敗，請稍後再試')
  }
}

function toggleOrderSelection(orderId: string) {
  const index = form.value.selectedOrders.indexOf(orderId)
  if (index > -1) {
    form.value.selectedOrders.splice(index, 1)
  }
  else {
    form.value.selectedOrders.push(orderId)
  }
}

function isOrderSelected(orderId: string) {
  return form.value.selectedOrders.includes(orderId)
}
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <h1 class="mb-6 text-2xl font-bold text-gray-900">
        編輯行程
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
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label
                for="name"
                class="block text-sm font-medium text-gray-700"
              >行程名稱 *</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                required
                class="
                  mt-1 block w-full rounded-md border-gray-300 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500
                  sm:text-sm
                "
              >
            </div>

            <div>
              <label
                for="scheduledDate"
                class="block text-sm font-medium text-gray-700"
              >預計日期 *</label>
              <input
                id="scheduledDate"
                v-model="form.scheduledDate"
                type="date"
                required
                class="
                  mt-1 block w-full rounded-md border-gray-300 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500
                  sm:text-sm
                "
              >
            </div>

            <div class="sm:col-span-2">
              <label
                for="description"
                class="block text-sm font-medium text-gray-700"
              >行程描述</label>
              <input
                id="description"
                v-model="form.description"
                type="text"
                placeholder="例如：小琉球行李運送"
                class="
                  mt-1 block w-full rounded-md border-gray-300 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500
                  sm:text-sm
                "
              >
            </div>

            <div class="sm:col-span-2">
              <label
                for="courierId"
                class="block text-sm font-medium text-gray-700"
              >指派配送員</label>
              <select
                id="courierId"
                v-model="form.courierId"
                class="
                  mt-1 block w-full rounded-md border-gray-300 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500
                  sm:text-sm
                "
              >
                <option value="">
                  暫不指派
                </option>
                <option
                  v-for="courier in couriers"
                  :key="courier.id"
                  :value="courier.id"
                >
                  {{ courier.name }} ({{ courier.employeeNumber }})
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- 選擇訂單 -->
        <div class="border-b pb-6">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">
              選擇訂單
            </h3>
            <div
              v-if="orderStats.count > 0"
              class="text-sm text-gray-600"
            >
              已選擇 {{ orderStats.count }} 個訂單，共 {{ orderStats.totalLuggage }} 件行李
              <span v-if="orderStats.areas.length > 0">
                ，區域：{{ orderStats.areas.join(', ') }}
              </span>
            </div>
          </div>

          <div
            v-if="availableOrders.length === 0"
            class="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center"
          >
            <p class="text-sm text-gray-600">
              目前沒有可分配的訂單
            </p>
          </div>

          <div
            v-else
            class="
              max-h-96 space-y-2 overflow-y-auto rounded-lg border
              border-gray-200 p-4
            "
          >
            <label
              v-for="order in availableOrders"
              :key="order.id"
              class="
                flex cursor-pointer items-start rounded-lg border p-3
                hover:bg-gray-50
              "
              :class="{
                'border-blue-500 bg-blue-50': isOrderSelected(order.id),
                'border-gray-200': !isOrderSelected(order.id),
              }"
            >
              <input
                type="checkbox"
                :checked="isOrderSelected(order.id)"
                class="
                  mt-1 rounded border-gray-300 text-blue-600
                  focus:ring-blue-500
                "
                @change="toggleOrderSelection(order.id)"
              >
              <div class="ml-3 flex-1">
                <div class="flex items-center justify-between">
                  <div class="font-medium text-gray-900">
                    {{ order.lineName }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ order.luggageCount }} 件行李
                  </div>
                </div>
                <div class="mt-1 text-sm text-gray-600">
                  {{ order.pickupLocation?.name }} → {{ order.deliveryLocation?.name }}
                </div>
                <div
                  v-if="order.deliveryDate"
                  class="mt-1 text-xs text-gray-500"
                >
                  {{ new Date(order.deliveryDate).toLocaleDateString('zh-TW') }}
                  {{ order.pickupTime }}
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- 備註 -->
        <div class="pb-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">
            備註
          </h3>
          <div>
            <label
              for="notes"
              class="block text-sm font-medium text-gray-700"
            >行程備註（選填）</label>
            <textarea
              id="notes"
              v-model="form.notes"
              rows="3"
              class="
                mt-1 block w-full rounded-md border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
                sm:text-sm
              "
              placeholder="請輸入特殊需求或注意事項"
            ></textarea>
          </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="flex justify-end space-x-4 border-t pt-6">
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
            class="
              rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm
              font-medium text-white
              hover:bg-blue-700
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
            "
          >
            更新行程
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

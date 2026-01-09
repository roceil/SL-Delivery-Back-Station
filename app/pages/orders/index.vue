<script lang="ts" setup>
interface Location {
  id: string
  name: string
  address: string
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
  pickupLocation: Location
  deliveryLocation: Location
  notes: string
  createdAt: string
}

useHead({
  title: '訂單總覽 - 行李運送系統',
})

const { data: orders } = await useFetch<Order[]>('/api/orders')

const columns = [
  { key: 'category', label: '類別', width: '0.7fr' },
  { key: 'customer', label: '客戶資訊', width: '1.2fr' },
  { key: 'deliveryDate', label: '寄送日期', width: '0.8fr' },
  { key: 'pickupTime', label: '收貨時間', width: '0.9fr' },
  { key: 'pickupLocation', label: '起始點', width: '1.5fr' },
  { key: 'deliveryLocation', label: '送達點', width: '1.5fr' },
  { key: 'luggageCount', label: '行李數量', width: '0.7fr' },
  { key: 'status', label: '狀態', width: '0.8fr' },
  { key: 'createdAt', label: '建立時間', width: '0.8fr' },
]

const gridTemplateColumns = columns.map(col => col.width).join(' ')

const router = useRouter()

function goToOrderDetail(orderId: string) {
  router.push(`/orders/${orderId}`)
}

const statusConfig = {
  pending: { text: '待確認', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { text: '已確認', color: 'bg-blue-100 text-blue-800' },
  assigned: { text: '已分配行程', color: 'bg-purple-100 text-purple-800' },
  in_delivery: { text: '配送中', color: 'bg-indigo-100 text-indigo-800' },
  delivered: { text: '已送達', color: 'bg-green-100 text-green-800' },
  cancelled: { text: '已取消', color: 'bg-red-100 text-red-800' },
}

const categoryConfig = {
  散客: { color: 'bg-blue-100 text-blue-800' },
  合作: { color: 'bg-purple-100 text-purple-800' },
  Trip: { color: 'bg-green-100 text-green-800' },
  Klook: { color: 'bg-orange-100 text-orange-800' },
}

// 篩選器狀態
const filters = reactive({
  category: '',
  status: '',
  searchText: '',
  dateFrom: '',
  dateTo: '',
})

// 過濾後的訂單
const filteredOrders = computed(() => {
  if (!orders.value)
    return []

  return orders.value.filter((order) => {
    // 篩選類別
    if (filters.category && order.category !== filters.category)
      return false

    // 篩選狀態
    if (filters.status && order.status !== filters.status)
      return false

    // 篩選搜尋文字（客戶姓名或電話）
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      const matchName = order.lineName?.toLowerCase().includes(searchLower)
      const matchPhone = order.phone?.toLowerCase().includes(searchLower)
      if (!matchName && !matchPhone)
        return false
    }

    // 篩選寄送日期範圍
    if (filters.dateFrom) {
      if (!order.deliveryDate)
        return false
      const orderDate = new Date(order.deliveryDate)
      const fromDate = new Date(filters.dateFrom)
      if (orderDate < fromDate)
        return false
    }

    if (filters.dateTo) {
      if (!order.deliveryDate)
        return false
      const orderDate = new Date(order.deliveryDate)
      const toDate = new Date(filters.dateTo)
      if (orderDate > toDate)
        return false
    }

    return true
  })
})

// 重置篩選器
function resetFilters() {
  filters.category = ''
  filters.status = ''
  filters.searchText = ''
  filters.dateFrom = ''
  filters.dateTo = ''
}

function getStatusText(status?: string) {
  if (!status)
    return '-'
  return statusConfig[status as keyof typeof statusConfig]?.text || status
}

function getStatusColor(status?: string) {
  if (!status)
    return 'bg-gray-100 text-gray-800'
  return statusConfig[status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'
}

function getCategoryColor(category?: string) {
  if (!category)
    return 'bg-gray-100 text-gray-800'
  return categoryConfig[category as keyof typeof categoryConfig]?.color || 'bg-gray-100 text-gray-800'
}

function formatDate(dateString?: string | null) {
  if (!dateString)
    return '-'
  return new Date(dateString).toLocaleDateString('zh-TW')
}

function formatTime(timeString?: string) {
  if (!timeString)
    return '-'
  // 將 hh:mm:ss 格式轉換為 hh:mm
  return timeString.slice(0, 5)
}
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">
          訂單總覽
        </h1>
        <NuxtLink
          to="/orders/new"
          class="
            rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm
            font-medium text-white
            hover:bg-blue-700
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            focus:outline-none
          "
        >
          新建訂單
        </NuxtLink>
      </div>

      <!-- 篩選器區域 -->
      <div class="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <!-- 搜尋框 -->
          <div>
            <label
              for="search"
              class="block text-sm font-medium text-gray-700"
            >
              搜尋客戶
            </label>
            <input
              id="search"
              v-model="filters.searchText"
              type="text"
              placeholder="姓名或電話"
              class="
                mt-1 block w-full rounded-md border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
                sm:text-sm
              "
            >
          </div>

          <!-- 類別篩選 -->
          <div>
            <label
              for="category"
              class="block text-sm font-medium text-gray-700"
            >
              類別
            </label>
            <select
              id="category"
              v-model="filters.category"
              class="
                mt-1 block w-full rounded-md border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
                sm:text-sm
              "
            >
              <option value="">
                全部類別
              </option>
              <option value="散客">
                散客
              </option>
              <option value="合作">
                合作
              </option>
              <option value="Trip">
                Trip
              </option>
              <option value="Klook">
                Klook
              </option>
            </select>
          </div>

          <!-- 狀態篩選 -->
          <div>
            <label
              for="status"
              class="block text-sm font-medium text-gray-700"
            >
              狀態
            </label>
            <select
              id="status"
              v-model="filters.status"
              class="
                mt-1 block w-full rounded-md border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
                sm:text-sm
              "
            >
              <option value="">
                全部狀態
              </option>
              <option value="pending">
                待確認
              </option>
              <option value="confirmed">
                已確認
              </option>
              <option value="assigned">
                已分配行程
              </option>
              <option value="in_delivery">
                配送中
              </option>
              <option value="delivered">
                已送達
              </option>
              <option value="cancelled">
                已取消
              </option>
            </select>
          </div>

          <!-- 寄送日期起 -->
          <div>
            <label
              for="dateFrom"
              class="block text-sm font-medium text-gray-700"
            >
              寄送日期起
            </label>
            <input
              id="dateFrom"
              v-model="filters.dateFrom"
              type="date"
              class="
                mt-1 block w-full rounded-md border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
                sm:text-sm
              "
            >
          </div>

          <!-- 寄送日期迄 -->
          <div>
            <label
              for="dateTo"
              class="block text-sm font-medium text-gray-700"
            >
              寄送日期迄
            </label>
            <input
              id="dateTo"
              v-model="filters.dateTo"
              type="date"
              class="
                mt-1 block w-full rounded-md border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
                sm:text-sm
              "
            >
          </div>
        </div>

        <!-- 重置按鈕 -->
        <div class="mt-4 flex justify-end">
          <button
            type="button"
            class="
              rounded-md border border-gray-300 bg-white px-4 py-2 text-sm
              font-medium text-gray-700 shadow-sm
              hover:bg-gray-50
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
            "
            @click="resetFilters"
          >
            重置篩選
          </button>
        </div>
      </div>

      <div
        class="
          overflow-hidden overflow-x-auto shadow ring-1 ring-black
          md:rounded-lg
        "
      >
        <!-- Header -->
        <div
          class="
            grid gap-4 bg-gray-50 px-6 py-3 text-left text-xs font-medium
            tracking-wider text-gray-500 uppercase
          "
          :style="{ gridTemplateColumns }"
        >
          <div
            v-for="column in columns"
            :key="column.key"
          >
            {{ column.label }}
          </div>
        </div>

        <!-- Body -->
        <div class="divide-y divide-gray-200 bg-white">
          <div
            v-for="order in filteredOrders"
            :key="order.id"
            class="grid cursor-pointer gap-4 px-6 py-4 hover:bg-gray-50"
            :style="{ gridTemplateColumns }"
            @click="goToOrderDetail(order.id)"
          >
            <div class="whitespace-nowrap">
              <span
                :class="getCategoryColor(order.category)"
                class="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
              >
                {{ order.category }}
              </span>
            </div>

            <div class="whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">
                {{ order.lineName }}
              </div>
              <div class="text-sm text-gray-500">
                {{ order.phone }}
              </div>
            </div>

            <div class="text-sm whitespace-nowrap text-gray-900">
              {{ formatDate(order.deliveryDate) }}
            </div>

            <div class="text-sm whitespace-nowrap text-gray-900">
              {{ formatTime(order.pickupTime) }}
            </div>

            <div class="whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">
                {{ order.pickupLocation?.name || '-' }}
              </div>
              <div class="text-xs text-gray-500">
                {{ order.pickupLocation?.address || '-' }}
              </div>
            </div>

            <div class="whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">
                {{ order.deliveryLocation?.name || '-' }}
              </div>
              <div class="text-xs text-gray-500">
                {{ order.deliveryLocation?.address || '-' }}
              </div>
            </div>

            <div class="text-sm whitespace-nowrap text-gray-900">
              {{ order.luggageCount }} 件
            </div>

            <div class="whitespace-nowrap">
              <span
                :class="getStatusColor(order.status)"
                class="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
              >
                {{ getStatusText(order.status) }}
              </span>
            </div>

            <div class="text-sm whitespace-nowrap text-gray-500">
              {{ formatDate(order.createdAt) }}
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="filteredOrders.length === 0"
        class="py-12 text-center"
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
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          沒有符合條件的訂單
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          目前沒有符合篩選條件的訂單，請調整篩選條件或建立新訂單。
        </p>
        <div class="mt-6 flex justify-center gap-3">
          <button
            type="button"
            class="
              inline-flex items-center rounded-md border border-gray-300
              bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm
              hover:bg-gray-50
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
            "
            @click="resetFilters"
          >
            重置篩選
          </button>
          <NuxtLink
            to="/orders/new"
            class="
              inline-flex items-center rounded-md border border-transparent
              bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm
              hover:bg-blue-700
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
            "
          >
            新建訂單
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

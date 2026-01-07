<script lang="ts" setup>
useHead({
  title: '訂單總覽 - 行李運送系統',
})

const { data: orders } = await useFetch('/api/orders')

const columns = [
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
  pending: { text: '待處理', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { text: '已確認', color: 'bg-blue-100 text-blue-800' },
  in_transit: { text: '運送中', color: 'bg-indigo-100 text-indigo-800' },
  delivered: { text: '已送達', color: 'bg-green-100 text-green-800' },
  cancelled: { text: '已取消', color: 'bg-red-100 text-red-800' },
}

function getStatusText(status: string) {
  return statusConfig[status as keyof typeof statusConfig]?.text || status
}

function getStatusColor(status: string) {
  return statusConfig[status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('zh-TW')
}

function formatTime(timeString: string) {
  if (!timeString)
    return '-'
  return timeString
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

      <div class="overflow-hidden shadow ring-1 ring-black md:rounded-lg">
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
            v-for="order in orders"
            :key="order.id"
            class="grid cursor-pointer gap-4 px-6 py-4 hover:bg-gray-50"
            :style="{ gridTemplateColumns }"
            @click="goToOrderDetail(order.id)"
          >
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
                {{ order.pickupLocation.name }}
              </div>
              <div class="text-xs text-gray-500">
                {{ order.pickupLocation.address }}
              </div>
            </div>

            <div class="whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">
                {{ order.deliveryLocation.name }}
              </div>
              <div class="text-xs text-gray-500">
                {{ order.deliveryLocation.address }}
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
        v-if="!orders || orders.length === 0"
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
          沒有訂單
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          目前尚無任何行李運送訂單。
        </p>
        <div class="mt-6">
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

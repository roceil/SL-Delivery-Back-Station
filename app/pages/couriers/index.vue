<script lang="ts" setup>
useHead({
  title: '快遞員總覽 - 物流管理系統',
})

const { data: couriers } = await useFetch('/api/couriers')
const { data: courierStats } = await useFetch('/api/couriers/stats')

function getStatusText(status: string) {
  const statusMap = {
    available: '可用',
    busy: '忙碌中',
    offline: '離線',
  }
  return statusMap[status as keyof typeof statusMap] || status
}

function getStatusColor(status: string) {
  const colorMap = {
    available: 'bg-green-100 text-green-800',
    busy: 'bg-yellow-100 text-yellow-800',
    offline: 'bg-gray-100 text-gray-800',
  }
  return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'
}

function getVehicleText(vehicleType: string) {
  const vehicleMap = {
    motorcycle: '機車',
    car: '轎車',
    van: '廂型車',
    truck: '卡車',
  }
  return vehicleMap[vehicleType as keyof typeof vehicleMap] || vehicleType
}

function getCourierStats(courierId: string) {
  return courierStats.value?.find((s: any) => s.courierId === courierId) || {
    completedTrips: 0,
    totalEarnings: 0,
    rating: 0,
  }
}
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <h1 class="mb-6 text-2xl font-bold text-gray-900">
        快遞員總覽
      </h1>

      <div
        class="
          grid grid-cols-1 gap-6
          sm:grid-cols-2
          lg:grid-cols-3
          xl:grid-cols-4
        "
      >
        <div
          v-for="courier in couriers"
          :key="courier.id"
          class="
            rounded-lg border border-gray-200 bg-white p-6 transition-shadow
            hover:shadow-md
          "
        >
          <div class="mb-4 flex items-start justify-between">
            <div>
              <h3 class="text-lg font-medium text-gray-900">
                {{ courier.name }}
              </h3>
              <p class="text-sm text-gray-500">
                {{ courier.phone }}
              </p>
            </div>
            <span
              :class="getStatusColor(courier.status)"
              class="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
            >
              {{ getStatusText(courier.status) }}
            </span>
          </div>

          <div class="mb-4 space-y-2">
            <div class="text-sm text-gray-700">
              <span class="font-medium">車輛:</span> {{ getVehicleText(courier.vehicleType) }}
            </div>
            <div class="text-sm text-gray-700">
              <span class="font-medium">車牌:</span> {{ courier.licensePlate }}
            </div>
            <div class="text-sm text-gray-500">
              加入時間: {{ new Date(courier.joinDate).toLocaleDateString('zh-TW') }}
            </div>
          </div>

          <div class="border-t pt-4">
            <div class="grid grid-cols-2 gap-4 text-center">
              <div>
                <div class="text-2xl font-bold text-blue-600">
                  {{ getCourierStats(courier.id).completedTrips }}
                </div>
                <div class="text-xs text-gray-500">
                  完成行程
                </div>
              </div>
              <div>
                <div class="text-2xl font-bold text-green-600">
                  {{ getCourierStats(courier.id).totalEarnings }}
                </div>
                <div class="text-xs text-gray-500">
                  總收入
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 flex items-center justify-between border-t pt-4">
            <div class="text-sm text-gray-500">
              評分: ⭐ {{ getCourierStats(courier.id).rating || 'N/A' }}
            </div>
            <div class="space-x-2">
              <button class="text-sm text-blue-600 hover:text-blue-800">
                查看詳情
              </button>
              <button class="text-sm text-green-600 hover:text-green-800">
                結帳
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="couriers.length === 0"
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          沒有快遞員
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          請先新增快遞員資料。
        </p>
      </div>

      <div class="mt-8 border-t pt-6">
        <h2 class="mb-4 text-lg font-medium text-gray-900">
          統計概覽
        </h2>
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-4">
          <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div class="text-2xl font-bold text-blue-600">
              {{ couriers.length }}
            </div>
            <div class="text-sm text-blue-800">
              總快遞員數
            </div>
          </div>
          <div class="rounded-lg border border-green-200 bg-green-50 p-4">
            <div class="text-2xl font-bold text-green-600">
              {{ couriers.filter(c => c.status === 'available').length }}
            </div>
            <div class="text-sm text-green-800">
              可用快遞員
            </div>
          </div>
          <div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div class="text-2xl font-bold text-yellow-600">
              {{ couriers.filter(c => c.status === 'busy').length }}
            </div>
            <div class="text-sm text-yellow-800">
              忙碌中
            </div>
          </div>
          <div class="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <div class="text-2xl font-bold text-purple-600">
              {{ courierStats.value?.reduce((sum, s) => sum + s.totalEarnings, 0) || 0 }}
            </div>
            <div class="text-sm text-purple-800">
              總收入
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

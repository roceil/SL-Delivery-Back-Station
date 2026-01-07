<script lang="ts" setup>
useHead({
  title: '行程總表 - 物流管理系統',
})

const { data: trips } = await useFetch('/api/trips')
const { data: couriers } = await useFetch('/api/couriers')

function getCourierName(courierId: string) {
  const courier = couriers.value?.find((c: any) => c.id === courierId)
  return courier?.name || '未知快遞員'
}

function getStatusText(status: string) {
  const statusMap = {
    pending: '待派發',
    dispatched: '已派發',
    completed: '已完成',
  }
  return statusMap[status as keyof typeof statusMap] || status
}

function getStatusColor(status: string) {
  const colorMap = {
    pending: 'bg-yellow-100 text-yellow-800',
    dispatched: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
  }
  return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'
}

async function dispatchTrip(tripId: string) {
  try {
    await $fetch(`/api/trips/${tripId}/dispatch`, {
      method: 'POST',
    })

    const tripIndex = trips.value?.findIndex((t: any) => t.id === tripId)
    if (tripIndex !== undefined && tripIndex > -1 && trips.value) {
      trips.value[tripIndex].status = 'dispatched'
      trips.value[tripIndex].dispatchedAt = new Date().toISOString()
      trips.value[tripIndex].trackingUrl = `${window.location.origin}/trips/track/${tripId}`
    }
  }
  catch (error) {
    console.error('派發行程失敗:', error)
  }
}

function copyTrackingUrl(url: string) {
  navigator.clipboard.writeText(url)
  // eslint-disable-next-line no-alert
  alert('追蹤連結已複製到剪貼簿')
}

async function viewTripMap(tripId: string) {
  try {
    // 獲取行程的物品信息
    const tripItems = await $fetch(`/api/trips/${tripId}/items`)
    
    if (tripItems && tripItems.length > 0) {
      // 收集所有地址
      const allAddresses: string[] = []
      
      // 添加所有寄件地址
      tripItems.forEach((item: any) => {
        if (!allAddresses.includes(item.senderAddress)) {
          allAddresses.push(item.senderAddress)
        }
      })
      
      // 添加所有收件地址  
      tripItems.forEach((item: any) => {
        if (!allAddresses.includes(item.receiverAddress)) {
          allAddresses.push(item.receiverAddress)
        }
      })

      const waypoints = allAddresses.map(addr => encodeURIComponent(addr)).join('/')
      const mapUrl = `https://www.google.com/maps/dir/${waypoints}`
      window.open(mapUrl, '_blank')
    }
  } catch (error) {
    console.error('無法獲取行程地圖:', error)
  }
}
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">
          行程總表
        </h1>
        <NuxtLink
          to="/trips/new"
          class="
            rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm
            font-medium text-white
            hover:bg-blue-700
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            focus:outline-none
          "
        >
          新建行程
        </NuxtLink>
      </div>

      <div
        class="
          ring-opacity-5 overflow-hidden shadow ring-1 ring-black
          md:rounded-lg
        "
      >
        <table class="min-w-full divide-y divide-gray-300">
          <thead class="bg-gray-50">
            <tr>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wider
                  text-gray-500 uppercase
                "
              >
                行程資訊
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wider
                  text-gray-500 uppercase
                "
              >
                快遞員
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wider
                  text-gray-500 uppercase
                "
              >
                物品數量
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wider
                  text-gray-500 uppercase
                "
              >
                預計日期
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wider
                  text-gray-500 uppercase
                "
              >
                狀態
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wider
                  text-gray-500 uppercase
                "
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr
              v-for="trip in trips"
              :key="trip.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4">
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ trip.name }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ trip.description }}
                  </div>
                  <div class="mt-1 text-xs text-gray-400">
                    建立: {{ new Date(trip.createdAt).toLocaleDateString('zh-TW') }}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                {{ getCourierName(trip.courierId) }}
              </td>
              <td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                {{ trip.itemIds.length }} 個物品
              </td>
              <td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                {{ new Date(trip.scheduledDate).toLocaleDateString('zh-TW') }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="getStatusColor(trip.status)"
                  class="
                    inline-flex rounded-full px-2 py-1 text-xs font-semibold
                  "
                >
                  {{ getStatusText(trip.status) }}
                </span>
              </td>
              <td
                class="
                  space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap
                "
              >
                <button
                  v-if="trip.status === 'pending'"
                  class="text-blue-600 hover:text-blue-900"
                  @click="dispatchTrip(trip.id)"
                >
                  派發
                </button>

                <button
                  class="text-orange-600 hover:text-orange-900"
                  @click="viewTripMap(trip.id)"
                >
                  地圖
                </button>

                <button
                  v-if="trip.trackingUrl"
                  class="text-green-600 hover:text-green-900"
                  @click="copyTrackingUrl(trip.trackingUrl)"
                >
                  複製連結
                </button>

                <NuxtLink
                  v-if="trip.trackingUrl"
                  :to="`/trips/track/${trip.id}`"
                  class="text-purple-600 hover:text-purple-900"
                >
                  查看
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="trips.length === 0"
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
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          沒有行程
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          開始建立您的第一個行程。
        </p>
        <div class="mt-6">
          <NuxtLink
            to="/trips/new"
            class="
              inline-flex items-center rounded-md border border-transparent
              bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm
              hover:bg-blue-700
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
            "
          >
            新建行程
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

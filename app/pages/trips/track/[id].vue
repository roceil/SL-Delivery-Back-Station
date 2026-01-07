<script lang="ts" setup>
const route = useRoute()
const tripId = route.params.id as string

useHead({
  title: `行程追蹤 - ${tripId} - 物流管理系統`,
})

const { data: trip } = await useFetch(`/api/trips/${tripId}`)
const { data: tripItems } = await useFetch(`/api/trips/${tripId}/items`)

const completedItems = ref<string[]>([])

function toggleItemCompletion(itemId: string) {
  const index = completedItems.value.indexOf(itemId)
  if (index > -1) {
    completedItems.value.splice(index, 1)
  }
  else {
    completedItems.value.push(itemId)
  }
}

function openMap() {
  if (tripItems.value && tripItems.value.length > 0) {
    // 優化路線：先收集所有地址，然後規劃最佳路線
    const allAddresses: string[] = []
    
    // 添加所有寄件地址
    tripItems.value.forEach((item: any) => {
      if (!allAddresses.includes(item.senderAddress)) {
        allAddresses.push(item.senderAddress)
      }
    })
    
    // 添加所有收件地址  
    tripItems.value.forEach((item: any) => {
      if (!allAddresses.includes(item.receiverAddress)) {
        allAddresses.push(item.receiverAddress)
      }
    })

    const waypoints = allAddresses.map(addr => encodeURIComponent(addr)).join('/')
    const mapUrl = `https://www.google.com/maps/dir/${waypoints}`
    window.open(mapUrl, '_blank')
  }
}

async function completeTrip() {
  if (!tripItems.value || completedItems.value.length !== tripItems.value.length) {
    // eslint-disable-next-line no-alert
    alert('請確認所有物品都已完成配送')
    return
  }

  try {
    await $fetch(`/api/trips/${tripId}/complete`, {
      method: 'POST',
    })

    // eslint-disable-next-line no-alert
    alert('行程已完成！')
    await navigateTo('/couriers')
  }
  catch (error) {
    console.error('完成行程失敗:', error)
  }
}

const remainingItems = computed(() => {
  return (tripItems.value?.length || 0) - completedItems.value.length
})
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ trip.name }}
          </h1>
          <p class="text-gray-600">
            {{ trip.description }}
          </p>
        </div>
        <div class="text-right">
          <div class="text-sm text-gray-500">
            剩餘物品
          </div>
          <div class="text-2xl font-bold text-blue-600">
            {{ remainingItems }}
          </div>
        </div>
      </div>

      <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 class="mb-2 text-lg font-medium text-blue-900">
            行程資訊
          </h3>
          <div class="space-y-1 text-sm text-blue-800">
            <div>預計日期: {{ new Date(trip.scheduledDate).toLocaleDateString('zh-TW') }}</div>
            <div>總物品數: {{ tripItems?.length || 0 }}</div>
            <div>已完成: {{ completedItems.length }}</div>
          </div>
        </div>

        <div class="rounded-lg border border-green-200 bg-green-50 p-4">
          <h3 class="mb-2 text-lg font-medium text-green-900">
            快速操作
          </h3>
          <div class="space-y-2">
            <button
              class="
                w-full text-left text-sm text-green-600
                hover:text-green-800 flex items-center gap-x-2
              "
              @click="openMap"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              打開 Google 地圖導航
            </button>
            <button
              :disabled="remainingItems > 0"
              class="
                w-full text-left text-sm
                disabled:cursor-not-allowed disabled:text-gray-400
              "
              :class="remainingItems === 0 ? `
                text-green-600
                hover:text-green-800
              ` : ''"
              @click="completeTrip"
            >
              ✅ 完成行程
            </button>
          </div>
        </div>

        <div class="rounded-lg border border-purple-200 bg-purple-50 p-4">
          <h3 class="mb-2 text-lg font-medium text-purple-900">
            進度統計
          </h3>
          <div class="space-y-2">
            <div class="flex justify-between text-sm text-purple-800">
              <span>完成率</span>
              <span>{{ Math.round((completedItems.length / (tripItems?.length || 1)) * 100) }}%</span>
            </div>
            <div class="h-2 w-full rounded-full bg-purple-200">
              <div
                class="
                  h-2 rounded-full bg-purple-600 transition-all duration-300
                "
                :style="{ width: `${(completedItems.length / (tripItems?.length || 1)) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 路線地圖 -->
      <div class="border-t pt-6">
        <TripMap v-if="tripItems" :trip-items="tripItems" :trip-name="trip?.name" />
      </div>

      <div class="border-t pt-6">
        <h3 class="mb-4 text-lg font-medium text-gray-900">
          物品清單
        </h3>

        <div class="space-y-4">
          <div
            v-for="item in tripItems || []"
            :key="item.id"
            class="flex items-start space-x-3 rounded-lg border p-4"
            :class="completedItems.includes(item.id) ? `
              border-green-200 bg-green-50
            ` : `hover:bg-gray-50`"
          >
            <input
              :id="item.id"
              type="checkbox"
              :checked="completedItems.includes(item.id)"
              class="mt-1 text-green-600"
              @change="toggleItemCompletion(item.id)"
            >
            <div class="flex-1">
              <div class="flex justify-between">
                <div>
                  <h4 class="text-sm font-medium text-gray-900">
                    {{ item.name }}
                  </h4>
                  <p class="text-sm text-gray-500">
                    {{ item.description }}
                  </p>
                  <p class="mt-1 text-xs text-gray-400">
                    {{ item.dimensions.length }}×{{ item.dimensions.width }}×{{ item.dimensions.height }} cm,
                    {{ item.weight }} kg
                  </p>
                </div>
                <div
                  v-if="completedItems.includes(item.id)"
                  class="text-green-600"
                >
                  ✓ 已完成
                </div>
              </div>

              <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div class="rounded border bg-white p-3">
                  <div
                    class="
                      text-xs font-medium tracking-wider text-gray-500 uppercase
                    "
                  >
                    寄件地址
                  </div>
                  <div class="text-sm text-gray-900">
                    {{ item.senderAddress }}
                  </div>
                </div>
                <div class="rounded border bg-white p-3">
                  <div
                    class="
                      text-xs font-medium tracking-wider text-gray-500 uppercase
                    "
                  >
                    收件地址
                  </div>
                  <div class="text-sm text-gray-900">
                    {{ item.receiverAddress }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 flex items-center justify-between border-t pt-6">
        <NuxtLink
          to="/trips"
          class="text-gray-600 hover:text-gray-800"
        >
          ← 返回行程總表
        </NuxtLink>

        <button
          :disabled="remainingItems > 0"
          class="
            rounded-md border border-transparent bg-green-600 px-6 py-2 text-sm
            font-medium text-white
            hover:bg-green-700
            focus:ring-2 focus:ring-green-500 focus:ring-offset-2
            focus:outline-none
            disabled:cursor-not-allowed disabled:bg-gray-300
          "
          @click="completeTrip"
        >
          完成行程 ({{ remainingItems }} 剩餘)
        </button>
      </div>
    </div>
  </div>
</template>

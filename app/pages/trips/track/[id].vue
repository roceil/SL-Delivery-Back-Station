<script lang="ts" setup>
const route = useRoute()
const tripId = route.params.id as string

useHead({
  title: `行程追蹤 - ${tripId} - 物流管理系統`,
})

const { data: trip } = await useFetch(`/api/trips/${tripId}`)
const { data: tripOrders } = await useFetch(`/api/trips/${tripId}/orders`)

const completedOrders = ref<string[]>([])

function toggleOrderCompletion(orderId: string) {
  const index = completedOrders.value.indexOf(orderId)
  if (index > -1) {
    completedOrders.value.splice(index, 1)
  }
  else {
    completedOrders.value.push(orderId)
  }
}

function openMap() {
  if (!tripOrders.value || tripOrders.value.length === 0) {
    // eslint-disable-next-line no-alert
    alert('此行程沒有訂單')
    return
  }

  // 收集所有地址
  const allAddresses: string[] = []

  // 添加所有起點地址
  tripOrders.value.forEach((order: any) => {
    if (!allAddresses.includes(order.pickupLocation.address)) {
      allAddresses.push(order.pickupLocation.address)
    }
  })

  // 添加所有終點地址
  tripOrders.value.forEach((order: any) => {
    if (!allAddresses.includes(order.deliveryLocation.address)) {
      allAddresses.push(order.deliveryLocation.address)
    }
  })

  const waypoints = allAddresses.map(addr => encodeURIComponent(addr)).join('/')
  const mapUrl = `https://www.google.com/maps/dir/${waypoints}`
  window.open(mapUrl, '_blank')
}

async function completeTrip() {
  if (!tripOrders.value || completedOrders.value.length !== tripOrders.value.length) {
    // eslint-disable-next-line no-alert
    alert('請確認所有訂單都已完成配送')
    return
  }

  try {
    await $fetch(`/api/trips/${tripId}/complete`, {
      method: 'POST',
    })

    // eslint-disable-next-line no-alert
    alert('行程已完成！')
    await navigateTo('/trips')
  }
  catch (error) {
    console.error('完成行程失敗:', error)
  }
}

const remainingOrders = computed(() => {
  return (tripOrders.value?.length || 0) - completedOrders.value.length
})

const totalLuggage = computed(() => {
  if (!tripOrders.value)
    return 0
  return tripOrders.value.reduce((sum: number, order: any) => sum + order.luggageCount, 0)
})

const completedLuggage = computed(() => {
  if (!tripOrders.value)
    return 0
  return tripOrders.value
    .filter((order: any) => completedOrders.value.includes(order.id))
    .reduce((sum: number, order: any) => sum + order.luggageCount, 0)
})
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ trip?.name }}
          </h1>
          <p class="text-gray-600">
            {{ trip?.description }}
          </p>
        </div>
        <div class="text-right">
          <div class="text-sm text-gray-500">
            剩餘訂單
          </div>
          <div class="text-2xl font-bold text-blue-600">
            {{ remainingOrders }}
          </div>
        </div>
      </div>

      <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 class="mb-2 text-lg font-medium text-blue-900">
            行程資訊
          </h3>
          <div class="space-y-1 text-sm text-blue-800">
            <div>預計日期: {{ trip?.scheduledDate ? new Date(trip.scheduledDate).toLocaleDateString('zh-TW') : 'N/A' }}</div>
            <div>總訂單數: {{ tripOrders?.length || 0 }}</div>
            <div>總行李數: {{ totalLuggage }} 件</div>
            <div>已完成: {{ completedOrders.length }} 訂單 ({{ completedLuggage }} 件)</div>
          </div>
        </div>

        <div class="rounded-lg border border-green-200 bg-green-50 p-4">
          <h3 class="mb-2 text-lg font-medium text-green-900">
            快速操作
          </h3>
          <div class="space-y-2">
            <button
              class="
                flex w-full items-center gap-x-2 text-left text-sm
                text-green-600
                hover:text-green-800
              "
              @click="openMap"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
              打開 Google 地圖導航
            </button>
            <button
              :disabled="remainingOrders > 0"
              class="
                w-full text-left text-sm
                disabled:cursor-not-allowed disabled:text-gray-400
              "
              :class="remainingOrders === 0 ? `
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
              <span>{{ Math.round((completedOrders.length / (tripOrders?.length || 1)) * 100) }}%</span>
            </div>
            <div class="h-2 w-full rounded-full bg-purple-200">
              <div
                class="
                  h-2 rounded-full bg-purple-600 transition-all duration-300
                "
                :style="{ width: `${(completedOrders.length / (tripOrders?.length || 1)) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t pt-6">
        <h3 class="mb-4 text-lg font-medium text-gray-900">
          訂單清單
        </h3>

        <div
          v-if="!tripOrders || tripOrders.length === 0"
          class="py-12 text-center text-gray-500"
        >
          此行程沒有訂單
        </div>

        <div
          v-else
          class="space-y-4"
        >
          <div
            v-for="order in tripOrders"
            :key="order.id"
            class="flex items-start space-x-3 rounded-lg border p-4"
            :class="completedOrders.includes(order.id) ? `
              border-green-200 bg-green-50
            ` : `hover:bg-gray-50`"
          >
            <input
              :id="order.id"
              type="checkbox"
              :checked="completedOrders.includes(order.id)"
              class="mt-1 text-green-600"
              @change="toggleOrderCompletion(order.id)"
            >
            <div class="flex-1">
              <div class="flex justify-between">
                <div class="flex-1">
                  <h4 class="text-sm font-medium text-gray-900">
                    {{ order.lineName }} - {{ order.phone }}
                  </h4>
                  <p class="text-sm text-gray-500">
                    收貨時間: {{ order.pickupTime }}
                  </p>
                  <p class="mt-1 text-xs text-gray-400">
                    行李數量: {{ order.luggageCount }} 件
                  </p>
                </div>
                <div class="text-right">
                  <div
                    v-if="completedOrders.includes(order.id)"
                    class="text-green-600"
                  >
                    ✓ 已完成
                  </div>
                  <div
                    v-else
                    class="text-xs text-gray-500"
                  >
                    待配送
                  </div>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div class="rounded border bg-white p-3">
                  <div
                    class="
                      text-xs font-medium tracking-wider text-gray-500 uppercase
                    "
                  >
                    起點
                  </div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ order.pickupLocation.name }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ order.pickupLocation.address }}
                  </div>
                  <div
                    v-if="order.pickupLocation.area"
                    class="mt-1 text-xs text-gray-400"
                  >
                    區域: {{ order.pickupLocation.area }}
                  </div>
                </div>
                <div class="rounded border bg-white p-3">
                  <div
                    class="
                      text-xs font-medium tracking-wider text-gray-500 uppercase
                    "
                  >
                    終點
                  </div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ order.deliveryLocation.name }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ order.deliveryLocation.address }}
                  </div>
                  <div
                    v-if="order.deliveryLocation.area"
                    class="mt-1 text-xs text-gray-400"
                  >
                    區域: {{ order.deliveryLocation.area }}
                  </div>
                </div>
              </div>

              <div
                v-if="order.notes"
                class="mt-3 rounded border bg-yellow-50 p-3"
              >
                <div
                  class="
                    text-xs font-medium tracking-wider text-gray-500 uppercase
                  "
                >
                  備註
                </div>
                <div class="text-sm text-gray-900">
                  {{ order.notes }}
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
          :disabled="remainingOrders > 0"
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
          完成行程 ({{ remainingOrders }} 剩餘)
        </button>
      </div>
    </div>
  </div>
</template>

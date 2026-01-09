<script lang="ts" setup>
import { COLOR_THEME_CLASSES, QUICK_ACTIONS, TIME_RANGE_OPTIONS } from '~/constants/dashboard'

useHead({
  title: '行李運送系統 - 首頁',
})

interface ActiveTrip {
  id: number
  courier: string
  route: string
  ordersCount: number
  progress: number
  estimatedTime: string
  status: string
}

const { data: recentStats } = await useFetch('/api/dashboard/stats')
const { data: activeTrips } = await useFetch<ActiveTrip[]>('/api/dashboard/active-trips')

const stats = computed(() => [
  { name: '總訂單數', value: recentStats.value?.totalOrders.toString() || '0', change: '+4.75%', changeType: 'positive', icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
  { name: '待確認訂單', value: recentStats.value?.pendingOrders.toString() || '0', change: '+2.3%', changeType: 'negative', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: '配送中訂單', value: recentStats.value?.inDeliveryOrders.toString() || '0', change: '-1.5%', changeType: 'positive', icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
  { name: '已完成訂單', value: recentStats.value?.deliveredOrders.toString() || '0', change: '+8.2%', changeType: 'positive', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: '配送夥伴', value: recentStats.value?.activeCouriers.toString() || '0', change: '+1', changeType: 'positive', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
  { name: '合作商家', value: recentStats.value?.totalMerchants.toString() || '0', change: '+2', changeType: 'positive', icon: 'M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.001 3.001 0 01-.621-1.82c0-.84.353-1.608.982-2.16m16.5 3.98a3.001 3.001 0 01-.621-1.82c0-.84.353-1.608.982-2.16' },
])
</script>

<template>
  <div class="relative isolate overflow-hidden">
    <!-- 頁面標題區域 -->
    <div class="border-b border-gray-900/10 pt-6 pb-4">
      <div
        class="
          mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-4
          sm:flex-nowrap sm:px-6
          lg:px-8
        "
      >
        <h1 class="text-2xl/7 font-bold text-gray-900">
          行李運送系統
        </h1>
        <div
          class="
            order-last flex w-full gap-x-8 text-sm/6 font-semibold
            sm:order-0 sm:w-auto sm:border-l sm:border-gray-200 sm:pl-6
          "
        >
          <span
            v-for="option in TIME_RANGE_OPTIONS"
            :key="option.value"
            :class="option.active ? 'text-indigo-600' : 'text-gray-700'"
          >
            {{ option.label }}
          </span>
        </div>
      </div>
    </div>

    <!-- 統計數據區域 -->
    <div class="border-b border-gray-900/10">
      <dl
        class="
          mx-auto grid max-w-7xl grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-3 lg:px-2
          xl:px-0
        "
      >
        <div
          v-for="(stat, statIdx) in stats"
          :key="stat.name"
          class="
            flex items-center gap-x-4 border-t border-gray-900/5 px-4 py-6
            sm:px-6
            lg:border-t-0
            xl:px-8
          "
          :class="[
            statIdx % 2 === 1 ? 'sm:border-l' : '',
            statIdx % 3 !== 0 ? 'lg:border-l' : '',
          ]"
        >
          <div
            class="
              flex h-12 w-12 flex-shrink-0 items-center justify-center
              rounded-lg bg-blue-50
            "
          >
            <svg
              class="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                :d="stat.icon"
              />
            </svg>
          </div>
          <div class="flex-1">
            <dt class="text-sm/6 font-medium text-gray-500">
              {{ stat.name }}
            </dt>
            <dd class="flex items-baseline gap-x-2">
              <span
                class="text-2xl/8 font-semibold tracking-tight text-gray-900"
              >
                {{ stat.value }}
              </span>
              <span
                class="text-xs font-medium"
                :class="[
                  stat.changeType === 'negative' ? 'text-rose-600' : `
                    text-green-600
                  `,
                ]"
              >
                {{ stat.change }}
              </span>
            </dd>
          </div>
        </div>
      </dl>
    </div>

    <!-- 背景裝飾 -->
    <div
      class="
        absolute top-full left-0 -z-10 mt-96 origin-top-left translate-y-40
        -rotate-90 transform-gpu opacity-20 blur-3xl
        sm:left-1/2 sm:-mt-10 sm:-ml-96 sm:translate-y-0 sm:rotate-0
        sm:opacity-50
      "
      aria-hidden="true"
    >
      <div
        class="
          aspect-[1154/678] w-[72.125rem] bg-gradient-to-br from-[#FF80B5]
          to-[#9089FC]
        "
        style="clip-path: polygon(100% 38.5%, 82.6% 100%, 60.2% 37.7%, 52.4% 32.1%, 47.5% 41.8%, 45.2% 65.6%, 27.5% 23.4%, 0.1% 35.3%, 17.9% 0%, 27.7% 23.4%, 76.2% 2.5%, 74.2% 56%, 100% 38.5%)"
      ></div>
    </div>
  </div>

  <div class="space-y-16 py-16 xl:space-y-20">
    <!-- 快速操作區域 -->
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 class="mb-6 text-lg font-semibold text-gray-900">
        快速操作
      </h2>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="action in QUICK_ACTIONS"
          :key="action.id"
          class="
            group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm
            ring-1 ring-gray-900/5 transition-shadow
            hover:shadow-lg
          "
        >
          <div
            class="absolute -top-6 -right-6 h-20 w-20 rounded-full"
            :class="COLOR_THEME_CLASSES[action.colorTheme].background"
          ></div>
          <div class="relative">
            <div
              class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg"
              :class="COLOR_THEME_CLASSES[action.colorTheme].iconBg"
            >
              <svg
                class="h-6 w-6"
                :class="COLOR_THEME_CLASSES[action.colorTheme].iconColor"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  :d="action.iconPath"
                />
              </svg>
            </div>
            <h3 class="mb-2 text-base font-semibold text-gray-900">
              {{ action.title }}
            </h3>
            <p class="mb-4 text-sm text-gray-500">
              {{ action.description }}
            </p>
            <div class="space-y-2">
              <NuxtLink
                v-for="link in action.links"
                :key="link.to"
                :to="link.to"
                class="block text-sm font-medium"
                :class="COLOR_THEME_CLASSES[action.colorTheme].linkColor"
              >
                → {{ link.label }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 運送中行程 -->
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">
          運送中行程
        </h2>
        <NuxtLink
          to="/trips"
          class="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
        >
          查看全部行程
        </NuxtLink>
      </div>

      <div
        v-if="!activeTrips || activeTrips.length === 0"
        class="
          overflow-hidden rounded-lg bg-white p-12 text-center shadow ring-1
          ring-gray-900/5
        "
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
          目前沒有運送中的行程
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          所有行程都已完成或尚未開始
        </p>
      </div>

      <div
        v-else
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div
          v-for="trip in activeTrips"
          :key="trip.id"
          class="
            overflow-hidden rounded-lg bg-white shadow ring-1 ring-gray-900/5
          "
        >
          <div class="p-6">
            <div class="mb-4 flex items-center justify-between">
              <div class="flex items-center gap-x-3">
                <div
                  class="
                    flex h-10 w-10 items-center justify-center rounded-full
                    bg-purple-50
                  "
                >
                  <svg
                    class="h-5 w-5 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                    />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {{ trip.courier }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ trip.ordersCount }} 個訂單
                  </p>
                </div>
              </div>
              <span
                class="
                  inline-flex rounded-full bg-green-100 px-2 py-1 text-xs
                  font-semibold text-green-800
                "
              >
                配送中
              </span>
            </div>

            <div class="mb-4">
              <p class="text-sm font-medium text-gray-700">
                {{ trip.route }}
              </p>
              <p class="mt-1 text-xs text-gray-500">
                預計抵達：{{ trip.estimatedTime }}
              </p>
            </div>

            <div>
              <div class="mb-1 flex items-center justify-between text-xs">
                <span class="text-gray-600">進度</span>
                <span class="font-medium text-gray-900">{{ trip.progress }}%</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  class="h-full bg-purple-600 transition-all"
                  :style="{ width: `${trip.progress}%` }"
                >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

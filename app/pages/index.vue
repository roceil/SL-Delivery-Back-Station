<script lang="ts" setup>
import { COLOR_THEME_CLASSES, QUICK_ACTIONS, TIME_RANGE_OPTIONS } from '~/constants/dashboard'

useHead({
  title: '物流管理系統 - 首頁',
})

const { data: recentStats } = await useFetch('/api/dashboard/stats')
const { data: recentActivities } = await useFetch('/api/dashboard/activities')

const stats = computed(() => [
  { name: '總物品數', value: recentStats.value?.totalItems.toString() || '0', change: '+4.75%', changeType: 'positive' },
  { name: '待處理物品', value: recentStats.value?.pendingItems.toString() || '0', change: '+12.3%', changeType: 'negative' },
  { name: '運送中物品', value: recentStats.value?.inTransitItems.toString() || '0', change: '-2.5%', changeType: 'positive' },
  { name: '總收入', value: `NT$ ${recentStats.value?.totalRevenue.toLocaleString() || '0'}`, change: '+8.2%', changeType: 'positive' },
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
          物流管理系統
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
          lg:grid-cols-4 lg:px-2
          xl:px-0
        "
      >
        <div
          v-for="(stat, statIdx) in stats"
          :key="stat.name"
          class="
            flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2
            border-t border-gray-900/5 px-4 py-10
            sm:px-6
            lg:border-t-0
            xl:px-8
          "
          :class="[
            statIdx % 2 === 1 ? 'sm:border-l' : statIdx === 2 ? 'lg:border-l' : '',
          ]"
        >
          <dt class="text-sm/6 font-medium text-gray-500">
            {{ stat.name }}
          </dt>
          <dd
            class="text-xs font-medium"
            :class="[
              stat.changeType === 'negative' ? 'text-rose-600' : 'text-gray-700',
            ]"
          >
            {{ stat.change }}
          </dd>
          <dd
            class="
              w-full flex-none text-3xl/10 font-medium tracking-tight
              text-gray-900
            "
          >
            {{ stat.value }}
          </dd>
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

    <!-- 最近活動 -->
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">
          最近活動
        </h2>
        <NuxtLink
          to="/items"
          class="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
        >
          查看全部
        </NuxtLink>
      </div>

      <div
        class="
          overflow-hidden rounded-lg bg-white shadow ring-1 ring-gray-900/5
        "
      >
        <div class="px-6 py-4">
          <div
            v-if="!recentActivities || recentActivities.length === 0"
            class="py-8 text-center text-gray-500"
          >
            暫無最近活動
          </div>
          <div
            v-else
            class="space-y-4"
          >
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="flex items-center gap-x-4 py-3"
            >
              <div
                class="
                  flex h-8 w-8 items-center justify-center rounded-full
                  bg-blue-50
                "
              >
                <svg
                  class="h-4 w-4 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                  />
                </svg>
              </div>
              <div class="flex-auto">
                <p class="text-sm font-medium text-gray-900">
                  {{ activity.title }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ activity.description }}
                </p>
              </div>
              <div class="text-xs text-gray-400">
                {{ new Date(activity.createdAt).toLocaleDateString('zh-TW') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

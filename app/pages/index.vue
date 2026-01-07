<script lang="ts" setup>
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
    <div class="border-b border-gray-900/10 pb-4 pt-6">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-4 sm:flex-nowrap sm:px-6 lg:px-8">
        <h1 class="text-2xl/7 font-bold text-gray-900">
          物流管理系統
        </h1>
        <div class="order-last flex w-full gap-x-8 text-sm/6 font-semibold sm:order-0 sm:w-auto sm:border-l sm:border-gray-200 sm:pl-6">
          <span class="text-indigo-600">今日概覽</span>
          <span class="text-gray-700">本週統計</span>
          <span class="text-gray-700">本月報告</span>
        </div>
        <NuxtLink
          to="/items"
          class="ml-auto flex items-center gap-x-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <svg class="-ml-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          物品管理
        </NuxtLink>
      </div>
    </div>

    <!-- 統計數據區域 -->
    <div class="border-b border-gray-900/10">
      <dl class="mx-auto grid max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:px-2 xl:px-0">
        <div
          v-for="(stat, statIdx) in stats"
          :key="stat.name"
          :class="[
            statIdx % 2 === 1 ? 'sm:border-l' : statIdx === 2 ? 'lg:border-l' : '',
            'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-t border-gray-900/5 px-4 py-10 sm:px-6 lg:border-t-0 xl:px-8'
          ]"
        >
          <dt class="text-sm/6 font-medium text-gray-500">
            {{ stat.name }}
          </dt>
          <dd :class="[
            stat.changeType === 'negative' ? 'text-rose-600' : 'text-gray-700',
            'text-xs font-medium'
          ]">
            {{ stat.change }}
          </dd>
          <dd class="w-full flex-none text-3xl/10 font-medium tracking-tight text-gray-900">
            {{ stat.value }}
          </dd>
        </div>
      </dl>
    </div>

    <!-- 背景裝飾 -->
    <div
      class="absolute left-0 top-full -z-10 mt-96 origin-top-left translate-y-40 -rotate-90 transform-gpu opacity-20 blur-3xl sm:left-1/2 sm:-mt-10 sm:-ml-96 sm:translate-y-0 sm:rotate-0 sm:opacity-50"
      aria-hidden="true"
    >
      <div
        class="aspect-[1154/678] w-[72.125rem] bg-gradient-to-br from-[#FF80B5] to-[#9089FC]"
        style="clip-path: polygon(100% 38.5%, 82.6% 100%, 60.2% 37.7%, 52.4% 32.1%, 47.5% 41.8%, 45.2% 65.6%, 27.5% 23.4%, 0.1% 35.3%, 17.9% 0%, 27.7% 23.4%, 76.2% 2.5%, 74.2% 56%, 100% 38.5%)"
      />
    </div>
  </div>

  <div class="space-y-16 py-16 xl:space-y-20">
    <!-- 快速操作區域 -->
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 class="text-lg font-semibold text-gray-900 mb-6">
        快速操作
      </h2>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <!-- 物品管理 -->
        <div class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 hover:shadow-lg transition-shadow">
          <div class="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-blue-500/10" />
          <div class="relative">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
              <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 mb-2">
              物品管理
            </h3>
            <p class="text-sm text-gray-500 mb-4">
              管理所有物品，查看寄送狀態
            </p>
            <div class="space-y-2">
              <NuxtLink
                to="/items/new"
                class="block text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                → 新建物品
              </NuxtLink>
              <NuxtLink
                to="/items"
                class="block text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                → 物品清單
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- 行程管理 -->
        <div class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 hover:shadow-lg transition-shadow">
          <div class="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-purple-500/10" />
          <div class="relative">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50">
              <svg class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0V6.375a1.5 1.5 0 013-3h6.75a1.5 1.5 0 013 3v12.75a1.5 1.5 0 01-3 0 1.5 1.5 0 00-3 0zm-3-3.75a1.5 1.5 0 003 0 1.5 1.5 0 003 0zm-3-7.5a1.5 1.5 0 003 0 1.5 1.5 0 003 0z" />
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 mb-2">
              行程管理
            </h3>
            <p class="text-sm text-gray-500 mb-4">
              創建和管理配送行程
            </p>
            <div class="space-y-2">
              <NuxtLink
                to="/trips/new"
                class="block text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                → 新建行程
              </NuxtLink>
              <NuxtLink
                to="/trips"
                class="block text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                → 行程總表
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- 商家管理 -->
        <div class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 hover:shadow-lg transition-shadow">
          <div class="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-orange-500/10" />
          <div class="relative">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50">
              <svg class="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.001 3.001 0 01-.621-1.82c0-.84.353-1.608.982-2.16m16.5 3.98a3.001 3.001 0 01-.621-1.82c0-.84.353-1.608.982-2.16" />
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 mb-2">
              商家管理
            </h3>
            <p class="text-sm text-gray-500 mb-4">
              管理合作商家和臨時商家
            </p>
            <div class="space-y-2">
              <NuxtLink
                to="/merchants/new"
                class="block text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                → 新增商家
              </NuxtLink>
              <NuxtLink
                to="/merchants"
                class="block text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                → 商家總覽
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- 財務管理 -->
        <div class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 hover:shadow-lg transition-shadow">
          <div class="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-green-500/10" />
          <div class="relative">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
              <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 mb-2">
              財務管理
            </h3>
            <p class="text-sm text-gray-500 mb-4">
              查看收支和結帳記錄
            </p>
            <div class="space-y-2">
              <NuxtLink
                to="/billing"
                class="block text-sm text-green-600 hover:text-green-700 font-medium"
              >
                → 結帳總覽
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- 快遞員管理 -->
        <div class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 hover:shadow-lg transition-shadow">
          <div class="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-indigo-500/10" />
          <div class="relative">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50">
              <svg class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 mb-2">
              快遞員管理
            </h3>
            <p class="text-sm text-gray-500 mb-4">
              管理快遞員和績效統計
            </p>
            <div class="space-y-2">
              <NuxtLink
                to="/couriers"
                class="block text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                → 快遞員總覽
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近活動 -->
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between mb-6">
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
      
      <div class="overflow-hidden rounded-lg bg-white shadow ring-1 ring-gray-900/5">
        <div class="px-6 py-4">
          <div v-if="!recentActivities || recentActivities.length === 0" class="text-center py-8 text-gray-500">
            暫無最近活動
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="flex items-center gap-x-4 py-3"
            >
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                <svg class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
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

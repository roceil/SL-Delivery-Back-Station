<script lang="ts" setup>
useHead({
  title: '收件地管理 - 物流管理系統',
})

const { data: deliveryPoints } = await useFetch('/api/delivery-points')

async function deleteDeliveryPoint(id: string) {
  if (!confirm('確定要刪除這個收件地嗎？')) return
  
  try {
    await $fetch(`/api/delivery-points/${id}`, {
      method: 'DELETE',
    })
    await refreshCookie('delivery-points')
    await navigateTo('/delivery-points')
  }
  catch (error) {
    console.error('刪除收件地失敗:', error)
  }
}
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">
          收件地管理
        </h1>
        <NuxtLink
          to="/delivery-points/new"
          class="
            rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white
            hover:bg-blue-500
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            focus:outline-none
          "
        >
          新增收件地
        </NuxtLink>
      </div>

      <div
        v-if="!deliveryPoints || deliveryPoints.length === 0"
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
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          沒有收件地
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          開始新增第一個收件地。
        </p>
        <div class="mt-6">
          <NuxtLink
            to="/delivery-points/new"
            class="
              inline-flex items-center rounded-md border border-transparent
              bg-blue-600 px-4 py-2 text-sm font-medium text-white
              hover:bg-blue-700
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
            "
          >
            新增收件地
          </NuxtLink>
        </div>
      </div>

      <div
        v-else
        class="overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 md:rounded-lg"
      >
        <table class="min-w-full divide-y divide-gray-300">
          <thead class="bg-gray-50">
            <tr>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                收件地名稱
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                類型
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                地址
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                聯絡方式
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                狀態
              </th>
              <th scope="col" class="relative px-6 py-3">
                <span class="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr
              v-for="point in deliveryPoints"
              :key="point.id"
              class="hover:bg-gray-50"
            >
              <td class="whitespace-nowrap px-6 py-4">
                <div class="flex items-center">
                  <div
                    class="
                      flex h-8 w-8 flex-shrink-0 items-center justify-center
                      rounded-full text-sm font-medium
                    "
                    :class="
                      point.type === '7-11' 
                        ? 'bg-red-100 text-red-600'
                        : point.type === '全家'
                        ? 'bg-blue-100 text-blue-600'
                        : point.type === '萊爾富'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-purple-100 text-purple-600'
                    "
                  >
                    {{ point.type.charAt(0) }}
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ point.name }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ point.storeId || '無店鋪編號' }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <span
                  class="inline-flex rounded-full px-2 text-xs font-semibold leading-5"
                  :class="
                    point.type === '7-11' 
                      ? 'bg-red-100 text-red-800'
                      : point.type === '全家'
                      ? 'bg-blue-100 text-blue-800'
                      : point.type === '萊爾富'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-purple-100 text-purple-800'
                  "
                >
                  {{ point.type }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {{ point.address }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <div v-if="point.phone">
                  📞 {{ point.phone }}
                </div>
                <div v-if="point.openHours">
                  🕒 {{ point.openHours }}
                </div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <span
                  class="inline-flex rounded-full px-2 text-xs font-semibold leading-5"
                  :class="
                    point.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  "
                >
                  {{ point.status === 'active' ? '營業中' : '暫停服務' }}
                </span>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <div class="flex space-x-2">
                  <NuxtLink
                    :to="`/delivery-points/${point.id}/edit`"
                    class="text-blue-600 hover:text-blue-900"
                  >
                    編輯
                  </NuxtLink>
                  <button
                    class="text-red-600 hover:text-red-900"
                    @click="deleteDeliveryPoint(point.id)"
                  >
                    刪除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 統計資訊 -->
      <div
        v-if="deliveryPoints && deliveryPoints.length > 0"
        class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-4"
      >
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <div class="text-2xl font-bold text-gray-900">
            {{ deliveryPoints.length }}
          </div>
          <div class="text-sm text-gray-500">
            總收件地數量
          </div>
        </div>
        <div class="rounded-lg border border-red-200 bg-red-50 p-4">
          <div class="text-2xl font-bold text-red-600">
            {{ deliveryPoints.filter(p => p.type === '7-11').length }}
          </div>
          <div class="text-sm text-red-500">
            7-11 門市
          </div>
        </div>
        <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div class="text-2xl font-bold text-blue-600">
            {{ deliveryPoints.filter(p => p.type === '全家').length }}
          </div>
          <div class="text-sm text-blue-500">
            全家便利商店
          </div>
        </div>
        <div class="rounded-lg border border-green-200 bg-green-50 p-4">
          <div class="text-2xl font-bold text-green-600">
            {{ deliveryPoints.filter(p => p.status === 'active').length }}
          </div>
          <div class="text-sm text-green-500">
            營業中門市
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
useHead({
  title: '物品清單 - 物流管理系統',
})

const { data: items } = await useFetch('/api/items')
const { data: merchants } = await useFetch('/api/merchants')

function getMerchantName(item: any) {
  if (item.customMerchant) {
    return item.customMerchant.name
  }

  const merchant = merchants.value?.find((m: any) => m.id === item.merchantId)
  return merchant?.name || '未知商家'
}

function getStatusText(status: string) {
  const statusMap = {
    pending: '待處理',
    in_transit: '運送中',
    delivered: '已送達',
  }
  return statusMap[status as keyof typeof statusMap] || status
}

function getStatusColor(status: string) {
  const colorMap = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_transit: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
  }
  return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'
}
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">
          物品清單
        </h1>
        <NuxtLink
          to="/items/new"
          class="
            rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm
            font-medium text-white
            hover:bg-blue-700
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            focus:outline-none
          "
        >
          新建物品
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
                物品資訊
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wider
                  text-gray-500 uppercase
                "
              >
                尺寸/重量
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wider
                  text-gray-500 uppercase
                "
              >
                商家
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wider
                  text-gray-500 uppercase
                "
              >
                寄送地址
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
                建立時間
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr
              v-for="item in items"
              :key="item.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ item.name }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ item.description }}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                <div>{{ item.dimensions.length }}×{{ item.dimensions.width }}×{{ item.dimensions.height }} cm</div>
                <div class="text-gray-500">
                  {{ item.weight }} kg
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ getMerchantName(item) }}
                </div>
                <div
                  v-if="item.customMerchant"
                  class="text-xs text-gray-500"
                >
                  {{ item.customMerchant.phone }}
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                <div class="mb-1">
                  <span class="font-medium">寄:</span> {{ item.senderAddress.substring(0, 20) }}...
                </div>
                <div>
                  <span class="font-medium">收:</span> {{ item.receiverAddress.substring(0, 20) }}...
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="getStatusColor(item.status)"
                  class="
                    inline-flex rounded-full px-2 py-1 text-xs font-semibold
                  "
                >
                  {{ getStatusText(item.status) }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                {{ new Date(item.createdAt).toLocaleDateString('zh-TW') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="!items || items.length === 0"
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
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4m-4 0H9m2 2v4m0 0h6m-6 0H9"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          沒有物品
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          開始建立您的第一個物品。
        </p>
        <div class="mt-6">
          <NuxtLink
            to="/items/new"
            class="
              inline-flex items-center rounded-md border border-transparent
              bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm
              hover:bg-blue-700
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
            "
          >
            新建物品
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

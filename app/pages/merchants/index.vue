<script lang="ts" setup>
useHead({
  title: '商家總覽 - 物流管理系統',
})

const { data: merchants, refresh } = await useFetch('/api/merchants')

function getTypeText(type: string) {
  const typeMap = {
    partner: '合作商家',
    temporary: '臨時商家',
  }
  return typeMap[type as keyof typeof typeMap] || type
}

function getTypeColor(type: string) {
  const colorMap = {
    partner: 'bg-blue-100 text-blue-800',
    temporary: 'bg-orange-100 text-orange-800',
  }
  return colorMap[type as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'
}

async function deleteMerchant(merchantId: string) {
  // eslint-disable-next-line no-alert
  if (!confirm('確定要刪除這個商家嗎？')) {
    return
  }

  try {
    await $fetch(`/api/merchants/${merchantId}`, {
      method: 'DELETE',
    })
    await refresh()
  }
  catch (error) {
    console.error('刪除商家失敗:', error)
  }
}
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">
          商家總覽
        </h1>
        <NuxtLink
          to="/merchants/new"
          class="
            rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm
            font-medium text-white
            hover:bg-blue-700
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            focus:outline-none
          "
        >
          新增商家
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="merchant in merchants"
          :key="merchant.id"
          class="
            rounded-lg border border-gray-200 bg-white p-6 transition-shadow
            hover:shadow-md
          "
        >
          <div class="mb-4 flex items-start justify-between">
            <div>
              <h3 class="text-lg font-medium text-gray-900">
                {{ merchant.name }}
              </h3>
              <p class="text-sm text-gray-500">
                {{ merchant.phone }}
              </p>
            </div>
            <span
              :class="getTypeColor(merchant.type)"
              class="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
            >
              {{ getTypeText(merchant.type) }}
            </span>
          </div>

          <div class="space-y-2">
            <div class="text-sm text-gray-700">
              <span class="font-medium">地址:</span> {{ merchant.address }}
            </div>
            <div class="text-sm text-gray-500">
              加入時間: {{ new Date(merchant.createdAt).toLocaleDateString('zh-TW') }}
            </div>
          </div>

          <div class="mt-4 flex justify-end space-x-2 border-t pt-4">
            <NuxtLink
              :to="`/merchants/${merchant.id}/edit`"
              class="text-sm text-blue-600 hover:text-blue-800"
            >
              編輯
            </NuxtLink>
            <button
              class="text-sm text-red-600 hover:text-red-800"
              @click="deleteMerchant(merchant.id)"
            >
              刪除
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="merchants.length === 0"
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
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          沒有商家
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          開始新增您的第一個商家。
        </p>
        <div class="mt-6">
          <NuxtLink
            to="/merchants/new"
            class="
              inline-flex items-center rounded-md border border-transparent
              bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm
              hover:bg-blue-700
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
            "
          >
            新增商家
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

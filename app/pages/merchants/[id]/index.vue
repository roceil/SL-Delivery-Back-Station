<script lang="ts" setup>
const route = useRoute()
const locationId = route.params.id as string

useHead({
  title: `合作地點詳細 - 行李運送系統`,
})

const { data: location, error } = await useFetch(`/api/merchants/${locationId}`)

if (error.value) {
  throw createError({
    statusCode: 404,
    message: '找不到此合作地點',
  })
}

function getTypeText(type: string) {
  const typeMap = {
    pier: '碼頭',
    dive_shop: '潛水店',
    hostel: '民宿',
    attraction: '景點',
  }
  return typeMap[type as keyof typeof typeMap] || type
}

function getTypeColor(type: string) {
  const colorMap = {
    pier: 'bg-blue-100 text-blue-800',
    dive_shop: 'bg-cyan-100 text-cyan-800',
    hostel: 'bg-purple-100 text-purple-800',
    attraction: 'bg-green-100 text-green-800',
  }
  return colorMap[type as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'
}

function getTypeIcon(type: string) {
  const iconMap = {
    pier: '🚢',
    dive_shop: '🤿',
    hostel: '🏠',
    attraction: '🏝️',
  }
  return iconMap[type as keyof typeof iconMap] || '📍'
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('zh-TW')
}

function getPartnershipDuration(startDate: string) {
  const start = new Date(startDate)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const months = Math.floor(diffDays / 30)
  const days = diffDays % 30

  if (months > 0)
    return `${months} 個月 ${days} 天`

  return `${days} 天`
}

function getStockStatus(stock: number) {
  if (stock >= 100)
    return { text: '充足', color: 'text-green-600' }
  if (stock >= 50)
    return { text: '正常', color: 'text-blue-600' }
  if (stock >= 20)
    return { text: '偏低', color: 'text-orange-600' }

  return { text: '不足', color: 'text-red-600' }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <NuxtLink
          to="/merchants"
          class="
            rounded-md border border-gray-300 bg-white px-4 py-2 text-sm
            font-medium text-gray-700 shadow-sm
            hover:bg-gray-50
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            focus:outline-none
          "
        >
          ← 返回列表
        </NuxtLink>
        <div class="flex items-center gap-3">
          <span class="text-3xl">{{ getTypeIcon(location?.type || '') }}</span>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ location?.name }}
          </h1>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <NuxtLink
          :to="`/merchants/${locationId}/edit`"
          class="
            rounded-md border border-gray-300 bg-white px-4 py-2 text-sm
            font-medium text-gray-700 shadow-sm
            hover:bg-gray-50
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            focus:outline-none
          "
        >
          ✏️ 編輯
        </NuxtLink>
        <span
          v-if="location"
          :class="getTypeColor(location.type)"
          class="inline-flex rounded-full px-4 py-2 text-sm font-semibold"
        >
          {{ getTypeText(location.type) }}
        </span>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Left Column - Main Info -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Basic Information -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            基本資訊
          </h2>
          <dl class="space-y-4">
            <div>
              <dt class="text-sm font-medium text-gray-500">
                地址
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ location?.address }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">
                聯絡電話
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                <a
                  :href="`tel:${location?.phone}`"
                  class="text-blue-600 hover:text-blue-800"
                >
                  {{ location?.phone }}
                </a>
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">
                營業時間
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ location?.openingHours }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Description -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            地點說明
          </h2>
          <p class="text-sm text-gray-700">
            {{ location?.description }}
          </p>
        </div>

        <!-- Features -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            提供服務
          </h2>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="feature in location?.features"
              :key="feature"
              class="
                inline-flex items-center rounded-full bg-blue-50 px-3 py-1
                text-sm font-medium text-blue-700
              "
            >
              ✓ {{ feature }}
            </span>
          </div>
        </div>
      </div>

      <!-- Right Column - Additional Info -->
      <div class="space-y-6">
        <!-- Important Notes -->
        <div class="rounded-lg bg-yellow-50 p-6 shadow">
          <h2 class="mb-4 flex items-center text-lg font-semibold text-gray-900">
            <span class="mr-2">⚠️</span>
            重要提醒
          </h2>
          <p class="text-sm text-gray-700">
            {{ location?.notes }}
          </p>
        </div>

        <!-- Quick Actions -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            快速操作
          </h2>
          <div class="space-y-3">
            <a
              :href="`tel:${location?.phone}`"
              class="
                block w-full rounded-md border border-gray-300 bg-white px-4
                py-2 text-center text-sm font-medium text-gray-700
                hover:bg-gray-50
                focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                focus:outline-none
              "
            >
              📞 撥打電話
            </a>
            <a
              :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location?.address || '')}`"
              target="_blank"
              rel="noopener noreferrer"
              class="
                block w-full rounded-md border border-gray-300 bg-white px-4
                py-2 text-center text-sm font-medium text-gray-700
                hover:bg-gray-50
                focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                focus:outline-none
              "
            >
              🗺️ 開啟地圖
            </a>
          </div>
        </div>

        <!-- Partnership Info -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            合作資訊
          </h2>
          <dl class="space-y-4">
            <div>
              <dt class="text-sm text-gray-500">
                合作開始日期
              </dt>
              <dd class="mt-1 text-sm font-medium text-gray-900">
                {{ formatDate(location?.partnerSince || '') }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">
                合作時長
              </dt>
              <dd class="mt-1 text-sm font-medium text-gray-900">
                {{ getPartnershipDuration(location?.partnerSince || '') }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">
                票卷庫存數量
              </dt>
              <dd
                class="mt-1 flex items-center justify-between"
              >
                <span class="text-lg font-bold text-gray-900">
                  {{ location?.voucherStock || 0 }}
                </span>
                <span
                  :class="getStockStatus(location?.voucherStock || 0).color"
                  class="text-sm font-medium"
                >
                  {{ getStockStatus(location?.voucherStock || 0).text }}
                </span>
              </dd>
              <div class="mt-2">
                <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    :style="{ width: `${Math.min((location?.voucherStock || 0) / 200 * 100, 100)}%` }"
                    :class="[
                      (location?.voucherStock || 0) >= 100
                        ? 'bg-green-500'
                        : (location?.voucherStock || 0) >= 50
                          ? 'bg-blue-500'
                          : (location?.voucherStock || 0) >= 20
                            ? 'bg-orange-500'
                            : 'bg-red-500',
                    ]"
                    class="h-full transition-all"
                  >
                  </div>
                </div>
              </div>
            </div>
          </dl>
        </div>

        <!-- Location Stats -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            地點統計
          </h2>
          <dl class="space-y-3">
            <div class="flex items-center justify-between">
              <dt class="text-sm text-gray-500">
                類型
              </dt>
              <dd class="text-sm font-medium text-gray-900">
                {{ getTypeText(location?.type || '') }}
              </dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-sm text-gray-500">
                商家區域
              </dt>
              <dd class="text-sm font-medium text-gray-900">
                區域 {{ location?.area }}
              </dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-sm text-gray-500">
                提供服務數
              </dt>
              <dd class="text-sm font-medium text-gray-900">
                {{ location?.features?.length || 0 }} 項
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface ColorScheme {
  border: string
  bg: string
  text: string
  label: string
}

interface TypeStat {
  type: string
  count: number
  colors: ColorScheme
}

interface DeliveryPoint {
  id: number
  name: string
  type: string
  typeId: number
  address: string
  area: string
  latitude: number | null
  longitude: number | null
  createdAt: string
}

useHead({
  title: '運送點管理 - 物流管理系統',
})

const { data: deliveryPoints, refresh } = await useFetch<DeliveryPoint[]>('/api/delivery-points')

// 動態統計各類型數量
const typeStats = computed<TypeStat[]>(() => {
  if (!deliveryPoints.value || deliveryPoints.value.length === 0) {
    return []
  }

  // 統計每個類型的數量
  const typeCounts = new Map<string, number>()

  for (const point of deliveryPoints.value) {
    const type = point.type || '未分類'
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1)
  }

  // 顏色配置（輪流使用）
  const colorSchemes: ColorScheme[] = [
    { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-600', label: 'text-blue-500' },
    { border: 'border-green-200', bg: 'bg-green-50', text: 'text-green-600', label: 'text-green-500' },
    { border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-600', label: 'text-purple-500' },
    { border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-600', label: 'text-orange-500' },
    { border: 'border-pink-200', bg: 'bg-pink-50', text: 'text-pink-600', label: 'text-pink-500' },
    { border: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-600', label: 'text-indigo-500' },
  ]

  // 將統計結果轉換為陣列並分配顏色
  return Array.from(typeCounts.entries())
    .map(([type, count], index): TypeStat => ({
      type,
      count,
      colors: colorSchemes[index % colorSchemes.length]!,
    }))
    .sort((a, b) => b.count - a.count) // 依數量排序
})

async function deleteDeliveryPoint(id: number | undefined) {
  if (!id)
    return

  // eslint-disable-next-line no-alert
  if (!confirm('確定要刪除這個運送點嗎？'))
    return

  try {
    await $fetch(`/api/delivery-points/${id}`, {
      method: 'DELETE',
    })
    await refresh()
  }
  catch (error) {
    console.error('刪除運送點失敗:', error)
    alert('刪除失敗,請稍後再試')
  }
}
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">
          運送點管理
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
          新增運送點
        </NuxtLink>
      </div>

      <!-- 統計資訊 -->
      <div
        v-if="deliveryPoints && deliveryPoints.length > 0"
        class="
          mt-6 grid grid-cols-1 gap-3 rounded-lg bg-gray-200 px-3 py-4
          sm:grid-cols-2
          lg:grid-cols-4
        "
      >
        <!-- 總數統計 -->
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <div class="text-2xl font-bold text-gray-900">
            {{ deliveryPoints.length }}
          </div>
          <div class="text-sm text-gray-500">
            總運送點數量
          </div>
        </div>

        <!-- 動態類型統計 -->
        <div
          v-for="stat in typeStats"
          :key="stat.type"
          class="rounded-lg border p-4"
          :class="[
            stat.colors.border,
            stat.colors.bg,
          ]"
        >
          <div
            class="text-2xl font-bold"
            :class="[stat.colors.text]"
          >
            {{ stat.count }}
          </div>
          <div
            class="text-sm"
            :class="[stat.colors.label]"
          >
            {{ stat.type }}運送點
          </div>
        </div>
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
          沒有運送點
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          開始新增第一個運送點。
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
            新增運送點
          </NuxtLink>
        </div>
      </div>

      <div
        v-else
        class="
          mt-6 overflow-hidden bg-white shadow ring-1 ring-black
          md:rounded-lg
        "
      >
        <table class="min-w-full divide-y divide-gray-300">
          <thead class="bg-gray-50">
            <tr>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wide
                  text-gray-500 uppercase
                "
              >
                運送點名稱
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wide
                  text-gray-500 uppercase
                "
              >
                類型
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wide
                  text-gray-500 uppercase
                "
              >
                地址
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wide
                  text-gray-500 uppercase
                "
              >
                區域
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wide
                  text-gray-500 uppercase
                "
              >
                座標
              </th>
              <th
                scope="col"
                class="relative px-6 py-3"
              >
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
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div
                    class="
                      flex h-8 w-8 flex-shrink-0 items-center justify-center
                      rounded-full bg-blue-100 text-sm font-medium text-blue-600
                    "
                  >
                    📍
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ point.name }}
                    </div>
                    <div class="text-sm text-gray-500">
                      ID: {{ point.id }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="
                    inline-flex rounded-full bg-gray-100 px-2 text-xs leading-5
                    font-semibold text-gray-800
                  "
                >
                  {{ point.type }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {{ point.address }}
              </td>
              <td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                <span
                  v-if="point.area"
                  class="
                    inline-flex rounded-full bg-purple-100 px-2 text-xs
                    leading-5 font-semibold text-purple-800
                  "
                >
                  {{ point.area }}
                </span>
                <span
                  v-else
                  class="text-gray-400"
                >
                  -
                </span>
              </td>
              <td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                <div
                  v-if="point.latitude && point.longitude"
                  class="text-xs"
                >
                  {{ point.latitude }}, {{ point.longitude }}
                </div>
                <div
                  v-else
                  class="text-gray-400"
                >
                  未設定
                </div>
              </td>
              <td
                class="
                  px-6 py-4 text-right text-sm font-medium whitespace-nowrap
                "
              >
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
    </div>
  </div>
</template>

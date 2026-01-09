<script lang="ts" setup>
interface ColorScheme {
  border: string
  bg: string
  text: string
  label: string
}

interface StatusStat {
  status: string
  explanation: string
  count: number
  colors: ColorScheme
}

interface Courier {
  id: number
  employeeNumber: string
  name: string
  phone: string
  statusId: number
  status: string
  statusExplanation: string
  isAvailable: boolean
  totalDeliveries: number
  hireDate: string
  createdAt: string
  updatedAt: string
}

useHead({
  title: '夥伴總覽 - 物流管理系統',
})

const { data: couriers, refresh } = await useFetch<Courier[]>('/api/couriers')

// 動態統計各狀態數量
const statusStats = computed<StatusStat[]>(() => {
  if (!couriers.value || couriers.value.length === 0) {
    return []
  }

  // 統計每個狀態的數量
  const statusCounts = new Map<string, { explanation: string, count: number }>()

  for (const courier of couriers.value) {
    const status = courier.status || '未設定'
    const explanation = courier.statusExplanation || ''
    const current = statusCounts.get(status) || { explanation, count: 0 }
    statusCounts.set(status, { explanation, count: current.count + 1 })
  }

  // 顏色配置
  const colorSchemes: ColorScheme[] = [
    { border: 'border-green-200', bg: 'bg-green-50', text: 'text-green-600', label: 'text-green-500' },
    { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-600', label: 'text-red-500' },
    { border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-600', label: 'text-purple-500' },
  ]

  return Array.from(statusCounts.entries())
    .map(([status, { explanation, count }], index): StatusStat => ({
      status,
      explanation,
      count,
      colors: colorSchemes[index % colorSchemes.length]!,
    }))
    .sort((a, b) => b.count - a.count)
})

// 計算總配送次數
const totalDeliveries = computed(() => {
  if (!couriers.value || couriers.value.length === 0)
    return 0
  return couriers.value.reduce((sum, courier) => sum + (courier.totalDeliveries || 0), 0)
})

// 取得狀態顏色
function getStatusColor(status: string | undefined) {
  if (!status)
    return 'bg-gray-100 text-gray-800'

  const colorMap: Record<string, string> = {
    hire: 'bg-green-100 text-green-800',
    fire: 'bg-red-100 text-red-800',
  }
  return colorMap[status] || 'bg-gray-100 text-gray-800'
}

// 格式化日期
function formatDate(dateString: string | null | undefined) {
  if (!dateString)
    return '-'
  return new Date(dateString).toLocaleDateString('zh-TW')
}

// 刪除夥伴
async function deleteCourier(id: number | undefined) {
  if (!id)
    return

  // eslint-disable-next-line no-alert
  if (!confirm('確定要刪除這位夥伴嗎？'))
    return

  try {
    await $fetch(`/api/couriers/${id}`, {
      method: 'DELETE',
    })
    await refresh()
  }
  catch (error) {
    console.error('刪除夥伴失敗:', error)
    alert('刪除失敗，請稍後再試')
  }
}
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">
          夥伴管理
        </h1>
        <NuxtLink
          to="/couriers/new"
          class="
            rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white
            hover:bg-blue-500
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            focus:outline-none
          "
        >
          新增夥伴
        </NuxtLink>
      </div>

      <!-- 統計資訊 -->
      <div
        v-if="couriers && couriers.length > 0"
        class="
          mt-6 grid grid-cols-1 gap-3 rounded-lg bg-gray-200 px-3 py-4
          sm:grid-cols-2
          lg:grid-cols-4
        "
      >
        <!-- 總數統計 -->
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <div class="text-2xl font-bold text-gray-900">
            {{ couriers.length }}
          </div>
          <div class="text-sm text-gray-500">
            總夥伴數量
          </div>
        </div>

        <!-- 動態狀態統計 -->
        <div
          v-for="stat in statusStats"
          :key="stat.status"
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
            {{ stat.explanation }}
          </div>
        </div>

        <!-- 總配送次數 -->
        <div class="rounded-lg border border-purple-200 bg-purple-50 p-4">
          <div class="text-2xl font-bold text-purple-600">
            {{ totalDeliveries }}
          </div>
          <div class="text-sm text-purple-500">
            總配送次數
          </div>
        </div>
      </div>

      <div
        v-if="!couriers || couriers.length === 0"
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          沒有夥伴
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          開始新增第一位夥伴。
        </p>
        <div class="mt-6">
          <NuxtLink
            to="/couriers/new"
            class="
              inline-flex items-center rounded-md border border-transparent
              bg-blue-600 px-4 py-2 text-sm font-medium text-white
              hover:bg-blue-700
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
            "
          >
            新增夥伴
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
                夥伴資訊
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wide
                  text-gray-500 uppercase
                "
              >
                員工編號
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wide
                  text-gray-500 uppercase
                "
              >
                聯絡方式
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wide
                  text-gray-500 uppercase
                "
              >
                狀態
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wide
                  text-gray-500 uppercase
                "
              >
                配送次數
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wide
                  text-gray-500 uppercase
                "
              >
                雇用日期
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
              v-for="courier in couriers"
              :key="courier.id"
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
                    👤
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ courier.name }}
                    </div>
                    <div class="text-sm text-gray-500">
                      ID: {{ courier.id }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  v-if="courier.employeeNumber"
                  class="
                    inline-flex rounded-full bg-gray-100 px-2 text-xs leading-5
                    font-semibold text-gray-800
                  "
                >
                  {{ courier.employeeNumber }}
                </span>
                <span
                  v-else
                  class="text-gray-400"
                >
                  未設定
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                <div v-if="courier.phone">
                  {{ courier.phone }}
                </div>
                <div
                  v-else
                  class="text-gray-400"
                >
                  未設定
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="getStatusColor(courier.status)"
                  class="
                    inline-flex rounded-full px-2 text-xs leading-5
                    font-semibold
                  "
                >
                  {{ courier.statusExplanation }}
                </span>
                <div
                  v-if="courier.isAvailable !== null"
                  class="mt-1 text-xs"
                  :class="courier.isAvailable ? 'text-green-600' : `
                    text-gray-400
                  `"
                >
                  {{ courier.isAvailable ? '✓ 可執行任務' : '✗ 無法執行' }}
                </div>
              </td>
              <td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                <div class="flex items-center">
                  <svg
                    class="mr-1 h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                  {{ courier.totalDeliveries || 0 }} 次
                </div>
              </td>
              <td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                {{ formatDate(courier.hireDate) }}
              </td>
              <td
                class="
                  px-6 py-4 text-right text-sm font-medium whitespace-nowrap
                "
              >
                <div class="flex space-x-2">
                  <NuxtLink
                    :to="`/couriers/${courier.id}/edit`"
                    class="text-blue-600 hover:text-blue-900"
                  >
                    編輯
                  </NuxtLink>
                  <button
                    class="text-red-600 hover:text-red-900"
                    @click="deleteCourier(courier.id)"
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

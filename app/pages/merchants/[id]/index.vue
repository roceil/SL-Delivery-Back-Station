<script lang="ts" setup>
interface Merchant {
  id: number
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  type: number
  typeName: string
  area: string
  isActive: boolean
  isCollaborate: boolean
  voucherId: string
  usedCounts: number
  maxUsageCounts: number
  remarks: string
  createdAt: string
  updatedAt: string
}

const route = useRoute()
const merchantId = route.params.id as string

useHead({
  title: `商家詳細 - 行李運送系統`,
})

const { data: merchant, error } = await useFetch<Merchant>(`/api/merchants/${merchantId}`)

if (error.value) {
  throw createError({
    statusCode: 404,
    message: '找不到此商家',
  })
}

function formatDate(dateString: string) {
  if (!dateString)
    return '-'
  return new Date(dateString).toLocaleDateString('zh-TW')
}

function getPartnershipDuration(startDate: string) {
  if (!startDate)
    return '-'

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

// 計算剩餘票券數量
const remainingVouchers = computed(() => {
  if (!merchant.value)
    return 0
  const max = merchant.value.maxUsageCounts || 0
  const used = merchant.value.usedCounts || 0
  return Math.max(0, max - used)
})

// 票券使用率
const usagePercentage = computed(() => {
  if (!merchant.value || !merchant.value.maxUsageCounts)
    return 0
  return Math.round((merchant.value.usedCounts / merchant.value.maxUsageCounts) * 100)
})

function getUsageStatus(used: number, max: number) {
  if (!max)
    return { text: '未設定', color: 'text-gray-600' }

  const remaining = max - used
  const percentage = (used / max) * 100

  if (percentage >= 90)
    return { text: '即將額滿', color: 'text-red-600' }
  if (percentage >= 70)
    return { text: '使用偏高', color: 'text-orange-600' }
  if (percentage >= 50)
    return { text: '使用正常', color: 'text-blue-600' }

  return { text: '使用充裕', color: 'text-green-600' }
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
          <span class="text-3xl">🏪</span>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ merchant?.name }}
          </h1>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <NuxtLink
          :to="`/merchants/${merchantId}/edit`"
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
          v-if="merchant?.typeName"
          class="
            inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold
            text-blue-800
          "
        >
          {{ merchant.typeName }}
        </span>
        <span
          v-if="merchant"
          :class="merchant.isActive ? 'bg-green-100 text-green-800' : `
            bg-gray-100 text-gray-800
          `"
          class="inline-flex rounded-full px-4 py-2 text-sm font-semibold"
        >
          {{ merchant.isActive ? '啟用中' : '已停用' }}
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
                商家名稱
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ merchant?.name || '-' }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">
                聯絡人
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ merchant?.contactPerson || '-' }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">
                聯絡電話
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                <a
                  v-if="merchant?.phone"
                  :href="`tel:${merchant.phone}`"
                  class="text-blue-600 hover:text-blue-800"
                >
                  {{ merchant.phone }}
                </a>
                <span v-else>-</span>
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">
                Email
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                <a
                  v-if="merchant?.email"
                  :href="`mailto:${merchant.email}`"
                  class="text-blue-600 hover:text-blue-800"
                >
                  {{ merchant.email }}
                </a>
                <span v-else>-</span>
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">
                地址
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ merchant?.address || '-' }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Voucher Information -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            票券資訊
          </h2>
          <dl class="space-y-4">
            <div>
              <dt class="text-sm font-medium text-gray-500">
                票券 ID
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ merchant?.voucherId || '-' }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">
                已使用次數
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ merchant?.usedCounts || 0 }} 次
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">
                最大使用次數
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ merchant?.maxUsageCounts || '-' }} 次
              </dd>
            </div>
            <div v-if="merchant?.maxUsageCounts">
              <dt class="text-sm font-medium text-gray-500">
                剩餘次數
              </dt>
              <dd class="mt-1 flex items-center justify-between">
                <span class="text-lg font-bold text-gray-900">
                  {{ remainingVouchers }} 次
                </span>
                <span
                  :class="getUsageStatus(merchant.usedCounts, merchant.maxUsageCounts).color"
                  class="text-sm font-medium"
                >
                  {{ getUsageStatus(merchant.usedCounts, merchant.maxUsageCounts).text }}
                </span>
              </dd>
              <div class="mt-2">
                <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    :style="{ width: `${usagePercentage}%` }"
                    :class="[
                      usagePercentage >= 90
                        ? 'bg-red-500'
                        : usagePercentage >= 70
                          ? 'bg-orange-500'
                          : usagePercentage >= 50
                            ? 'bg-blue-500'
                            : 'bg-green-500',
                    ]"
                    class="h-full transition-all"
                  ></div>
                </div>
                <p class="mt-1 text-xs text-gray-500">
                  已使用 {{ usagePercentage }}%
                </p>
              </div>
            </div>
          </dl>
        </div>

        <!-- Remarks -->
        <div
          v-if="merchant?.remarks"
          class="rounded-lg bg-white p-6 shadow"
        >
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            備註
          </h2>
          <p class="text-sm whitespace-pre-wrap text-gray-700">
            {{ merchant.remarks }}
          </p>
        </div>
      </div>

      <!-- Right Column - Additional Info -->
      <div class="space-y-6">
        <!-- Status Card -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            狀態資訊
          </h2>
          <dl class="space-y-3">
            <div class="flex items-center justify-between">
              <dt class="text-sm text-gray-500">
                啟用狀態
              </dt>
              <dd>
                <span
                  :class="
                    merchant?.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  "
                  class="
                    inline-flex rounded-full px-2.5 py-1 text-xs font-semibold
                  "
                >
                  {{ merchant?.isActive ? '啟用中' : '已停用' }}
                </span>
              </dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-sm text-gray-500">
                合作狀態
              </dt>
              <dd>
                <span
                  :class="
                    merchant?.isCollaborate
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  "
                  class="
                    inline-flex rounded-full px-2.5 py-1 text-xs font-semibold
                  "
                >
                  {{ merchant?.isCollaborate ? '合作中' : '未合作' }}
                </span>
              </dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-sm text-gray-500">
                商家類型
              </dt>
              <dd class="text-sm font-medium text-gray-900">
                {{ merchant?.typeName || '-' }}
              </dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-sm text-gray-500">
                商家區域
              </dt>
              <dd class="text-sm font-medium text-gray-900">
                區域 {{ merchant?.area || '-' }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Quick Actions -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            快速操作
          </h2>
          <div class="space-y-3">
            <a
              v-if="merchant?.phone"
              :href="`tel:${merchant.phone}`"
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
              v-if="merchant?.email"
              :href="`mailto:${merchant.email}`"
              class="
                block w-full rounded-md border border-gray-300 bg-white px-4
                py-2 text-center text-sm font-medium text-gray-700
                hover:bg-gray-50
                focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                focus:outline-none
              "
            >
              ✉️ 寄送郵件
            </a>
            <a
              v-if="merchant?.address"
              :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(merchant.address)}`"
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
            系統資訊
          </h2>
          <dl class="space-y-4">
            <div>
              <dt class="text-sm text-gray-500">
                建立日期
              </dt>
              <dd class="mt-1 text-sm font-medium text-gray-900">
                {{ formatDate(merchant?.createdAt || '') }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">
                合作時長
              </dt>
              <dd class="mt-1 text-sm font-medium text-gray-900">
                {{ getPartnershipDuration(merchant?.createdAt || '') }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">
                最後更新
              </dt>
              <dd class="mt-1 text-sm font-medium text-gray-900">
                {{ formatDate(merchant?.updatedAt || '') }}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
useHead({
  title: '商家管理 - 行李運送系統',
})

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
  voucherId: string | null
  usedCounts: number
  maxUsageCounts: number | null
  remarks: string
  createdAt: string
  updatedAt: string
}

const { data: merchants } = await useFetch<Merchant[]>('/api/merchants')

// 取得所有類型選項
const { data: types } = await useFetch('/api/stations/types')

const locationTypes = computed(() => {
  const allTypes = [{ value: 'all', label: '全部商家' }]
  if (types.value) {
    types.value.forEach((type: { id: number, name: string }) => {
      allTypes.push({ value: type.id.toString(), label: type.name })
    })
  }
  return allTypes
})

const selectedType = ref('all')

const filteredMerchants = computed(() => {
  if (!merchants.value)
    return []
  if (selectedType.value === 'all')
    return merchants.value
  return merchants.value.filter(merchant => merchant.type.toString() === selectedType.value)
})

function getTypeColor(typeId: number) {
  const colorMap: Record<number, string> = {
    1: 'bg-purple-100 text-purple-800',
    2: 'bg-yellow-100 text-yellow-800',
  }
  return colorMap[typeId] || 'bg-gray-100 text-gray-800'
}

function getTypeIcon(typeId: number) {
  const iconMap: Record<number, string> = {
    1: '🏠',
    2: '🛵',
  }
  return iconMap[typeId] || '📍'
}

const router = useRouter()

function goToMerchantDetail(merchantId: number) {
  router.push(`/merchants/${merchantId}`)
}
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            商家總覽
          </h1>
          <p class="mt-1 text-sm text-gray-500">
            小琉球行李運送合作商家總覽
          </p>
        </div>
        <NuxtLink
          to="/merchants/new"
          class="
            rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm
            font-medium text-white shadow-sm
            hover:bg-blue-700
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            focus:outline-none
          "
        >
          ➕ 新增商家
        </NuxtLink>
      </div>

      <!-- Filter Tabs -->
      <div class="mb-6 border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button
            v-for="type in locationTypes"
            :key="type.value"
            class="border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap"
            :class="[
              selectedType === type.value
                ? 'border-blue-500 text-blue-600'
                : `
                  border-transparent text-gray-500
                  hover:border-gray-300 hover:text-gray-700
                `,
            ]"
            @click="selectedType = type.value"
          >
            {{ type.label }}
            <span
              v-if="type.value === 'all'"
              class="
                ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium
                text-gray-600
              "
            >
              {{ merchants?.length || 0 }}
            </span>
            <span
              v-else
              class="
                ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium
                text-gray-600
              "
            >
              {{ merchants?.filter(m => m.type.toString() === type.value).length || 0 }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Merchant Cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="merchant in filteredMerchants"
          :key="merchant.id"
          class="
            cursor-pointer rounded-lg border border-gray-200 bg-white p-5
            transition-all
            hover:shadow-md
          "
          @click="goToMerchantDetail(merchant.id)"
        >
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 text-3xl">
              {{ getTypeIcon(merchant.type) }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="mb-2 flex items-start justify-between">
                <h3 class="text-base font-semibold text-gray-900">
                  {{ merchant.name }}
                </h3>
                <span
                  :class="getTypeColor(merchant.type)"
                  class="
                    ml-2 inline-flex flex-shrink-0 rounded-full px-2 py-0.5
                    text-xs font-medium
                  "
                >
                  {{ merchant.typeName }}
                </span>
              </div>
              <p class="text-sm text-gray-600">
                {{ merchant.address }}
              </p>
              <p
                v-if="merchant.phone"
                class="mt-1 text-sm text-gray-500"
              >
                📞 {{ merchant.phone }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="!filteredMerchants || filteredMerchants.length === 0"
        class="py-12 text-center"
      >
        <div class="text-6xl">
          🏪
        </div>
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          沒有符合的商家
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          請選擇其他類別查看合作商家
        </p>
      </div>
    </div>
  </div>
</template>

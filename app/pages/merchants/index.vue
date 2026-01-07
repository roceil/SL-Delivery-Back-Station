<script lang="ts" setup>
useHead({
  title: '合作地點 - 行李運送系統',
})

const { data: locations } = await useFetch('/api/merchants')

const locationTypes = [
  { value: 'all', label: '全部地點' },
  { value: 'pier', label: '碼頭' },
  { value: 'dive_shop', label: '潛水店' },
  { value: 'hostel', label: '民宿' },
  { value: 'attraction', label: '景點' },
]

const selectedType = ref('all')

const filteredLocations = computed(() => {
  if (!locations.value)
    return []
  if (selectedType.value === 'all')
    return locations.value
  return locations.value.filter(loc => loc.type === selectedType.value)
})

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

const router = useRouter()

function goToLocationDetail(locationId: string) {
  router.push(`/merchants/${locationId}`)
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
            小琉球行李運送合作地點總覽
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
          ➕ 新增地點
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
              {{ locations?.length || 0 }}
            </span>
            <span
              v-else
              class="
                ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium
                text-gray-600
              "
            >
              {{ locations?.filter(l => l.type === type.value).length || 0 }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Location Cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="location in filteredLocations"
          :key="location.id"
          class="
            cursor-pointer rounded-lg border border-gray-200 bg-white p-5
            transition-all
            hover:shadow-md
          "
          @click="goToLocationDetail(location.id)"
        >
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 text-3xl">
              {{ getTypeIcon(location.type) }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="mb-2 flex items-start justify-between">
                <h3 class="text-base font-semibold text-gray-900">
                  {{ location.name }}
                </h3>
                <span
                  :class="getTypeColor(location.type)"
                  class="
                    ml-2 inline-flex flex-shrink-0 rounded-full px-2 py-0.5
                    text-xs font-medium
                  "
                >
                  {{ getTypeText(location.type) }}
                </span>
              </div>
              <p class="text-sm text-gray-600">
                {{ location.address }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="!filteredLocations || filteredLocations.length === 0"
        class="py-12 text-center"
      >
        <div class="text-6xl">
          📍
        </div>
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          沒有符合的地點
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          請選擇其他類別查看合作地點
        </p>
      </div>
    </div>
  </div>
</template>

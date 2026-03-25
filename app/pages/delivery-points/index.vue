<script lang="ts" setup>
import { MapPin } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

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

// 搜尋與篩選
const filters = reactive({
  keyword: '',
  zone: '',
})

const activeTab = ref('all')

// 從資料動態取得所有類型（用於 Tab）
const typeList = computed(() => {
  if (!deliveryPoints.value)
    return []
  const types = [...new Set(deliveryPoints.value.map(p => p.type).filter(Boolean))]
  return types
})

// 從資料動態取得所有區域（用於篩選 Select）
const zoneList = computed(() => {
  if (!deliveryPoints.value)
    return []
  const zones = [...new Set(deliveryPoints.value.map(p => p.area).filter(Boolean))].sort()
  return zones
})

const filteredPoints = computed(() => {
  if (!deliveryPoints.value)
    return []
  return deliveryPoints.value.filter((p) => {
    if (activeTab.value !== 'all' && p.type !== activeTab.value)
      return false
    if (filters.zone && p.area !== filters.zone)
      return false
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      const matchName = p.name?.toLowerCase().includes(kw)
      const matchAddress = p.address?.toLowerCase().includes(kw)
      if (!matchName && !matchAddress)
        return false
    }
    return true
  })
})

// 分頁
const pageSize = 10
const currentPage = ref(1)

watch([filteredPoints], () => {
  currentPage.value = 1
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredPoints.value.length / pageSize)))

const pagedPoints = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredPoints.value.slice(start, start + pageSize)
})

function setTab(tab: string) {
  activeTab.value = tab
  currentPage.value = 1
}

// 各 Tab 的計數（只受 keyword/zone 篩選影響，不受 tab 自身影響）
function countByType(type: string) {
  if (!deliveryPoints.value)
    return 0
  return deliveryPoints.value.filter((p) => {
    if (p.type !== type)
      return false
    if (filters.zone && p.area !== filters.zone)
      return false
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      return p.name?.toLowerCase().includes(kw) || p.address?.toLowerCase().includes(kw)
    }
    return true
  }).length
}

function countAll() {
  if (!deliveryPoints.value)
    return 0
  return deliveryPoints.value.filter((p) => {
    if (filters.zone && p.area !== filters.zone)
      return false
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      return p.name?.toLowerCase().includes(kw) || p.address?.toLowerCase().includes(kw)
    }
    return true
  }).length
}

// 類型 Badge 對應
interface BadgeInfo { type: 'gray' | 'blue' | 'green' | 'orange', label: string }

const typeBadgeMap: Record<string, BadgeInfo> = {
  民宿: { type: 'green', label: '民宿' },
  潛水店: { type: 'blue', label: '潛水店' },
  餐廳: { type: 'orange', label: '餐廳' },
  碼頭: { type: 'gray', label: '碼頭' },
}

function getTypeBadge(type: string): BadgeInfo {
  return typeBadgeMap[type] ?? { type: 'gray', label: type || '-' }
}

async function deleteDeliveryPoint(id: number) {
  // eslint-disable-next-line no-alert
  if (!confirm('確定要刪除這個運送點嗎？'))
    return
  try {
    await $fetch(`/api/delivery-points/${id}`, { method: 'DELETE' })
    await refresh()
  }
  catch (error) {
    console.error('刪除運送點失敗:', error)
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 p-8">
    <!-- 標題列 -->
    <div class="flex items-center justify-between">
      <h4 class="text-2xl font-bold tracking-[1.2px] text-neutral-900">
        運送點管理
      </h4>
      <div class="flex items-center gap-4">
        <!-- 關鍵字搜尋 -->
        <div class="relative">
          <svg
            class="
              absolute top-1/2 left-3 size-5 -translate-y-1/2 text-neutral-400
            "
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            v-model="filters.keyword"
            type="text"
            placeholder="輸入運送點名稱、地址"
            class="
              w-[280px] rounded-xs border border-neutral-200 bg-white py-2 pr-3
              pl-10 text-base tracking-[0.8px] text-neutral-900 outline-none
              placeholder:text-neutral-400
              focus:border-neutral-400
            "
          >
        </div>

        <!-- 區域篩選 -->
        <Select v-model="filters.zone">
          <SelectTrigger class="w-[160px] bg-white text-base">
            <SelectValue placeholder="請選擇區域類型" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem
                v-for="zone in zoneList"
                :key="zone"
                :value="zone"
              >
                區域 {{ zone }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <!-- 新增運送點 -->
        <NuxtLink
          to="/delivery-points/new"
          class="
            hover:bg-primary-50
            flex items-center gap-2 rounded-sm border border-primary-400 px-4
            py-2 text-base font-medium tracking-[0.8px] text-primary-400
            transition-colors
          "
        >
          <span class="text-lg leading-none">+</span>
          新增運送點
        </NuxtLink>
      </div>
    </div>

    <!-- Tab + 表格 -->
    <div class="flex flex-col items-start">
      <!-- Tabs -->
      <div class="flex items-center">
        <!-- 所有運送點 -->
        <button
          type="button"
          class="
            flex items-center gap-1 rounded-tl-sm rounded-tr-sm px-6 py-2
            text-base font-medium tracking-[0.8px] transition-colors
          "
          :class="
            activeTab === 'all'
              ? `
                border border-b-0 border-primary-200 bg-neutral-100
                text-neutral-900
              `
              : 'text-neutral-600 hover:text-neutral-900'
          "
          @click="setTab('all')"
        >
          所有運送點
          <span
            class="
              rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-medium
              tracking-[0.55px] text-neutral-600
            "
          >{{ countAll() }}</span>
        </button>

        <!-- 各類型 Tab -->
        <button
          v-for="type in typeList"
          :key="type"
          type="button"
          class="
            flex items-center gap-1 rounded-tl-sm rounded-tr-sm px-6 py-2
            text-base font-medium tracking-[0.8px] transition-colors
          "
          :class="
            activeTab === type
              ? `
                border border-b-0 border-primary-200 bg-neutral-100
                text-neutral-900
              `
              : 'text-neutral-600 hover:text-neutral-900'
          "
          @click="setTab(type)"
        >
          {{ type }}
          <span
            class="
              rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-medium
              tracking-[0.55px] text-neutral-600
            "
          >{{ countByType(type) }}</span>
        </button>
      </div>

      <!-- 表格容器 -->
      <div
        class="
          w-full overflow-hidden rounded-tr-md rounded-br-md rounded-bl-md
          bg-neutral-100 p-6
        "
      >
        <!-- 有資料 -->
        <template v-if="pagedPoints.length > 0">
          <div
            class="
              rounded-sm bg-white shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <!-- 表頭 -->
            <div
              class="
                grid grid-cols-[2fr_1fr_3fr_80px_2fr_120px] border-b
                border-neutral-200 px-4 py-3
              "
            >
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >運送點名稱</span>
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >類型</span>
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >地址</span>
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >區域</span>
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >座標</span>
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >操作</span>
            </div>

            <!-- 資料列 -->
            <div class="divide-y divide-neutral-200">
              <div
                v-for="point in pagedPoints"
                :key="point.id"
                class="
                  grid min-h-[60px] grid-cols-[2fr_1fr_3fr_80px_2fr_120px]
                  items-center px-4 py-3
                "
              >
                <!-- 名稱 + ID -->
                <div class="flex flex-col gap-0.5">
                  <span
                    class="
                      text-sm font-medium tracking-[0.7px] text-neutral-900
                    "
                  >{{ point.name || '-' }}</span>
                  <span class="text-xs tracking-[0.6px] text-neutral-600">ID: {{ point.id }}</span>
                </div>

                <!-- 類型 -->
                <div>
                  <Badge
                    :type="getTypeBadge(point.type).type"
                    :label="getTypeBadge(point.type).label"
                    size="lg"
                  />
                </div>

                <!-- 地址 -->
                <span class="text-sm tracking-[0.7px] text-neutral-900">
                  {{ point.address || '-' }}
                </span>

                <!-- 區域 -->
                <span class="text-sm tracking-[0.7px] text-neutral-900">
                  {{ point.area || '-' }}
                </span>

                <!-- 座標 -->
                <span
                  v-if="point.latitude && point.longitude"
                  class="text-sm tracking-[0.7px] text-neutral-900"
                >
                  {{ point.latitude }}, {{ point.longitude }}
                </span>
                <span
                  v-else
                  class="text-sm text-neutral-400"
                >-</span>

                <!-- 操作 -->
                <div class="flex items-center gap-4">
                  <NuxtLink
                    :to="`/delivery-points/${point.id}/edit`"
                    class="
                      text-base font-medium tracking-[0.8px] text-primary-400
                      hover:text-primary-500
                    "
                  >
                    編輯
                  </NuxtLink>
                  <button
                    type="button"
                    class="
                      text-base font-medium tracking-[0.8px] text-danger-300
                      hover:text-danger-400
                    "
                    @click="deleteDeliveryPoint(point.id)"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 分頁 -->
          <div
            v-if="totalPages > 1"
            class="mt-3 flex items-center justify-center gap-1 py-3"
          >
            <!-- 上一頁 -->
            <button
              type="button"
              class="
                flex items-center justify-center rounded-full p-2
                hover:bg-neutral-200
                disabled:cursor-not-allowed disabled:opacity-40
              "
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              <svg
                class="size-6 text-neutral-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 18l-6-6 6-6"
                />
              </svg>
            </button>

            <!-- 頁碼 -->
            <button
              v-for="page in totalPages"
              :key="page"
              type="button"
              class="
                flex size-10 items-center justify-center rounded-sm text-base
                font-bold tracking-[0.8px] transition-colors
              "
              :class="
                page === currentPage
                  ? 'text-primary-400'
                  : 'text-neutral-400 hover:text-neutral-600'
              "
              @click="currentPage = page"
            >
              {{ page }}
            </button>

            <!-- 下一頁 -->
            <button
              type="button"
              class="
                flex items-center justify-center rounded-full p-2
                hover:bg-neutral-200
                disabled:cursor-not-allowed disabled:opacity-40
              "
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              <svg
                class="size-6 text-neutral-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 18l6-6-6-6"
                />
              </svg>
            </button>
          </div>
        </template>

        <!-- 無資料 -->
        <template v-else>
          <div
            class="flex flex-col items-center gap-3 rounded-sm bg-white p-12"
          >
            <MapPin class="size-10 text-neutral-400" />
            <div class="flex flex-col items-center gap-1">
              <span class="text-base font-bold tracking-wider text-neutral-900">查無運送點</span>
              <span class="text-xs tracking-wide text-neutral-600">請嘗試調整搜尋條件</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

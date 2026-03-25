<script lang="ts" setup>
import { MapPin, Phone, Store } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

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

useHead({
  title: '商家管理 - 物流管理系統',
})

const router = useRouter()

const { data: merchants } = await useFetch<Merchant[]>('/api/merchants')

// 搜尋與篩選
const filters = reactive({
  keyword: '',
  zone: '',
})

const activeTab = ref('all')

// 從資料動態取得所有類型（用於 Tab）
const typeList = computed(() => {
  if (!merchants.value)
    return []
  const types = [...new Set(merchants.value.map(m => m.typeName).filter(Boolean))]
  return types
})

// 從資料動態取得所有區域（用於篩選 Select）
const zoneList = computed(() => {
  if (!merchants.value)
    return []
  const zones = [...new Set(merchants.value.map(m => m.area).filter(Boolean))].sort()
  return zones
})

const filteredMerchants = computed(() => {
  if (!merchants.value)
    return []
  return merchants.value.filter((m) => {
    if (activeTab.value !== 'all' && m.typeName !== activeTab.value)
      return false
    if (filters.zone && m.area !== filters.zone)
      return false
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      const matchName = m.name?.toLowerCase().includes(kw)
      const matchAddress = m.address?.toLowerCase().includes(kw)
      if (!matchName && !matchAddress)
        return false
    }
    return true
  })
})

// 分頁
const pageSize = 12
const currentPage = ref(1)

watch([filteredMerchants], () => {
  currentPage.value = 1
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredMerchants.value.length / pageSize)))

const pagedMerchants = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredMerchants.value.slice(start, start + pageSize)
})

function setTab(tab: string) {
  activeTab.value = tab
  currentPage.value = 1
}

// 各 Tab 的計數（只受 keyword/zone 篩選影響，不受 tab 自身影響）
function countByType(type: string) {
  if (!merchants.value)
    return 0
  return merchants.value.filter((m) => {
    if (m.typeName !== type)
      return false
    if (filters.zone && m.area !== filters.zone)
      return false
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      return m.name?.toLowerCase().includes(kw) || m.address?.toLowerCase().includes(kw)
    }
    return true
  }).length
}

function countAll() {
  if (!merchants.value)
    return 0
  return merchants.value.filter((m) => {
    if (filters.zone && m.area !== filters.zone)
      return false
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      return m.name?.toLowerCase().includes(kw) || m.address?.toLowerCase().includes(kw)
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

function getTypeBadge(typeName: string): BadgeInfo {
  return typeBadgeMap[typeName] ?? { type: 'gray', label: typeName || '-' }
}

function goToMerchantDetail(id: number) {
  router.push(`/merchants/${id}`)
}
</script>

<template>
  <div class="flex flex-col gap-4 p-8">
    <!-- 標題列 -->
    <div class="flex items-center justify-between">
      <h4 class="text-2xl font-bold tracking-[1.2px] text-neutral-900">
        商家管理
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
            placeholder="輸入商家名稱、地址"
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

        <!-- 新增商家 -->
        <NuxtLink
          to="/merchants/new"
          class="
            hover:bg-primary-50
            flex items-center gap-2 rounded-sm border border-primary-400 px-4
            py-2 text-base font-medium tracking-[0.8px] text-primary-400
            transition-colors
          "
        >
          <span class="text-lg leading-none">+</span>
          新增商家
        </NuxtLink>
      </div>
    </div>

    <!-- Tab + 卡片區 -->
    <div class="flex flex-col items-start">
      <!-- Tabs -->
      <div class="flex items-center">
        <!-- 全部商家 -->
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
          全部商家
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

      <!-- 卡片容器 -->
      <div
        class="
          w-full rounded-tr-md rounded-br-md rounded-bl-md bg-neutral-100 p-6
        "
      >
        <!-- 有資料 -->
        <template v-if="pagedMerchants.length > 0">
          <div class="grid grid-cols-3 gap-4">
            <div
              v-for="merchant in pagedMerchants"
              :key="merchant.id"
              class="
                flex cursor-pointer flex-col gap-3 rounded-sm bg-white p-4
                shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)] transition-shadow
                hover:shadow-[0px_4px_16px_0px_rgba(32,78,184,0.1)]
              "
              @click="goToMerchantDetail(merchant.id)"
            >
              <!-- 名稱 + 類型 badge -->
              <div class="flex items-center justify-between gap-2">
                <span
                  class="
                    truncate text-lg font-bold tracking-[0.9px] text-neutral-900
                  "
                >{{ merchant.name }}</span>
                <Badge
                  :type="getTypeBadge(merchant.typeName).type"
                  :label="getTypeBadge(merchant.typeName).label"
                  size="sm"
                  class="shrink-0"
                />
              </div>

              <!-- 地址 -->
              <div
                v-if="merchant.address"
                class="flex items-start gap-1.5"
              >
                <MapPin class="mt-0.5 size-4 shrink-0 text-neutral-400" />
                <span class="text-sm tracking-[0.7px] text-neutral-600">{{ merchant.address }}</span>
              </div>

              <!-- 電話 -->
              <div
                v-if="merchant.phone"
                class="flex items-center gap-1.5"
              >
                <Phone class="size-4 shrink-0 text-neutral-400" />
                <span class="text-sm tracking-[0.7px] text-neutral-600">{{ merchant.phone }}</span>
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
            <Store class="size-10 text-neutral-400" />
            <div class="flex flex-col items-center gap-1">
              <span class="text-base font-bold tracking-wider text-neutral-900">查無商家</span>
              <span class="text-xs tracking-wide text-neutral-600">請嘗試調整搜尋條件</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

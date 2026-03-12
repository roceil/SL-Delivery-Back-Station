<script lang="ts" setup>
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

useHead({
  title: '儀表板 - 你行李來',
})

const activeTab = ref<'today' | 'week' | 'month'>('today')

const { data: statsData } = await useFetch('/api/dashboard/stats')

const tabs = [
  { key: 'today' as const, label: '今日概覽' },
  { key: 'week' as const, label: '本週統計' },
  { key: 'month' as const, label: '本月報告' },
]

const todayCards = computed(() => {
  const total = statsData.value?.totalOrders || 0
  const delivered = statsData.value?.deliveredOrders || 0

  return [
    { label: '總訂單數', value: total || 47, change: '+4.75%' },
    { label: '待交付訂單', value: 5, change: null },
    { label: '運送中訂單', value: total - delivered || 12, change: null },
    { label: '已完成訂單', value: delivered || 30, change: null },
    { label: '值班夥伴', value: 3, change: null },
  ]
})

const overviewCards = computed(() => {
  const total = statsData.value?.totalOrders || 0
  const delivered = statsData.value?.deliveredOrders || 0
  const completionRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : '94.5'

  return [
    { label: '總訂單數', value: total || 180, change: '+57', changeType: 'positive' as const },
    { label: '訂單成長率', value: '+15.6%', change: '123 筆 → 180 筆', changeType: 'neutral' as const },
    { label: '總營收 (NTD)', value: '600,000', change: '+4.75%', changeType: 'positive' as const },
    { label: '訂單完成率', value: `${completionRate}%`, change: '-1.5%', changeType: 'negative' as const },
  ]
})

const weeklyBars = [
  { label: '第一週', heightPercent: 100 },
  { label: '第二週', heightPercent: 49 },
  { label: '第三週', heightPercent: 95, isHighlight: true },
  { label: '第四週', heightPercent: 50 },
]

const revenueSources = [
  { label: '散客', percent: 60, amount: 'NT$ 360,000', color: '#92beff' },
  { label: '代售', percent: 20, amount: 'NT$ 120,000', color: '#a8e0ff' },
  { label: 'Klook', percent: 10, amount: 'NT$ 60,000', color: '#ffd67d' },
  { label: 'Trip', percent: 6, amount: 'NT$ 36,000', color: '#ffae74' },
  { label: 'KKday', percent: 4, amount: 'NT$ 24,000', color: '#8fdcc0' },
]

const topDestinations = [
  { rank: 1, name: '小本愛玉', count: 38, percent: 80 },
  { rank: 2, name: '嶼景6.8', count: 30, percent: 69 },
  { rank: 3, name: '小琉球樂嶼海景民宿', count: 24, percent: 49 },
  { rank: 4, name: '小琉球寮寓', count: 16, percent: 32 },
  { rank: 5, name: '居琉潛水', count: 12, percent: 23 },
]

const workloadStats = [
  { label: '總行程數', value: '45' },
  { label: '行李總件數', value: '146' },
  { label: '平均件數/趟', value: '3.7' },
]

const topCouriers = [
  { rank: 1, name: '陳大明', trips: 18, luggage: 72, percent: 80 },
  { rank: 2, name: '李志遠', trips: 14, luggage: 42, percent: 69 },
  { rank: 3, name: '王阿福', trips: 13, luggage: 32, percent: 49 },
]

const ongoingTrips = [
  { date: '2026/1/19', courier: '長樂公主', orders: 2, from: '碼頭門市', to: '小琉球樂嶼海景民宿', luggage: 4, area: 'A、B', status: 'in-transit' },
  { date: '2026/1/19', courier: '長樂公主', orders: 2, from: '碼頭門市', to: '小琉球樂嶼海景民宿', luggage: 4, area: 'A、B', status: 'in-transit' },
  { date: '2026/1/19', courier: '朱姓碼農', orders: 2, from: '碼頭門市', to: '小琉球樂嶼海景民宿', luggage: 4, area: 'A、B', status: 'pending' },
  { date: '2026/1/19', courier: '長樂公主', orders: 2, from: '碼頭門市', to: '小本愛玉', luggage: 4, area: 'A、B', status: 'in-transit' },
  { date: '2026/1/19', courier: '朱姓碼農', orders: 2, from: '小琉球樂嶼海景民宿', to: '碼頭門市', luggage: 4, area: 'A、B', status: 'in-transit' },
  { date: '2026/1/19', courier: '長樂公主', orders: 2, from: '小琉球樂嶼海景民宿', to: '碼頭門市', luggage: 4, area: 'A、B', status: 'in-transit' },
]

const statusConfig: Record<string, { label: string, bg: string, text: string }> = {
  'in-transit': { label: '運送中', bg: 'bg-[#eaf5ff]', text: 'text-[#3087db]' },
  'pending': { label: '待運送', bg: 'bg-[#fef0f0]', text: 'text-[#d74f4f]' },
}
</script>

<template>
  <Tabs
    v-model="activeTab"
    class="flex flex-col gap-6"
  >
    <!-- Tab + Overview 區塊 -->
    <div class="flex flex-col">
      <!-- Tab 列 -->
      <TabsList
        class="
          !flex !h-auto !items-end !justify-start !rounded-none !bg-transparent
          !p-0
        "
      >
        <TabsTrigger
          v-for="tab in tabs"
          :key="tab.key"
          :value="tab.key"
          variant="gradient-border"
        >
          {{ tab.label }}
        </TabsTrigger>
      </TabsList>

      <!-- Content box：左上角不圓（active tab 在那裡） -->
      <div
        class="rounded-tr-md rounded-br-md rounded-bl-md bg-neutral-100 p-6"
      >
        <!-- 今日概覽 cards -->
        <div
          v-if="activeTab === 'today'"
          class="flex gap-3"
        >
          <div
            v-for="card in todayCards"
            :key="card.label"
            class="
              flex flex-1 flex-col gap-2 rounded-sm border border-[#8cbcf1]
              bg-neutral-0 p-4 shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <!-- Header：label + icon -->
            <div class="flex w-full items-center gap-3">
              <p
                class="
                  flex-1 text-sm font-medium tracking-wider text-neutral-600
                "
              >
                {{ card.label }}
              </p>
              <Icon
                v-if="card.label === '總訂單數'"
                name="carbon:trending-up"
                class="size-5 shrink-0 text-neutral-500"
              />
            </div>
            <!-- Value -->
            <div class="flex w-full items-end gap-3">
              <div class="flex flex-1 items-baseline gap-2">
                <p
                  class="
                    text-[28px] leading-[1.2] font-bold tracking-wider
                    text-neutral-900
                  "
                >
                  {{ card.value }}
                </p>
                <p
                  v-if="card.change"
                  class="text-xs text-success-300"
                >
                  {{ card.change }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 本週統計 / 本月報告 cards -->
        <div
          v-else
          class="grid grid-cols-4 gap-3"
        >
          <div
            v-for="card in overviewCards"
            :key="card.label"
            class="
              flex flex-col gap-2 rounded-sm border border-[#8cbcf1]
              bg-neutral-0 p-4 shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <p class="text-sm font-medium tracking-wider text-neutral-600">
              {{ card.label }}
            </p>
            <div class="flex items-baseline gap-2">
              <p
                class="
                  text-[28px] leading-[1.2] font-bold tracking-wider
                  text-neutral-900
                "
              >
                {{ card.value }}
              </p>
              <p
                class="text-xs"
                :class="{
                  'text-success-300': card.changeType === 'positive',
                  'text-danger-300': card.changeType === 'negative',
                  'text-neutral-600': card.changeType === 'neutral',
                }"
              >
                {{ card.change }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 進行中行程（今日概覽） -->
    <div
      v-if="activeTab === 'today'"
      class="flex flex-col gap-4 rounded-2xl bg-neutral-100 p-6"
    >
      <!-- Header -->
      <div class="flex items-baseline gap-3">
        <p class="text-h6 shrink-0 font-bold tracking-wider text-neutral-900">
          進行中行程
        </p>
        <div
          class="
            flex flex-1 items-center gap-2 text-xs tracking-wide
            text-neutral-600
          "
        >
          <span>2026/1/19</span>
          <span>·</span>
          <span>8 趟行程</span>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            class="text-neutral-600 hover:text-neutral-900"
          >
            清除篩選條件
          </Button>
          <Button
            as-child
            variant="outline-primary"
            size="sm"
            class="bg-transparent hover:bg-primary-300 hover:text-white"
          >
            <NuxtLink to="/trips">
              查看所有行程
            </NuxtLink>
          </Button>
        </div>
      </div>

      <!-- Filter row -->
      <div class="flex items-center gap-3">
        <!-- Search -->
        <div
          class="
            flex w-[220px] items-center gap-2 rounded-xs border
            border-neutral-200 bg-neutral-0 px-3 py-2
          "
        >
          <Icon
            name="carbon:search"
            class="size-4 shrink-0 text-neutral-500"
          />
          <input
            type="text"
            placeholder="目的地、行程或訂單編號"
            class="
              flex-1 bg-transparent text-sm tracking-wider text-neutral-900
              outline-none
              placeholder:text-neutral-500
            "
          >
        </div>
        <!-- 區域類型 -->
        <Select>
          <SelectTrigger class="flex-1">
            <SelectValue placeholder="請選擇區域類型" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="airport">
                機場
              </SelectItem>
              <SelectItem value="hotel">
                飯店
              </SelectItem>
              <SelectItem value="other">
                其他
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <!-- 快遞員 -->
        <Select>
          <SelectTrigger class="flex-1">
            <SelectValue placeholder="請選擇快遞員" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">
                全部
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <!-- 運送日期 -->
        <input
          type="date"
          class="
            flex-1 cursor-pointer rounded-xs border border-neutral-200
            bg-neutral-0 px-3 py-2 text-sm tracking-wider text-neutral-500
            outline-none
          "
        >
        <!-- 運送狀態 -->
        <Select>
          <SelectTrigger class="flex-1">
            <SelectValue placeholder="請選擇運送狀態" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="pending">
                待處理
              </SelectItem>
              <SelectItem value="in-transit">
                運送中
              </SelectItem>
              <SelectItem value="delivered">
                已完成
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <!-- Table -->
      <div
        class="
          overflow-hidden rounded-xl bg-white
          shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
        "
      >
        <!-- Header row -->
        <div
          class="grid border-b border-neutral-200"
          style="grid-template-columns: 52px 1fr 1fr 1fr 255px 1fr 1fr 1fr 1fr 56px"
        >
          <div class="flex items-center py-3 pl-4">
            <input
              type="checkbox"
              class="size-4 cursor-pointer accent-primary-300"
            >
          </div>
          <div
            v-for="col in ['運送日期', '快遞員', '訂單資訊', '路線', '行李數量', '區域', '運送狀態', '操作']"
            :key="col"
            class="
              px-4 py-3 text-sm font-medium tracking-wider text-neutral-600
            "
          >
            {{ col }}
          </div>
          <div class="px-4 py-3"></div>
        </div>

        <!-- Body rows -->
        <ul>
          <li
            v-for="(trip, i) in ongoingTrips"
            :key="i"
            class="
              group border-b border-neutral-200 transition-colors
              last:border-b-0
              hover:bg-neutral-50
            "
          >
            <NuxtLink
              :to="`/trips/track/${i}`"
              class="grid"
              style="grid-template-columns: 52px 1fr 1fr 1fr 255px 1fr 1fr 1fr 1fr 56px"
            >
              <!-- Checkbox -->
              <div class="flex h-[60px] items-center pl-4">
                <input
                  type="checkbox"
                  class="size-4 cursor-pointer accent-primary-300"
                  @click.prevent
                >
              </div>
              <!-- 運送日期 -->
              <div
                class="
                  flex h-[60px] items-center px-4 text-sm tracking-wider
                  text-neutral-900
                "
              >
                {{ trip.date }}
              </div>
              <!-- 快遞員 -->
              <div
                class="
                  flex h-[60px] items-center px-4 text-sm tracking-wider
                  text-neutral-900
                "
              >
                {{ trip.courier }}
              </div>
              <!-- 訂單資訊 -->
              <div
                class="
                  flex h-[60px] items-center px-4 text-sm tracking-wider
                  text-neutral-900
                "
              >
                {{ trip.orders }} 筆訂單
              </div>
              <!-- 路線 -->
              <div
                class="
                  flex h-[60px] items-center gap-2 px-2 text-sm tracking-wider
                  text-neutral-900
                "
              >
                <HoverCard
                  :open-delay="100"
                >
                  <HoverCardTrigger class="truncate">
                    {{ trip.from }}
                  </HoverCardTrigger>
                  <HoverCardContent
                    class="
                      w-auto rounded-full border-none bg-primary-200 px-3 py-1
                      text-sm font-medium tracking-wide text-info-300
                    "
                  >
                    {{ trip.from }}
                  </HoverCardContent>
                </HoverCard>

                <Icon
                  name="carbon:arrow-right"
                  class="size-4 shrink-0 text-neutral-600"
                />

                <HoverCard :open-delay="100">
                  <HoverCardTrigger class="truncate">
                    {{ trip.to }}
                  </HoverCardTrigger>
                  <HoverCardContent
                    class="
                      w-auto rounded-full border-none bg-primary-200 px-3 py-1
                      text-sm font-medium tracking-wide text-info-300
                    "
                  >
                    {{ trip.to }}
                  </HoverCardContent>
                </HoverCard>
              </div>
              <!-- 行李數量 -->
              <div
                class="
                  flex h-[60px] items-center px-4 text-sm tracking-wider
                  text-neutral-900
                "
              >
                {{ trip.luggage }} 件
              </div>
              <!-- 區域 -->
              <div
                class="
                  flex h-[60px] items-center px-4 text-sm tracking-wider
                  text-neutral-900
                "
              >
                {{ trip.area }}
              </div>
              <!-- 運送狀態 -->
              <div class="flex h-[60px] items-center px-4">
                <span
                  class="
                    inline-flex items-center rounded-full px-3 py-1 text-xs
                    font-medium tracking-wide
                  "
                  :class="trip.status === 'in-transit'
                    ? 'bg-info-100 text-info-300'
                    : 'bg-danger-100 text-danger-300'"
                >
                  {{ statusConfig[trip.status]?.label ?? trip.status }}
                </span>
              </div>
              <!-- 操作 -->
              <div class="flex h-[60px] items-center px-4">
                <button
                  class="
                    cursor-pointer text-sm leading-[1.5] font-medium
                    tracking-[0.7px] text-primary-300 underline-offset-4
                    transition-all duration-300 ease-in-out
                    hover:text-primary-500 hover:underline
                  "
                  @click.prevent
                >
                  查看地圖
                </button>
              </div>
              <!-- Expand -->
              <div class="flex h-[60px] items-center justify-center px-4">
                <Icon
                  name="carbon:chevron-right"
                  class="
                    size-4 text-neutral-600 transition-transform duration-200
                    group-hover:translate-x-1
                  "
                />
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <!-- 圖表區域（本週統計 / 本月報告） -->
    <template v-if="activeTab !== 'today'">
      <div class="grid grid-cols-2 gap-6">
        <!-- 每週表現 -->
        <div class="flex flex-col gap-4 rounded-2xl bg-neutral-100 p-6">
          <div class="flex items-start justify-between">
            <div class="flex flex-col gap-1">
              <p class="text-h6 font-bold tracking-wider text-neutral-900">
                每週表現
              </p>
              <p class="text-sm tracking-wide text-neutral-600">
                每週訂單量與營收比較
              </p>
            </div>
            <p class="text-xs tracking-wide whitespace-nowrap text-neutral-600">
              2026 ｜ 1 月
            </p>
          </div>

          <!-- Bar Chart -->
          <div class="mt-2 flex gap-3">
            <!-- Y 軸 -->
            <div
              class="
                flex h-[165px] w-7 shrink-0 flex-col justify-between text-right
              "
            >
              <span class="text-sm font-bold text-neutral-600">50</span>
              <span class="text-sm font-bold text-neutral-600">25</span>
              <span class="text-sm font-bold text-neutral-600">0</span>
            </div>
            <!-- 圖表主體 -->
            <div class="flex flex-1 flex-col gap-5">
              <div class="relative h-[165px]">
                <!-- 格線 -->
                <div
                  class="
                    pointer-events-none absolute inset-0 flex flex-col
                    justify-between
                  "
                >
                  <div class="w-full border-t border-dashed border-neutral-300"></div>
                  <div class="w-full border-t border-dashed border-neutral-300"></div>
                  <div class="w-full border-t border-dashed border-neutral-300"></div>
                </div>
                <!-- Bars -->
                <div class="absolute inset-0 flex items-end justify-around px-6">
                  <div
                    v-for="bar in weeklyBars"
                    :key="bar.label"
                    class="relative flex items-end"
                  >
                    <!-- Tooltip -->
                    <div
                      v-if="bar.isHighlight"
                      class="
                        absolute bottom-full left-1/2 z-10 mb-3 -translate-x-1/2
                        rounded-xl border border-neutral-200 bg-white p-3
                        text-left whitespace-nowrap
                        shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
                      "
                    >
                      <p
                        class="text-sm font-bold tracking-wide text-primary-500"
                      >
                        45 件
                      </p>
                      <p class="text-xs tracking-wide text-neutral-600">
                        週營收 NT$ 10,250
                      </p>
                    </div>
                    <div
                      class="w-4 rounded-2xl"
                      :class="bar.isHighlight ? 'bg-primary-500' : `
                        bg-neutral-200
                      `"
                      :style="{ height: `${(bar.heightPercent / 100) * 165}px` }"
                    ></div>
                  </div>
                </div>
              </div>
              <!-- X 軸標籤 -->
              <div class="flex items-center justify-around">
                <p
                  v-for="bar in weeklyBars"
                  :key="`${bar.label}-x`"
                  class="text-md font-medium tracking-wider text-neutral-600"
                >
                  {{ bar.label }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 營收來源分布 -->
        <div class="flex flex-col gap-4 rounded-2xl bg-neutral-100 p-6">
          <div class="flex items-start justify-between">
            <div class="flex flex-col gap-1">
              <p class="text-h6 font-bold tracking-wider text-neutral-900">
                營收來源分布
              </p>
              <p class="text-sm tracking-wide text-neutral-600">
                各項營收來源占比與金額比較
              </p>
            </div>
            <p class="text-xs tracking-wide whitespace-nowrap text-neutral-600">
              2026 ｜ 1月
            </p>
          </div>
          <div class="flex flex-1 items-center gap-10">
            <!-- Doughnut -->
            <div
              class="relative size-[200px] shrink-0 rounded-full"
              :style="{
                background: 'conic-gradient(#92beff 0% 60%, #a8e0ff 60% 80%, #ffd67d 80% 90%, #ffae74 90% 96%, #8fdcc0 96% 100%)',
              }"
            >
              <div
                class="
                  absolute inset-[22%] flex flex-col items-center justify-center
                  rounded-full bg-white
                "
              >
                <p class="text-center text-xs tracking-wide text-neutral-600">
                  NTD
                </p>
                <p
                  class="
                    text-h5 font-bold tracking-wider whitespace-nowrap
                    text-neutral-900
                  "
                >
                  600,000
                </p>
              </div>
            </div>
            <!-- Legend -->
            <div class="flex flex-1 flex-col gap-4">
              <div
                v-for="source in revenueSources"
                :key="source.label"
                class="flex items-center gap-3"
              >
                <div
                  class="size-5 shrink-0 rounded-[4px]"
                  :style="{ backgroundColor: source.color }"
                ></div>
                <p
                  class="
                    text-md min-w-[52px] font-medium tracking-wider
                    text-neutral-900
                  "
                >
                  {{ source.label }}
                </p>
                <p class="min-w-[36px] text-sm text-neutral-700">
                  {{ source.percent }}%
                </p>
                <p class="text-sm text-neutral-700">
                  {{ source.amount }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 圖表區域 - 第二排 -->
      <div class="grid grid-cols-2 gap-6">
        <!-- 運送點熱度排行 -->
        <div class="flex flex-col gap-4 rounded-2xl bg-neutral-100 p-6">
          <div class="flex items-start justify-between">
            <div class="flex flex-col gap-1">
              <p class="text-h6 font-bold tracking-wider text-neutral-900">
                運送點熱度排行
              </p>
              <p class="text-sm tracking-wide text-neutral-600">
                最常送達的目的地統計
              </p>
            </div>
            <p class="text-xs tracking-wide whitespace-nowrap text-neutral-600">
              2026 ｜ 1 月
            </p>
          </div>
          <div class="flex flex-col gap-6">
            <div
              v-for="dest in topDestinations"
              :key="dest.rank"
              class="flex items-center gap-2"
            >
              <div
                class="
                  flex size-7 shrink-0 items-center justify-center rounded-full
                  bg-neutral-200
                "
              >
                <p class="text-xs font-medium text-neutral-600">
                  {{ dest.rank }}
                </p>
              </div>
              <div class="flex flex-1 flex-col gap-1">
                <div class="flex items-center justify-between">
                  <p class="text-md font-medium tracking-wider text-neutral-900">
                    {{ dest.name }}
                  </p>
                  <p class="shrink-0 text-sm text-neutral-600">
                    {{ dest.count }} 筆
                  </p>
                </div>
                <div
                  class="
                    h-[2px] w-full overflow-hidden rounded-full bg-neutral-400
                  "
                >
                  <div
                    class="h-full rounded-full"
                    :style="{
                      width: `${dest.percent}%`,
                      background: 'linear-gradient(150deg, #4090E8 16.25%, #306CF7 61.77%)',
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 運量分析 -->
        <div class="flex flex-col gap-4 rounded-2xl bg-neutral-100 p-6">
          <div class="flex items-start justify-between">
            <div class="flex flex-col gap-1">
              <p class="text-h6 font-bold tracking-wider text-neutral-900">
                運量分析
              </p>
              <p class="text-sm tracking-wide text-neutral-600">
                評估運送量能與快遞員工作量
              </p>
            </div>
            <p class="text-xs tracking-wide whitespace-nowrap text-neutral-600">
              2026 ｜ 1 月
            </p>
          </div>
          <!-- Mini 統計 -->
          <div class="grid grid-cols-3 gap-2">
            <div
              v-for="stat in workloadStats"
              :key="stat.label"
              class="
                flex flex-col gap-1 rounded-xl border border-neutral-200
                bg-white p-4 shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
              "
            >
              <p class="text-sm font-medium tracking-wide text-neutral-600">
                {{ stat.label }}
              </p>
              <p class="text-h5 font-bold tracking-wider text-neutral-900">
                {{ stat.value }}
              </p>
            </div>
          </div>
          <!-- 快遞員排名 -->
          <div class="flex flex-col gap-6">
            <div
              v-for="courier in topCouriers"
              :key="courier.rank"
              class="flex items-center gap-2"
            >
              <div
                class="
                  flex size-7 shrink-0 items-center justify-center rounded-full
                  bg-neutral-200
                "
              >
                <p class="text-xs font-medium text-neutral-600">
                  {{ courier.rank }}
                </p>
              </div>
              <div class="flex flex-1 flex-col gap-1">
                <div class="flex items-center justify-between">
                  <p class="text-md font-medium tracking-wider text-neutral-900">
                    {{ courier.name }}
                  </p>
                  <div
                    class="
                      flex shrink-0 items-center gap-2 text-sm text-neutral-600
                    "
                  >
                    <span>{{ courier.trips }} 趟行程</span>
                    <span class="text-neutral-500">·</span>
                    <span>{{ courier.luggage }} 件行李</span>
                  </div>
                </div>
                <div
                  class="
                    h-[2px] w-full overflow-hidden rounded-full bg-neutral-400
                  "
                >
                  <div
                    class="h-full rounded-full"
                    :style="{
                      width: `${courier.percent}%`,
                      background: 'linear-gradient(150deg, #4090E8 16.25%, #306CF7 61.77%)',
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Tabs>
</template>

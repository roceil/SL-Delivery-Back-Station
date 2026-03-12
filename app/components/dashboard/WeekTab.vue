<script lang="ts" setup>
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'

const weekActionCards = [
  { label: '待確認訂單', value: 21 },
  { label: '待分配訂單', value: 12 },
  { label: '待退款訂單', value: 12 },
]

const dailyBars = [
  { label: '日', heightPercent: 10 },
  { label: '一', heightPercent: 30 },
  { label: '二', heightPercent: 28 },
  { label: '三', heightPercent: 38 },
  { label: '四', heightPercent: 90, isHighlight: true },
  { label: '五', heightPercent: 50 },
  { label: '六', heightPercent: 38 },
]

const revenueSources = [
  { label: '散客', percent: 60, amount: 'NT$ 60,150', color: '#92beff' },
  { label: '代售', percent: 20, amount: 'NT$ 200,50', color: '#a8e0ff' },
  { label: 'Klook', percent: 10, amount: 'NT$ 100,25', color: '#ffd67d' },
  { label: 'Trip', percent: 6, amount: 'NT$ 6,015', color: '#ffae74' },
  { label: 'KKday', percent: 4, amount: 'NT$ 4,010', color: '#8fdcc0' },
]

const ongoingTrips = [
  { date: '2026/1/19', courier: '長樂公主', orders: 2, from: '碼頭門市', to: '小琉球樂嶼海景民宿', luggage: 4, area: 'A、B', status: 'in-transit' },
  { date: '2026/1/19', courier: '長樂公主', orders: 2, from: '碼頭門市', to: '小琉球樂嶼海景民宿', luggage: 4, area: 'A、B', status: 'in-transit' },
  { date: '2026/1/19', courier: '朱姓碼農', orders: 2, from: '碼頭門市', to: '小琉球樂嶼海景民宿', luggage: 4, area: 'A、B', status: 'pending' },
  { date: '2026/1/19', courier: '長樂公主', orders: 2, from: '碼頭門市', to: '小本愛玉', luggage: 4, area: 'A、B', status: 'in-transit' },
  { date: '2026/1/19', courier: '朱姓碼農', orders: 2, from: '小琉球樂嶼海景民宿', to: '碼頭門市', luggage: 4, area: 'A、B', status: 'in-transit' },
  { date: '2026/1/19', courier: '長樂公主', orders: 2, from: '小琉球樂嶼海景民宿', to: '碼頭門市', luggage: 4, area: 'A、B', status: 'in-transit' },
]

const statusConfig: Record<string, { label: string }> = {
  'in-transit': { label: '運送中' },
  'pending': { label: '尚未開始' },
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- 概覽 cards -->
    <div
      class="rounded-tr-md rounded-br-md rounded-bl-md bg-neutral-100 p-6"
    >
      <div class="grid grid-cols-4 gap-3">
        <!-- 總訂單數 -->
        <div
          class="
            flex flex-col gap-2 rounded-sm border border-[#8cbcf1] bg-neutral-0
            p-4 shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <div class="flex w-full items-center gap-3">
            <p
              class="flex-1 text-sm font-medium tracking-wider text-neutral-600"
            >
              總訂單數
            </p>
            <Icon
              name="carbon:trending-up"
              class="size-5 shrink-0 text-neutral-500"
            />
          </div>
          <div class="flex items-baseline gap-2">
            <p
              class="
                text-[28px] leading-[1.2] font-bold tracking-wider
                text-neutral-900
              "
            >
              47
            </p>
            <p class="text-xs text-success-300">
              +4.75%
            </p>
          </div>
        </div>
        <!-- 待確認 / 待分配 / 待退款 -->
        <div
          v-for="card in weekActionCards"
          :key="card.label"
          class="
            flex flex-col gap-2 rounded-sm border border-[#8cbcf1] bg-neutral-0
            p-4 shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <p class="text-sm font-medium tracking-wider text-neutral-600">
            {{ card.label }}
          </p>
          <div class="flex w-full items-end justify-between">
            <p
              class="
                text-[28px] leading-[1.2] font-bold tracking-wider
                text-neutral-900
              "
            >
              {{ card.value }}
            </p>
            <button
              class="
                cursor-pointer text-sm font-medium tracking-wider
                text-primary-300 underline-offset-4 transition-all duration-300
                ease-in-out
                hover:text-primary-500 hover:underline
              "
            >
              立即處理
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 圖表區 -->
    <div class="grid grid-cols-2 gap-6">
      <!-- 每日表現 -->
      <div class="flex flex-col gap-4 rounded-2xl bg-neutral-100 p-6">
        <div class="flex items-start justify-between">
          <div class="flex flex-col gap-1">
            <p class="text-h6 font-bold tracking-wider text-neutral-900">
              每日表現
            </p>
            <p class="text-sm tracking-wide text-neutral-600">
              每日訂單量與營收比較
            </p>
          </div>
          <p class="text-xs tracking-wide whitespace-nowrap text-neutral-600">
            2026/1/19 ～ 2026/1/26
          </p>
        </div>

        <div class="mt-2 flex gap-3">
          <div
            class="
              flex h-[165px] w-7 shrink-0 flex-col justify-between text-right
            "
          >
            <span class="text-sm font-bold text-neutral-600">50</span>
            <span class="text-sm font-bold text-neutral-600">25</span>
            <span class="text-sm font-bold text-neutral-600">0</span>
          </div>
          <div class="flex flex-1 flex-col gap-5">
            <div class="relative h-[165px]">
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
              <div class="absolute inset-0 flex items-end justify-around px-2">
                <div
                  v-for="bar in dailyBars"
                  :key="bar.label"
                  class="relative flex items-end"
                >
                  <div
                    v-if="bar.isHighlight"
                    class="
                      absolute bottom-full left-1/2 z-10 mb-3 -translate-x-1/2
                      rounded-xl border border-neutral-200 bg-white p-3
                      text-left whitespace-nowrap
                      shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
                    "
                  >
                    <p class="text-sm font-bold tracking-wide text-primary-500">
                      45 件
                    </p>
                    <p class="text-xs tracking-wide text-neutral-600">
                      日營收 NT$ 10,250
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
            <div class="flex items-center justify-around">
              <p
                v-for="bar in dailyBars"
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
              各項由營收來源的佔比與營業額比較
            </p>
          </div>
          <p class="text-xs tracking-wide whitespace-nowrap text-neutral-600">
            2026/1/19 ～ 2026/1/26
          </p>
        </div>
        <div class="flex flex-1 items-center gap-10">
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
                100,250
              </p>
            </div>
          </div>
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

    <!-- 進行中行程 -->
    <div class="flex flex-col gap-4 rounded-2xl bg-neutral-100 p-6">
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
          <span>2026/1/19 ～ 2026/1/26</span>
          <span>·</span>
          <span>24 趟行程</span>
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
        <input
          type="date"
          class="
            flex-1 cursor-pointer rounded-xs border border-neutral-200
            bg-neutral-0 px-3 py-2 text-sm tracking-wider text-neutral-500
            outline-none
          "
        >
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
              <div class="flex h-[60px] items-center pl-4">
                <input
                  type="checkbox"
                  class="size-4 cursor-pointer accent-primary-300"
                  @click.prevent
                >
              </div>
              <div
                class="
                  flex h-[60px] items-center px-4 text-sm tracking-wider
                  text-neutral-900
                "
              >
                {{ trip.date }}
              </div>
              <div
                class="
                  flex h-[60px] items-center px-4 text-sm tracking-wider
                  text-neutral-900
                "
              >
                {{ trip.courier }}
              </div>
              <div
                class="
                  flex h-[60px] items-center px-4 text-sm tracking-wider
                  text-neutral-900
                "
              >
                {{ trip.orders }} 筆訂單
              </div>
              <div
                class="
                  flex h-[60px] items-center gap-2 px-2 text-sm tracking-wider
                  text-neutral-900
                "
              >
                <HoverCard :open-delay="100">
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
              <div
                class="
                  flex h-[60px] items-center px-4 text-sm tracking-wider
                  text-neutral-900
                "
              >
                {{ trip.luggage }} 件
              </div>
              <div
                class="
                  flex h-[60px] items-center px-4 text-sm tracking-wider
                  text-neutral-900
                "
              >
                {{ trip.area }}
              </div>
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
  </div>
</template>

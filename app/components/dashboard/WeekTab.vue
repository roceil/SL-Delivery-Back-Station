<script lang="ts" setup>
import { TrendingUp } from 'lucide-vue-next'

const weekActionCards = [
  { label: '待確認訂單', value: 21 },
  { label: '待分配訂單', value: 12 },
  { label: '待退款訂單', value: 12 },
]

const dailyBars = [
  { label: '日', orders: 5, revenue: 'NT$ 5,125', heightPercent: 10 },
  { label: '一', orders: 15, revenue: 'NT$ 15,375', heightPercent: 30 },
  { label: '二', orders: 14, revenue: 'NT$ 14,350', heightPercent: 28 },
  { label: '三', orders: 19, revenue: 'NT$ 19,475', heightPercent: 38 },
  { label: '四', orders: 45, revenue: 'NT$ 10,250', heightPercent: 90 },
  { label: '五', orders: 25, revenue: 'NT$ 25,625', heightPercent: 50 },
  { label: '六', orders: 19, revenue: 'NT$ 19,475', heightPercent: 38 },
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
  { date: '2026/1/19', courier: '長樂公主', orders: 2, from: '小琉球樂嶼海景民宿', to: '碼頭門市', luggage: 4, area: 'A、B', status: 'in-transit' },
]
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
            <TrendingUp
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
      <DashboardDailyBarChart
        :bars="dailyBars"
        date-range="2026/1/19 ～ 2026/1/26"
      />

      <!-- 營收來源分布 -->
      <DashboardRevenueDonutChart
        :sources="revenueSources"
        total-amount="100,250"
        date-range="2026/1/19 ～ 2026/1/26"
      />
    </div>

    <!-- 進行中行程 -->
    <DashboardOngoingTripsTable
      :trips="ongoingTrips"
      start-date="2026/1/19"
      end-date="2026/1/26"
    />
  </div>
</template>

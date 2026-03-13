<script lang="ts" setup>
import { TrendingUp } from 'lucide-vue-next'

const props = defineProps<{
  statsData: { totalOrders?: number, deliveredOrders?: number } | null
}>()

const todayCards = computed(() => {
  const total = props.statsData?.totalOrders || 0
  const delivered = props.statsData?.deliveredOrders || 0

  return [
    { label: '總訂單數', value: total || 47, change: '+4.75%' },
    { label: '待交付訂單', value: 5, change: null },
    { label: '運送中訂單', value: total - delivered || 12, change: null },
    { label: '已完成訂單', value: delivered || 30, change: null },
    { label: '值班夥伴', value: 3, change: null },
  ]
})

const ongoingTrips = [
  { date: '2026/1/19', courier: '長樂公主', orders: 2, from: '碼頭門市', to: '小琉球樂嶼海景民宿', luggage: 4, area: 'A、B', status: 'in-transit' },
  { date: '2026/1/19', courier: '長樂公主', orders: 2, from: '碼頭門市', to: '小琉球樂嶼海景民宿', luggage: 4, area: 'A、B', status: 'in-transit' },
  { date: '2026/1/19', courier: '朱姓碼農', orders: 2, from: '碼頭門市', to: '小琉球樂嶼海景民宿', luggage: 4, area: 'A、B', status: 'pending' },
  { date: '2026/1/19', courier: '長樂公主', orders: 2, from: '碼頭門市', to: '小本愛玉', luggage: 4, area: 'A、B', status: 'in-transit' },
  { date: '2026/1/19', courier: '朱姓碼農', orders: 2, from: '小琉球樂嶼海景民宿', to: '碼頭門市', luggage: 4, area: 'A、B', status: 'in-transit' },
  { date: '2026/1/19', courier: '長樂公主', orders: 2, from: '小琉球樂嶼海景民宿', to: '碼頭門市', luggage: 4, area: 'A、B', status: 'in-transit' },
]
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- 概覽 cards -->
    <div
      class="rounded-tr-md rounded-br-md rounded-bl-md bg-neutral-100 p-6"
    >
      <div class="flex gap-3">
        <div
          v-for="card in todayCards"
          :key="card.label"
          class="
            flex flex-1 flex-col gap-2 rounded-sm border border-[#8cbcf1]
            bg-neutral-0 p-4 shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <div class="flex w-full items-center gap-3">
            <p
              class="flex-1 text-sm font-medium tracking-wider text-neutral-600"
            >
              {{ card.label }}
            </p>
            <TrendingUp
              v-if="card.label === '總訂單數'"
              class="size-5 shrink-0 text-neutral-500"
            />
          </div>
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
    </div>

    <!-- 進行中行程 -->
    <DashboardOngoingTripsTable
      :trips="ongoingTrips"
      start-date="2026/1/19"
    />
  </div>
</template>

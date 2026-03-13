<script lang="ts" setup>
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'

interface Bar {
  label: string
  orders: number
  revenue: string
  heightPercent: number
}

const props = defineProps<{
  bars: Bar[]
  dateRange: string
  chartHeight?: number
  yAxisLabels?: string[]
}>()

const chartHeight = computed(() => props.chartHeight ?? 165)
const yAxisLabels = computed(() => props.yAxisLabels ?? ['50', '25', '0'])

const hoveredBar = ref<string | null>(null)
</script>

<template>
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
        {{ dateRange }}
      </p>
    </div>

    <div class="mt-2 flex gap-3">
      <div
        class="flex w-7 shrink-0 flex-col justify-between text-right"
        :style="{ height: `${chartHeight}px` }"
      >
        <span
          v-for="label in yAxisLabels"
          :key="label"
          class="text-sm font-bold text-neutral-600"
        >{{ label }}</span>
      </div>
      <div class="flex flex-1 flex-col gap-5">
        <div
          class="relative"
          :style="{ height: `${chartHeight}px` }"
        >
          <div
            class="
              pointer-events-none absolute inset-0 flex flex-col justify-between
            "
          >
            <div
              v-for="_ in yAxisLabels"
              :key="_"
              class="w-full border-t border-dashed border-neutral-300"
            ></div>
          </div>
          <div class="absolute inset-0 flex items-end justify-around px-2">
            <HoverCard
              v-for="bar in bars"
              :key="bar.label"
              :open-delay="80"
              :close-delay="50"
            >
              <HoverCardTrigger
                class="relative flex cursor-pointer items-end"
                @mouseenter="hoveredBar = bar.label"
                @mouseleave="hoveredBar = null"
              >
                <div
                  class="w-4 rounded-2xl transition-colors duration-150"
                  :class="hoveredBar === bar.label ? 'bg-primary-500' : `
                    bg-neutral-200
                  `"
                  :style="{ height: `${(bar.heightPercent / 100) * chartHeight}px` }"
                ></div>
              </HoverCardTrigger>
              <HoverCardContent
                side="top"
                :side-offset="8"
                class="
                  w-auto min-w-[120px] rounded-xl border border-neutral-200
                  bg-white p-3 text-left whitespace-nowrap
                  shadow-[0px_4px_12px_0px_rgba(32,78,184,0.08)]
                "
              >
                <p class="text-sm font-bold tracking-wide text-primary-500">
                  {{ bar.orders }} 件
                </p>
                <p class="text-xs tracking-wide text-neutral-600">
                  日營收 {{ bar.revenue }}
                </p>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
        <div class="flex items-center justify-around">
          <p
            v-for="bar in bars"
            :key="`${bar.label}-x`"
            class="text-md font-medium tracking-wider text-neutral-600"
          >
            {{ bar.label }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Source {
  label: string
  percent: number
  amount: string
  color: string
}

const props = defineProps<{
  sources: Source[]
  totalAmount: string
  dateRange: string
}>()

const hoveredLabel = ref<string | null>(null)

// SVG donut 參數
const CX = 100
const CY = 100
const OUTER_R = 90
const INNER_R = 58

const segments = computed(() => {
  let accumulated = 0
  return props.sources.map((source) => {
    const startAngle = accumulated * 3.6
    accumulated += source.percent
    const endAngle = accumulated * 3.6
    const midAngle = (startAngle + endAngle) / 2
    return { ...source, startAngle, endAngle, midAngle }
  })
})

function toRad(deg: number) {
  return (deg - 90) * Math.PI / 180
}

function getPath(startAngle: number, endAngle: number, r: number = OUTER_R) {
  const x1 = CX + r * Math.cos(toRad(startAngle))
  const y1 = CY + r * Math.sin(toRad(startAngle))
  const x2 = CX + r * Math.cos(toRad(endAngle))
  const y2 = CY + r * Math.sin(toRad(endAngle))
  const x3 = CX + INNER_R * Math.cos(toRad(endAngle))
  const y3 = CY + INNER_R * Math.sin(toRad(endAngle))
  const x4 = CX + INNER_R * Math.cos(toRad(startAngle))
  const y4 = CY + INNER_R * Math.sin(toRad(startAngle))
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${x4} ${y4} Z`
}

// 計算 tooltip 位置（SVG 坐標轉為百分比，用於絕對定位）
function getTooltipStyle(midAngle: number) {
  const r = OUTER_R + 8
  const x = CX + r * Math.cos(toRad(midAngle))
  const y = CY + r * Math.sin(toRad(midAngle))
  return {
    left: `${(x / 200) * 100}%`,
    top: `${(y / 200) * 100}%`,
  }
}

const hoveredSegment = computed(() =>
  segments.value.find(s => s.label === hoveredLabel.value) ?? null,
)
</script>

<template>
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
        {{ dateRange }}
      </p>
    </div>

    <div class="flex flex-1 items-center gap-10">
      <!-- Donut Chart -->
      <div class="relative size-[200px] shrink-0">
        <svg
          viewBox="0 0 200 200"
          class="size-full"
        >
          <path
            v-for="seg in segments"
            :key="seg.label"
            :d="getPath(seg.startAngle, seg.endAngle, hoveredLabel === seg.label ? OUTER_R + 5 : OUTER_R)"
            :fill="seg.color"
            class="cursor-pointer transition-all duration-150"
            :opacity="hoveredLabel && hoveredLabel !== seg.label ? 0.5 : 1"
            @mouseenter="hoveredLabel = seg.label"
            @mouseleave="hoveredLabel = null"
          />
        </svg>

        <!-- 中心文字 -->
        <div
          class="
            pointer-events-none absolute inset-[22%] flex flex-col items-center
            justify-center rounded-full bg-white
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
            {{ totalAmount }}
          </p>
        </div>

        <!-- Tooltip -->
        <Transition
          enter-active-class="transition-opacity duration-100"
          enter-from-class="opacity-0"
          leave-active-class="transition-opacity duration-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="hoveredSegment"
            class="
              pointer-events-none absolute z-10 -translate-x-1/2
              -translate-y-1/2 rounded-xl border border-neutral-200 bg-white p-3
              whitespace-nowrap shadow-[0px_4px_12px_0px_rgba(32,78,184,0.08)]
            "
            :style="getTooltipStyle(hoveredSegment.midAngle)"
          >
            <p class="text-sm font-bold tracking-wide text-primary-500">
              {{ hoveredSegment.label }} {{ hoveredSegment.percent }}%
            </p>
            <p class="text-xs tracking-wide text-neutral-600">
              {{ hoveredSegment.amount }}
            </p>
          </div>
        </Transition>
      </div>

      <!-- 圖例 -->
      <div class="flex flex-1 flex-col gap-4">
        <div
          v-for="source in sources"
          :key="source.label"
          class="
            flex cursor-default items-center gap-3 transition-opacity
            duration-150
          "
          :class="hoveredLabel && hoveredLabel !== source.label ? 'opacity-40' : `
            opacity-100
          `"
          @mouseenter="hoveredLabel = source.label"
          @mouseleave="hoveredLabel = null"
        >
          <div
            class="size-5 shrink-0 rounded-[4px]"
            :style="{ backgroundColor: source.color }"
          ></div>
          <p
            class="
              text-md min-w-[52px] font-medium tracking-wider text-neutral-900
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
</template>

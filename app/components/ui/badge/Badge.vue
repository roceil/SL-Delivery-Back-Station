<script lang="ts" setup>
export type BadgeType = 'gray' | 'blue' | 'green' | 'red' | 'orange' | 'sky' | 'light-sky' | 'amber' | 'peach' | 'mint'
export type BadgeSize = 'sm' | 'lg'

defineProps<{
  type?: BadgeType
  size?: BadgeSize
  label: string
}>()

const typeClass: Record<BadgeType, string> = {
  'gray': 'bg-neutral-200 text-neutral-600',
  'blue': 'bg-info-100 text-info-300',
  'green': 'bg-success-100 text-success-300',
  'red': 'bg-danger-100 text-danger-300',
  'orange': 'bg-warning-100 text-warning-300',
  'sky': 'bg-[#92beff] text-[#1a4a99]',
  'light-sky': 'bg-[#a8e0ff] text-[#1a4a99]',
  'amber': 'bg-[#ffd67d] text-[#7c5800]',
  'peach': 'bg-[#ffae74] text-[#7c3200]',
  'mint': 'bg-[#8fdcc0] text-[#14665a]',
}

const sizeClass: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[11px] tracking-[0.55px]',
  lg: 'px-2 py-1 text-xs tracking-[0.6px]',
}
</script>

<template>
  <span
    class="
      inline-flex items-center justify-center rounded-full font-medium
      whitespace-nowrap
    "
    :class="[typeClass[type ?? 'gray'], sizeClass[size ?? 'sm']]"
  >{{ label }}</span>
</template>

<script lang="ts" setup>
export type BadgeType = 'gray' | 'blue' | 'green' | 'red' | 'orange'
export type BadgeSize = 'sm' | 'lg'

defineProps<{
  type?: BadgeType
  size?: BadgeSize
  label: string
}>()

const typeClass: Record<BadgeType, string> = {
  gray: 'bg-neutral-200 text-neutral-600',
  blue: 'bg-info-100 text-info-300',
  green: 'bg-success-100 text-success-300',
  red: 'bg-danger-100 text-danger-300',
  orange: 'bg-warning-100 text-warning-300',
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

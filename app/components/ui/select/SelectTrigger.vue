<script setup lang="ts">
import type { SelectTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ChevronDown } from 'lucide-vue-next'
import { SelectIcon, SelectTrigger, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<SelectTriggerProps & { class?: HTMLAttributes['class'], size?: 'sm' | 'default' }>(),
  { size: 'default' },
)

const delegatedProps = reactiveOmit(props, 'class', 'size')
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectTrigger
    data-slot="select-trigger"
    :data-size="size"
    v-bind="forwardedProps"
    :class="cn(
      `
        flex w-full items-center justify-between gap-2 rounded-xs border
        border-neutral-200 bg-neutral-0 px-3 py-2 text-base tracking-[0.8px]
        whitespace-nowrap transition-[color,box-shadow] outline-none
        focus-visible:border-ring focus-visible:ring-[3px]
        focus-visible:ring-ring/50
        disabled:cursor-not-allowed disabled:opacity-50
        data-[placeholder]:text-neutral-500
        [&_svg]:pointer-events-none [&_svg]:shrink-0
        [&_svg:not([class*=\'size-\'])]:size-4
      `,
      props.class,
    )"
  >
    <slot></slot>
    <SelectIcon as-child>
      <ChevronDown class="size-4 opacity-50" />
    </SelectIcon>
  </SelectTrigger>
</template>

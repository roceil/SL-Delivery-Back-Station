<script setup lang="ts">
import type { TabsTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TabsTrigger, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<TabsTriggerProps & {
  class?: HTMLAttributes['class']
  variant?: 'default' | 'gradient-border'
}>()

const delegatedProps = reactiveOmit(props, 'class', 'variant')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <TabsTrigger
    data-slot="tabs-trigger"
    :class="cn(
      props.variant === 'gradient-border'
        ? `
          tabs-trigger--gradient-border !h-auto !flex-none cursor-pointer
          !rounded-tl-xl !rounded-tr-xl !rounded-br-none !rounded-bl-none
          !border-0 !shadow-none transition-colors
          data-[state=inactive]:px-6 data-[state=inactive]:py-2
          data-[state=inactive]:text-neutral-600
          data-[state=inactive]:hover:text-neutral-900
        `
        : `
          inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center
          gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm
          font-medium whitespace-nowrap text-foreground
          transition-[color,box-shadow]
          focus-visible:border-ring focus-visible:ring-[3px]
          focus-visible:ring-ring/50 focus-visible:outline-1
          focus-visible:outline-ring
          disabled:pointer-events-none disabled:opacity-50
          data-[state=active]:bg-background data-[state=active]:shadow-sm
          dark:text-muted-foreground dark:data-[state=active]:border-input
          dark:data-[state=active]:bg-input/30
          dark:data-[state=active]:text-foreground
          [&_svg]:pointer-events-none [&_svg]:shrink-0
          [&_svg:not([class*=\'size-\'])]:size-4
        `,
      props.class,
    )"
    v-bind="forwardedProps"
  >
    <span
      v-if="props.variant === 'gradient-border'"
      class="text-md block font-medium tracking-wider"
    >
      <slot></slot>
    </span>
    <slot v-else></slot>
  </TabsTrigger>
</template>

<style scoped>
.tabs-trigger--gradient-border[data-state="active"] {
  background: linear-gradient(
    161deg,
    rgb(140, 188, 241) 5.68%,
    rgb(131, 167, 250) 12.36%,
    rgba(135, 177, 245, 0) 52%
  );
  padding: 1px 1px 0;
}

.tabs-trigger--gradient-border[data-state="active"] span {
  border-radius: 11px 11px 0 0;
  background-color: var(--color-neutral-100);
  padding: 0.5rem 1.5rem;
  color: var(--color-neutral-900);
}
</style>

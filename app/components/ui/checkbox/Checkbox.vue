<script lang="ts" setup>
import { Check, Minus } from 'lucide-vue-next'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'

const props = defineProps<{
  checked?: boolean
  indeterminate?: boolean
}>()

const emit = defineEmits<{
  change: [value: boolean]
}>()

const rekaChecked = computed<boolean | 'indeterminate'>(() => {
  if (props.indeterminate)
    return 'indeterminate'
  return props.checked ?? false
})
</script>

<template>
  <CheckboxRoot
    :model-value="rekaChecked"
    class="
      flex size-5 shrink-0 cursor-pointer items-center justify-center
      rounded-[4px] bg-white transition-all outline-none
      data-[state=checked]:bg-[image:linear-gradient(131deg,#4090E8_16.25%,#306CF7_61.77%)]
      data-[state=indeterminate]:bg-[image:linear-gradient(131deg,#4090E8_16.25%,#306CF7_61.77%)]
      data-[state=unchecked]:ring-1 data-[state=unchecked]:ring-neutral-300
      data-[state=unchecked]:ring-inset
    "
    @update:model-value="val => emit('change', val === true)"
  >
    <CheckboxIndicator class="flex items-center justify-center text-white">
      <Minus
        v-if="indeterminate"
        class="size-3 stroke-[2.5]"
      />
      <Check
        v-else
        class="size-3 stroke-[2.5]"
      />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import {
  ChartColumn,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  MapPin,
  Printer,
  Route,
  Store,
  UsersRound,
} from 'lucide-vue-next'

interface NavSubItem {
  to: string
  label: string
}

interface NavItem {
  to: string
  label: string
  icon: Component
  children?: NavSubItem[]
}

const navItems: NavItem[] = [
  { to: '/', label: '儀表板', icon: ChartColumn },
  { to: '/orders', label: '訂單總覽', icon: ClipboardList },
  { to: '/trips', label: '行程管理', icon: Route },
  { to: '/merchants', label: '商家管理', icon: Store },
  { to: '/delivery-points', label: '運送點管理', icon: MapPin },
  {
    to: '/billing',
    label: '結帳總覽',
    icon: CircleDollarSign,
    children: [
      { to: '/billing', label: '帳務詳情' },
      { to: '/billing/pricing', label: '售價設定' },
    ],
  },
  { to: '/couriers', label: '夥伴總覽', icon: UsersRound },
  { to: '/print-settings', label: '列印設定', icon: Printer },
]

const route = useRoute()
const expandedItems = ref(new Set<string>())

watch(
  () => route.path,
  (path) => {
    for (const item of navItems) {
      if (!item.children)
        continue
      if (path.startsWith(item.to))
        expandedItems.value.add(item.to)
      else
        expandedItems.value.delete(item.to)
    }
  },
  { immediate: true },
)

function isActive(path: string) {
  if (path === '/')
    return route.path === '/'
  return route.path.startsWith(path)
}

function isParentActive(item: NavItem) {
  return item.children?.some(child => isActive(child.to)) ?? false
}

// 從子項目中找出最長路徑優先匹配的那一個，避免 /billing 誤匹配 /billing/pricing
function getActiveChild(item: NavItem): string | null {
  if (!item.children)
    return null
  const sorted = [...item.children].sort((a, b) => b.to.length - a.to.length)
  for (const child of sorted) {
    if (route.path === child.to || route.path.startsWith(`${child.to}/`))
      return child.to
  }
  return null
}

function isExpanded(item: NavItem) {
  return expandedItems.value.has(item.to)
}

function toggleExpanded(item: NavItem) {
  if (expandedItems.value.has(item.to))
    expandedItems.value.delete(item.to)
  else
    expandedItems.value.add(item.to)
}
</script>

<template>
  <aside
    class="
      flex h-screen w-[200px] shrink-0 flex-col gap-6 overflow-hidden border-r
      border-neutral-200 bg-white p-6
    "
  >
    <!-- Brand -->
    <p class="text-h5 font-medium tracking-wider text-neutral-900">
      你行李來
    </p>

    <!-- Nav items -->
    <nav class="flex flex-1 flex-col gap-3">
      <template
        v-for="item in navItems"
        :key="item.to"
      >
        <!-- 一般項目 -->
        <NuxtLink
          v-if="!item.children"
          :to="item.to"
          class="flex items-center gap-2 rounded-sm p-2 transition-colors"
          :class="
            isActive(item.to)
              ? 'bg-primary-200 text-neutral-900'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          "
        >
          <component
            :is="item.icon"
            class="size-5 shrink-0"
          />
          <span class="text-base font-medium tracking-wider">{{ item.label }}</span>
        </NuxtLink>

        <!-- 手風琴項目 -->
        <div
          v-else
          class="flex flex-col gap-2 rounded-xl p-2 transition-colors"
          :class="
            isParentActive(item) || isExpanded(item)
              ? 'bg-primary-200'
              : 'hover:bg-neutral-100'
          "
        >
          <button
            type="button"
            class="flex w-full items-center gap-2"
            @click="toggleExpanded(item)"
          >
            <component
              :is="item.icon"
              class="size-5 shrink-0"
              :class="
                isParentActive(item) || isExpanded(item)
                  ? 'text-neutral-900'
                  : 'text-neutral-600'
              "
            />
            <span
              class="flex-1 text-left text-base font-medium tracking-wider"
              :class="
                isParentActive(item) || isExpanded(item)
                  ? 'text-neutral-900'
                  : 'text-neutral-600'
              "
            >{{ item.label }}</span>
            <ChevronDown
              class="size-5 shrink-0 transition-transform"
              :class="[
                isExpanded(item) ? 'rotate-180' : 'rotate-0',
                isParentActive(item) || isExpanded(item)
                  ? 'text-neutral-900'
                  : 'text-neutral-600',
              ]"
            />
          </button>

          <template v-if="isExpanded(item)">
            <div class="border-t border-primary-300"></div>
            <NuxtLink
              v-for="sub in item.children"
              :key="sub.to"
              :to="sub.to"
              class="text-sm font-medium tracking-[0.7px] transition-colors"
              :class="
                getActiveChild(item) === sub.to
                  ? 'text-neutral-900'
                  : 'text-neutral-600 hover:text-neutral-900'
              "
            >
              {{ sub.label }}
            </NuxtLink>
          </template>
        </div>
      </template>
    </nav>

    <!-- Logout button -->
    <UButton
      label="登出"
      color="neutral"
      variant="outline"
      block
      class="rounded-xs border border-neutral-200"
    />
  </aside>
</template>

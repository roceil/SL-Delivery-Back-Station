<script setup lang="ts">
const route = useRoute()

const navItems = [
  { to: '/', label: '儀表板', icon: 'carbon:dashboard' },
  { to: '/orders', label: '訂單總覽', icon: 'carbon:document-multiple-01' },
  { to: '/trips', label: '行程管理', icon: 'carbon:road' },
  { to: '/merchants', label: '商家管理', icon: 'carbon:store' },
  { to: '/delivery-points', label: '運送點管理', icon: 'carbon:location' },
  { to: '/billing', label: '結帳總覽', icon: 'carbon:wallet' },
  { to: '/couriers', label: '夥伴總覽', icon: 'carbon:group' },
  { to: '/print-settings', label: '列印設定', icon: 'carbon:printer' },
]

function isActive(path: string) {
  if (path === '/')
    return route.path === '/'
  return route.path.startsWith(path)
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
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-2 rounded-sm px-4 py-2 transition-colors"
        :class="isActive(item.to)
          ? 'bg-primary-200 text-neutral-900'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'"
      >
        <Icon
          :name="item.icon"
          class="size-5 shrink-0"
        />
        <span class="text-base font-medium tracking-wider">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <!-- Logout button -->
    <UButton
      label="登出"
      color="neutral"
      variant="outline"
      block
    />
  </aside>
</template>

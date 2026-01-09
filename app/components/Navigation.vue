<script setup lang="ts">
const route = useRoute()

const navItems = [
  { to: '/', label: '首頁' },
  { to: '/orders', label: '訂單總覽' },
  { to: '/trips', label: '行程管理' },
  { to: '/merchants', label: '商家管理' },
  { to: '/delivery-points', label: '運送點管理' },
  { to: '/billing', label: '結帳總覽' },
  { to: '/couriers', label: '夥伴總覽' },
]

function isActive(path: string) {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="border-b bg-white shadow-lg">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 justify-between">
        <div class="flex">
          <div class="flex flex-shrink-0 items-center">
            <h1 class="text-xl font-bold text-gray-900">
              行李運送系統
            </h1>
          </div>
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="
                inline-flex items-center border-b-2 px-1 pt-1 text-sm
                font-medium
              "
              :class="[
                isActive(item.to)
                  ? 'border-blue-500 text-gray-900'
                  : `
                    border-transparent text-gray-500
                    hover:border-gray-300 hover:text-gray-700
                  `,
              ]"
            >
              {{ item.label }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

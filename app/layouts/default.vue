<script setup lang="ts">
import { Search } from 'lucide-vue-next'

const route = useRoute()

const routeLabels: Record<string, string> = {
  '/': '儀表板',
  '/orders': '訂單總覽',
  '/trips': '行程管理',
  '/merchants': '商家管理',
  '/delivery-points': '運送點管理',
  '/billing': '結帳總覽',
  '/couriers': '夥伴總覽',
  '/print-settings': '列印設定',
  '/quick-receive': '快速收件',
}

const pageLabel = computed(() => {
  for (const [path, label] of Object.entries(routeLabels)) {
    if (path === '/') {
      if (route.path === '/')
        return label
      continue
    }
    if (route.path.startsWith(path))
      return label
  }
  return '管理後台'
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-neutral-0">
    <!-- Sidebar -->
    <Navigation />

    <!-- Main content area -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- Header -->
      <header
        class="
          flex shrink-0 items-center justify-between border-b border-neutral-200
          bg-neutral-0 px-8 py-3
        "
      >
        <!-- Breadcrumb -->
        <nav class="flex items-center">
          <NuxtLink
            to="/"
            class="
              px-1 py-0.5 text-base font-medium tracking-wider text-neutral-600
              hover:text-neutral-900
            "
          >
            管理後台
          </NuxtLink>
          <span
            class="px-2 text-base font-medium tracking-wider text-neutral-600"
          >/</span>
          <span
            class="
              px-1 py-0.5 text-base font-medium tracking-wider text-primary-300
            "
          >
            {{ pageLabel }}
          </span>
        </nav>

        <!-- Header actions -->
        <div class="flex items-center gap-2">
          <!-- Search input -->
          <div
            class="
              flex w-[300px] items-center gap-2 rounded-xs border
              border-neutral-200 bg-neutral-0 px-3 py-2
            "
          >
            <Search
              class="size-5 shrink-0 text-neutral-500"
            />
            <input
              type="text"
              placeholder="輸入行程或訂單編號"
              class="
                flex-1 bg-transparent text-base font-normal tracking-wider
                text-neutral-900 outline-none
                placeholder:text-neutral-500
              "
            >
          </div>

          <!-- 新增訂單 -->
          <Button
            as-child
            variant="outline"
          >
            <NuxtLink to="/orders/new">
              新增訂單
            </NuxtLink>
          </Button>

          <!-- 快速收件 -->
          <Button as-child>
            <NuxtLink to="/quick-receive">
              快速收件
            </NuxtLink>
          </Button>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-auto p-8">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

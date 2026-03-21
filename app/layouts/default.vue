<script setup lang="ts">
import { Search } from 'lucide-vue-next'

const route = useRoute()
const { extraItems } = useBreadcrumb()

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

interface SecondCrumb {
  label: string
  to: string
}

const secondCrumb = computed<SecondCrumb | null>(() => {
  for (const [path, label] of Object.entries(routeLabels)) {
    if (path === '/') {
      if (route.path === '/')
        return { label, to: path }
      continue
    }
    if (route.path.startsWith(path))
      return { label, to: path }
  }
  return null
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
          <template v-if="secondCrumb">
            <span
              class="px-2 text-base font-medium tracking-wider text-neutral-600"
            >/</span>
            <template v-if="extraItems.length > 0">
              <NuxtLink
                :to="secondCrumb.to"
                class="
                  px-1 py-0.5 text-base font-medium tracking-wider
                  text-neutral-600
                  hover:text-neutral-900
                "
              >
                {{ secondCrumb.label }}
              </NuxtLink>
              <template
                v-for="(item, index) in extraItems"
                :key="index"
              >
                <span
                  class="
                    px-2 text-base font-medium tracking-wider text-neutral-600
                  "
                >/</span>
                <NuxtLink
                  v-if="item.to"
                  :to="item.to"
                  class="
                    px-1 py-0.5 text-base font-medium tracking-wider
                    text-primary-300
                    hover:text-primary-400
                  "
                >
                  {{ item.label }}
                </NuxtLink>
                <span
                  v-else
                  class="
                    px-1 py-0.5 text-base font-medium tracking-wider
                    text-primary-300
                  "
                >
                  {{ item.label }}
                </span>
              </template>
            </template>
            <span
              v-else
              class="
                px-1 py-0.5 text-base font-medium tracking-wider
                text-primary-300
              "
            >
              {{ secondCrumb.label }}
            </span>
          </template>
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
      <main class="flex-1 overflow-auto">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

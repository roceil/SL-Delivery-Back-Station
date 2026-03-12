<script lang="ts" setup>
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

useHead({
  title: '儀表板 - 你行李來',
})

const activeTab = ref<'today' | 'week' | 'month'>('today')

const { data: statsData } = await useFetch('/api/dashboard/stats')

const tabs = [
  { key: 'today' as const, label: '今日概覽' },
  { key: 'week' as const, label: '本週統計' },
  { key: 'month' as const, label: '本月報告' },
]
</script>

<template>
  <Tabs v-model="activeTab">
    <div class="flex flex-col">
      <!-- Tab 列 -->
      <TabsList
        class="
          !flex !h-auto !items-end !justify-start !rounded-none !bg-transparent
          !p-0
        "
      >
        <TabsTrigger
          v-for="tab in tabs"
          :key="tab.key"
          :value="tab.key"
          variant="gradient-border"
        >
          {{ tab.label }}
        </TabsTrigger>
      </TabsList>

      <!-- Tab 內容元件 -->
      <DashboardTodayTab
        v-if="activeTab === 'today'"
        :stats-data="statsData"
      />
      <DashboardWeekTab v-else-if="activeTab === 'week'" />
      <DashboardMonthTab
        v-else
        :stats-data="statsData"
      />
    </div>
  </Tabs>
</template>

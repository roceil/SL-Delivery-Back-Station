<script lang="ts" setup>
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

useHead({
  title: '儀表板 - 你行李來',
})

const { data: statsData } = await useFetch('/api/dashboard/stats')

const tabs = [
  { key: 'today', label: '今日概覽' },
  { key: 'week', label: '本週統計' },
  { key: 'month', label: '本月報告' },
]
</script>

<template>
  <div class="p-8">
    <Tabs default-value="today">
      <div class="flex flex-col">
        <!-- Tab 列 -->
        <TabsList
          class="
            !flex !h-auto !items-end !justify-start !rounded-none
            !bg-transparent !p-0
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

        <!-- 今日概覽 -->
        <TabsContent value="today">
          <DashboardTodayTab :stats-data="statsData ?? null" />
        </TabsContent>

        <!-- 本週統計 -->
        <TabsContent value="week">
          <DashboardWeekTab />
        </TabsContent>

        <!-- 本月報告 -->
        <TabsContent value="month">
          <DashboardMonthTab :stats-data="statsData ?? null" />
        </TabsContent>
      </div>
    </Tabs>
  </div>
</template>

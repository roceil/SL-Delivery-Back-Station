<script lang="ts" setup>
import {
  ChevronLeft,
  Phone,
  Store,
  Tag,
  Ticket,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const route = useRoute()
const merchantId = route.params.id as string

useHead({
  title: `代售詳情 - 物流管理系統`,
})

// TODO: 替換為實際 API 呼叫 /api/billing/pricing/merchant/:id
const merchant = reactive({
  id: merchantId,
  name: '小本愛玉',
  phone: '0912345678',
  ticketId: 'VjfyNC5fCg7f',
  cooperationStatus: 'active' as const,
  enableStatus: 'active' as const,
  ticketStatus: 'out_of_stock' as const,
  stats: {
    totalRevenue: 0,
    totalTickets: 0,
    usedTickets: 0,
    remainingTickets: 0,
  },
  unitPrice: 50,
})

const { setBreadcrumb, clearBreadcrumb } = useBreadcrumb()

onMounted(() => {
  setBreadcrumb({ label: merchant.name })
})

onBeforeRouteLeave(() => {
  clearBreadcrumb()
})

const ticketStatusConfig: Record<string, { type: 'orange' | 'red' | 'gray', label: string }> = {
  out_of_stock: { type: 'orange', label: '無庫存' },
  low_stock: { type: 'red', label: '庫存量低' },
  sufficient: { type: 'gray', label: '餘額充裕' },
}

const cooperationStatusConfig: Record<string, { type: 'green' | 'gray', label: string }> = {
  active: { type: 'green', label: '合作中' },
  suspended: { type: 'gray', label: '暫停合作' },
}

const enableStatusConfig: Record<string, { type: 'green' | 'gray', label: string }> = {
  active: { type: 'green', label: '啟用中' },
  inactive: { type: 'gray', label: '停用中' },
}

// ── 票券設定表單 ────────────────────────────────────────────────────────────────

const unitPrice = ref(merchant.unitPrice)
const stockToAdd = ref(0)

function decreaseStock() {
  if (stockToAdd.value > 0)
    stockToAdd.value--
}

function increaseStock() {
  stockToAdd.value++
}

function formatCurrency(amount: number) {
  return `NT$ ${amount.toLocaleString()}`
}
</script>

<template>
  <div class="min-h-full bg-neutral-100">
    <div class="grid grid-cols-12 gap-4 p-8">
      <!-- Header -->
      <div class="col-span-12 flex items-center gap-3">
        <Button
          as-child
          variant="ghost"
          size="icon-sm"
        >
          <NuxtLink to="/billing/pricing">
            <ChevronLeft class="size-4" />
          </NuxtLink>
        </Button>
        <h1 class="text-2xl font-bold tracking-[1.2px] text-neutral-900">
          {{ merchant.name }}
        </h1>
        <Badge
          :type="ticketStatusConfig[merchant.ticketStatus]?.type ?? 'gray'"
          :label="ticketStatusConfig[merchant.ticketStatus]?.label ?? merchant.ticketStatus"
          size="lg"
        />
      </div>

      <!-- 左欄 -->
      <div class="col-span-8 flex flex-col gap-4">
        <!-- 代售資訊 -->
        <div
          class="rounded-2xl bg-white p-6"
          style="box-shadow: 0px 4px 12px rgba(32,78,184,0.04);"
        >
          <div class="mb-4 flex items-center gap-2">
            <Store class="size-5 text-neutral-900" />
            <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
              代售資訊
            </h2>
          </div>

          <!-- 統計數據 -->
          <div class="mb-4 grid grid-cols-4 gap-2">
            <div class="flex flex-col gap-1 rounded-xl bg-neutral-100 p-4">
              <span class="text-sm tracking-[0.7px] text-neutral-600">累計代售款</span>
              <span
                class="text-base font-medium tracking-[0.8px] text-neutral-900"
              >
                {{ formatCurrency(merchant.stats.totalRevenue) }}
              </span>
            </div>
            <div class="flex flex-col gap-1 rounded-xl bg-neutral-100 p-4">
              <span class="text-sm tracking-[0.7px] text-neutral-600">累計給票數</span>
              <span
                class="text-base font-medium tracking-[0.8px] text-neutral-900"
              >
                {{ merchant.stats.totalTickets }}
              </span>
            </div>
            <div class="flex flex-col gap-1 rounded-xl bg-neutral-100 p-4">
              <span class="text-sm tracking-[0.7px] text-neutral-600">已核銷</span>
              <span
                class="text-base font-medium tracking-[0.8px] text-neutral-900"
              >
                {{ merchant.stats.usedTickets }}
              </span>
            </div>
            <div class="flex flex-col gap-1 rounded-xl bg-neutral-100 p-4">
              <span class="text-sm tracking-[0.7px] text-neutral-600">剩餘票券</span>
              <span
                class="text-base font-medium tracking-[0.8px] text-neutral-900"
              >
                {{ merchant.stats.remainingTickets }}
              </span>
            </div>
          </div>

          <!-- 資訊列表 -->
          <dl class="flex flex-col gap-2">
            <div class="flex items-center gap-4">
              <dt
                class="
                  min-w-[100px] shrink-0 text-base tracking-[0.8px]
                  text-neutral-600
                "
              >
                票卷 ID
              </dt>
              <dd class="text-base tracking-[0.8px] text-neutral-900">
                {{ merchant.ticketId }}
              </dd>
            </div>
            <div class="flex items-center gap-4">
              <dt
                class="
                  min-w-[100px] shrink-0 text-base tracking-[0.8px]
                  text-neutral-600
                "
              >
                合作狀態
              </dt>
              <dd>
                <Badge
                  :type="cooperationStatusConfig[merchant.cooperationStatus]?.type ?? 'gray'"
                  :label="cooperationStatusConfig[merchant.cooperationStatus]?.label ?? merchant.cooperationStatus"
                  size="sm"
                />
              </dd>
            </div>
            <div class="flex items-center gap-4">
              <dt
                class="
                  min-w-[100px] shrink-0 text-base tracking-[0.8px]
                  text-neutral-600
                "
              >
                啟用狀態
              </dt>
              <dd>
                <Badge
                  :type="enableStatusConfig[merchant.enableStatus]?.type ?? 'gray'"
                  :label="enableStatusConfig[merchant.enableStatus]?.label ?? merchant.enableStatus"
                  size="sm"
                />
              </dd>
            </div>
          </dl>
        </div>

        <!-- 票券設定 -->
        <div
          class="flex flex-col items-end gap-4 rounded-2xl bg-white p-6"
          style="box-shadow: 0px 4px 12px rgba(32,78,184,0.04);"
        >
          <div class="flex w-full items-center gap-2">
            <Ticket class="size-5 text-neutral-900" />
            <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
              票券設定
            </h2>
          </div>

          <!-- 單價 -->
          <div class="flex w-full flex-col gap-2">
            <label class="text-base tracking-[0.8px] text-neutral-600">
              單價 (NTD)
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model="unitPrice"
                type="number"
                class="
                  flex-1 rounded-xs border border-neutral-200 bg-white px-3 py-2
                  text-base tracking-[0.8px] text-neutral-900 outline-none
                  focus:border-neutral-400
                "
              >
              <span class="shrink-0 text-base tracking-[0.8px] text-neutral-600">/張</span>
            </div>
          </div>

          <!-- 補充庫存 -->
          <div class="flex w-full flex-col gap-2">
            <label class="text-base tracking-[0.8px] text-neutral-600">
              補充庫存
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model="stockToAdd"
                type="number"
                min="0"
                class="
                  flex-1 rounded-xs border border-neutral-200 bg-white px-3 py-2
                  text-base tracking-[0.8px] text-neutral-900 outline-none
                  focus:border-neutral-400
                "
              >
              <span class="shrink-0 text-base tracking-[0.8px] text-neutral-600">張</span>
            </div>
          </div>

          <!-- 儲存按鈕 -->
          <button
            type="button"
            class="
              shrink-0 rounded-xl bg-primary-400 px-4 py-2 text-base font-medium
              tracking-[0.8px] text-white
              hover:bg-primary-500
            "
          >
            儲存
          </button>
        </div>
      </div>

      <!-- 右欄：快速操作 -->
      <div
        class="
          sticky top-8 col-span-4 self-start rounded-2xl border border-[#8cbcf1]
          bg-white p-6
        "
        style="box-shadow: 0px 4px 12px rgba(32,78,184,0.04);"
      >
        <h3 class="mb-4 text-lg font-bold tracking-[0.9px] text-neutral-900">
          快速操作
        </h3>
        <div class="flex flex-col gap-2">
          <Button
            as-child
            variant="outline"
            class="w-full justify-center gap-2"
          >
            <a :href="`tel:${merchant.phone}`">
              <Phone class="size-5" />
              聯絡商家
            </a>
          </Button>
          <Button
            as-child
            variant="outline"
            class="w-full justify-center gap-2"
          >
            <NuxtLink :to="`/merchants/${merchant.id}`">
              <Tag class="size-5" />
              查看商家資訊
            </NuxtLink>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

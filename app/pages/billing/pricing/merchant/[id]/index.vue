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

interface MerchantData {
  id: number
  name: string
  phone: string
  voucherId: string | null
  isCollaborate: boolean
  isActive: boolean
  usedCounts: number
  maxUsageCounts: number | null
  unitPrice: number | null
}

const { data: merchantData, refresh } = await useFetch<MerchantData>(`/api/merchants/${merchantId}`)

if (!merchantData.value) {
  throw createError({ statusCode: 404, message: '找不到此商家' })
}

const merchant = merchantData as Ref<MerchantData>

const { setBreadcrumb, clearBreadcrumb } = useBreadcrumb()

onMounted(() => {
  setBreadcrumb({ label: merchant.value.name })
})

onBeforeRouteLeave(() => {
  clearBreadcrumb()
})

const remainingTickets = computed(() => {
  const max = merchant.value.maxUsageCounts ?? 0
  return Math.max(0, max - merchant.value.usedCounts)
})

const ticketStatus = computed(() => {
  const remaining = remainingTickets.value
  if (remaining <= 0)
    return 'out_of_stock'
  if (remaining <= 10)
    return 'low_stock'
  return 'sufficient'
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

const unitPrice = ref(merchant.value.unitPrice ?? 0)
const stockToAdd = ref(0)
const hasCollected = ref(false)

const showPaymentSummary = computed(() => unitPrice.value > 0 && stockToAdd.value > 0)
const paymentTotal = computed(() => unitPrice.value * stockToAdd.value)

function decreaseStock() {
  if (stockToAdd.value > 0)
    stockToAdd.value--
}

function increaseStock() {
  stockToAdd.value++
}

// ── 給票紀錄 ────────────────────────────────────────────────────────────────────

interface TicketRecord {
  id: number
  batchNumber: number
  quantity: number
  unitPrice: number
  total: number
  paymentStatus: 'paid' | 'unpaid'
  issuedAt: string
  paidAt: string | null
}

const filterYear = ref(new Date().getFullYear())
const filterMonth = ref(new Date().getMonth() + 1)

const { data: ticketRecordsData, refresh: refreshRecords } = await useFetch<TicketRecord[]>(
  () => `/api/merchants/${merchantId}/ticket-records?year=${filterYear.value}&month=${filterMonth.value}`,
)

const ticketRecords = computed(() => ticketRecordsData.value ?? [])

const yearOptions = computed(() => {
  const current = new Date().getFullYear()
  return [current - 1, current, current + 1]
})

const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)

async function markRecordAsPaid(recordId: number) {
  await $fetch(`/api/merchants/${merchantId}/ticket-records/${recordId}`, {
    method: 'PATCH' as const,
  })
  await refreshRecords()
}

async function saveSettings() {
  await $fetch(`/api/merchants/${merchantId}`, {
    method: 'PATCH' as const,
    body: { unitPrice: unitPrice.value, stockToAdd: stockToAdd.value, hasCollected: hasCollected.value },
  })
  stockToAdd.value = 0
  hasCollected.value = false
  await Promise.all([refresh(), refreshRecords()])
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
          :type="ticketStatusConfig[ticketStatus]?.type ?? 'gray'"
          :label="ticketStatusConfig[ticketStatus]?.label ?? ticketStatus"
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
                {{ merchant.unitPrice != null ? formatCurrency(merchant.usedCounts * merchant.unitPrice) : '-' }}
              </span>
            </div>
            <div class="flex flex-col gap-1 rounded-xl bg-neutral-100 p-4">
              <span class="text-sm tracking-[0.7px] text-neutral-600">累計給票數</span>
              <span
                class="text-base font-medium tracking-[0.8px] text-neutral-900"
              >
                {{ merchant.maxUsageCounts ?? '-' }}
              </span>
            </div>
            <div class="flex flex-col gap-1 rounded-xl bg-neutral-100 p-4">
              <span class="text-sm tracking-[0.7px] text-neutral-600">已核銷</span>
              <span
                class="text-base font-medium tracking-[0.8px] text-neutral-900"
              >
                {{ merchant.usedCounts }}
              </span>
            </div>
            <div class="flex flex-col gap-1 rounded-xl bg-neutral-100 p-4">
              <span class="text-sm tracking-[0.7px] text-neutral-600">剩餘票券</span>
              <span
                class="text-base font-medium tracking-[0.8px] text-neutral-900"
              >
                {{ remainingTickets }}
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
                {{ merchant.voucherId ?? '-' }}
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
                  :type="merchant.isCollaborate ? 'green' : 'gray'"
                  :label="merchant.isCollaborate ? '合作中' : '暫停合作'"
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
                  :type="merchant.isActive ? 'green' : 'gray'"
                  :label="merchant.isActive ? '啟用中' : '停用中'"
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

          <!-- 收款明細 -->
          <div
            v-if="showPaymentSummary"
            class="w-full rounded-xl border border-neutral-200 p-4"
          >
            <p
              class="mb-3 text-base font-bold tracking-[0.8px] text-neutral-900"
            >
              收款明細
            </p>
            <dl class="flex flex-col gap-2">
              <div class="flex items-center gap-4">
                <dt
                  class="
                    min-w-[60px] text-base tracking-[0.8px] text-neutral-600
                  "
                >
                  單價
                </dt>
                <dd class="text-base tracking-[0.8px] text-neutral-900">
                  {{ formatCurrency(unitPrice) }}
                </dd>
              </div>
              <div class="flex items-center gap-4">
                <dt
                  class="
                    min-w-[60px] text-base tracking-[0.8px] text-neutral-600
                  "
                >
                  張數
                </dt>
                <dd class="text-base tracking-[0.8px] text-neutral-900">
                  {{ stockToAdd }}
                </dd>
              </div>
              <div class="flex items-center gap-4">
                <dt
                  class="
                    min-w-[60px] text-base tracking-[0.8px] text-neutral-600
                  "
                >
                  總計
                </dt>
                <dd
                  class="
                    text-base font-medium tracking-[0.8px] text-neutral-900
                  "
                >
                  {{ formatCurrency(paymentTotal) }}
                </dd>
              </div>
            </dl>
            <label class="mt-3 flex cursor-pointer items-center gap-2">
              <input
                v-model="hasCollected"
                type="checkbox"
                class="size-4 accent-primary-400"
              >
              <span class="text-base tracking-[0.8px] text-neutral-900">已向商家收取款項</span>
            </label>
          </div>

          <!-- 儲存按鈕 -->
          <button
            type="button"
            class="
              shrink-0 rounded-xl bg-primary-400 px-4 py-2 text-base font-medium
              tracking-[0.8px] text-white
              hover:bg-primary-500
            "
            @click="saveSettings"
          >
            儲存
          </button>
        </div>

        <!-- 給票紀錄 -->
        <div
          class="flex flex-col gap-4 rounded-2xl bg-white p-6"
          style="box-shadow: 0px 4px 12px rgba(32,78,184,0.04);"
        >
          <div class="flex items-center gap-2">
            <span class="text-lg font-bold tracking-[0.9px] text-neutral-900">給票紀錄</span>
            <span class="text-base tracking-[0.8px] text-neutral-600">{{ ticketRecords.length }} 筆</span>
            <div class="ml-auto flex items-center gap-2">
              <Select v-model="filterYear">
                <SelectTrigger class="w-[100px] bg-white text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem
                      v-for="y in yearOptions"
                      :key="y"
                      :value="y"
                    >
                      {{ y }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select v-model="filterMonth">
                <SelectTrigger class="w-[80px] bg-white text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem
                      v-for="m in monthOptions"
                      :key="m"
                      :value="m"
                    >
                      {{ m }} 月
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div
            v-if="ticketRecords.length > 0"
            class="overflow-hidden rounded-xl border border-neutral-200"
          >
            <!-- 表頭 -->
            <div
              class="grid grid-cols-6 border-b border-neutral-200 px-4 py-3"
            >
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >批次</span>
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >張數</span>
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >總計</span>
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >付款狀態</span>
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >給票日</span>
              <span
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >操作</span>
            </div>
            <!-- 資料列 -->
            <div class="divide-y divide-neutral-200">
              <div
                v-for="record in ticketRecords"
                :key="record.id"
                class="grid grid-cols-6 items-center px-4 py-3"
              >
                <span class="text-sm tracking-[0.7px] text-neutral-900">第 {{ record.batchNumber }} 批</span>
                <span class="text-sm tracking-[0.7px] text-neutral-900">{{ record.quantity }} 張</span>
                <span class="text-sm tracking-[0.7px] text-neutral-900">{{ formatCurrency(record.total) }}</span>
                <div>
                  <Badge
                    :type="record.paymentStatus === 'paid' ? 'green' : 'red'"
                    :label="record.paymentStatus === 'paid' ? '已付款' : '未付款'"
                    size="sm"
                  />
                </div>
                <span class="text-sm tracking-[0.7px] text-neutral-900">{{ record.issuedAt }}</span>
                <div>
                  <button
                    v-if="record.paymentStatus === 'unpaid'"
                    type="button"
                    class="
                      text-sm font-medium tracking-[0.7px] text-primary-400
                      hover:text-primary-500
                    "
                    @click="markRecordAsPaid(record.id)"
                  >
                    標示為已付款
                  </button>
                  <span
                    v-else
                    class="text-sm text-neutral-400"
                  >-</span>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="
              flex items-center justify-center rounded-xl bg-neutral-100 py-8
            "
          >
            <span class="text-sm tracking-[0.7px] text-neutral-600">尚無給票紀錄</span>
          </div>
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
            <a :href="merchant.phone ? `tel:${merchant.phone}` : undefined">
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

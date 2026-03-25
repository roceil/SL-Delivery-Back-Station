<script lang="ts" setup>
import {
  ArrowRight,
  ChevronLeft,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Phone,
  User,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const route = useRoute()
const billingId = route.params.id as string

useHead({
  title: `帳單詳情 ${billingId} - 物流管理系統`,
})

const { setBreadcrumb, clearBreadcrumb } = useBreadcrumb()

onMounted(() => {
  setBreadcrumb({ label: billingId })
})

onBeforeRouteLeave(() => {
  clearBreadcrumb()
})

// TODO: 替換為實際 API 呼叫 /api/billing/:id
const billing = {
  id: billingId,
  orderId: billingId,
  category: '散客',
  passengerName: '池昌旭',
  passengerPhone: '0912345678',
  from: '碼頭門市',
  to: '小琉球樂嶼海景民宿',
  revenueSource: '線上預約',
  deliveryStatus: 'in_transit',
  paymentStatus: 'paid',
  paymentMethod: 'LINE Pay',
  fees: [
    { plan: '雙程套票', type: '-', unitPrice: 250, quantity: 2, subtotal: 500 },
  ],
  totalAmount: 500,
  createdAt: '2026/2/10 12:00',
  paidAt: '2026/2/10 12:05',
}

const deliveryStatusConfig: Record<string, { type: 'blue' | 'green' | 'gray', label: string }> = {
  in_transit: { type: 'blue', label: '運送中' },
  delivered: { type: 'green', label: '已送達' },
  pending: { type: 'gray', label: '待處理' },
}

const paymentStatusConfig: Record<string, { type: 'green' | 'orange' | 'red', label: string }> = {
  paid: { type: 'green', label: '已付款' },
  pending_refund: { type: 'orange', label: '待退款' },
  pending_payment: { type: 'red', label: '待補款' },
}

function formatCurrency(amount: number) {
  return `NT$ ${amount.toLocaleString()}`
}
</script>

<template>
  <div class="grid grid-cols-12 gap-4 bg-neutral-100 p-8">
    <!-- Header -->
    <div class="col-span-12 flex items-center gap-3">
      <Button
        as-child
        variant="ghost"
        size="icon-sm"
      >
        <NuxtLink to="/billing">
          <ChevronLeft class="size-4" />
        </NuxtLink>
      </Button>
      <h1 class="text-2xl font-bold tracking-[1.2px] text-neutral-900">
        訂單編號 {{ billing.orderId }}
      </h1>
      <Badge
        :type="deliveryStatusConfig[billing.deliveryStatus]?.type ?? 'gray'"
        :label="deliveryStatusConfig[billing.deliveryStatus]?.label ?? billing.deliveryStatus"
        size="lg"
      />
      <Badge
        :type="paymentStatusConfig[billing.paymentStatus]?.type ?? 'gray'"
        :label="paymentStatusConfig[billing.paymentStatus]?.label ?? billing.paymentStatus"
        size="lg"
      />
    </div>

    <!-- 左欄 -->
    <div class="col-span-8 flex flex-col gap-4">
      <!-- 訂單資訊 -->
      <div
        class="rounded-2xl bg-white p-6"
        style="box-shadow: 0px 4px 12px rgba(32,78,184,0.04);"
      >
        <div class="mb-4 flex items-center gap-2">
          <User class="size-5 text-neutral-900" />
          <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
            訂單資訊
          </h2>
        </div>
        <dl class="flex flex-col gap-2">
          <div class="flex items-center gap-4">
            <dt
              class="
                min-w-[100px] shrink-0 text-base tracking-[0.8px]
                text-neutral-600
              "
            >
              類別
            </dt>
            <dd>
              <Badge
                type="gray"
                :label="billing.category"
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
              旅客姓名
            </dt>
            <dd class="text-base tracking-[0.8px] text-neutral-900">
              {{ billing.passengerName }}
            </dd>
          </div>
          <div class="flex items-center gap-4">
            <dt
              class="
                min-w-[100px] shrink-0 text-base tracking-[0.8px]
                text-neutral-600
              "
            >
              聯絡電話
            </dt>
            <dd class="text-base tracking-[0.8px] text-neutral-900">
              {{ billing.passengerPhone }}
            </dd>
          </div>
          <div class="flex items-center gap-4">
            <dt
              class="
                min-w-[100px] shrink-0 text-base tracking-[0.8px]
                text-neutral-600
              "
            >
              運送路線
            </dt>
            <dd
              class="
                flex items-center gap-2 text-base tracking-[0.8px]
                text-neutral-900
              "
            >
              <span>{{ billing.from }}</span>
              <ArrowRight class="size-4 shrink-0 text-neutral-500" />
              <span>{{ billing.to }}</span>
            </dd>
          </div>
          <div class="flex items-center gap-4">
            <dt
              class="
                min-w-[100px] shrink-0 text-base tracking-[0.8px]
                text-neutral-600
              "
            >
              營收來源
            </dt>
            <dd class="text-base tracking-[0.8px] text-neutral-900">
              {{ billing.revenueSource }}
            </dd>
          </div>
        </dl>
      </div>

      <!-- 費用明細 -->
      <div
        class="rounded-2xl bg-white p-6"
        style="box-shadow: 0px 4px 12px rgba(32,78,184,0.04);"
      >
        <div class="mb-4 flex items-center gap-2">
          <CircleDollarSign class="size-5 text-neutral-900" />
          <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
            費用明細
          </h2>
        </div>

        <!-- 費用表格 -->
        <table class="w-full">
          <thead>
            <tr class="border-b border-neutral-200">
              <th
                class="
                  px-4 py-3 text-left text-sm font-medium tracking-[0.7px]
                  text-neutral-600
                "
              >
                方案
              </th>
              <th
                class="
                  px-4 py-3 text-left text-sm font-medium tracking-[0.7px]
                  text-neutral-600
                "
              >
                種類
              </th>
              <th
                class="
                  px-4 py-3 text-left text-sm font-medium tracking-[0.7px]
                  text-neutral-600
                "
              >
                單價
              </th>
              <th
                class="
                  px-4 py-3 text-left text-sm font-medium tracking-[0.7px]
                  text-neutral-600
                "
              >
                行李數量
              </th>
              <th
                class="
                  px-4 py-3 text-right text-sm font-medium tracking-[0.7px]
                  text-neutral-600
                "
              >
                小計
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="fee in billing.fees"
              :key="fee.plan + fee.type"
              class="border-b border-neutral-200"
            >
              <td
                class="h-[60px] px-4 text-sm tracking-[0.7px] text-neutral-900"
              >
                {{ fee.plan }}
              </td>
              <td
                class="h-[60px] px-4 text-sm tracking-[0.7px] text-neutral-600"
              >
                {{ fee.type }}
              </td>
              <td
                class="h-[60px] px-4 text-sm tracking-[0.7px] text-neutral-900"
              >
                {{ formatCurrency(fee.unitPrice) }}
              </td>
              <td
                class="h-[60px] px-4 text-sm tracking-[0.7px] text-neutral-900"
              >
                {{ fee.quantity }}
              </td>
              <td
                class="
                  h-[60px] px-4 text-right text-sm tracking-[0.7px]
                  text-neutral-900
                "
              >
                {{ formatCurrency(fee.subtotal) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td
                colspan="4"
                class="
                  h-[60px] px-4 text-sm font-bold tracking-[0.7px]
                  text-neutral-900
                "
              >
                總計
              </td>
              <td
                class="
                  h-[60px] px-4 text-right text-xl font-bold tracking-[1px]
                  text-primary-400
                "
              >
                {{ formatCurrency(billing.totalAmount) }}
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- 付款資訊 -->
        <div class="mt-4 rounded-xl bg-neutral-100 p-3">
          <h3
            class="
              border-b border-neutral-200 pb-2 text-sm font-medium
              tracking-[0.7px] text-neutral-600
            "
          >
            付款資訊
          </h3>
          <dl class="mt-2 flex flex-col gap-2">
            <div class="flex items-center gap-4">
              <dt
                class="
                  min-w-[100px] shrink-0 text-base tracking-[0.8px]
                  text-neutral-600
                "
              >
                付款方式
              </dt>
              <dd class="text-base tracking-[0.8px] text-neutral-900">
                {{ billing.paymentMethod }}
              </dd>
            </div>
            <div class="flex items-center gap-4">
              <dt
                class="
                  min-w-[100px] shrink-0 text-base tracking-[0.8px]
                  text-neutral-600
                "
              >
                付款狀態
              </dt>
              <dd>
                <Badge
                  :type="paymentStatusConfig[billing.paymentStatus]?.type ?? 'gray'"
                  :label="paymentStatusConfig[billing.paymentStatus]?.label ?? billing.paymentStatus"
                  size="sm"
                />
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- 帳務紀錄 -->
      <div
        class="rounded-2xl bg-white p-6"
        style="box-shadow: 0px 4px 12px rgba(32,78,184,0.04);"
      >
        <div class="mb-4 flex items-center gap-2">
          <FileText class="size-5 text-neutral-900" />
          <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
            帳務紀錄
          </h2>
        </div>
        <dl class="flex flex-col gap-2">
          <div class="flex items-center gap-4">
            <dt
              class="
                min-w-[100px] shrink-0 text-base tracking-[0.8px]
                text-neutral-600
              "
            >
              訂單編號
            </dt>
            <dd class="text-base tracking-[0.8px] text-neutral-900">
              {{ billing.orderId }}
            </dd>
          </div>
          <div class="flex items-center gap-4">
            <dt
              class="
                min-w-[100px] shrink-0 text-base tracking-[0.8px]
                text-neutral-600
              "
            >
              建立時間
            </dt>
            <dd class="text-base tracking-[0.8px] text-neutral-900">
              {{ billing.createdAt }}
            </dd>
          </div>
          <div class="flex items-center gap-4">
            <dt
              class="
                min-w-[100px] shrink-0 text-base tracking-[0.8px]
                text-neutral-600
              "
            >
              付款時間
            </dt>
            <dd class="text-base tracking-[0.8px] text-neutral-900">
              {{ billing.paidAt }}
            </dd>
          </div>
        </dl>
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
          <a :href="`tel:${billing.passengerPhone}`">
            <Phone class="size-5" />
            聯絡旅客
          </a>
        </Button>
        <Button
          as-child
          variant="outline"
          class="w-full justify-center gap-2"
        >
          <NuxtLink :to="`/orders/${billing.orderId}`">
            <ClipboardList class="size-5" />
            查看訂單詳情
          </NuxtLink>
        </Button>
      </div>
    </div>
  </div>
</template>

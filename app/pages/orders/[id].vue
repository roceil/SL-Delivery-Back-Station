<script lang="ts" setup>
import QrcodeVue from 'qrcode.vue'

const route = useRoute()
const orderId = route.params.id as string

useHead({
  title: `訂單詳細 #${orderId} - 行李運送系統`,
})

const { data: order, error } = await useFetch(`/api/orders/${orderId}`)

if (error.value) {
  throw createError({
    statusCode: 404,
    message: '找不到此訂單',
  })
}

function handlePrint() {
  window.print()
}

const statusConfig = {
  pending: { text: '待處理', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { text: '已確認', color: 'bg-blue-100 text-blue-800' },
  in_transit: { text: '運送中', color: 'bg-indigo-100 text-indigo-800' },
  delivered: { text: '已送達', color: 'bg-green-100 text-green-800' },
  cancelled: { text: '已取消', color: 'bg-red-100 text-red-800' },
}

function getStatusText(status: string) {
  return statusConfig[status as keyof typeof statusConfig]?.text || status
}

function getStatusColor(status: string) {
  return statusConfig[status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('zh-TW')
}
</script>

<template>
  <div>
    <!-- Print Card Layout (Only visible when printing) -->
    <div
      v-if="order"
      class="hidden print:block"
      style="width: 85mm; height: 54mm; padding: 4mm; box-sizing: border-box;"
    >
      <div class="flex h-full gap-3">
        <!-- Left: QR Code -->
        <div class="flex flex-shrink-0 items-center">
          <QrcodeVue
            :value="order.id"
            :size="160"
            level="H"
          />
        </div>

        <!-- Right: Order Info -->
        <div
          class="flex flex-1 flex-col justify-between text-[9px] leading-tight"
        >
          <!-- Top: Order ID & Status -->
          <div class="border-b border-gray-300 pb-1">
            <div class="font-bold">
              #{{ order.id }}
            </div>
            <div class="text-[8px]">
              {{ getStatusText(order.status) }}
            </div>
          </div>

          <!-- Customer Info -->
          <div class="border-b border-gray-300 py-1">
            <div class="font-semibold">
              {{ order.lineName }}
            </div>
            <div class="text-[8px]">
              {{ order.phone }}
            </div>
          </div>

          <!-- Locations -->
          <div class="flex-1 py-1">
            <div class="mb-1">
              <div class="text-[8px] text-gray-600">
                起始
              </div>
              <div class="font-medium">
                {{ order.pickupLocation.name }}
              </div>
            </div>
            <div>
              <div class="text-[8px] text-gray-600">
                送達
              </div>
              <div class="font-medium">
                {{ order.deliveryLocation.name }}
              </div>
            </div>
          </div>

          <!-- Bottom: Luggage Count -->
          <div class="border-t border-gray-300 pt-1 text-right">
            <span class="font-bold">{{ order.luggageCount }}</span> 件行李
          </div>
        </div>
      </div>
    </div>

    <!-- Screen Layout (Hidden when printing) -->
    <div class="space-y-6 print:hidden">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/orders"
            class="
              rounded-md border border-gray-300 bg-white px-4 py-2 text-sm
              font-medium text-gray-700 shadow-sm
              hover:bg-gray-50
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
            "
          >
            ← 返回列表
          </NuxtLink>
          <h1 class="text-2xl font-bold text-gray-900">
            訂單詳細 #{{ order?.id }}
          </h1>
        </div>
        <div class="flex items-center gap-3">
          <span
            v-if="order"
            :class="getStatusColor(order.status)"
            class="inline-flex rounded-full px-4 py-2 text-sm font-semibold"
          >
            {{ getStatusText(order.status) }}
          </span>
          <button
            type="button"
            class="
              rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm
              font-medium text-white shadow-sm
              hover:bg-blue-700
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
            "
            @click="handlePrint"
          >
            列印訂單
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- QR Code Section -->
        <div class="rounded-lg bg-white p-6 shadow lg:col-span-2">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            訂單 QR Code
          </h2>
          <div class="flex justify-center">
            <QrcodeVue
              v-if="order"
              :value="order.id"
              :size="200"
              level="H"
            />
          </div>
          <p class="mt-2 text-center text-sm text-gray-500">
            掃描此 QR Code 查看訂單詳細
          </p>
        </div>

        <!-- Customer Information -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            客戶資訊
          </h2>
          <dl class="space-y-3">
            <div>
              <dt class="text-sm font-medium text-gray-500">
                LINE 名稱
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ order?.lineName }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">
                聯絡電話
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ order?.phone }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Delivery Information -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            配送資訊
          </h2>
          <dl class="space-y-3">
            <div>
              <dt class="text-sm font-medium text-gray-500">
                寄送日期
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ formatDate(order?.deliveryDate || '') }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">
                收貨時間
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ order?.pickupTime }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">
                行李數量
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ order?.luggageCount }} 件
              </dd>
            </div>
          </dl>
        </div>

        <!-- Pickup Location -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            起始點
          </h2>
          <dl class="space-y-3">
            <div>
              <dt class="text-sm font-medium text-gray-500">
                地點名稱
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ order?.pickupLocation.name }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">
                地址
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ order?.pickupLocation.address }}
              </dd>
            </div>
            <div v-if="order?.pickupLocation.area">
              <dt class="text-sm font-medium text-gray-500">
                區域
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                區域 {{ order?.pickupLocation.area }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Delivery Location -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            送達點
          </h2>
          <dl class="space-y-3">
            <div>
              <dt class="text-sm font-medium text-gray-500">
                地點名稱
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ order?.deliveryLocation.name }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">
                地址
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ order?.deliveryLocation.address }}
              </dd>
            </div>
            <div v-if="order?.deliveryLocation.area">
              <dt class="text-sm font-medium text-gray-500">
                區域
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                區域 {{ order?.deliveryLocation.area }}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Notes -->
      <div
        v-if="order?.notes"
        class="rounded-lg bg-white p-6 shadow"
      >
        <h2 class="mb-4 text-lg font-semibold text-gray-900">
          備註
        </h2>
        <p class="text-sm text-gray-700">
          {{ order.notes }}
        </p>
      </div>

      <!-- Timestamps -->
      <div class="rounded-lg bg-white p-6 shadow">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">
          時間記錄
        </h2>
        <dl class="grid gap-3 sm:grid-cols-2">
          <div>
            <dt class="text-sm font-medium text-gray-500">
              建立時間
            </dt>
            <dd class="mt-1 text-sm text-gray-900">
              {{ formatDateTime(order?.createdAt || '') }}
            </dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">
              最後更新
            </dt>
            <dd class="mt-1 text-sm text-gray-900">
              {{ formatDateTime(order?.updatedAt || '') }}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>

<style>
@media print {
  @page {
    size: 85mm 54mm;
    margin: 0;
  }
}
</style>

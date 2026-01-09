<script lang="ts" setup>
useHead({
  title: '結帳總覽 - 物流管理系統',
})

interface Merchant {
  id: number
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  type: number
  typeName: string
  area: string
  isActive: boolean
  isCollaborate: boolean
  voucherId: string | null
  usedCounts: number
  maxUsageCounts: number | null
  remarks: string
  createdAt: string
  updatedAt: string
}

const { data: billingData } = await useFetch('/api/billing')
const { data: merchants } = await useFetch<Merchant[]>('/api/merchants')

function getMerchantName(merchantId: string) {
  const merchant = merchants.value?.find(m => m.id.toString() === merchantId)
  return merchant?.name || '未知商家'
}

function getStatusText(status: string) {
  const statusMap = {
    pending: '待結帳',
    paid: '已付款',
    overdue: '逾期未付',
  }
  return statusMap[status as keyof typeof statusMap] || status
}

function getStatusColor(status: string) {
  const colorMap = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  }
  return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'
}

async function markAsPaid(billingId: string) {
  try {
    await $fetch(`/api/billing/${billingId}/pay`, {
      method: 'POST',
    })

    const data = billingData.value
    if (!data)
      return

    const billIndex = data.findIndex((b: any) => b.id === billingId)
    if (billIndex > -1 && data[billIndex]) {
      data[billIndex].status = 'paid'
      data[billIndex].paidAt = new Date().toISOString()
    }
  }
  catch (error) {
    console.error('標記付款失敗:', error)
  }
}

const totalAmount = computed(() => {
  return billingData.value?.reduce((sum: number, bill: any) => sum + bill.amount, 0) || 0
})

const pendingAmount = computed(() => {
  return billingData.value
    ?.filter((bill: any) => bill.status === 'pending')
    .reduce((sum: number, bill: any) => sum + bill.amount, 0) || 0
})
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <h1 class="mb-6 text-2xl font-bold text-gray-900">
        結帳總覽
      </h1>

      <div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div class="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 class="mb-2 text-lg font-medium text-blue-900">
            總金額
          </h3>
          <p class="text-2xl font-bold text-blue-600">
            NT$ {{ totalAmount.toLocaleString() }}
          </p>
        </div>

        <div class="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h3 class="mb-2 text-lg font-medium text-yellow-900">
            待收款
          </h3>
          <p class="text-2xl font-bold text-yellow-600">
            NT$ {{ pendingAmount.toLocaleString() }}
          </p>
        </div>

        <div class="rounded-lg border border-green-200 bg-green-50 p-6">
          <h3 class="mb-2 text-lg font-medium text-green-900">
            已收款
          </h3>
          <p class="text-2xl font-bold text-green-600">
            NT$ {{ (totalAmount - pendingAmount).toLocaleString() }}
          </p>
        </div>
      </div>

      <div
        class="
          ring-opacity-5 overflow-hidden shadow ring-1 ring-black
          md:rounded-lg
        "
      >
        <table class="min-w-full divide-y divide-gray-300">
          <thead class="bg-gray-50">
            <tr>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wider
                  text-gray-500 uppercase
                "
              >
                商家資訊
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wider
                  text-gray-500 uppercase
                "
              >
                收貨商家
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wider
                  text-gray-500 uppercase
                "
              >
                訂單數量
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wider
                  text-gray-500 uppercase
                "
              >
                金額
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wider
                  text-gray-500 uppercase
                "
              >
                狀態
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wider
                  text-gray-500 uppercase
                "
              >
                建立時間
              </th>
              <th
                scope="col"
                class="
                  px-6 py-3 text-left text-xs font-medium tracking-wider
                  text-gray-500 uppercase
                "
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr
              v-for="bill in billingData"
              :key="bill.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ getMerchantName(bill.fromMerchantId) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ getMerchantName(bill.toMerchantId) }}
                </div>
              </td>
              <td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                {{ bill.itemCount }} 個物品
              </td>
              <td
                class="
                  px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900
                "
              >
                NT$ {{ bill.amount.toLocaleString() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="getStatusColor(bill.status)"
                  class="
                    inline-flex rounded-full px-2 py-1 text-xs font-semibold
                  "
                >
                  {{ getStatusText(bill.status) }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                {{ new Date(bill.createdAt).toLocaleDateString('zh-TW') }}
              </td>
              <td class="px-6 py-4 text-sm font-medium whitespace-nowrap">
                <button
                  v-if="bill.status === 'pending'"
                  class="text-green-600 hover:text-green-900"
                  @click="markAsPaid(bill.id)"
                >
                  標記已付款
                </button>
                <span
                  v-else
                  class="text-gray-400"
                >已處理</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="!billingData || billingData.length === 0"
        class="py-12 text-center"
      >
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          沒有結帳記錄
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          當有物品配送完成時，這裡會顯示結帳資訊。
        </p>
      </div>
    </div>
  </div>
</template>

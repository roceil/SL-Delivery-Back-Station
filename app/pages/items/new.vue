<script lang="ts" setup>
useHead({
  title: '新建物品 - 物流管理系統',
})

const router = useRouter()

const form = ref({
  name: '',
  description: '',
  length: '',
  width: '',
  height: '',
  weight: '',
  senderAddress: '',
  senderMerchantId: '',
  receiverAddress: '',
  deliveryPointId: '',
  merchantId: '',
  customMerchant: {
    name: '',
    phone: '',
    address: '',
  },
  isCustomMerchant: false,
})

const { data: merchants } = await useFetch('/api/merchants')
const { data: deliveryPoints } = await useFetch('/api/delivery-points')

const selectedDeliveryPoint = computed(() => {
  return deliveryPoints.value?.find(point => point.id === form.value.deliveryPointId)
})

const selectedSenderMerchant = computed(() => {
  return merchants.value?.find(merchant => merchant.id === form.value.senderMerchantId)
})

function updateReceiverAddress() {
  if (selectedDeliveryPoint.value) {
    form.value.receiverAddress = selectedDeliveryPoint.value.address
  }
}

function updateSenderAddress() {
  if (selectedSenderMerchant.value) {
    form.value.senderAddress = selectedSenderMerchant.value.address
    // 同時設定為結帳商家，因為通常寄件商家就是結帳商家
    form.value.merchantId = form.value.senderMerchantId
  }
}

async function submitForm() {
  try {
    await $fetch('/api/items', {
      method: 'POST',
      body: form.value,
    })
    router.push('/items')
  }
  catch (error) {
    console.error('建立物品失敗:', error)
  }
}
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <h1 class="mb-6 text-2xl font-bold text-gray-900">
        新建物品
      </h1>

      <form
        class="space-y-6"
        @submit.prevent="submitForm"
      >
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              for="name"
              class="block text-sm font-medium text-gray-700"
            >物品名稱</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="mt-1 block w-full"
            >
          </div>

          <div class="sm:col-span-2">
            <label
              for="description"
              class="block text-sm font-medium text-gray-700"
            >物品描述</label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              class="mt-1 block w-full"
            ></textarea>
          </div>
        </div>

        <div class="border-t pt-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">
            尺寸與重量
          </h3>
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label
                for="length"
                class="block text-sm font-medium text-gray-700"
              >長度 (cm)</label>
              <input
                id="length"
                v-model="form.length"
                type="number"
                step="0.1"
                required
                class="mt-1 block w-full"
              >
            </div>
            <div>
              <label
                for="width"
                class="block text-sm font-medium text-gray-700"
              >寬度 (cm)</label>
              <input
                id="width"
                v-model="form.width"
                type="number"
                step="0.1"
                required
                class="mt-1 block w-full"
              >
            </div>
            <div>
              <label
                for="height"
                class="block text-sm font-medium text-gray-700"
              >高度 (cm)</label>
              <input
                id="height"
                v-model="form.height"
                type="number"
                step="0.1"
                required
                class="mt-1 block w-full"
              >
            </div>
            <div>
              <label
                for="weight"
                class="block text-sm font-medium text-gray-700"
              >重量 (kg)</label>
              <input
                id="weight"
                v-model="form.weight"
                type="number"
                step="0.1"
                required
                class="mt-1 block w-full"
              >
            </div>
          </div>
        </div>

        <div class="border-t pt-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">
            寄送地址
          </h3>
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label
                for="senderMerchantId"
                class="block text-sm font-medium text-gray-700"
              >寄件商家</label>
              <select
                id="senderMerchantId"
                v-model="form.senderMerchantId"
                required
                class="mt-1 block w-full"
                @change="updateSenderAddress"
              >
                <option value="">
                  請選擇寄件商家
                </option>
                <option
                  v-for="merchant in merchants"
                  :key="merchant.id"
                  :value="merchant.id"
                >
                  {{ merchant.name }} - {{ merchant.address.substring(0, 20) }}...
                </option>
              </select>

              <div
                v-if="form.senderMerchantId"
                class="mt-3 rounded-lg bg-gray-50 p-3"
              >
                <div class="text-sm font-medium text-gray-900">
                  寄件地址預覽
                </div>
                <div class="mt-1 text-sm text-gray-600">
                  {{ selectedSenderMerchant?.address }}
                </div>
                <div
                  v-if="selectedSenderMerchant?.phone"
                  class="mt-1 text-xs text-gray-500"
                >
                  📞 {{ selectedSenderMerchant.phone }}
                </div>
              </div>
            </div>
            <div>
              <label
                for="deliveryPointId"
                class="block text-sm font-medium text-gray-700"
              >收件地點</label>
              <select
                id="deliveryPointId"
                v-model="form.deliveryPointId"
                required
                class="mt-1 block w-full text-black"
                @change="updateReceiverAddress"
              >
                <option value="">
                  請選擇收件地點
                </option>
                <option
                  v-for="point in deliveryPoints"
                  :key="point.id"
                  :value="point.id"
                >
                  {{ point.type }} - {{ point.name }} ({{ point.address.substring(0, 20) }}...)
                </option>
              </select>

              <div
                v-if="form.deliveryPointId"
                class="mt-3 rounded-lg bg-gray-50 p-3"
              >
                <div class="text-sm font-medium text-gray-900">
                  收件地址預覽
                </div>
                <div class="mt-1 text-sm text-gray-600">
                  {{ selectedDeliveryPoint?.address }}
                </div>
                <div
                  v-if="selectedDeliveryPoint?.phone"
                  class="mt-1 text-xs text-gray-500"
                >
                  📞 {{ selectedDeliveryPoint.phone }}
                </div>
                <div
                  v-if="selectedDeliveryPoint?.openHours"
                  class="mt-1 text-xs text-gray-500"
                >
                  🕒 {{ selectedDeliveryPoint.openHours }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t pt-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">
            結帳商家
          </h3>

          <div class="mb-4 rounded-lg bg-blue-50 p-3">
            <p class="text-sm text-blue-800">
              💡 系統已自動選擇寄件商家作為結帳商家。如需使用不同的結帳商家，請勾選下方選項。
            </p>
          </div>

          <div class="mb-4">
            <label class="flex items-center">
              <input
                v-model="form.isCustomMerchant"
                type="checkbox"
              >
              <span class="ml-2 text-sm text-gray-700">使用不同的結帳商家</span>
            </label>
          </div>

          <div v-if="!form.isCustomMerchant">
            <label
              for="merchantId"
              class="block text-sm font-medium text-gray-700"
            >選擇商家</label>
            <select
              id="merchantId"
              v-model="form.merchantId"
              required
              class="mt-1 block w-full"
            >
              <option value="">
                請選擇商家
              </option>
              <option
                v-for="merchant in merchants"
                :key="merchant.id"
                :value="merchant.id"
              >
                {{ merchant.name }}
              </option>
            </select>
          </div>

          <div
            v-else
            class="grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <div>
              <label
                for="customMerchantName"
                class="block text-sm font-medium text-gray-700"
              >商家名稱</label>
              <input
                id="customMerchantName"
                v-model="form.customMerchant.name"
                type="text"
                required
                class="mt-1 block w-full"
              >
            </div>
            <div>
              <label
                for="customMerchantPhone"
                class="block text-sm font-medium text-gray-700"
              >聯絡電話</label>
              <input
                id="customMerchantPhone"
                v-model="form.customMerchant.phone"
                type="tel"
                required
                class="mt-1 block w-full"
              >
            </div>
            <div>
              <label
                for="customMerchantAddress"
                class="block text-sm font-medium text-gray-700"
              >商家地址</label>
              <input
                id="customMerchantAddress"
                v-model="form.customMerchant.address"
                type="text"
                required
                class="mt-1 block w-full"
              >
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-4 border-t pt-6">
          <NuxtLink
            to="/items"
            class="
              rounded-md border border-gray-300 bg-white px-4 py-2 text-sm
              font-medium text-gray-700
              hover:bg-gray-50
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
            "
          >
            取消
          </NuxtLink>
          <button
            type="submit"
            class="
              rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm
              font-medium text-white
              hover:bg-blue-700
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
            "
          >
            建立物品
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

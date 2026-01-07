<script lang="ts" setup>
useHead({
  title: '新建訂單 - 行李運送系統',
})

const router = useRouter()

const form = ref({
  lineName: '',
  phone: '',
  deliveryDate: '',
  pickupTime: '',
  luggageCount: 1,
  pickupLocationId: '',
  deliveryLocationId: '',
  notes: '',
})

const { data: deliveryPoints } = await useFetch('/api/delivery-points')

const selectedPickupLocation = computed(() => {
  if (!deliveryPoints.value)
    return null
  return deliveryPoints.value.find(point => point.id === form.value.pickupLocationId)
})

const selectedDeliveryLocation = computed(() => {
  if (!deliveryPoints.value)
    return null
  return deliveryPoints.value.find(point => point.id === form.value.deliveryLocationId)
})

async function submitForm() {
  try {
    await $fetch('/api/orders', {
      method: 'POST',
      body: form.value,
    })
    router.push('/orders')
  }
  catch (error) {
    console.error('建立訂單失敗:', error)
  }
}
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <h1 class="mb-6 text-2xl font-bold text-gray-900">
        新建訂單
      </h1>

      <form
        class="space-y-6"
        @submit.prevent="submitForm"
      >
        <!-- 客戶資訊 -->
        <div class="border-b pb-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">
            客戶資訊
          </h3>
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label
                for="lineName"
                class="block text-sm font-medium text-gray-700"
              >LINE 名稱</label>
              <input
                id="lineName"
                v-model="form.lineName"
                type="text"
                required
                class="mt-1 block w-full"
                placeholder="請輸入客戶的 LINE 名稱"
              >
            </div>

            <div>
              <label
                for="phone"
                class="block text-sm font-medium text-gray-700"
              >聯絡電話</label>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                required
                pattern="[0-9]{4}-[0-9]{3}-[0-9]{3}"
                class="mt-1 block w-full"
                placeholder="0912-345-678"
              >
              <p class="mt-1 text-xs text-gray-500">
                格式：0912-345-678
              </p>
            </div>
          </div>
        </div>

        <!-- 配送資訊 -->
        <div class="border-b pb-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">
            配送資訊
          </h3>
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label
                for="deliveryDate"
                class="block text-sm font-medium text-gray-700"
              >寄送日期</label>
              <input
                id="deliveryDate"
                v-model="form.deliveryDate"
                type="date"
                required
                class="mt-1 block w-full"
              >
            </div>

            <div>
              <label
                for="pickupTime"
                class="block text-sm font-medium text-gray-700"
              >收貨時間</label>
              <input
                id="pickupTime"
                v-model="form.pickupTime"
                type="time"
                required
                class="mt-1 block w-full"
              >
            </div>

            <div>
              <label
                for="luggageCount"
                class="block text-sm font-medium text-gray-700"
              >行李數量</label>
              <input
                id="luggageCount"
                v-model.number="form.luggageCount"
                type="number"
                min="1"
                max="10"
                required
                class="mt-1 block w-full"
              >
            </div>
          </div>
        </div>

        <!-- 地點資訊 -->
        <div class="border-b pb-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">
            地點資訊
          </h3>
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <!-- 起始點 -->
            <div>
              <label
                for="pickupLocationId"
                class="block text-sm font-medium text-gray-700"
              >起始點</label>
              <select
                id="pickupLocationId"
                v-model="form.pickupLocationId"
                required
                class="mt-1 block w-full"
              >
                <option value="">
                  請選擇起始點
                </option>
                <option
                  v-for="point in deliveryPoints"
                  :key="point.id"
                  :value="point.id"
                >
                  {{ point.type }} - {{ point.name }}
                </option>
              </select>

              <div
                v-if="selectedPickupLocation"
                class="mt-3 rounded-lg bg-gray-50 p-3"
              >
                <div class="text-sm font-medium text-gray-900">
                  地點資訊
                </div>
                <div class="mt-1 text-sm text-gray-600">
                  {{ selectedPickupLocation.address }}
                </div>
                <div
                  v-if="selectedPickupLocation.phone"
                  class="mt-1 text-xs text-gray-500"
                >
                  📞 {{ selectedPickupLocation.phone }}
                </div>
                <div
                  v-if="selectedPickupLocation.openHours"
                  class="mt-1 text-xs text-gray-500"
                >
                  🕒 {{ selectedPickupLocation.openHours }}
                </div>
              </div>
            </div>

            <!-- 送達點 -->
            <div>
              <label
                for="deliveryLocationId"
                class="block text-sm font-medium text-gray-700"
              >送達點</label>
              <select
                id="deliveryLocationId"
                v-model="form.deliveryLocationId"
                required
                class="mt-1 block w-full"
              >
                <option value="">
                  請選擇送達點
                </option>
                <option
                  v-for="point in deliveryPoints"
                  :key="point.id"
                  :value="point.id"
                >
                  {{ point.type }} - {{ point.name }}
                </option>
              </select>

              <div
                v-if="selectedDeliveryLocation"
                class="mt-3 rounded-lg bg-gray-50 p-3"
              >
                <div class="text-sm font-medium text-gray-900">
                  地點資訊
                </div>
                <div class="mt-1 text-sm text-gray-600">
                  {{ selectedDeliveryLocation.address }}
                </div>
                <div
                  v-if="selectedDeliveryLocation.phone"
                  class="mt-1 text-xs text-gray-500"
                >
                  📞 {{ selectedDeliveryLocation.phone }}
                </div>
                <div
                  v-if="selectedDeliveryLocation.openHours"
                  class="mt-1 text-xs text-gray-500"
                >
                  🕒 {{ selectedDeliveryLocation.openHours }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 備註 -->
        <div class="pb-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">
            備註
          </h3>
          <div>
            <label
              for="notes"
              class="block text-sm font-medium text-gray-700"
            >訂單備註（選填）</label>
            <textarea
              id="notes"
              v-model="form.notes"
              rows="3"
              class="mt-1 block w-full"
              placeholder="請輸入特殊需求或注意事項"
            ></textarea>
          </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="flex justify-end space-x-4 border-t pt-6">
          <NuxtLink
            to="/orders"
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
            建立訂單
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
useHead({
  title: '新建行程 - 物流管理系統',
})

const router = useRouter()

const form = ref({
  name: '',
  description: '',
  courierId: '',
  selectedItems: [] as string[],
  scheduledDate: '',
})

const { data: availableItems } = await useFetch('/api/items/available')
const { data: couriers } = await useFetch('/api/couriers')

function toggleItemSelection(itemId: string) {
  const index = form.value.selectedItems.indexOf(itemId)
  if (index > -1) {
    form.value.selectedItems.splice(index, 1)
  }
  else {
    form.value.selectedItems.push(itemId)
  }
}

async function submitForm() {
  if (form.value.selectedItems.length === 0) {
    // eslint-disable-next-line no-alert
    alert('請至少選擇一個物品')
    return
  }

  try {
    await $fetch('/api/trips', {
      method: 'POST',
      body: form.value,
    })
    router.push('/trips')
  }
  catch (error) {
    console.error('建立行程失敗:', error)
  }
}
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <h1 class="mb-6 text-2xl font-bold text-gray-900">
        新建行程
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
            >行程名稱</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="mt-1 block w-full"
            >
          </div>

          <div>
            <label
              for="scheduledDate"
              class="block text-sm font-medium text-gray-700"
            >預計日期</label>
            <input
              id="scheduledDate"
              v-model="form.scheduledDate"
              type="date"
              required
              class="mt-1 block w-full"
            >
          </div>
        </div>

        <div>
          <label
            for="description"
            class="block text-sm font-medium text-gray-700"
          >行程描述</label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            class="mt-1 block w-full"
          ></textarea>
        </div>

        <div>
          <label
            for="courierId"
            class="block text-sm font-medium text-gray-700"
          >指派快遞員</label>
          <select
            id="courierId"
            v-model="form.courierId"
            required
            class="mt-1 block w-full"
          >
            <option value="">
              請選擇快遞員
            </option>
            <option
              v-for="courier in couriers"
              :key="courier.id"
              :value="courier.id"
            >
              {{ courier.name }} - {{ courier.phone }}
            </option>
          </select>
        </div>

        <div class="border-t pt-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">
            選擇物品
          </h3>

          <div
            v-if="availableItems.length === 0"
            class="py-8 text-center text-gray-500"
          >
            沒有可用的物品，請先建立物品。
          </div>

          <div
            v-else
            class="space-y-4"
          >
            <div
              v-for="item in availableItems"
              :key="item.id"
              class="
                flex items-start space-x-3 rounded-lg border p-4
                hover:bg-gray-50
              "
            >
              <input
                :id="item.id"
                type="checkbox"
                :value="item.id"
                class="mt-1"
                @change="toggleItemSelection(item.id)"
              >
              <label
                :for="item.id"
                class="flex-1 cursor-pointer"
              >
                <div class="flex justify-between">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900">{{ item.name }}</h4>
                    <p class="text-sm text-gray-500">{{ item.description }}</p>
                    <p class="mt-1 text-xs text-gray-400">
                      尺寸: {{ item.dimensions.length }}×{{ item.dimensions.width }}×{{ item.dimensions.height }} cm,
                      重量: {{ item.weight }} kg
                    </p>
                  </div>
                  <div class="text-right text-sm text-gray-500">
                    <div>寄: {{ item.senderAddress.substring(0, 15) }}...</div>
                    <div>收: {{ item.receiverAddress.substring(0, 15) }}...</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div
            v-if="form.selectedItems.length > 0"
            class="mt-4 rounded-lg bg-blue-50 p-4"
          >
            <p class="text-sm text-blue-800">
              已選擇 {{ form.selectedItems.length }} 個物品
            </p>
          </div>
        </div>

        <div class="flex justify-end space-x-4 border-t pt-6">
          <NuxtLink
            to="/trips"
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
            :disabled="form.selectedItems.length === 0"
            class="
              rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm
              font-medium text-white
              hover:bg-blue-700
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
              disabled:cursor-not-allowed disabled:bg-gray-300
            "
          >
            建立行程
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

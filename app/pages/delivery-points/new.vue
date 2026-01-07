<script lang="ts" setup>
useHead({
  title: '新增收件地 - 物流管理系統',
})

const router = useRouter()

const form = ref({
  name: '',
  type: '7-11',
  storeId: '',
  address: '',
  phone: '',
  openHours: '',
  status: 'active',
})

const storeTypes = [
  { value: '7-11', label: '7-11' },
  { value: '全家', label: '全家便利商店' },
  { value: '萊爾富', label: '萊爾富' },
  { value: 'OK超商', label: 'OK超商' },
  { value: '其他', label: '其他' },
]

const statusOptions = [
  { value: 'active', label: '營業中' },
  { value: 'inactive', label: '暫停服務' },
]

async function submitForm() {
  try {
    await $fetch('/api/delivery-points', {
      method: 'POST',
      body: form.value,
    })
    router.push('/delivery-points')
  }
  catch (error) {
    console.error('新增收件地失敗:', error)
  }
}
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <h1 class="mb-6 text-2xl font-bold text-gray-900">
        新增收件地
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
            >收件地名稱</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="mt-1 block w-full"
              placeholder="例：台北車站門市"
            >
          </div>

          <div>
            <label
              for="type"
              class="block text-sm font-medium text-gray-700"
            >門市類型</label>
            <select
              id="type"
              v-model="form.type"
              required
              class="mt-1 block w-full"
            >
              <option
                v-for="storeType in storeTypes"
                :key="storeType.value"
                :value="storeType.value"
              >
                {{ storeType.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              for="storeId"
              class="block text-sm font-medium text-gray-700"
            >店鋪編號</label>
            <input
              id="storeId"
              v-model="form.storeId"
              type="text"
              class="mt-1 block w-full"
              placeholder="例：TW001、FM456"
            >
            <p class="mt-1 text-sm text-gray-500">
              便利商店的店鋪編號（選填）
            </p>
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
              class="mt-1 block w-full"
              placeholder="02-2312-1234"
            >
          </div>
        </div>

        <div>
          <label
            for="address"
            class="block text-sm font-medium text-gray-700"
          >完整地址</label>
          <textarea
            id="address"
            v-model="form.address"
            rows="3"
            required
            class="mt-1 block w-full"
            placeholder="請輸入完整的門市地址"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              for="openHours"
              class="block text-sm font-medium text-gray-700"
            >營業時間</label>
            <input
              id="openHours"
              v-model="form.openHours"
              type="text"
              class="mt-1 block w-full"
              placeholder="例：24小時、07:00-23:00"
            >
            <p class="mt-1 text-sm text-gray-500">
              門市的營業時間
            </p>
          </div>

          <div>
            <label
              for="status"
              class="block text-sm font-medium text-gray-700"
            >狀態</label>
            <select
              id="status"
              v-model="form.status"
              class="mt-1 block w-full"
            >
              <option
                v-for="status in statusOptions"
                :key="status.value"
                :value="status.value"
              >
                {{ status.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- 預覽區域 -->
        <div class="border-t pt-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">
            預覽
          </h3>
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div class="flex items-center">
              <div
                class="
                  flex h-8 w-8 flex-shrink-0 items-center justify-center
                  rounded-full text-sm font-medium
                "
                :class="
                  form.type === '7-11' 
                    ? 'bg-red-100 text-red-600'
                    : form.type === '全家'
                    ? 'bg-blue-100 text-blue-600'
                    : form.type === '萊爾富'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-purple-100 text-purple-600'
                "
              >
                {{ form.type.charAt(0) }}
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-900">
                  {{ form.name || '未填寫名稱' }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ form.storeId || '無店鋪編號' }}
                </div>
              </div>
            </div>
            <div class="mt-3 space-y-1 text-sm text-gray-600">
              <div v-if="form.address">
                📍 {{ form.address }}
              </div>
              <div v-if="form.phone">
                📞 {{ form.phone }}
              </div>
              <div v-if="form.openHours">
                🕒 {{ form.openHours }}
              </div>
              <div>
                <span
                  class="inline-flex rounded-full px-2 text-xs font-semibold leading-5"
                  :class="
                    form.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  "
                >
                  {{ form.status === 'active' ? '營業中' : '暫停服務' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-4 border-t pt-6">
          <NuxtLink
            to="/delivery-points"
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
            新增收件地
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
<script lang="ts" setup>
useHead({
  title: '新增運送點 - 物流管理系統',
})

const router = useRouter()

// 從 API 取得地點類型
const { data: stationTypes } = await useFetch('/api/stations/types')

const form = ref({
  name: '',
  type: stationTypes.value?.[0]?.id || 1,
  address: '',
  area: '',
  latitude: '',
  longitude: '',
})

async function submitForm() {
  try {
    await $fetch('/api/delivery-points', {
      method: 'POST',
      body: form.value,
    })
    router.push('/delivery-points')
  }
  catch (error) {
    console.error('新增運送點失敗:', error)
    alert('新增失敗，請稍後再試')
  }
}
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <h1 class="mb-6 text-2xl font-bold text-gray-900">
        新增運送點
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
            >運送點名稱</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="
                mt-1 block w-full rounded-md border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
              "
              placeholder="例：碼頭門市"
            >
          </div>

          <div>
            <label
              for="type"
              class="block text-sm font-medium text-gray-700"
            >地點類型</label>
            <select
              id="type"
              v-model="form.type"
              required
              class="
                mt-1 block w-full rounded-md border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
              "
            >
              <option
                v-for="stationType in stationTypes"
                :key="stationType.id"
                :value="stationType.id"
              >
                {{ stationType.name }}
              </option>
            </select>
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
            class="
              mt-1 block w-full rounded-md border-gray-300 shadow-sm
              focus:border-blue-500 focus:ring-blue-500
            "
            placeholder="請輸入完整的地址"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <label
              for="area"
              class="block text-sm font-medium text-gray-700"
            >區域</label>
            <input
              id="area"
              v-model="form.area"
              type="text"
              class="
                mt-1 block w-full rounded-md border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
              "
              placeholder="例：A、B、C"
            >
            <p class="mt-1 text-sm text-gray-500">
              配送區域代碼（選填）
            </p>
          </div>

          <div>
            <label
              for="latitude"
              class="block text-sm font-medium text-gray-700"
            >緯度</label>
            <input
              id="latitude"
              v-model="form.latitude"
              type="text"
              class="
                mt-1 block w-full rounded-md border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
              "
              placeholder="22.4645"
            >
          </div>

          <div>
            <label
              for="longitude"
              class="block text-sm font-medium text-gray-700"
            >經度</label>
            <input
              id="longitude"
              v-model="form.longitude"
              type="text"
              class="
                mt-1 block w-full rounded-md border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
              "
              placeholder="120.4517"
            >
          </div>
        </div>

        <!-- 預覽區域 -->
        <div class="border-t pt-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">
            預覽
          </h3>
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div class="space-y-2 text-sm text-gray-600">
              <div class="text-base font-medium text-gray-900">
                {{ form.name || '未填寫名稱' }}
              </div>
              <div v-if="form.address">
                📍 {{ form.address }}
              </div>
              <div v-if="form.area">
                🗺️ 區域：{{ form.area }}
              </div>
              <div v-if="form.latitude && form.longitude">
                🧭 座標：{{ form.latitude }}, {{ form.longitude }}
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
            新增運送點
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

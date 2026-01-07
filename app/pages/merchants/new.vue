<script lang="ts" setup>
useHead({
  title: '新增商家 - 物流管理系統',
})

const router = useRouter()

const form = ref({
  name: '',
  phone: '',
  address: '',
  type: 'partner',
})

async function submitForm() {
  try {
    await $fetch('/api/merchants', {
      method: 'POST',
      body: form.value,
    })
    router.push('/merchants')
  }
  catch (error) {
    console.error('新增商家失敗:', error)
  }
}
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <h1 class="mb-6 text-2xl font-bold text-gray-900">
        新增商家
      </h1>

      <form
        class="space-y-6"
        @submit.prevent="submitForm"
      >
        <div>
          <label
            for="name"
            class="block text-sm font-medium text-gray-700"
          >商家名稱</label>
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
            for="phone"
            class="block text-sm font-medium text-gray-700"
          >聯絡電話</label>
          <input
            id="phone"
            v-model="form.phone"
            type="tel"
            required
            class="mt-1 block w-full"
          >
        </div>

        <div>
          <label
            for="address"
            class="block text-sm font-medium text-gray-700"
          >商家地址</label>
          <textarea
            id="address"
            v-model="form.address"
            rows="3"
            required
            class="mt-1 block w-full"
          ></textarea>
        </div>

        <div>
          <label
            for="type"
            class="block text-sm font-medium text-gray-700"
          >商家類型</label>
          <select
            id="type"
            v-model="form.type"
            class="mt-1 block w-full"
          >
            <option value="partner">
              合作商家
            </option>
            <option value="temporary">
              臨時商家
            </option>
          </select>
        </div>

        <div class="flex justify-end space-x-4 border-t pt-6">
          <NuxtLink
            to="/merchants"
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
            新增商家
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

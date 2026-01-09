<script lang="ts" setup>
const route = useRoute()
const router = useRouter()
const merchantId = route.params.id as string

useHead({
  title: '編輯商家 - 行李運送系統',
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

// 取得商家類型選項
const { data: types } = await useFetch('/api/stations/types')

// 取得商家現有資料
const { data: merchant, error } = await useFetch<Merchant>(`/api/merchants/${merchantId}`)

if (error.value || !merchant.value) {
  throw createError({
    statusCode: 404,
    message: '找不到此商家',
  })
}

// 初始化表單資料
const form = ref({
  name: merchant.value.name || '',
  contactPerson: merchant.value.contactPerson || '',
  phone: merchant.value.phone || '',
  email: merchant.value.email || '',
  address: merchant.value.address || '',
  type: merchant.value.type || 1,
  area: merchant.value.area || 'A',
  isActive: merchant.value.isActive !== undefined ? merchant.value.isActive : true,
  isCollaborate: merchant.value.isCollaborate || false,
  maxUsageCounts: merchant.value.maxUsageCounts || null,
  remarks: merchant.value.remarks || '',
})

const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function handleSubmit() {
  if (isSubmitting.value)
    return

  errorMessage.value = ''
  successMessage.value = ''

  if (!form.value.name || !form.value.address) {
    errorMessage.value = '請填寫商家名稱和地址'
    return
  }

  isSubmitting.value = true

  try {
    const response = await $fetch<{ success: boolean }>(`/api/merchants/${merchantId}`, {
      method: 'PUT' as const,
      body: form.value,
    })

    if (response.success) {
      successMessage.value = '商家更新成功！'
      setTimeout(() => {
        router.push(`/merchants/${merchantId}`)
      }, 1500)
    }
  }
  catch (error: unknown) {
    console.error('更新商家失敗:', error)
    errorMessage.value = (error as { data?: { message?: string } })?.data?.message || '更新商家失敗，請稍後再試'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="rounded-lg bg-white shadow">
    <div class="px-4 py-5 sm:p-6">
      <div class="mb-6 flex items-center gap-4">
        <NuxtLink
          :to="`/merchants/${merchantId}`"
          class="
            rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
            font-medium text-gray-700 shadow-sm
            hover:bg-gray-50
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            focus:outline-none
          "
        >
          ← 返回
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900">
          編輯商家
        </h1>
      </div>

      <!-- 錯誤訊息 -->
      <div
        v-if="errorMessage"
        class="mb-4 rounded-md bg-red-50 p-4"
      >
        <div class="flex">
          <div class="text-sm text-red-800">
            {{ errorMessage }}
          </div>
        </div>
      </div>

      <!-- 成功訊息 -->
      <div
        v-if="successMessage"
        class="mb-4 rounded-md bg-green-50 p-4"
      >
        <div class="flex">
          <div class="text-sm text-green-800">
            {{ successMessage }}
          </div>
        </div>
      </div>

      <form
        class="space-y-6"
        @submit.prevent="handleSubmit"
      >
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              for="name"
              class="block text-sm font-medium text-gray-700"
            >商家名稱 *</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="
                mt-1 block w-full rounded-md border border-gray-300 px-3 py-2
                shadow-sm
                focus:border-blue-500 focus:ring-blue-500 focus:outline-none
              "
            >
          </div>

          <div>
            <label
              for="contactPerson"
              class="block text-sm font-medium text-gray-700"
            >聯絡人</label>
            <input
              id="contactPerson"
              v-model="form.contactPerson"
              type="text"
              class="
                mt-1 block w-full rounded-md border border-gray-300 px-3 py-2
                shadow-sm
                focus:border-blue-500 focus:ring-blue-500 focus:outline-none
              "
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
              class="
                mt-1 block w-full rounded-md border border-gray-300 px-3 py-2
                shadow-sm
                focus:border-blue-500 focus:ring-blue-500 focus:outline-none
              "
            >
          </div>

          <div>
            <label
              for="email"
              class="block text-sm font-medium text-gray-700"
            >電子郵件</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="
                mt-1 block w-full rounded-md border border-gray-300 px-3 py-2
                shadow-sm
                focus:border-blue-500 focus:ring-blue-500 focus:outline-none
              "
            >
          </div>

          <div class="sm:col-span-2">
            <label
              for="address"
              class="block text-sm font-medium text-gray-700"
            >商家地址 *</label>
            <textarea
              id="address"
              v-model="form.address"
              rows="2"
              required
              class="
                mt-1 block w-full rounded-md border border-gray-300 px-3 py-2
                shadow-sm
                focus:border-blue-500 focus:ring-blue-500 focus:outline-none
              "
            ></textarea>
          </div>

          <div>
            <label
              for="type"
              class="block text-sm font-medium text-gray-700"
            >商家類型</label>
            <select
              id="type"
              v-model.number="form.type"
              class="
                mt-1 block w-full rounded-md border border-gray-300 px-3 py-2
                shadow-sm
                focus:border-blue-500 focus:ring-blue-500 focus:outline-none
              "
            >
              <option
                v-for="type in types"
                :key="type.id"
                :value="type.id"
              >
                {{ type.name }}
              </option>
            </select>
          </div>

          <div>
            <label
              for="area"
              class="block text-sm font-medium text-gray-700"
            >區域</label>
            <select
              id="area"
              v-model="form.area"
              class="
                mt-1 block w-full rounded-md border border-gray-300 px-3 py-2
                shadow-sm
                focus:border-blue-500 focus:ring-blue-500 focus:outline-none
              "
            >
              <option value="A">
                區域 A
              </option>
              <option value="B">
                區域 B
              </option>
              <option value="C">
                區域 C
              </option>
              <option value="D">
                區域 D
              </option>
            </select>
          </div>

          <div>
            <label
              for="maxUsageCounts"
              class="block text-sm font-medium text-gray-700"
            >最大使用次數</label>
            <input
              id="maxUsageCounts"
              v-model.number="form.maxUsageCounts"
              type="number"
              min="0"
              class="
                mt-1 block w-full rounded-md border border-gray-300 px-3 py-2
                shadow-sm
                focus:border-blue-500 focus:ring-blue-500 focus:outline-none
              "
            >
          </div>

          <div class="flex flex-col gap-2 text-sm text-gray-500">
            <p>票券 ID: {{ merchant?.voucherId || '尚未生成' }}</p>
            <p class="text-xs">
              提示：經緯度資訊請至「運送點管理」頁面編輯
            </p>
          </div>

          <div></div>

          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2">
              <input
                v-model="form.isActive"
                type="checkbox"
                class="
                  rounded border-gray-300 text-blue-600
                  focus:ring-blue-500
                "
              >
              <span class="text-sm font-medium text-gray-700">啟用狀態</span>
            </label>

            <label class="flex items-center gap-2">
              <input
                v-model="form.isCollaborate"
                type="checkbox"
                class="
                  rounded border-gray-300 text-blue-600
                  focus:ring-blue-500
                "
              >
              <span class="text-sm font-medium text-gray-700">合作商家</span>
            </label>
          </div>

          <div class="sm:col-span-2">
            <label
              for="remarks"
              class="block text-sm font-medium text-gray-700"
            >備註</label>
            <textarea
              id="remarks"
              v-model="form.remarks"
              rows="3"
              placeholder="商家備註資訊"
              class="
                mt-1 block w-full rounded-md border border-gray-300 px-3 py-2
                shadow-sm
                focus:border-blue-500 focus:ring-blue-500 focus:outline-none
              "
            ></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-3 border-t pt-6">
          <NuxtLink
            :to="`/merchants/${merchantId}`"
            class="
              rounded-md border border-gray-300 bg-white px-4 py-2 text-sm
              font-medium text-gray-700 shadow-sm
              hover:bg-gray-50
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
            "
          >
            取消
          </NuxtLink>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="
              rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm
              font-medium text-white
              hover:bg-blue-700
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:outline-none
              disabled:opacity-50
            "
          >
            {{ isSubmitting ? '更新中...' : '更新商家' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

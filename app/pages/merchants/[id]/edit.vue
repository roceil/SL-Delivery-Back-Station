<script lang="ts" setup>
const route = useRoute()
const router = useRouter()
const locationId = route.params.id as string

useHead({
  title: '編輯合作地點 - 行李運送系統',
})

const locationTypes = [
  { value: 'pier', label: '碼頭', icon: '🚢' },
  { value: 'dive_shop', label: '潛水店', icon: '🤿' },
  { value: 'hostel', label: '民宿', icon: '🏠' },
  { value: 'attraction', label: '景點', icon: '🏝️' },
]

// Fetch existing location data
const { data: location, error } = await useFetch(`/api/merchants/${locationId}`)

if (error.value || !location.value) {
  throw createError({
    statusCode: 404,
    message: '找不到此合作地點',
  })
}

// Initialize form with existing data
const form = ref({
  name: location.value.name,
  address: location.value.address,
  type: location.value.type,
  area: location.value.area,
  phone: location.value.phone,
  openingHours: location.value.openingHours,
  description: location.value.description,
  features: [...location.value.features],
  notes: location.value.notes,
  partnerSince: location.value.partnerSince,
  voucherStock: location.value.voucherStock,
})

const newFeature = ref('')
const isSubmitting = ref(false)

function addFeature() {
  if (!newFeature.value.trim())
    return

  form.value.features.push(newFeature.value.trim())
  newFeature.value = ''
}

function removeFeature(index: number) {
  form.value.features.splice(index, 1)
}

async function handleSubmit() {
  if (isSubmitting.value)
    return

  isSubmitting.value = true

  try {
    await $fetch(`/api/merchants/${locationId}`, {
      method: 'PUT',
      body: form.value,
    })

    router.push(`/merchants/${locationId}`)
  }
  catch (error) {
    console.error('更新地點失敗:', error)
    alert('更新地點失敗，請稍後再試')
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
          :to="`/merchants/${locationId}`"
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
          編輯地點
        </h1>
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
            >地點名稱 *</label>
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
              for="phone"
              class="block text-sm font-medium text-gray-700"
            >聯絡電話 *</label>
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              required
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
            >地點地址 *</label>
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
            >地點類型 *</label>
            <select
              id="type"
              v-model="form.type"
              required
              class="
                mt-1 block w-full rounded-md border border-gray-300 px-3 py-2
                shadow-sm
                focus:border-blue-500 focus:ring-blue-500 focus:outline-none
              "
            >
              <option
                v-for="locationType in locationTypes"
                :key="locationType.value"
                :value="locationType.value"
              >
                {{ locationType.icon }} {{ locationType.label }}
              </option>
            </select>
          </div>

          <div>
            <label
              for="area"
              class="block text-sm font-medium text-gray-700"
            >商家區域 *</label>
            <select
              id="area"
              v-model="form.area"
              required
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
              for="openingHours"
              class="block text-sm font-medium text-gray-700"
            >營業時間 *</label>
            <input
              id="openingHours"
              v-model="form.openingHours"
              type="text"
              required
              placeholder="例: 08:00 - 20:00"
              class="
                mt-1 block w-full rounded-md border border-gray-300 px-3 py-2
                shadow-sm
                focus:border-blue-500 focus:ring-blue-500 focus:outline-none
              "
            >
          </div>

          <div class="sm:col-span-2">
            <label
              for="description"
              class="block text-sm font-medium text-gray-700"
            >地點說明 *</label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              required
              class="
                mt-1 block w-full rounded-md border border-gray-300 px-3 py-2
                shadow-sm
                focus:border-blue-500 focus:ring-blue-500 focus:outline-none
              "
            ></textarea>
          </div>

          <div class="sm:col-span-2">
            <label
              for="features"
              class="block text-sm font-medium text-gray-700"
            >提供服務</label>
            <div class="mt-2 flex gap-2">
              <input
                id="features"
                v-model="newFeature"
                type="text"
                placeholder="輸入服務項目後按新增"
                class="
                  block w-full rounded-md border border-gray-300 px-3 py-2
                  shadow-sm
                  focus:border-blue-500 focus:ring-blue-500 focus:outline-none
                "
                @keyup.enter="addFeature"
              >
              <button
                type="button"
                class="
                  rounded-md border border-transparent bg-blue-600 px-4 py-2
                  text-sm font-medium text-white
                  hover:bg-blue-700
                  focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  focus:outline-none
                "
                @click="addFeature"
              >
                新增
              </button>
            </div>
            <div
              v-if="form.features.length > 0"
              class="mt-3 flex flex-wrap gap-2"
            >
              <span
                v-for="(feature, index) in form.features"
                :key="index"
                class="
                  inline-flex items-center gap-1 rounded-full bg-blue-50 px-3
                  py-1 text-sm font-medium text-blue-700
                "
              >
                {{ feature }}
                <button
                  type="button"
                  class="text-blue-500 hover:text-blue-700"
                  @click="removeFeature(index)"
                >
                  ×
                </button>
              </span>
            </div>
          </div>

          <div class="sm:col-span-2">
            <label
              for="notes"
              class="block text-sm font-medium text-gray-700"
            >重要提醒</label>
            <textarea
              id="notes"
              v-model="form.notes"
              rows="2"
              placeholder="特殊注意事項或提醒事項"
              class="
                mt-1 block w-full rounded-md border border-gray-300 px-3 py-2
                shadow-sm
                focus:border-blue-500 focus:ring-blue-500 focus:outline-none
              "
            ></textarea>
          </div>

          <div>
            <label
              for="partnerSince"
              class="block text-sm font-medium text-gray-700"
            >合作開始日期 *</label>
            <input
              id="partnerSince"
              v-model="form.partnerSince"
              type="date"
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
              for="voucherStock"
              class="block text-sm font-medium text-gray-700"
            >票卷庫存數量 *</label>
            <input
              id="voucherStock"
              v-model.number="form.voucherStock"
              type="number"
              required
              min="0"
              class="
                mt-1 block w-full rounded-md border border-gray-300 px-3 py-2
                shadow-sm
                focus:border-blue-500 focus:ring-blue-500 focus:outline-none
              "
            >
          </div>
        </div>

        <div class="flex justify-end gap-3 border-t pt-6">
          <NuxtLink
            :to="`/merchants/${locationId}`"
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
            {{ isSubmitting ? '更新中...' : '更新地點' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

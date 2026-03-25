<script lang="ts" setup>
import { ArrowLeft, MapPin, Route } from 'lucide-vue-next'

useHead({
  title: '新增運送點 - 物流管理系統',
})

const { setBreadcrumb, clearBreadcrumb } = useBreadcrumb()

onMounted(() => {
  setBreadcrumb({ label: '新增運送點' })
})

onBeforeRouteLeave(() => {
  clearBreadcrumb()
})

const router = useRouter()

const { data: stationTypes } = await useFetch<{ id: number, name: string }[]>('/api/stations/types')

const form = ref({
  name: '',
  type: stationTypes.value?.[0]?.id ?? 1,
  address: '',
  latitude: '',
  longitude: '',
  area: '',
})

const hasData = computed(() => !!(form.value.name || form.value.address))

const selectedTypeName = computed(() => {
  return stationTypes.value?.find(t => t.id === form.value.type)?.name ?? ''
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
  }
}
</script>

<template>
  <div class="flex min-h-full flex-col gap-4 bg-neutral-100 p-8">
    <!-- 頁面標題 -->
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="
          flex items-center justify-center rounded-full p-2
          hover:bg-neutral-200
        "
        @click="router.push('/delivery-points')"
      >
        <ArrowLeft class="size-4 text-neutral-900" />
      </button>
      <h4 class="text-2xl font-bold tracking-[1.2px] text-neutral-900">
        新增運送點
      </h4>
    </div>

    <!-- 主要內容 -->
    <form
      class="grid grid-cols-12 items-start gap-4"
      @submit.prevent="submitForm"
    >
      <!-- 左欄：運送點資訊 -->
      <div
        class="
          col-span-8 flex flex-1 flex-col gap-4 rounded-md bg-white p-6
          shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
        "
      >
        <div class="flex items-center gap-2">
          <Route class="size-5 text-neutral-600" />
          <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
            運送點資訊
          </h2>
        </div>

        <div class="flex flex-col gap-4">
          <!-- 運送點名稱 -->
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium tracking-[0.7px] text-neutral-600">
              運送點名稱
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="請輸入 Google 地圖上的全銜"
              class="
                rounded-xs border border-neutral-200 px-3 py-2 text-base
                tracking-[0.8px] text-neutral-900 outline-none
                placeholder:text-neutral-400
                focus:border-neutral-400
              "
            >
          </div>

          <!-- 運送點類型 -->
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium tracking-[0.7px] text-neutral-600">
              運送點類型
            </label>
            <Select v-model="form.type">
              <SelectTrigger
                class="rounded-xs border-neutral-200 bg-white text-neutral-900"
              >
                <SelectValue placeholder="請選擇類型" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem
                    v-for="t in stationTypes"
                    :key="t.id"
                    :value="t.id"
                  >
                    {{ t.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <!-- 地址 -->
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium tracking-[0.7px] text-neutral-600">
              地址
            </label>
            <input
              v-model="form.address"
              type="text"
              required
              placeholder="屏東縣琉球鄉仁愛路52之7號"
              class="
                rounded-xs border border-neutral-200 px-3 py-2 text-base
                tracking-[0.8px] text-neutral-900 outline-none
                placeholder:text-neutral-400
                focus:border-neutral-400
              "
            >
          </div>

          <!-- 經度 -->
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium tracking-[0.7px] text-neutral-600">
              經度
            </label>
            <input
              v-model="form.longitude"
              type="text"
              placeholder="120.3743899"
              class="
                rounded-xs border border-neutral-200 px-3 py-2 text-base
                tracking-[0.8px] text-neutral-900 outline-none
                placeholder:text-neutral-400
                focus:border-neutral-400
              "
            >
          </div>

          <!-- 緯度 -->
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium tracking-[0.7px] text-neutral-600">
              緯度
            </label>
            <input
              v-model="form.latitude"
              type="text"
              placeholder="22.3372317"
              class="
                rounded-xs border border-neutral-200 px-3 py-2 text-base
                tracking-[0.8px] text-neutral-900 outline-none
                placeholder:text-neutral-400
                focus:border-neutral-400
              "
            >
          </div>

          <!-- 區域（選填） -->
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium tracking-[0.7px] text-neutral-600">
              區域
              <span
                class="text-xs font-normal tracking-[0.6px] text-neutral-400"
              >（選填）</span>
            </label>
            <input
              v-model="form.area"
              type="text"
              placeholder="區域 D"
              class="
                rounded-xs border border-neutral-200 px-3 py-2 text-base
                tracking-[0.8px] text-neutral-900 outline-none
                placeholder:text-neutral-400
                focus:border-neutral-400
              "
            >
          </div>
        </div>
      </div>

      <!-- 右欄：運送點摘要 -->
      <div
        class="
          sticky top-8 col-span-4 shrink-0 rounded-md bg-white p-6
          shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
        "
      >
        <div class="mb-4 flex items-center gap-2">
          <MapPin class="size-5 text-neutral-600" />
          <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
            運送點摘要
          </h2>
        </div>

        <!-- 預覽卡片 -->
        <div
          class="
            mb-4 overflow-hidden rounded-sm border border-neutral-200 bg-white
          "
        >
          <!-- 有資料時顯示摘要 -->
          <template v-if="hasData">
            <div class="w-full space-y-2 p-6">
              <p class="text-lg font-bold tracking-[0.9px] text-primary-400">
                {{ form.name || '-' }}
              </p>
              <div class="h-px bg-neutral-200"></div>
              <div class="flex flex-col gap-2 text-base tracking-[0.8px]">
                <div
                  v-if="form.address"
                  class="flex gap-3"
                >
                  <span class="min-w-[76px] text-neutral-600">地址</span>
                  <span class="text-neutral-900">{{ form.address }}</span>
                </div>
                <div class="flex gap-3">
                  <span class="min-w-[76px] text-neutral-600">類型</span>
                  <span class="text-neutral-900">{{ selectedTypeName || '-' }}</span>
                </div>
                <div
                  v-if="form.longitude"
                  class="flex gap-3"
                >
                  <span class="min-w-[76px] text-neutral-600">經度</span>
                  <span class="text-neutral-900">{{ form.longitude }}</span>
                </div>
                <div
                  v-if="form.latitude"
                  class="flex gap-3"
                >
                  <span class="min-w-[76px] text-neutral-600">緯度</span>
                  <span class="text-neutral-900">{{ form.latitude }}</span>
                </div>
                <div
                  v-if="form.area"
                  class="flex gap-3"
                >
                  <span class="min-w-[76px] text-neutral-600">區域</span>
                  <span class="text-neutral-900">{{ form.area }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- 無資料時顯示空白狀態 -->
          <template v-else>
            <div class="flex flex-col items-center gap-2 bg-neutral-100 py-4">
              <svg
                class="size-[80px] text-neutral-300"
                fill="none"
                viewBox="0 0 120 120"
                stroke="currentColor"
              >
                <rect
                  x="20"
                  y="35"
                  width="80"
                  height="60"
                  rx="8"
                  stroke-width="4"
                />
                <path
                  d="M40 35V28a20 20 0 0 1 40 0v7"
                  stroke-width="4"
                />
                <circle
                  cx="60"
                  cy="65"
                  r="8"
                  stroke-width="4"
                />
                <line
                  x1="60"
                  y1="73"
                  x2="60"
                  y2="82"
                  stroke-width="4"
                />
              </svg>
              <p class="text-base tracking-[0.8px] text-neutral-600">
                尚未填寫資料
              </p>
            </div>
          </template>
        </div>

        <!-- 立即新增按鈕 -->
        <button
          type="submit"
          class="
            w-full rounded-sm bg-primary-400 py-2 text-base font-medium
            tracking-[0.8px] text-white transition-colors
            hover:bg-primary-500
          "
        >
          立即新增
        </button>
      </div>
    </form>
  </div>
</template>

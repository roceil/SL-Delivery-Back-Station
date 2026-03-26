<script lang="ts" setup>
import { ArrowLeft, MapPin, Settings2, Store, UserRound } from 'lucide-vue-next'

useHead({
  title: '新增商家 - 物流管理系統',
})

const { setBreadcrumb, clearBreadcrumb } = useBreadcrumb()

onMounted(() => {
  setBreadcrumb({ label: '新增商家' })
})

onBeforeRouteLeave(() => {
  clearBreadcrumb()
})

const router = useRouter()

const { data: stationTypes } = await useFetch<{ id: number, name: string }[]>('/api/stations/types')

const form = ref({
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  type: stationTypes.value?.[0]?.id ?? 1,
  area: '',
  isActive: false,
  isCollaborate: false,
  latitude: '',
  longitude: '',
})

const hasData = computed(() => !!(form.value.name || form.value.address))

const selectedTypeName = computed(() => {
  return stationTypes.value?.find(t => t.id === form.value.type)?.name ?? ''
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
  <div class="flex min-h-full flex-col gap-4 bg-neutral-100 p-8">
    <!-- 頁面標題 -->
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="
          flex items-center justify-center rounded-full p-2
          hover:bg-neutral-200
        "
        @click="router.push('/merchants')"
      >
        <ArrowLeft class="size-4 text-neutral-900" />
      </button>
      <h4 class="text-2xl font-bold tracking-[1.2px] text-neutral-900">
        新增商家
      </h4>
    </div>

    <!-- 主要內容 -->
    <form
      class="grid grid-cols-12 items-start gap-4"
      @submit.prevent="submitForm"
    >
      <!-- 左欄 -->
      <div class="col-span-8 flex flex-col gap-4">
        <!-- 商家資訊 -->
        <div
          class="
            rounded-md bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <div class="mb-4 flex items-center gap-2">
            <UserRound class="size-5 text-neutral-600" />
            <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
              商家資訊
            </h2>
          </div>

          <div class="flex flex-col gap-4">
            <!-- 商家名稱 -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >
                商家名稱
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="建議填寫 Google 地圖上的商家名稱"
                class="
                  rounded-xs border border-neutral-200 px-3 py-2 text-base
                  tracking-[0.8px] text-neutral-900 outline-none
                  placeholder:text-neutral-400
                  focus:border-neutral-400
                "
              >
            </div>

            <!-- 聯絡人 -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >
                聯絡人
              </label>
              <input
                v-model="form.contactPerson"
                type="text"
                placeholder="王大明"
                class="
                  rounded-xs border border-neutral-200 px-3 py-2 text-base
                  tracking-[0.8px] text-neutral-900 outline-none
                  placeholder:text-neutral-400
                  focus:border-neutral-400
                "
              >
            </div>

            <!-- 聯絡電話 -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >
                聯絡電話
              </label>
              <input
                v-model="form.phone"
                type="tel"
                placeholder="0912345678"
                class="
                  rounded-xs border border-neutral-200 px-3 py-2 text-base
                  tracking-[0.8px] text-neutral-900 outline-none
                  placeholder:text-neutral-400
                  focus:border-neutral-400
                "
              >
            </div>

            <!-- Email -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >
                Email
              </label>
              <input
                v-model="form.email"
                type="email"
                placeholder="helloworld@gmail.com"
                class="
                  rounded-xs border border-neutral-200 px-3 py-2 text-base
                  tracking-[0.8px] text-neutral-900 outline-none
                  placeholder:text-neutral-400
                  focus:border-neutral-400
                "
              >
            </div>

            <!-- 地址 -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >
                地址
              </label>
              <input
                v-model="form.address"
                type="text"
                required
                placeholder="屏東縣琉球鄉仁愛路53號"
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

        <!-- 營運設定 -->
        <div
          class="
            rounded-md bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <div class="mb-4 flex items-center gap-2">
            <Settings2 class="size-5 text-neutral-600" />
            <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
              營運設定
            </h2>
          </div>

          <div class="flex flex-col gap-4">
            <!-- 商家類型 -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >
                商家類型
              </label>
              <Select v-model="form.type">
                <SelectTrigger
                  class="
                    rounded-xs border-neutral-200 bg-white text-neutral-900
                  "
                >
                  <SelectValue placeholder="請選擇商家類型" />
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

            <!-- 區域 -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >
                區域
              </label>
              <Select v-model="form.area">
                <SelectTrigger
                  class="
                    rounded-xs border-neutral-200 bg-white text-neutral-900
                  "
                >
                  <SelectValue placeholder="請選擇區域" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="A">
                      區域 A
                    </SelectItem>
                    <SelectItem value="B">
                      區域 B
                    </SelectItem>
                    <SelectItem value="C">
                      區域 C
                    </SelectItem>
                    <SelectItem value="D">
                      區域 D
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <!-- 啟用狀態 / 合作狀態 -->
            <div class="flex gap-4">
              <!-- 啟用狀態 -->
              <div class="flex flex-1 items-center justify-between">
                <span
                  class="text-sm font-medium tracking-[0.7px] text-neutral-600"
                >
                  啟用狀態
                </span>
                <div class="flex items-center gap-2">
                  <span class="text-sm tracking-[0.7px] text-neutral-600">
                    {{ form.isActive ? '啟用中' : '停用' }}
                  </span>
                  <button
                    type="button"
                    class="
                      relative inline-flex h-6 w-11 shrink-0 cursor-pointer
                      rounded-full transition-colors duration-200
                    "
                    :class="form.isActive ? 'bg-primary-400' : 'bg-neutral-300'"
                    @click="form.isActive = !form.isActive"
                  >
                    <span
                      class="
                        mt-0.5 inline-block size-5 rounded-full bg-white shadow
                        transition-transform duration-200
                      "
                      :class="form.isActive ? 'translate-x-5' : `
                        translate-x-0.5
                      `"
                    ></span>
                  </button>
                </div>
              </div>

              <div class="w-px bg-neutral-200"></div>

              <!-- 合作狀態 -->
              <div class="flex flex-1 items-center justify-between">
                <span
                  class="text-sm font-medium tracking-[0.7px] text-neutral-600"
                >
                  合作狀態
                </span>
                <div class="flex items-center gap-2">
                  <span class="text-sm tracking-[0.7px] text-neutral-600">
                    {{ form.isCollaborate ? '合作中' : '暫停合作' }}
                  </span>
                  <button
                    type="button"
                    class="
                      relative inline-flex h-6 w-11 shrink-0 cursor-pointer
                      rounded-full transition-colors duration-200
                    "
                    :class="form.isCollaborate ? 'bg-primary-400' : `
                      bg-neutral-300
                    `"
                    @click="form.isCollaborate = !form.isCollaborate"
                  >
                    <span
                      class="
                        mt-0.5 inline-block size-5 rounded-full bg-white shadow
                        transition-transform duration-200
                      "
                      :class="form.isCollaborate ? 'translate-x-5' : `
                        translate-x-0.5
                      `"
                    ></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 經緯度 -->
        <div
          class="
            rounded-md bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <div class="mb-4 flex items-center gap-2">
            <MapPin class="size-5 text-neutral-600" />
            <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
              經緯度
            </h2>
          </div>

          <div class="flex flex-col gap-4">
            <!-- 經度 -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >
                經度
                <span
                  class="text-xs font-normal tracking-[0.6px] text-neutral-400"
                >（選填）</span>
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
              <label
                class="text-sm font-medium tracking-[0.7px] text-neutral-600"
              >
                緯度
                <span
                  class="text-xs font-normal tracking-[0.6px] text-neutral-400"
                >（選填）</span>
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
          </div>
        </div>
      </div>

      <!-- 右欄：預覽 -->
      <div
        class="
          sticky top-8 col-span-4 shrink-0 rounded-md bg-white p-6
          shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
        "
      >
        <div class="mb-4 flex items-center gap-2">
          <Store class="size-5 text-neutral-600" />
          <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
            預覽
          </h2>
        </div>

        <!-- 預覽卡片 -->
        <div class="mb-4 rounded-sm border border-neutral-200 bg-white">
          <template v-if="hasData">
            <div class="flex flex-col gap-4 p-4">
              <!-- 商家名稱 -->
              <p class="text-lg font-bold tracking-[0.9px] text-primary-400">
                {{ form.name || '-' }}
              </p>

              <!-- 商家資訊 -->
              <div class="flex flex-col gap-3">
                <div class="h-px bg-neutral-200"></div>
                <p class="text-base font-bold tracking-[0.8px] text-neutral-900">
                  商家資訊
                </p>
                <div class="flex flex-col gap-2 text-base tracking-[0.8px]">
                  <div class="flex items-start gap-3">
                    <span class="min-w-[76px] text-neutral-600">聯絡人</span>
                    <span class="text-neutral-900">{{ form.contactPerson || '-' }}</span>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="min-w-[76px] text-neutral-600">聯絡電話</span>
                    <span class="text-neutral-900">{{ form.phone || '-' }}</span>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="min-w-[76px] text-neutral-600">Email</span>
                    <span class="break-all text-neutral-900">{{ form.email || '-' }}</span>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="min-w-[76px] text-neutral-600">地址</span>
                    <span class="text-neutral-900">{{ form.address || '-' }}</span>
                  </div>
                </div>
              </div>

              <!-- 營運設定 -->
              <div class="flex flex-col gap-3">
                <div class="h-px bg-neutral-200"></div>
                <p class="text-base font-bold tracking-[0.8px] text-neutral-900">
                  營運設定
                </p>
                <div class="flex flex-col gap-2 text-base tracking-[0.8px]">
                  <div class="flex items-center gap-3">
                    <span class="min-w-[76px] text-neutral-600">商家類型</span>
                    <span class="text-neutral-900">{{ selectedTypeName || '-' }}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="min-w-[76px] text-neutral-600">區域</span>
                    <span class="text-neutral-900">{{ form.area ? `區域 ${form.area}` : '-' }}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="min-w-[76px] text-neutral-600">啟用狀態</span>
                    <span class="text-neutral-900">{{ form.isActive ? '啟用中' : '停用' }}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="min-w-[76px] text-neutral-600">合作狀態</span>
                    <span class="text-neutral-900">{{ form.isCollaborate ? '合作中' : '暫停合作' }}</span>
                  </div>
                </div>
              </div>

              <!-- 經緯度 -->
              <div class="flex flex-col gap-3">
                <div class="h-px bg-neutral-200"></div>
                <p class="text-base font-bold tracking-[0.8px] text-neutral-900">
                  經緯度
                </p>
                <div class="flex flex-col gap-2 text-base tracking-[0.8px]">
                  <div class="flex items-start gap-3">
                    <span class="min-w-[76px] text-neutral-600">經度</span>
                    <span class="text-neutral-900">{{ form.longitude || '-' }}</span>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="min-w-[76px] text-neutral-600">緯度</span>
                    <span class="text-neutral-900">{{ form.latitude || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="flex flex-col items-center gap-2 bg-neutral-100 p-4">
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

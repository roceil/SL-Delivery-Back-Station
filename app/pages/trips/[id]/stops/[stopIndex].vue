<script lang="ts" setup>
import { Edit2, Minus, Plus, Store, Truck, X } from 'lucide-vue-next'

useHead({ title: '站點詳情 - 物流管理系統' })

const router = useRouter()
const route = useRoute()
const tripId = route.params.id as string
const stopIndex = Number(route.params.stopIndex)

interface StopOrder {
  id: string
  lineName: string
  orderNumber: string
  luggageCount: number
  status: string
  notes?: string
  isSale?: boolean
}

const { data: stopData, error: stopError } = await useFetch<{
  index: number
  name: string
  totalStops: number
  pickups: StopOrder[]
  deliveries: StopOrder[]
}>(`/api/trips/${tripId}/stops/${stopIndex}`)

if (stopError.value) {
  throw createError({ statusCode: 404, message: '找不到站點資料' })
}

const pickupKeyword = ref('')
const deliveryKeyword = ref('')

const filteredPickups = computed(() => {
  const pickups = stopData.value?.pickups ?? []
  if (!pickupKeyword.value)
    return pickups
  const kw = pickupKeyword.value.toLowerCase()
  return pickups.filter(o =>
    o.lineName.toLowerCase().includes(kw) || o.orderNumber.toLowerCase().includes(kw),
  )
})

const filteredDeliveries = computed(() => {
  const deliveries = stopData.value?.deliveries ?? []
  if (!deliveryKeyword.value)
    return deliveries
  const kw = deliveryKeyword.value.toLowerCase()
  return deliveries.filter(o =>
    o.lineName.toLowerCase().includes(kw) || o.orderNumber.toLowerCase().includes(kw),
  )
})

const totalPickupLuggage = computed(() =>
  (stopData.value?.pickups ?? []).reduce((s, o) => s + o.luggageCount, 0),
)
const totalDeliveryLuggage = computed(() =>
  (stopData.value?.deliveries ?? []).reduce((s, o) => s + o.luggageCount, 0),
)

// 補登訂單彈窗
interface AddOrderForm {
  lineName: string
  phone: string
  luggageCount: number
  notes: string
}
interface SpecialItem {
  name: string
  price: string
  count: number
}

const showAddOrderModal = ref(false)
const addOrderForms = ref<AddOrderForm[]>([
  { lineName: '', phone: '', luggageCount: 1, notes: '' },
])
const valueAddedEnabled = ref(false)
const largeQty = ref(1)
const equipmentQty = ref(2)
const specialItems = ref<SpecialItem[]>([])

function addOrderForm() {
  addOrderForms.value.push({ lineName: '', phone: '', luggageCount: 1, notes: '' })
}
function addSpecialItem() {
  specialItems.value.push({ name: '', price: '', count: 1 })
}
function removeSpecialItem(idx: number) {
  specialItems.value.splice(idx, 1)
}
function closeAddOrderModal() {
  showAddOrderModal.value = false
  addOrderForms.value = [{ lineName: '', phone: '', luggageCount: 1, notes: '' }]
  valueAddedEnabled.value = false
  largeQty.value = 1
  equipmentQty.value = 2
  specialItems.value = []
}
</script>

<template>
  <div class="flex min-h-full flex-col gap-4 bg-neutral-100 p-8">
    <!-- 標題列 -->
    <div class="flex items-baseline gap-2">
      <button
        type="button"
        class="
          flex items-center justify-center rounded-full p-2
          hover:bg-neutral-200
        "
        @click="router.push(`/trips/${tripId}`)"
      >
        <svg
          class="size-4 text-neutral-900"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 18l-6-6 6-6"
          />
        </svg>
      </button>
      <h4 class="text-2xl font-bold tracking-[1.2px] text-neutral-900">
        第{{ stopIndex + 1 }}站｜{{ stopData?.name }}
      </h4>
    </div>

    <!-- 主內容 -->
    <div class="grid grid-cols-12 items-start gap-4">
      <!-- 左欄 -->
      <div class="col-span-8 flex flex-col gap-4">
        <!-- 攬件卡片 -->
        <div
          v-if="(stopData?.pickups?.length ?? 0) > 0"
          class="
            flex flex-col gap-4 rounded-2xl bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <!-- Header -->
          <div class="flex items-center gap-3">
            <Truck class="size-5 shrink-0 text-[#3087db]" />
            <span class="text-lg font-bold tracking-[0.9px] text-[#3087db]">攬件</span>
            <span class="text-sm tracking-[0.7px] text-neutral-600">
              共 {{ totalPickupLuggage }} 件
            </span>
            <div class="ml-auto flex items-center gap-2">
              <div class="relative">
                <svg
                  class="
                    absolute top-1/2 left-3 size-4 -translate-y-1/2
                    text-neutral-400
                  "
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                  />
                </svg>
                <input
                  v-model="pickupKeyword"
                  type="text"
                  placeholder="旅客姓名、民宿或訂單編號"
                  class="
                    w-[260px] rounded-xs border border-neutral-200 bg-white py-2
                    pr-3 pl-9 text-base tracking-[0.7px] text-neutral-900
                    outline-none
                    placeholder:text-neutral-500
                    focus:border-neutral-400
                  "
                >
              </div>
              <div class="relative">
                <select
                  class="
                    w-[169px] appearance-none rounded-xs border
                    border-neutral-200 bg-white py-2 pr-8 pl-3 text-base
                    tracking-[0.7px] text-neutral-500 outline-none
                    focus:border-neutral-400
                  "
                >
                  <option
                    value=""
                    disabled
                    selected
                  >
                    請選擇訂單狀態
                  </option>
                </select>
                <svg
                  class="
                    pointer-events-none absolute top-1/2 right-3 size-5
                    -translate-y-1/2 text-neutral-400
                  "
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <!-- 訂單列表 -->
          <div class="flex flex-col gap-2">
            <div
              v-for="order in filteredPickups"
              :key="order.id"
              class="flex flex-col gap-0.5 rounded-sm bg-neutral-100 p-3"
            >
              <div class="flex items-center gap-2">
                <span
                  class="
                    text-base font-medium tracking-[0.8px] text-neutral-900
                  "
                >
                  {{ order.lineName }}
                </span>
                <span
                  class="
                    rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium
                    text-neutral-600
                  "
                >
                  {{ order.status }}
                </span>
              </div>
              <div>
                <span class="text-sm tracking-[0.7px] text-neutral-600">
                  {{ order.luggageCount }} 件
                </span>
                <span class="text-sm text-neutral-400"> · </span>
                <span class="text-sm tracking-[0.7px] text-neutral-600">
                  {{ order.orderNumber }}
                </span>
                <template v-if="order.isSale">
                  <span class="text-sm text-neutral-400"> · </span>
                  <span class="text-sm tracking-[0.7px] text-neutral-600">代售</span>
                </template>
              </div>
              <p
                v-if="order.notes"
                class="text-sm tracking-[0.7px] text-neutral-600"
              >
                {{ order.notes }}
              </p>
              <div
                v-if="order.isSale"
                class="flex justify-end gap-6 pt-1"
              >
                <button
                  type="button"
                  class="
                    flex items-center gap-1.5 text-sm font-medium
                    tracking-[0.7px] text-neutral-600
                    hover:text-neutral-900
                  "
                >
                  <Edit2 class="size-5" />
                  編輯
                </button>
                <button
                  type="button"
                  class="
                    flex items-center gap-1.5 text-sm font-medium
                    tracking-[0.7px] text-primary-400
                    hover:text-primary-500
                  "
                >
                  <svg
                    class="size-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M17 17H17.01M17 14A5 5 0 1 0 7 9V17H17V14ZM3 17H7M17 17H21M12 9V3M9 3H15"
                    />
                  </svg>
                  列印訂單
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 放置卡片 -->
        <div
          v-if="(stopData?.deliveries?.length ?? 0) > 0"
          class="
            flex flex-col gap-4 rounded-2xl bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <!-- Header -->
          <div class="flex items-center gap-3">
            <Store class="size-5 shrink-0 text-[#229464]" />
            <span class="text-lg font-bold tracking-[0.9px] text-[#229464]">放置</span>
            <span class="text-sm tracking-[0.7px] text-neutral-600">
              共 {{ totalDeliveryLuggage }} 件
            </span>
            <div class="ml-auto flex items-center gap-2">
              <div class="relative">
                <svg
                  class="
                    absolute top-1/2 left-3 size-4 -translate-y-1/2
                    text-neutral-400
                  "
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                  />
                </svg>
                <input
                  v-model="deliveryKeyword"
                  type="text"
                  placeholder="旅客姓名、民宿或訂單編號"
                  class="
                    w-[260px] rounded-xs border border-neutral-200 bg-white py-2
                    pr-3 pl-9 text-base tracking-[0.7px] text-neutral-900
                    outline-none
                    placeholder:text-neutral-500
                    focus:border-neutral-400
                  "
                >
              </div>
              <div class="relative">
                <select
                  class="
                    w-[169px] appearance-none rounded-xs border
                    border-neutral-200 bg-white py-2 pr-8 pl-3 text-base
                    tracking-[0.7px] text-neutral-500 outline-none
                    focus:border-neutral-400
                  "
                >
                  <option
                    value=""
                    disabled
                    selected
                  >
                    請選擇訂單狀態
                  </option>
                </select>
                <svg
                  class="
                    pointer-events-none absolute top-1/2 right-3 size-5
                    -translate-y-1/2 text-neutral-400
                  "
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <!-- 訂單列表 -->
          <div class="flex flex-col gap-2">
            <div
              v-for="order in filteredDeliveries"
              :key="order.id"
              class="flex flex-col gap-0.5 rounded-sm bg-neutral-100 p-3"
            >
              <div class="flex items-center gap-2">
                <span
                  class="
                    text-base font-medium tracking-[0.8px] text-neutral-900
                  "
                >
                  {{ order.lineName }}
                </span>
                <span
                  class="
                    rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium
                    text-neutral-600
                  "
                >
                  {{ order.status }}
                </span>
              </div>
              <div>
                <span class="text-sm tracking-[0.7px] text-neutral-600">
                  {{ order.luggageCount }} 件
                </span>
                <span class="text-sm text-neutral-400"> · </span>
                <span class="text-sm tracking-[0.7px] text-neutral-600">
                  {{ order.orderNumber }}
                </span>
              </div>
              <p
                v-if="order.notes"
                class="text-sm tracking-[0.7px] text-neutral-600"
              >
                {{ order.notes }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右欄：快速操作 -->
      <div
        class="
          col-span-4 flex flex-col gap-3 rounded-2xl border border-[#8cbcf1]
          bg-white p-6 shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
        "
      >
        <span class="text-lg font-bold tracking-[0.9px] text-neutral-900">快速操作</span>

        <button
          type="button"
          class="
            flex w-full items-center justify-center gap-2 rounded-sm border
            border-neutral-200 bg-white px-4 py-2 text-base font-medium
            tracking-[0.8px] text-neutral-900 transition-colors
            hover:bg-neutral-50
          "
          @click="showAddOrderModal = true"
        >
          <Plus class="size-5 text-neutral-600" />
          補登訂單
        </button>

        <button
          type="button"
          class="
            flex w-full items-center justify-center gap-2 rounded-sm border
            border-neutral-200 bg-white px-4 py-2 text-base font-medium
            tracking-[0.8px] text-neutral-900 transition-colors
            hover:bg-neutral-50
          "
        >
          <Store class="size-5 text-neutral-600" />
          聯絡商家
        </button>
      </div>
    </div>
  </div>

  <!-- 補登訂單彈窗 -->
  <Teleport to="body">
    <div
      v-if="showAddOrderModal"
      class="
        fixed inset-0 z-50 flex items-center justify-center
        bg-[rgba(33,37,41,0.6)] backdrop-blur-[12px]
      "
      @click.self="closeAddOrderModal"
    >
      <div
        class="
          relative flex h-[760px] w-[1080px] flex-col overflow-hidden
          rounded-2xl border border-neutral-200 bg-white
          shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
        "
      >
        <!-- 關閉按鈕 -->
        <button
          type="button"
          class="
            absolute top-2 right-2 z-10 flex items-center justify-center
            rounded-full p-2
            hover:bg-neutral-100
          "
          @click="closeAddOrderModal"
        >
          <X class="size-4 text-neutral-600" />
        </button>

        <!-- 主要內容區（左 + 右） -->
        <div class="grid flex-1 grid-cols-12 overflow-hidden">
          <!-- 左側表單區 -->
          <div class="col-span-9 flex flex-col gap-6 overflow-y-auto p-8">
            <!-- 標題列 -->
            <div class="flex items-center justify-between">
              <h4 class="text-2xl font-bold tracking-[1.2px] text-neutral-900">
                補登訂單
              </h4>
              <button
                type="button"
                class="
                  flex items-center gap-1.5 rounded-sm border border-primary-400
                  px-4 py-2 text-sm font-medium tracking-[0.7px]
                  text-primary-400 transition-colors
                  hover:bg-neutral-50
                "
                @click="addOrderForm"
              >
                新增一筆
              </button>
            </div>

            <!-- 訂單表單列表 -->
            <div
              v-for="(form, idx) in addOrderForms"
              :key="idx"
              class="flex flex-col gap-4"
            >
              <!-- 旅客資訊卡片 -->
              <div
                class="
                  overflow-hidden rounded-2xl border border-[#8cbcf1]
                  shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
                "
              >
                <!-- 卡片 Header -->
                <div class="flex items-center gap-3 bg-[#f4f9ff] px-4 py-3">
                  <span
                    class="
                      flex size-7 items-center justify-center rounded-full
                      bg-[#eaf5ff] text-xs font-bold text-[#3087db]
                    "
                  >{{ idx + 1 }}</span>
                  <span
                    class="
                      text-base font-bold tracking-[0.8px] text-neutral-900
                    "
                  >請填寫旅客資訊</span>
                </div>

                <!-- 表單欄位 -->
                <div class="flex flex-col gap-3 p-4">
                  <!-- 姓名 -->
                  <div class="flex flex-col gap-1">
                    <label
                      class="
                        text-sm font-medium tracking-[0.7px] text-neutral-600
                      "
                    >姓名</label>
                    <input
                      v-model="form.lineName"
                      type="text"
                      placeholder="王大明"
                      class="
                        w-full rounded-xs border border-neutral-200 bg-white
                        px-3 py-2 text-base tracking-[0.8px] text-neutral-900
                        outline-none
                        placeholder:text-neutral-500
                        focus:border-neutral-400
                      "
                    >
                  </div>

                  <!-- 聯絡電話 + 行李件數 -->
                  <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                      <label
                        class="
                          text-sm font-medium tracking-[0.7px] text-neutral-600
                        "
                      >聯絡電話</label>
                      <input
                        v-model="form.phone"
                        type="tel"
                        placeholder="0912345678"
                        class="
                          w-full rounded-xs border border-neutral-200 bg-white
                          px-3 py-2 text-base tracking-[0.8px] text-neutral-900
                          outline-none
                          placeholder:text-neutral-500
                          focus:border-neutral-400
                        "
                      >
                    </div>
                    <div class="flex flex-col gap-1">
                      <label
                        class="
                          text-sm font-medium tracking-[0.7px] text-neutral-600
                        "
                      >行李件數</label>
                      <div
                        class="
                          flex h-10 items-center gap-3 rounded-xs bg-neutral-100
                          px-3 py-2
                        "
                      >
                        <button
                          type="button"
                          class="
                            flex items-center rounded-full p-2 transition-colors
                            hover:bg-neutral-200
                          "
                          @click="form.luggageCount = Math.max(1, form.luggageCount - 1)"
                        >
                          <Minus class="size-4 text-neutral-900" />
                        </button>
                        <span
                          class="
                            flex-1 text-center text-base tracking-[0.8px]
                            text-neutral-900
                          "
                        >{{ form.luggageCount }}</span>
                        <button
                          type="button"
                          class="
                            flex items-center rounded-full p-2 transition-colors
                            hover:bg-neutral-200
                          "
                          @click="form.luggageCount++"
                        >
                          <Plus class="size-4 text-neutral-900" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- 備註 -->
                  <div class="flex flex-col gap-1">
                    <label
                      class="
                        text-sm font-medium tracking-[0.7px] text-neutral-600
                      "
                    >備註<span class="text-neutral-400">（選填）</span></label>
                    <textarea
                      v-model="form.notes"
                      rows="3"
                      maxlength="50"
                      placeholder="例如行李尺寸、易碎物品等"
                      class="
                        w-full resize-none rounded-xs border border-neutral-200
                        bg-white px-3 py-2 text-base tracking-[0.8px]
                        text-neutral-900 outline-none
                        placeholder:text-neutral-500
                        focus:border-neutral-400
                      "
                    ></textarea>
                    <div class="flex justify-end px-1">
                      <span class="text-xs tracking-[0.6px] text-neutral-600">
                        {{ form.notes.length }}/50
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 加值服務卡片 -->
              <div class="flex flex-col gap-4 rounded-2xl bg-neutral-100 p-6">
                <div class="flex items-center justify-between">
                  <span
                    class="text-lg font-bold tracking-[0.9px] text-neutral-900"
                  >加值服務</span>
                  <!-- Toggle Switch -->
                  <button
                    type="button"
                    class="
                      relative flex h-6 w-11 items-center rounded-full p-0.5
                      transition-colors
                    "
                    :class="
                      valueAddedEnabled ? 'bg-primary-300' : 'bg-neutral-300'
                    "
                    @click="valueAddedEnabled = !valueAddedEnabled"
                  >
                    <span
                      class="
                        size-5 rounded-full bg-white shadow-sm
                        transition-transform
                      "
                      :class="
                        valueAddedEnabled ? 'translate-x-5' : 'translate-x-0'
                      "
                    ></span>
                  </button>
                </div>

                <template v-if="valueAddedEnabled">
                  <div class="grid grid-cols-2 gap-4">
                    <!-- 大型行李箱 -->
                    <div
                      class="
                        flex flex-col gap-3 rounded-xl border border-neutral-200
                        bg-white p-4
                      "
                    >
                      <div class="flex items-start gap-3">
                        <div class="flex flex-1 flex-col gap-1">
                          <div class="flex items-start gap-2">
                            <div
                              class="
                                mt-0.5 w-1 self-stretch rounded-xs
                                bg-gradient-to-br from-[#4090e8] to-[#306cf7]
                              "
                            ></div>
                            <span
                              class="
                                text-base font-bold tracking-[0.8px]
                                text-neutral-900
                              "
                            >大型行李箱</span>
                          </div>
                          <span
                            class="text-sm tracking-[0.7px] text-neutral-600"
                          >29 寸以上</span>
                        </div>
                        <span
                          class="
                            text-sm font-bold tracking-[0.7px] text-primary-400
                          "
                        >+NT$ 50 / 件</span>
                      </div>
                      <div
                        class="
                          flex h-10 items-center gap-3 rounded-xs bg-neutral-100
                          px-3 py-2
                        "
                      >
                        <button
                          type="button"
                          class="
                            flex items-center rounded-full p-2 transition-colors
                            hover:bg-neutral-200
                          "
                          @click="largeQty = Math.max(0, largeQty - 1)"
                        >
                          <Minus class="size-4 text-neutral-900" />
                        </button>
                        <span
                          class="
                            flex-1 text-center text-base tracking-[0.8px]
                            text-neutral-900
                          "
                        >{{ largeQty }}</span>
                        <button
                          type="button"
                          class="
                            flex items-center rounded-full p-2 transition-colors
                            hover:bg-neutral-200
                          "
                          @click="largeQty++"
                        >
                          <Plus class="size-4 text-neutral-900" />
                        </button>
                      </div>
                    </div>

                    <!-- 專業裝備 -->
                    <div
                      class="
                        flex flex-col gap-3 rounded-xl border border-neutral-200
                        bg-white p-4
                      "
                    >
                      <div class="flex items-start gap-3">
                        <div class="flex flex-1 flex-col gap-1">
                          <div class="flex items-start gap-2">
                            <div
                              class="
                                mt-0.5 w-1 self-stretch rounded-xs
                                bg-gradient-to-br from-[#4090e8] to-[#306cf7]
                              "
                            ></div>
                            <span
                              class="
                                text-base font-bold tracking-[0.8px]
                                text-neutral-900
                              "
                            >專業裝備</span>
                          </div>
                          <span
                            class="text-sm tracking-[0.7px] text-neutral-600"
                          >潛水裝備、高爾夫球袋</span>
                        </div>
                        <span
                          class="
                            text-sm font-bold tracking-[0.7px] text-primary-400
                          "
                        >+NT$ 100 / 件</span>
                      </div>
                      <div
                        class="
                          flex h-10 items-center gap-3 rounded-xs bg-neutral-100
                          px-3 py-2
                        "
                      >
                        <button
                          type="button"
                          class="
                            flex items-center rounded-full p-2 transition-colors
                            hover:bg-neutral-200
                          "
                          @click="equipmentQty = Math.max(0, equipmentQty - 1)"
                        >
                          <Minus class="size-4 text-neutral-900" />
                        </button>
                        <span
                          class="
                            flex-1 text-center text-base tracking-[0.8px]
                            text-neutral-900
                          "
                        >{{ equipmentQty }}</span>
                        <button
                          type="button"
                          class="
                            flex items-center rounded-full p-2 transition-colors
                            hover:bg-neutral-200
                          "
                          @click="equipmentQty++"
                        >
                          <Plus class="size-4 text-neutral-900" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- 特殊物件 -->
                  <div
                    class="
                      flex flex-col gap-3 rounded-xl border border-neutral-200
                      bg-white p-4
                    "
                  >
                    <div class="flex items-start gap-2">
                      <div class="flex flex-1 flex-col gap-0.5">
                        <div class="flex items-start gap-2">
                          <div
                            class="
                              mt-0.5 w-1 self-stretch rounded-xs
                              bg-gradient-to-br from-[#4090e8] to-[#306cf7]
                            "
                          ></div>
                          <span
                            class="
                              text-base font-bold tracking-[0.8px]
                              text-neutral-900
                            "
                          >特殊物件</span>
                        </div>
                        <span
                          class="text-sm tracking-[0.7px] text-neutral-600"
                        >如衝浪板、腳踏車、嬰兒推車等</span>
                      </div>
                      <button
                        type="button"
                        class="
                          flex items-center gap-2 rounded-xl border
                          border-primary-400 px-4 py-2 text-sm font-medium
                          tracking-[0.7px] text-primary-400 transition-colors
                          hover:bg-neutral-50
                        "
                        @click="addSpecialItem"
                      >
                        <Plus class="size-5" />
                        新增物件
                      </button>
                    </div>

                    <template v-if="specialItems.length > 0">
                      <!-- 表頭 -->
                      <div
                        class="
                          grid grid-cols-[1fr_1fr_1fr_32px] items-center gap-3
                        "
                      >
                        <span
                          class="
                            text-sm font-medium tracking-[0.7px]
                            text-neutral-600
                          "
                        >物件</span>
                        <span
                          class="
                            text-sm font-medium tracking-[0.7px]
                            text-neutral-600
                          "
                        >單價 NTD</span>
                        <span
                          class="
                            text-sm font-medium tracking-[0.7px]
                            text-neutral-600
                          "
                        >件數</span>
                        <div></div>
                      </div>

                      <!-- 資料列 -->
                      <div
                        v-for="(item, itemIdx) in specialItems"
                        :key="itemIdx"
                        class="
                          grid grid-cols-[1fr_1fr_1fr_32px] items-center gap-3
                        "
                      >
                        <select
                          v-model="item.name"
                          class="
                            w-full rounded-xs border border-neutral-200 bg-white
                            px-3 py-2 text-base text-neutral-900 outline-none
                            focus:border-neutral-400
                          "
                        >
                          <option value="">
                            衝浪板
                          </option>
                          <option value="腳踏車">
                            腳踏車
                          </option>
                          <option value="嬰兒推車">
                            嬰兒推車
                          </option>
                        </select>
                        <input
                          v-model="item.price"
                          type="text"
                          placeholder="50"
                          class="
                            w-full rounded-xs border border-neutral-200 bg-white
                            px-3 py-2 text-base tracking-[0.8px]
                            text-neutral-900 outline-none
                            placeholder:text-neutral-500
                            focus:border-neutral-400
                          "
                        >
                        <div
                          class="
                            flex h-10 items-center gap-3 rounded-xs
                            bg-neutral-100 px-3 py-2
                          "
                        >
                          <button
                            type="button"
                            class="
                              flex items-center rounded-full p-1.5
                              transition-colors
                              hover:bg-neutral-200
                            "
                            @click="item.count = Math.max(1, item.count - 1)"
                          >
                            <Minus class="size-4 text-neutral-900" />
                          </button>
                          <span
                            class="
                              flex-1 text-center text-base tracking-[0.8px]
                              text-neutral-900
                            "
                          >{{ item.count }}</span>
                          <button
                            type="button"
                            class="
                              flex items-center rounded-full p-1.5
                              transition-colors
                              hover:bg-neutral-200
                            "
                            @click="item.count++"
                          >
                            <Plus class="size-4 text-neutral-900" />
                          </button>
                        </div>
                        <button
                          type="button"
                          class="
                            flex items-center justify-center rounded-full p-1
                            hover:bg-neutral-100
                          "
                          @click="removeSpecialItem(itemIdx)"
                        >
                          <X class="size-4 text-neutral-400" />
                        </button>
                      </div>
                    </template>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- 右側票券資訊 -->
          <div
            class="
              col-span-3 flex flex-col gap-4 border-l border-neutral-200 p-6
            "
          >
            <span class="text-base font-bold tracking-[0.8px] text-neutral-900">票券資訊</span>

            <div class="flex flex-col gap-3">
              <div class="flex flex-col gap-1 rounded-sm bg-neutral-100 p-4">
                <span class="text-sm tracking-[0.7px] text-neutral-600">代售商家</span>
                <span
                  class="
                    text-base font-medium tracking-[0.8px] text-neutral-900
                  "
                >{{ stopData?.name }}</span>
              </div>
              <div class="flex flex-col gap-1 rounded-sm bg-neutral-100 p-4">
                <span class="text-sm tracking-[0.7px] text-neutral-600">剩餘票券</span>
                <span
                  class="
                    text-base font-medium tracking-[0.8px] text-neutral-900
                  "
                >50</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="
            flex shrink-0 gap-3 px-8 py-4
            shadow-[0px_-4px_20px_0px_rgba(32,78,184,0.12)]
          "
        >
          <button
            type="button"
            class="
              flex-1 rounded-sm border border-neutral-200 bg-white py-2.5
              text-base font-medium tracking-[0.8px] text-neutral-900
              transition-colors
              hover:bg-neutral-50
            "
            @click="closeAddOrderModal"
          >
            取消
          </button>
          <button
            type="button"
            class="
              flex-1 rounded-sm bg-primary-400 py-2.5 text-base font-medium
              tracking-[0.8px] text-white transition-colors
              hover:bg-primary-500
            "
          >
            立即補登
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

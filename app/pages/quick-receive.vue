<script setup lang="ts">
/**
 * 此頁面的訂單資料目前為完整假資料（`order` 物件），待串接掃描 QR Code → API 查詢訂單後替換。
 *
 * 【orders 資料表 — 待新增欄位】
 * - payment_status  VARCHAR  付款狀態（'paid' | 'unpaid'），對應假資料 `order.paymentStatus`
 * - service_plan    VARCHAR  服務方案（'round_trip' | 'one_way' | 'merchant'），對應 `order.servicePlan`
 *
 * 其餘欄位（status、category、luggageCount 等）應已存在於 orders 資料表中。
 */
import { AlertCircle, Minus, Plus, ReceiptText, RefreshCw, ScanLine, X } from 'lucide-vue-next'

useHead({ title: '快速收件 - 行李運送系統' })

type PageState = 'scanning' | 'orderFound'

const pageState = ref<PageState>('scanning')
const manualOrderNumber = ref('')

// 加值服務 toggles
const adjustLuggage = ref(false)
const additionalLuggage = ref(1)
const valueServices = ref(false)
const largeLuggageCount = ref(1)
const professionalEquipmentCount = ref(2)

interface SpecialItem {
  name: string
  price: number | string
  count: number
}

const specialItems = ref<SpecialItem[]>([
  { name: '衝浪板', price: 200, count: 1 },
])

// Mock 訂單資料
const order = {
  id: 'LSE12345670',
  category: '散客',
  status: '待交付',
  paymentStatus: '已付款',
  passenger: '池昌旭',
  servicePlan: '雙程套票',
  luggageCount: 2,
  tripDateOut: '2026/2/10',
  tripDateReturn: '2026/2/14',
  pickupLocation: '碼頭門市',
  deliveryLocation: '小琉球樂嶼海景民宿',
  amount: 500,
  unitPrice: 250,
}

const hasExtraPayment = computed(() => adjustLuggage.value || valueServices.value)

const extraPaymentTotal = computed(() => {
  let total = 0
  if (adjustLuggage.value)
    total += additionalLuggage.value * 250
  if (valueServices.value) {
    total += largeLuggageCount.value * 50
    total += professionalEquipmentCount.value * 100
    specialItems.value.forEach((item) => {
      total += (Number(item.price) || 0) * item.count
    })
  }
  return total
})

function handleScan() {
  pageState.value = 'orderFound'
}

function handleRescan() {
  pageState.value = 'scanning'
  manualOrderNumber.value = ''
  adjustLuggage.value = false
  additionalLuggage.value = 1
  valueServices.value = false
  largeLuggageCount.value = 1
  professionalEquipmentCount.value = 2
  specialItems.value = [{ name: '衝浪板', price: 200, count: 1 }]
}

function addSpecialItem() {
  specialItems.value.push({ name: '', price: 0, count: 0 })
}

function removeSpecialItem(index: number) {
  specialItems.value.splice(index, 1)
}
</script>

<template>
  <div
    class="flex min-h-full flex-col gap-4 p-8"
    :class="pageState === 'orderFound' ? 'bg-neutral-100' : 'bg-neutral-0'"
  >
    <!-- 0.2.1：掃描訂單狀態 -->
    <template v-if="pageState === 'scanning'">
      <!-- QR Code 掃描區 -->
      <div
        class="
          flex flex-col items-center justify-center gap-6 rounded-md border
          border-[#8cbcf1] bg-neutral-100 p-8
        "
      >
        <ScanLine class="size-16 text-neutral-600" />
        <div class="w-full text-center">
          <h2 class="text-h4 font-bold tracking-wider text-neutral-900">
            請掃描 QR Code
          </h2>
          <p class="text-h6 mt-2 font-normal tracking-wider text-neutral-600">
            將掃碼機對準訂單條碼
          </p>
        </div>
      </div>

      <!-- 無法掃描手動輸入區 -->
      <div class="rounded-md bg-neutral-100 p-8">
        <p class="text-h6 mb-3 font-medium tracking-wider text-neutral-900">
          無法掃描？
        </p>
        <div class="flex items-center gap-2">
          <input
            v-model="manualOrderNumber"
            type="text"
            placeholder="輸入訂單編號來核銷"
            class="
              w-[311px] rounded-xs border border-neutral-200 bg-neutral-0 px-3
              py-2 text-base tracking-wider text-neutral-900 outline-none
              placeholder:text-neutral-500
            "
          >
          <button
            class="
              rounded-sm bg-primary-300 px-4 py-2 text-base font-medium
              tracking-wider text-neutral-0
              hover:bg-primary-400
            "
            @click="handleScan"
          >
            查詢
          </button>
        </div>
      </div>
    </template>

    <!-- 0.2.2 / 0.2.3：訂單確認頁狀態 -->
    <template v-else>
      <!-- 頁面標題列 -->
      <div class="flex items-baseline justify-between">
        <h1 class="text-2xl font-bold tracking-wider text-neutral-900">
          快速收件
        </h1>
        <button
          class="
            flex items-center gap-2 rounded-sm px-4 py-2 text-base font-medium
            tracking-wider text-neutral-600
            hover:bg-neutral-200
          "
          @click="handleRescan"
        >
          <RefreshCw class="size-5" />
          重新掃描
        </button>
      </div>

      <!-- 主要內容：左右兩欄 -->
      <div class="flex items-start gap-4">
        <!-- 左欄 -->
        <div class="flex min-w-0 flex-1 flex-col gap-6">
          <!-- 訂單資訊卡 -->
          <div
            class="
              overflow-hidden rounded-md border border-[#8cbcf1] bg-neutral-0
              shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <!-- 訂單 Header -->
            <div class="flex items-center gap-2 border-b border-neutral-200 p-5">
              <UiBadge
                :label="order.category"
                type="gray"
                size="lg"
              />
              <p
                class="
                  text-h6 flex-1 font-medium tracking-wider text-neutral-900
                "
              >
                {{ order.id }}
              </p>
              <div class="flex items-center gap-2">
                <UiBadge
                  :label="order.status"
                  type="gray"
                  size="lg"
                />
                <UiBadge
                  :label="order.paymentStatus"
                  type="green"
                  size="lg"
                />
              </div>
            </div>

            <!-- 旅客資訊 -->
            <div class="flex border-b border-neutral-200">
              <div
                class="
                  flex flex-1 flex-col gap-1 border-r border-neutral-200 p-5
                "
              >
                <p class="text-sm tracking-wider text-neutral-600">
                  旅客
                </p>
                <p class="text-base font-medium tracking-wider text-neutral-900">
                  {{ order.passenger }}
                </p>
              </div>
              <div
                class="
                  flex flex-1 flex-col gap-1 border-r border-neutral-200 p-5
                "
              >
                <p class="text-sm tracking-wider text-neutral-600">
                  服務方案
                </p>
                <p class="text-base font-medium tracking-wider text-neutral-900">
                  {{ order.servicePlan }}
                </p>
              </div>
              <div class="flex flex-1 flex-col gap-1 p-5">
                <p class="text-sm tracking-wider text-neutral-600">
                  行李件數
                </p>
                <p class="text-base font-medium tracking-wider text-neutral-900">
                  {{ order.luggageCount }} 件
                </p>
              </div>
            </div>

            <!-- 地點資訊 -->
            <div class="flex border-b border-neutral-200">
              <div
                class="
                  flex flex-1 flex-col gap-1 border-r border-neutral-200 p-5
                "
              >
                <p class="text-sm tracking-wider text-neutral-600">
                  寄件日期
                </p>
                <div
                  class="
                    flex items-center gap-2 text-base font-medium tracking-wider
                    text-neutral-900
                  "
                >
                  <span>去程</span>
                  <span>{{ order.tripDateOut }}</span>
                </div>
                <div
                  class="
                    flex items-center gap-2 text-base font-medium tracking-wider
                    text-neutral-900
                  "
                >
                  <span>回程</span>
                  <span>{{ order.tripDateReturn }}</span>
                </div>
              </div>
              <div
                class="
                  flex flex-1 flex-col gap-1 border-r border-neutral-200 p-5
                "
              >
                <p class="text-sm tracking-wider text-neutral-600">
                  寄件地點
                </p>
                <p class="text-base font-medium tracking-wider text-neutral-900">
                  {{ order.pickupLocation }}
                </p>
              </div>
              <div class="flex flex-1 flex-col gap-1 p-5">
                <p class="text-sm tracking-wider text-neutral-600">
                  送達地點
                </p>
                <p class="text-base font-medium tracking-wider text-neutral-900">
                  {{ order.deliveryLocation }}
                </p>
              </div>
            </div>

            <!-- 訂單金額 -->
            <div class="flex items-center justify-between p-5">
              <p class="text-base font-medium tracking-wider text-neutral-600">
                訂單金額
              </p>
              <p class="text-h6 font-bold tracking-wider text-neutral-900">
                NT$ {{ order.amount }}
              </p>
            </div>
          </div>

          <!-- 調整行李件數 -->
          <div
            class="
              overflow-hidden rounded-md bg-neutral-0
              shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <div class="p-6">
              <div class="flex items-center gap-2">
                <p
                  class="
                    text-h6 flex-1 font-bold tracking-wider text-neutral-900
                  "
                >
                  調整行李件數
                </p>
                <!-- Toggle Switch -->
                <button
                  class="
                    relative flex h-6 w-11 items-center rounded-full p-0.5
                    transition-colors
                  "
                  :class="adjustLuggage ? 'bg-primary-300' : 'bg-neutral-300'"
                  @click="adjustLuggage = !adjustLuggage"
                >
                  <span
                    class="
                      size-5 rounded-full bg-white shadow-sm
                      transition-transform
                    "
                    :class="adjustLuggage ? 'translate-x-5' : 'translate-x-0'"
                  ></span>
                </button>
              </div>

              <!-- 展開內容 -->
              <div
                v-if="adjustLuggage"
                class="mt-4 flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="
                      text-base font-medium tracking-wider text-neutral-600
                    "
                  >
                    原為 {{ order.luggageCount }} 件，增加
                  </span>
                  <!-- 數字輸入 -->
                  <div
                    class="
                      flex h-10 items-center gap-3 rounded-xs bg-neutral-100
                      px-3
                    "
                  >
                    <button
                      class="
                        flex size-8 items-center justify-center rounded-full
                        hover:bg-neutral-200
                      "
                      @click="additionalLuggage = Math.max(1, additionalLuggage - 1)"
                    >
                      <Minus class="size-4 text-neutral-600" />
                    </button>
                    <span
                      class="
                        w-8 text-center text-base tracking-wider
                        text-neutral-900
                      "
                    >
                      {{ additionalLuggage }}
                    </span>
                    <button
                      class="
                        flex size-8 items-center justify-center rounded-full
                        hover:bg-neutral-200
                      "
                      @click="additionalLuggage++"
                    >
                      <Plus class="size-4 text-neutral-600" />
                    </button>
                  </div>
                  <span
                    class="
                      text-base font-medium tracking-wider text-neutral-600
                    "
                  >件</span>
                </div>
                <span class="text-h8 font-bold tracking-wider text-primary-300">
                  +NT$ 250 / 件
                </span>
              </div>
            </div>
          </div>

          <!-- 加值服務 -->
          <div
            class="
              overflow-hidden rounded-md bg-neutral-0
              shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <div class="p-6">
              <div class="flex items-center gap-2">
                <p
                  class="
                    text-h6 flex-1 font-bold tracking-wider text-neutral-900
                  "
                >
                  加值服務
                </p>
                <!-- Toggle Switch -->
                <button
                  class="
                    relative flex h-6 w-11 items-center rounded-full p-0.5
                    transition-colors
                  "
                  :class="valueServices ? 'bg-primary-300' : 'bg-neutral-300'"
                  @click="valueServices = !valueServices"
                >
                  <span
                    class="
                      size-5 rounded-full bg-white shadow-sm
                      transition-transform
                    "
                    :class="valueServices ? 'translate-x-5' : 'translate-x-0'"
                  ></span>
                </button>
              </div>

              <!-- 展開：加值服務選項 -->
              <div
                v-if="valueServices"
                class="mt-4 flex flex-col gap-4"
              >
                <!-- 大型行李箱 & 專業裝備 -->
                <div class="grid grid-cols-2 gap-4">
                  <!-- 大型行李箱 -->
                  <div
                    class="
                      rounded-sm border border-neutral-200 bg-neutral-0 p-4
                    "
                  >
                    <div class="mb-3 flex items-start justify-between gap-3">
                      <div class="flex flex-1 flex-col gap-1">
                        <div class="flex items-start gap-2">
                          <span
                            class="
                              h-5 w-1 shrink-0 rounded-xs bg-gradient-to-r
                              from-[#4090E8] to-[#306CF7]
                            "
                          ></span>
                          <p
                            class="
                              text-h7 font-bold tracking-wider text-neutral-900
                            "
                          >
                            大型行李箱
                          </p>
                        </div>
                        <p class="pl-3 text-sm tracking-wider text-neutral-600">
                          29 寸以上
                        </p>
                      </div>
                      <span
                        class="
                          text-h8 font-bold tracking-wider whitespace-nowrap
                          text-primary-300
                        "
                      >
                        +NT$ 50 / 件
                      </span>
                    </div>
                    <div
                      class="
                        flex h-10 items-center gap-3 rounded-xs bg-neutral-100
                        px-3
                      "
                    >
                      <button
                        class="
                          flex size-8 items-center justify-center rounded-full
                          hover:bg-neutral-200
                        "
                        @click="largeLuggageCount = Math.max(0, largeLuggageCount - 1)"
                      >
                        <Minus class="size-4 text-neutral-600" />
                      </button>
                      <span
                        class="
                          flex-1 text-center text-base tracking-wider
                          text-neutral-900
                        "
                      >
                        {{ largeLuggageCount }}
                      </span>
                      <button
                        class="
                          flex size-8 items-center justify-center rounded-full
                          hover:bg-neutral-200
                        "
                        @click="largeLuggageCount++"
                      >
                        <Plus class="size-4 text-neutral-600" />
                      </button>
                    </div>
                  </div>

                  <!-- 專業裝備 -->
                  <div
                    class="
                      rounded-sm border border-neutral-200 bg-neutral-0 p-4
                    "
                  >
                    <div class="mb-3 flex items-start justify-between gap-3">
                      <div class="flex flex-1 flex-col gap-1">
                        <div class="flex items-start gap-2">
                          <span
                            class="
                              h-5 w-1 shrink-0 rounded-xs bg-gradient-to-r
                              from-[#4090E8] to-[#306CF7]
                            "
                          ></span>
                          <p
                            class="
                              text-h7 font-bold tracking-wider text-neutral-900
                            "
                          >
                            專業裝備
                          </p>
                        </div>
                        <p class="pl-3 text-sm tracking-wider text-neutral-600">
                          潛水裝備、高爾夫球袋
                        </p>
                      </div>
                      <span
                        class="
                          text-h8 font-bold tracking-wider whitespace-nowrap
                          text-primary-300
                        "
                      >
                        +NT$ 100 / 件
                      </span>
                    </div>
                    <div
                      class="
                        flex h-10 items-center gap-3 rounded-xs bg-neutral-100
                        px-3
                      "
                    >
                      <button
                        class="
                          flex size-8 items-center justify-center rounded-full
                          hover:bg-neutral-200
                        "
                        @click="professionalEquipmentCount = Math.max(0, professionalEquipmentCount - 1)"
                      >
                        <Minus class="size-4 text-neutral-600" />
                      </button>
                      <span
                        class="
                          flex-1 text-center text-base tracking-wider
                          text-neutral-900
                        "
                      >
                        {{ professionalEquipmentCount }}
                      </span>
                      <button
                        class="
                          flex size-8 items-center justify-center rounded-full
                          hover:bg-neutral-200
                        "
                        @click="professionalEquipmentCount++"
                      >
                        <Plus class="size-4 text-neutral-600" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 特殊物件 -->
                <div
                  class="rounded-sm border border-neutral-200 bg-neutral-0 p-4"
                >
                  <div class="mb-3 flex items-start justify-between gap-2">
                    <div class="flex flex-col gap-0.5">
                      <div class="flex items-start gap-2">
                        <span
                          class="
                            mt-0.5 h-5 w-1 shrink-0 rounded-xs bg-gradient-to-r
                            from-[#4090E8] to-[#306CF7]
                          "
                        ></span>
                        <p
                          class="
                            text-h7 font-bold tracking-wider text-neutral-900
                          "
                        >
                          特殊物件
                        </p>
                      </div>
                      <p class="pl-3 text-sm tracking-wider text-neutral-600">
                        如衝浪板、腳踏車、嬰兒推車等
                      </p>
                    </div>
                    <button
                      class="
                        flex items-center gap-1 rounded-sm border
                        border-primary-300 px-4 py-2 text-sm font-medium
                        tracking-wider whitespace-nowrap text-primary-300
                        hover:bg-primary-100
                      "
                      @click="addSpecialItem"
                    >
                      <Plus class="size-4 text-neutral-600" />
                      新增物件
                    </button>
                  </div>

                  <!-- 表頭 -->
                  <div class="mb-2 grid grid-cols-[1fr_1fr_1fr_40px] gap-3">
                    <span
                      class="
                        text-sm font-medium tracking-wider text-neutral-600
                      "
                    >物件</span>
                    <span
                      class="
                        text-sm font-medium tracking-wider text-neutral-600
                      "
                    >單價(NTD)</span>
                    <span
                      class="
                        text-sm font-medium tracking-wider text-neutral-600
                      "
                    >件數</span>
                    <span></span>
                  </div>

                  <!-- 特殊物件列表 -->
                  <div class="flex flex-col gap-2">
                    <div
                      v-for="(item, index) in specialItems"
                      :key="index"
                      class="
                        grid grid-cols-[1fr_1fr_1fr_40px] items-center gap-3
                      "
                    >
                      <input
                        v-model="item.name"
                        type="text"
                        placeholder="衝浪板"
                        class="
                          rounded-xs border border-neutral-200 bg-neutral-0 px-3
                          py-2 text-base tracking-wider text-neutral-900
                          outline-none
                          placeholder:text-neutral-500
                        "
                      >
                      <input
                        v-model="item.price"
                        type="number"
                        placeholder="0"
                        class="
                          rounded-xs border border-neutral-200 bg-neutral-0 px-3
                          py-2 text-base tracking-wider text-neutral-900
                          outline-none
                          placeholder:text-neutral-500
                        "
                      >
                      <div
                        class="
                          flex h-10 items-center gap-3 rounded-xs bg-neutral-100
                          px-3
                        "
                      >
                        <button
                          class="
                            flex size-6 items-center justify-center rounded-full
                            hover:bg-neutral-200
                          "
                          @click="item.count = Math.max(0, item.count - 1)"
                        >
                          <Minus class="size-3 text-neutral-600" />
                        </button>
                        <span
                          class="
                            flex-1 text-center text-base tracking-wider
                            text-neutral-900
                          "
                        >
                          {{ item.count }}
                        </span>
                        <button
                          class="
                            flex size-6 items-center justify-center rounded-full
                            hover:bg-neutral-200
                          "
                          @click="item.count++"
                        >
                          <Plus class="size-3 text-neutral-600" />
                        </button>
                      </div>
                      <button
                        class="
                          flex size-8 items-center justify-center rounded-full
                          hover:bg-neutral-100
                        "
                        @click="removeSpecialItem(index)"
                      >
                        <X class="size-4 text-neutral-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右欄 -->
        <div class="flex w-[380px] shrink-0 flex-col gap-4">
          <!-- 0.2.3：費用尚未付清提示 -->
          <div
            v-if="hasExtraPayment"
            class="
              flex items-start gap-2 rounded-sm border border-danger-200
              bg-danger-100 p-3
            "
          >
            <AlertCircle class="mt-0.5 size-4 shrink-0 text-danger-300" />
            <p class="text-sm font-medium tracking-wider text-danger-300">
              請先向旅客收取差額，再列印標籤
            </p>
          </div>

          <!-- 訂單摘要 -->
          <div
            class="
              overflow-hidden rounded-md bg-neutral-0
              shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <div class="flex flex-col gap-4 p-6">
              <!-- 標題 -->
              <div class="flex items-center gap-2">
                <ReceiptText class="size-5 text-neutral-600" />
                <p
                  class="
                    text-h6 flex-1 font-bold tracking-wider text-neutral-900
                  "
                >
                  訂單摘要
                </p>
                <NuxtLink
                  :to="`/orders/${order.id}`"
                  class="
                    text-base font-medium tracking-wider text-primary-300
                    hover:text-primary-400
                  "
                >
                  查看訂單詳情
                </NuxtLink>
              </div>

              <!-- 摘要卡 -->
              <div class="rounded-sm border border-neutral-200 p-4">
                <div class="flex flex-col gap-4">
                  <!-- 基本套票資訊 -->
                  <div class="flex flex-col gap-2">
                    <p
                      class="
                        text-base font-bold tracking-wider text-neutral-900
                      "
                    >
                      {{ order.servicePlan }}
                    </p>
                    <div class="flex flex-col gap-2 text-base tracking-wider">
                      <div class="flex items-center gap-2">
                        <span class="w-[100px] shrink-0 text-neutral-600">單價</span>
                        <span class="text-neutral-900">NT$ {{ order.unitPrice }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="w-[100px] shrink-0 text-neutral-600">行李件數</span>
                        <span class="text-neutral-900">{{ order.luggageCount }} 件</span>
                      </div>
                    </div>
                  </div>

                  <!-- 補款明細 (有加值服務時才顯示) -->
                  <template v-if="hasExtraPayment">
                    <hr class="border-neutral-200">

                    <div class="flex flex-col gap-2">
                      <p
                        class="
                          text-base font-bold tracking-wider text-neutral-900
                        "
                      >
                        補款明細
                      </p>
                      <div class="flex flex-col gap-2 text-base tracking-wider">
                        <div
                          v-if="adjustLuggage"
                          class="flex items-center gap-2"
                        >
                          <span class="w-[100px] shrink-0 text-neutral-600">增加行李</span>
                          <span class="text-neutral-900">{{ additionalLuggage }} 件</span>
                          <span class="text-neutral-500">·</span>
                          <span class="flex-1 text-neutral-900">+NT$ {{ additionalLuggage * 250 }}</span>
                        </div>
                        <template v-if="valueServices">
                          <div
                            v-if="largeLuggageCount > 0"
                            class="flex items-center gap-2"
                          >
                            <span class="w-[100px] shrink-0 text-neutral-600">大型行李箱</span>
                            <span class="text-neutral-900">{{ largeLuggageCount }} 件</span>
                            <span class="text-neutral-500">·</span>
                            <span class="flex-1 text-neutral-900">+NT$ {{ largeLuggageCount * 50 }}</span>
                          </div>
                          <div
                            v-if="professionalEquipmentCount > 0"
                            class="flex items-center gap-2"
                          >
                            <span class="w-[100px] shrink-0 text-neutral-600">專業裝備</span>
                            <span class="text-neutral-900">{{ professionalEquipmentCount }} 件</span>
                            <span class="text-neutral-500">·</span>
                            <span class="flex-1 text-neutral-900">+NT$ {{ professionalEquipmentCount * 100 }}</span>
                          </div>
                          <template
                            v-for="item in specialItems"
                            :key="item.name"
                          >
                            <div
                              v-if="item.count > 0 && item.name"
                              class="flex items-center gap-2"
                            >
                              <span class="w-[100px] shrink-0 text-neutral-600">{{ item.name }}</span>
                              <span class="text-neutral-900">{{ item.count }} 件</span>
                              <span class="text-neutral-500">·</span>
                              <span class="flex-1 text-neutral-900">+NT$ {{ Number(item.price) * item.count }}</span>
                            </div>
                          </template>
                        </template>
                      </div>
                    </div>

                    <hr class="border-neutral-200">

                    <div class="flex items-center gap-2">
                      <span
                        class="
                          w-[100px] shrink-0 text-base font-bold tracking-wider
                          text-neutral-900
                        "
                      >需補差額</span>
                      <span
                        class="
                          text-h5 font-bold tracking-wider text-primary-300
                        "
                      >
                        NT$ {{ extraPaymentTotal }}
                      </span>
                    </div>
                  </template>
                </div>
              </div>

              <!-- 列印按鈕 -->
              <button
                class="
                  w-full rounded-sm bg-primary-300 px-4 py-2 text-base
                  font-medium tracking-wider text-neutral-0
                  hover:bg-primary-400
                "
              >
                列印訂單標籤
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { DateValue } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Box,
  CalendarDays,
  CalendarIcon,
  Luggage,
  Minus,
  Plus,
  Send,
  Sparkle,
  SquareChartGantt,
  Store,
  Tag,
  Truck,
  UserRound,
  X,
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Checkbox } from '~/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { cn } from '~/lib/utils'

useHead({
  title: '新增訂單 - 行李運送系統',
})

// ── 訂單類型 ──────────────────────────────────────────
type OrderType = 'round-trip' | 'one-way' | 'merchant'

const orderType = ref<OrderType>('round-trip')

interface DeliveryPlan {
  id: number
  name: string
  price: number
  enableStatus: string
}

interface MerchantOption {
  id: number
  name: string
  isActive: boolean
  usedCounts: number
  maxUsageCounts: number | null
}

const { data: deliveryPlans } = await useFetch<DeliveryPlan[]>('/api/billing/pricing/delivery')
const { data: merchants } = await useFetch<MerchantOption[]>('/api/merchants')

const orderTypes = computed(() => {
  const plans = deliveryPlans.value ?? []
  return [
    { key: 'round-trip' as OrderType, label: plans[0]?.name ?? '雙程套票', price: plans[0] ? `NT$ ${plans[0].price} / 件` : null },
    { key: 'one-way' as OrderType, label: plans[1]?.name ?? '單程運送', price: plans[1] ? `NT$ ${plans[1].price} / 件` : null },
    { key: 'merchant' as OrderType, label: '商家代售', price: null },
  ]
})

// ── 雙程 / 單程 共用表單 ─────────────────────────────
const luggageCount = ref(1)

const hasAddons = ref(false)

interface AddonPlan {
  id: number
  name: string
  unitPrice: number
  type: string
  enableStatus: string
}

const { data: addonPlans } = await useFetch<AddonPlan[]>('/api/billing/pricing/addon')

// addonCounts: planId → 件數
const addonCounts = ref<Record<number, number>>({})

function getAddonCount(id: number) {
  return addonCounts.value[id] ?? 0
}

function setAddonCount(id: number, delta: number) {
  const current = getAddonCount(id)
  const next = current + delta
  if (next <= 0) {
    delete addonCounts.value[id]
  }
  else {
    addonCounts.value[id] = next
  }
}

interface SpecialItem {
  name: string
  unitPrice: number
  count: number
}
const specialItems = ref<SpecialItem[]>([])

function addSpecialItem() {
  specialItems.value.push({ name: '', unitPrice: 0, count: 0 })
}

function removeSpecialItem(i: number) {
  specialItems.value.splice(i, 1)
}

const passengerType = ref('散客')
const passengerName = ref('')
const passengerPhone = ref('')

interface DeliveryPoint {
  id: number
  name: string
  type: string
  typeId: number
  address: string
  area: string | null
  latitude: string | null
  longitude: string | null
  createdAt: string
}

const { data: deliveryPoints } = await useFetch<DeliveryPoint[]>('/api/delivery-points')

const pickupLocationId = ref('')
const deliveryLocationId = ref('')

const departureDate = ref('')
const returnDate = ref('')

const df = new DateFormatter('zh-TW', { dateStyle: 'medium' })

const departureDateValue = computed<DateValue | undefined>({
  get: () => departureDate.value ? parseDate(departureDate.value) : undefined,
  set: val => departureDate.value = val ? val.toString() : '',
})

const returnDateValue = computed<DateValue | undefined>({
  get: () => returnDate.value ? parseDate(returnDate.value) : undefined,
  set: val => returnDate.value = val ? val.toString() : '',
})

const returnDateError = computed(() => {
  if (!returnDate.value || !departureDate.value)
    return ''
  return returnDate.value < departureDate.value ? '回程日期不能早於去程日期' : ''
})

const sameAsPassenger = ref(false)
const recipientName = ref('')
const recipientPhone = ref('')

watch(sameAsPassenger, (val) => {
  if (!val)
    return
  recipientName.value = passengerName.value
  recipientPhone.value = passengerPhone.value
})

const notes = ref('')

// ── 費用計算 ─────────────────────────────────────────
const unitPrice = computed(() => {
  const plans = deliveryPlans.value ?? []
  if (orderType.value === 'round-trip')
    return plans[0]?.price ?? 250
  if (orderType.value === 'one-way')
    return plans[1]?.price ?? 130
  return 0
})

const baseSubtotal = computed(() => unitPrice.value * luggageCount.value)

const addonPlansCost = computed(() =>
  (addonPlans.value ?? []).reduce((sum, plan) => {
    return sum + (getAddonCount(plan.id) * plan.unitPrice)
  }, 0),
)
const specialItemsCost = computed(() =>
  specialItems.value.reduce((sum, item) => sum + item.unitPrice * item.count, 0),
)
const addonSubtotal = computed(() => addonPlansCost.value + specialItemsCost.value)
const total = computed(() => baseSubtotal.value + (hasAddons.value ? addonSubtotal.value : 0))

// ── 商家代售 表單 ────────────────────────────────────
const merchantStore = ref('')
const selectedMerchant = computed(() =>
  merchants.value?.find(m => String(m.id) === merchantStore.value) ?? null,
)
const selectedMerchantName = computed(() => selectedMerchant.value?.name ?? '')
const merchantTotalLuggage = computed(() => luggageCount.value)
const merchantRemainingAfter = computed(() => {
  const m = selectedMerchant.value
  if (!m || m.maxUsageCounts === null)
    return null
  return m.maxUsageCounts - m.usedCounts - merchantTotalLuggage.value
})


// ── 送出 ─────────────────────────────────────────────
const router = useRouter()

async function submitForm() {
  if (returnDateError.value)
    return

  try {
    const body = {
      servicePlan: orderType.value === 'round-trip' ? 'round_trip' : orderType.value === 'one-way' ? 'one_way' : 'merchant',
      merchantStore: orderType.value === 'merchant' ? merchantStore.value : undefined,
      luggageCount: luggageCount.value,
      hasAddons: hasAddons.value,
      addonItems: hasAddons.value
        ? (addonPlans.value ?? [])
            .filter(p => getAddonCount(p.id) > 0)
            .map(p => ({ id: p.id, name: p.name, unitPrice: p.unitPrice, count: getAddonCount(p.id) }))
        : [],
      specialItems: specialItems.value,
      passengerType: passengerType.value,
      lineName: passengerName.value,
      phone: passengerPhone.value,
      pickupLocationId: pickupLocationId.value,
      deliveryLocationId: deliveryLocationId.value,
      deliveryDate: departureDate.value,
      returnDate: orderType.value === 'round-trip' ? returnDate.value : undefined,
      sameAsPassenger: sameAsPassenger.value,
      recipientName: recipientName.value,
      recipientPhone: recipientPhone.value,
      notes: notes.value,
    }

    const result = await $fetch<{ id: string }>('/api/orders', { method: 'POST', body })
    router.push(`/orders/${result.id}`)
  }
  catch (error) {
    console.error('建立訂單失敗:', error)
  }
}
</script>

<template>
  <div class="min-h-full bg-neutral-100">
    <!-- 頁面標題列 -->
    <div class="flex items-center gap-2 px-8 py-5">
      <NuxtLink
        to="/orders"
        class="
          flex items-center justify-center rounded-full p-2
          hover:bg-neutral-200
        "
      >
        <ArrowLeft class="size-4 text-neutral-700" />
      </NuxtLink>
      <h1 class="text-2xl font-bold tracking-[1.2px] text-neutral-900">
        新增訂單
      </h1>
    </div>

    <!-- 主要內容 -->
    <div class="grid grid-cols-12 items-start gap-4 px-8 pb-8">
      <!-- 左欄：表單 -->
      <div class="col-span-8 flex flex-col gap-4">
        <!-- 服務方案 -->
        <div
          class="
            rounded-md bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <div class="mb-4 flex items-center gap-2">
            <Tag class="size-5 text-neutral-600" />
            <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
              服務方案
            </h2>
          </div>
          <div class="flex gap-4">
            <button
              v-for="t in orderTypes"
              :key="t.key"
              type="button"
              class="
                flex w-[150px] flex-col gap-3 rounded-sm border p-4 text-left
                transition-colors
              "
              :class="
                orderType === t.key
                  ? 'border-primary-300 bg-white'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              "
              @click="orderType = t.key"
            >
              <div
                class="self-start rounded-full p-2"
                :class="orderType === t.key ? 'bg-primary-200' : `
                  bg-neutral-200
                `"
              >
                <ArrowLeftRight
                  v-if="t.key === 'round-trip'"
                  class="size-4"
                  :class="orderType === t.key ? 'text-primary-300' : `
                    text-neutral-500
                  `"
                />
                <ArrowRight
                  v-else-if="t.key === 'one-way'"
                  class="size-4"
                  :class="orderType === t.key ? 'text-primary-300' : `
                    text-neutral-500
                  `"
                />
                <Store
                  v-else
                  class="size-4"
                  :class="orderType === t.key ? 'text-primary-300' : `
                    text-neutral-500
                  `"
                />
              </div>
              <div class="flex flex-col gap-0.5">
                <p class="text-base font-bold tracking-[0.8px] text-neutral-900">
                  {{ t.label }}
                </p>
                <p
                  v-if="t.price"
                  class="text-sm font-bold tracking-[0.7px]"
                  :class="orderType === t.key ? 'text-primary-300' : `
                    text-neutral-900
                  `"
                >
                  {{ t.price }}
                </p>
              </div>
            </button>
          </div>
        </div>

        <!-- ── 共用表單 ── -->

        <!-- 代售商家（商家模式限定） -->
        <div
          v-if="orderType === 'merchant'"
          class="
            rounded-md bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <div class="mb-4 flex items-center gap-2">
            <Truck class="size-5 text-neutral-600" />
            <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
              運送資訊
            </h2>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium tracking-[0.7px] text-neutral-600">代售商家</label>
            <Select v-model="merchantStore">
              <SelectTrigger>
                <SelectValue placeholder="請選擇商家" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem
                    v-for="merchant in merchants"
                    :key="merchant.id"
                    :value="String(merchant.id)"
                    :disabled="merchant.maxUsageCounts === null || merchant.maxUsageCounts - merchant.usedCounts <= 0"
                  >
                    <div class="flex w-full items-center justify-between">
                      <span>{{ merchant.name }}</span>
                      <span
                        v-if="merchant.maxUsageCounts === null"
                        class="shrink-0 text-xs text-neutral-400"
                      >
                        ｜未設定票數
                      </span>
                      <span
                        v-else-if="merchant.maxUsageCounts - merchant.usedCounts <= 0"
                        class="shrink-0 text-xs text-danger-300"
                      >
                        ｜票數已用完
                      </span>
                      <span
                        v-else
                        class="shrink-0 text-xs text-neutral-700"
                      >
                        ｜剩餘票數： {{ merchant.maxUsageCounts - merchant.usedCounts }} 張
                      </span>
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

          <!-- 行李件數 -->
          <div
            class="
              rounded-md bg-white p-6
              shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <div class="mb-4 flex items-center gap-2">
              <Luggage class="size-5 text-neutral-600" />
              <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
                行李件數
              </h2>
            </div>
            <div
              class="
                flex max-w-[300px] items-center gap-3 rounded-xs bg-neutral-100
                px-3 py-1
              "
            >
              <button
                type="button"
                class="
                  flex shrink-0 items-center justify-center rounded-full p-2
                  hover:bg-neutral-200
                  disabled:cursor-not-allowed disabled:opacity-40
                "
                :disabled="luggageCount <= 1"
                @click="luggageCount--"
              >
                <Minus class="size-6" />
              </button>
              <span
                class="
                  flex-1 text-center text-base tracking-[0.8px] text-neutral-900
                "
              >{{ luggageCount }}</span>
              <button
                type="button"
                class="
                  flex shrink-0 items-center justify-center rounded-full p-2
                  hover:bg-neutral-200
                "
                @click="luggageCount++"
              >
                <Plus class="size-6" />
              </button>
            </div>
          </div>

          <!-- 加值服務 -->
          <div
            class="
              rounded-md bg-white p-6
              shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <div
              class="flex items-center justify-between"
              :class="hasAddons ? 'mb-4' : 'mb-0'"
            >
              <div class="flex items-center gap-2">
                <Sparkle class="size-5 text-neutral-600" />
                <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
                  加值服務
                </h2>
              </div>
              <!-- Toggle -->
              <button
                type="button"
                role="switch"
                :aria-checked="hasAddons"
                class="
                  relative inline-flex h-6 w-11 shrink-0 cursor-pointer
                  rounded-full border-2 border-transparent transition-colors
                  focus-visible:outline-none
                "
                :class="hasAddons ? 'bg-primary-300' : 'bg-neutral-300'"
                @click="hasAddons = !hasAddons"
              >
                <span
                  class="
                    pointer-events-none inline-block size-5 translate-x-0
                    rounded-full bg-white shadow ring-0 transition-transform
                  "
                  :class="hasAddons ? 'translate-x-5' : 'translate-x-0'"
                ></span>
              </button>
            </div>

            <template v-if="hasAddons">
              <div class="flex gap-4">
                <div
                  v-for="plan in addonPlans"
                  :key="plan.id"
                  class="
                    flex flex-1 flex-col gap-3 rounded-sm border
                    border-neutral-200 p-4
                  "
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-2">
                      <div
                        class="
                          w-1 self-stretch rounded-xs bg-gradient-to-br
                          from-[#4090e8] to-[#306cf7]
                        "
                      ></div>
                      <p
                        class="
                          text-base font-bold tracking-[0.8px] text-neutral-900
                        "
                      >
                        {{ plan.name }}
                      </p>
                    </div>
                    <p class="shrink-0 text-sm font-bold text-primary-300">
                      +NT$ {{ plan.unitPrice }} / 件
                    </p>
                  </div>
                  <div
                    class="
                      flex items-center gap-3 rounded-xs bg-neutral-100 px-3
                      py-1
                    "
                  >
                    <button
                      type="button"
                      class="
                        flex shrink-0 items-center justify-center rounded-full
                        p-2
                        hover:bg-neutral-200
                        disabled:cursor-not-allowed disabled:opacity-40
                      "
                      :disabled="getAddonCount(plan.id) <= 0"
                      @click="setAddonCount(plan.id, -1)"
                    >
                      <Minus class="size-6" />
                    </button>
                    <span
                      class="
                        flex-1 text-center text-base tracking-[0.8px]
                        text-neutral-900
                      "
                    >{{ getAddonCount(plan.id) }}</span>
                    <button
                      type="button"
                      class="
                        flex shrink-0 items-center justify-center rounded-full
                        p-2
                        hover:bg-neutral-200
                      "
                      @click="setAddonCount(plan.id, 1)"
                    >
                      <Plus class="size-6" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- 特殊物件 -->
              <div
                class="
                  mt-4 flex flex-col gap-3 rounded-sm border border-neutral-200
                  p-4
                "
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                      <div
                        class="
                          w-1 self-stretch rounded-xs bg-gradient-to-br
                          from-[#4090e8] to-[#306cf7]
                        "
                      ></div>
                      <p
                        class="
                          text-base font-bold tracking-[0.8px] text-neutral-900
                        "
                      >
                        特殊物件
                      </p>
                    </div>
                    <p class="text-sm text-neutral-600">
                      如衝浪板、腳踏車、嬰兒推車等
                    </p>
                  </div>
                  <button
                    type="button"
                    class="
                      flex shrink-0 items-center gap-2 rounded-sm border
                      border-primary-300 px-4 py-2 text-sm font-medium
                      text-primary-300
                      hover:bg-primary-100
                    "
                    @click="addSpecialItem"
                  >
                    <Plus class="size-5" />
                    新增物件
                  </button>
                </div>
                <template v-if="specialItems.length > 0">
                  <div
                    class="
                      grid grid-cols-[1fr_1fr_1fr_40px] gap-3 text-sm
                      font-medium text-neutral-600
                    "
                  >
                    <span>物件</span><span>單價 NTD</span><span>件數</span><span></span>
                  </div>
                  <div
                    v-for="(item, i) in specialItems"
                    :key="i"
                    class="grid grid-cols-[1fr_1fr_1fr_40px] items-center gap-3"
                  >
                    <input
                      v-model="item.name"
                      type="text"
                      placeholder="物件名稱"
                      class="
                        min-w-0 rounded-xs border border-neutral-200 px-3 py-2
                        text-base outline-none
                        focus:border-primary-300
                      "
                    >
                    <input
                      v-model.number="item.unitPrice"
                      type="number"
                      min="0"
                      class="
                        min-w-0 rounded-xs border border-neutral-200 px-3 py-2
                        text-base outline-none
                        focus:border-primary-300
                      "
                    >
                    <div
                      class="
                        flex min-w-0 items-center gap-3 rounded-xs
                        bg-neutral-100 px-3 py-1
                      "
                    >
                      <button
                        type="button"
                        class="
                          flex shrink-0 items-center justify-center rounded-full
                          p-2
                          hover:bg-neutral-200
                          disabled:cursor-not-allowed disabled:opacity-40
                        "
                        :disabled="item.count <= 0"
                        @click="item.count--"
                      >
                        <Minus class="size-6" />
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
                          flex shrink-0 items-center justify-center rounded-full
                          p-2
                          hover:bg-neutral-200
                        "
                        @click="item.count++"
                      >
                        <Plus class="size-6" />
                      </button>
                    </div>
                    <button
                      type="button"
                      class="
                        flex size-8 items-center justify-center rounded-full
                        text-neutral-400
                        hover:bg-neutral-100 hover:text-neutral-600
                      "
                      @click="removeSpecialItem(i)"
                    >
                      <X />
                    </button>
                  </div>
                </template>
              </div>
            </template>
          </div>

          <!-- 旅客資訊 -->
          <div
            class="
              rounded-md bg-white p-6
              shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <div class="mb-4 flex items-center gap-2">
              <UserRound class="size-5 text-neutral-600" />
              <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
                旅客資訊
              </h2>
            </div>
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-sm font-medium tracking-[0.7px] text-neutral-600"
                >類別</label>
                <Select v-model="passengerType">
                  <SelectTrigger
                    class="
                      rounded-xs border-neutral-200 bg-white text-neutral-900
                    "
                  >
                    <SelectValue placeholder="請選擇類別" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="散客">
                      散客
                    </SelectItem>
                    <SelectItem value="旅行社">
                      旅行社
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-sm font-medium tracking-[0.7px] text-neutral-600"
                >姓名</label>
                <input
                  v-model="passengerName"
                  type="text"
                  placeholder="王大明"
                  class="
                    rounded-xs border border-neutral-200 px-3 py-2 text-base
                    text-neutral-900 outline-none
                    placeholder:text-neutral-400
                    focus:border-primary-300
                  "
                >
              </div>
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-sm font-medium tracking-[0.7px] text-neutral-600"
                >聯絡電話</label>
                <input
                  v-model="passengerPhone"
                  type="tel"
                  placeholder="0912345678"
                  class="
                    rounded-xs border border-neutral-200 px-3 py-2 text-base
                    text-neutral-900 outline-none
                    placeholder:text-neutral-400
                    focus:border-primary-300
                  "
                >
              </div>
            </div>
          </div>

          <!-- 路線設定 -->
          <div
            class="
              rounded-md bg-white p-6
              shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <div class="mb-4 flex items-center gap-2">
              <Send class="size-5 text-neutral-600" />
              <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
                路線設定
              </h2>
            </div>
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-sm font-medium tracking-[0.7px] text-neutral-600"
                >起始地點</label>
                <Select v-model="pickupLocationId">
                  <SelectTrigger
                    class="
                      rounded-xs border-neutral-200 bg-white text-neutral-900
                    "
                  >
                    <SelectValue placeholder="請選擇起始地點" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="point in deliveryPoints"
                      :key="point.id"
                      :value="String(point.id)"
                    >
                      {{ point.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-sm font-medium tracking-[0.7px] text-neutral-600"
                >送達地點</label>
                <Select v-model="deliveryLocationId">
                  <SelectTrigger
                    class="
                      rounded-xs border-neutral-200 bg-white text-neutral-900
                    "
                  >
                    <SelectValue placeholder="請選擇送達地點" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="point in deliveryPoints"
                      :key="point.id"
                      :value="String(point.id)"
                    >
                      {{ point.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <!-- 寄件日期 -->
          <div
            class="
              rounded-md bg-white p-6
              shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <div class="mb-4 flex items-center gap-2">
              <CalendarDays class="size-5 text-neutral-600" />
              <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
                寄件日期
              </h2>
            </div>
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-sm font-medium tracking-[0.7px] text-neutral-600"
                >去程</label>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      :class="cn(
                        `
                          w-full justify-start rounded-xs border-neutral-200
                          px-3 py-2 text-sm font-normal tracking-wide
                          shadow-none
                        `,
                        !departureDateValue && 'text-neutral-400',
                      )"
                    >
                      <CalendarIcon class="mr-2 size-4" />
                      {{ departureDateValue ? df.format(departureDateValue.toDate(getLocalTimeZone())) : '選擇日期' }}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0">
                    <Calendar
                      v-model="departureDateValue"
                      :initial-focus="true"
                      layout="month-and-year"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div
                v-if="orderType === 'round-trip'"
                class="flex flex-col gap-1.5"
              >
                <label
                  class="text-sm font-medium tracking-[0.7px] text-neutral-600"
                >回程</label>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      :class="cn(
                        `
                          w-full justify-start rounded-xs border-neutral-200
                          px-3 py-2 text-sm font-normal tracking-wide
                          shadow-none
                        `,
                        !returnDateValue && 'text-neutral-400',
                      )"
                    >
                      <CalendarIcon class="mr-2 size-4" />
                      {{ returnDateValue ? df.format(returnDateValue.toDate(getLocalTimeZone())) : '選擇日期' }}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0">
                    <Calendar
                      v-model="returnDateValue"
                      :initial-focus="true"
                      :min-value="departureDateValue"
                      layout="month-and-year"
                    />
                  </PopoverContent>
                </Popover>
                <p
                  v-if="returnDateError"
                  class="text-xs text-red-500"
                >
                  {{ returnDateError }}
                </p>
              </div>
            </div>
          </div>

          <!-- 領件資訊 -->
          <div
            class="
              rounded-md bg-white p-6
              shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <div class="mb-4 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Box class="size-5 text-neutral-600" />
                <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
                  領件資訊
                </h2>
              </div>
              <label
                class="
                  flex cursor-pointer items-center gap-2 text-sm font-medium
                  text-neutral-600
                "
              >
                <Checkbox
                  :checked="sameAsPassenger"
                  @change="sameAsPassenger = $event"
                />
                同旅客資訊
              </label>
            </div>
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-sm font-medium tracking-[0.7px] text-neutral-600"
                >領件人</label>
                <input
                  v-model="recipientName"
                  type="text"
                  placeholder="王大明"
                  :disabled="sameAsPassenger"
                  class="
                    rounded-xs border border-neutral-200 px-3 py-2 text-base
                    text-neutral-900 outline-none
                    placeholder:text-neutral-400
                    focus:border-primary-300
                    disabled:bg-neutral-50 disabled:text-neutral-400
                  "
                >
              </div>
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-sm font-medium tracking-[0.7px] text-neutral-600"
                >聯絡電話</label>
                <input
                  v-model="recipientPhone"
                  type="tel"
                  placeholder="0912345678"
                  :disabled="sameAsPassenger"
                  class="
                    rounded-xs border border-neutral-200 px-3 py-2 text-base
                    text-neutral-900 outline-none
                    placeholder:text-neutral-400
                    focus:border-primary-300
                    disabled:bg-neutral-50 disabled:text-neutral-400
                  "
                >
              </div>
            </div>
          </div>

          <!-- 備註 -->
          <div
            class="
              rounded-md bg-white p-6
              shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <div class="mb-4 flex items-center gap-2">
              <SquareChartGantt class="size-5 text-neutral-600" />
              <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
                備註
                <span class="ml-1 text-sm font-normal text-neutral-400">（選填）</span>
              </h2>
            </div>
            <textarea
              v-model="notes"
              rows="3"
              placeholder="例如行李尺寸、易碎物品等"
              class="
                w-full resize-none rounded-xs border border-neutral-200 px-3
                py-2 text-base text-neutral-900 outline-none
                placeholder:text-neutral-400
                focus:border-primary-300
              "
            ></textarea>
          </div>
      </div>

      <!-- 右欄：費用明細 -->
      <div class="sticky top-8 col-span-4">
        <div
          class="
            flex flex-col gap-4 rounded-md bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <h2 class="text-base font-bold tracking-[0.8px] text-neutral-900">
            費用明細
          </h2>

          <!-- 商家代售：票券明細 -->
          <template v-if="orderType === 'merchant'">
            <div class="flex flex-col gap-2 text-sm">
              <p class="font-bold text-neutral-900">
                商家代售
              </p>
              <div class="flex justify-between text-neutral-600">
                <span>代售商家</span>
                <span>{{ selectedMerchantName || '—' }}</span>
              </div>
              <div class="flex justify-between text-neutral-600">
                <span>本次使用票券</span>
                <span>{{ merchantTotalLuggage }} 張</span>
              </div>
              <div class="flex justify-between font-medium text-neutral-900">
                <span>扣除後剩餘</span>
                <span>
                  <template v-if="merchantRemainingAfter === null">—</template>
                  <template v-else-if="merchantRemainingAfter < 0">
                    <span class="text-danger-300">票券不足</span>
                  </template>
                  <template v-else>{{ merchantRemainingAfter }} 張</template>
                </span>
              </div>
            </div>
            <div class="border-t border-neutral-200 pt-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-neutral-600">本次扣除</span>
                <span class="text-xl font-bold text-primary-300">{{ merchantTotalLuggage }} 張</span>
              </div>
            </div>
          </template>

          <!-- 雙程 / 單程：費用明細 -->
          <template v-else>
            <!-- 套票小計 -->
            <div class="flex flex-col gap-2 text-sm">
              <p class="font-bold text-neutral-900">
                {{ orderType === 'round-trip' ? '雙程套票' : '單程運送' }}
              </p>
              <div class="flex justify-between text-neutral-600">
                <span>單價</span>
                <span>NT$ {{ unitPrice }}</span>
              </div>
              <div class="flex justify-between text-neutral-600">
                <span>行李數量</span>
                <span>{{ luggageCount }} 件</span>
              </div>
              <div class="flex justify-between font-medium text-neutral-900">
                <span>小計</span>
                <span>NT$ {{ baseSubtotal.toLocaleString() }}</span>
              </div>
            </div>

            <!-- 加值服務小計 -->
            <template v-if="hasAddons && addonSubtotal > 0">
              <div class="border-t border-neutral-100 pt-3"></div>
              <div class="flex flex-col gap-2 text-sm">
                <p class="font-bold text-neutral-900">
                  加值服務
                </p>
                <template
                  v-for="plan in addonPlans"
                  :key="plan.id"
                >
                  <div
                    v-if="getAddonCount(plan.id) > 0"
                    class="flex justify-between text-neutral-600"
                  >
                    <span>{{ plan.name }}</span>
                    <span>{{ getAddonCount(plan.id) }} 件 · NT$ {{ getAddonCount(plan.id) * plan.unitPrice }}</span>
                  </div>
                </template>
                <template
                  v-for="item in specialItems"
                  :key="item.name"
                >
                  <div
                    v-if="item.count > 0"
                    class="flex justify-between text-neutral-600"
                  >
                    <span>{{ item.name || '特殊物件' }}</span>
                    <span>{{ item.count }} 件 · NT$ {{ item.unitPrice * item.count }}</span>
                  </div>
                </template>
                <div class="flex justify-between font-medium text-neutral-900">
                  <span>小計</span>
                  <span>NT$ {{ addonSubtotal.toLocaleString() }}</span>
                </div>
              </div>
            </template>

            <!-- 總金額 -->
            <div class="border-t border-neutral-200 pt-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-neutral-600">總計</span>
                <span class="text-xl font-bold text-primary-300">NT$ {{ total.toLocaleString() }}</span>
              </div>
            </div>
          </template>

          <!-- 新增按鈕 -->
          <button
            type="button"
            class="
              w-full rounded-sm bg-primary-300 py-2.5 text-base font-medium
              tracking-[0.8px] text-white
              hover:bg-primary-400
            "
            @click="submitForm"
          >
            立即新增
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

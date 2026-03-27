<script lang="ts" setup>
/**
 * 以下欄位在 orders 資料表中尚未建立，目前以預設值代替：
 *
 * - recipient_name  VARCHAR  領件人姓名（預設值：'李美玲'）
 * - recipient_phone VARCHAR  領件人電話（預設值：'0987654321'）
 *
 * 補齊後請移除 `|| '李美玲'` / `|| '0987654321'` 的 fallback 預設值。
 */
import type { DateValue } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Box,
  CalendarDays,
  CalendarIcon,
  CircleDollarSign,
  Luggage,
  Minus,
  Plus,
  Send,
  Sparkle,
  SquareChartGantt,
  Store,
  UserRound,
  X,
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Checkbox } from '~/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { cn } from '~/lib/utils'

const route = useRoute()
const router = useRouter()
const orderId = route.params.id as string

useHead({
  title: `編輯訂單 #${orderId} - 行李運送系統`,
})

const { setBreadcrumb, clearBreadcrumb } = useBreadcrumb()

onMounted(() => {
  setBreadcrumb({ label: '編輯訂單' })
})

onBeforeRouteLeave(() => {
  clearBreadcrumb()
})

interface Location {
  id: string
  name: string
  address: string
  area: string
}

interface Order {
  id: string
  category: string
  lineName: string
  phone: string
  deliveryDate: string | null
  returnDate?: string | null
  luggageCount: number
  status: string
  servicePlan?: string | null
  pickupLocation: Location
  deliveryLocation: Location
  notes: string
  recipientName?: string
  recipientPhone?: string
}

interface Fee {
  id: number
  item_type: string
  item_name: string
  unit_price: number
  quantity: number
  subtotal: number
}

interface DeliveryPoint {
  id: number
  name: string
  type: string
  typeId: number
  address: string
  area: string | null
}

const { data: order, error } = await useFetch<Order>(`/api/orders/${orderId}`)

if (error.value) {
  throw createError({
    statusCode: 404,
    message: '找不到此訂單',
  })
}

const { data: fees } = await useFetch<Fee[]>(`/api/orders/${orderId}/fees`)
const { data: deliveryPoints } = await useFetch<DeliveryPoint[]>('/api/delivery-points')

// ── 訂單類型 ──────────────────────────────────────────
type OrderType = 'round-trip' | 'one-way' | 'merchant'

function mapServicePlan(plan: string | null | undefined): OrderType {
  if (plan === 'round_trip')
    return 'round-trip'
  if (plan === 'one_way')
    return 'one-way'
  if (plan === 'merchant')
    return 'merchant'
  return 'round-trip'
}

interface DeliveryPlan {
  id: number
  name: string
  price: number
  enableStatus: string
}

interface AddonPlan {
  id: number
  type: string
  name: string
  unitPrice: number
  enableStatus: string
}

const { data: deliveryPlans } = await useFetch<DeliveryPlan[]>('/api/billing/pricing/delivery')
const { data: addonPlans } = await useFetch<AddonPlan[]>('/api/billing/pricing/addon')

const orderTypes = computed(() => {
  const plans = deliveryPlans.value ?? []
  return [
    { key: 'round-trip' as OrderType, label: plans[0]?.name ?? '雙程套票', price: plans[0] ? `NT$ ${plans[0].price} / 件` : null },
    { key: 'one-way' as OrderType, label: plans[1]?.name ?? '單程運送', price: plans[1] ? `NT$ ${plans[1].price} / 件` : null },
    { key: 'merchant' as OrderType, label: '商家代售', price: null },
  ]
})

const orderType = ref<OrderType>(mapServicePlan(order.value?.servicePlan))

// ── 表單欄位（以訂單資料初始化）──────────────────────
const luggageCount = ref(order.value?.luggageCount ?? 1)

const addonFees = (fees.value ?? []).filter(f => f.item_type === 'addon')
const hasAddons = ref(addonFees.length > 0)

const addonCounts = ref<Record<number, number>>(
  Object.fromEntries(
    (addonPlans.value ?? [])
      .map(plan => [plan.id, addonFees.find(f => f.item_name === plan.name)?.quantity ?? 0])
      .filter(([, qty]) => (qty as number) > 0),
  ),
)

function getAddonCount(id: number) {
  return addonCounts.value[id] ?? 0
}

function setAddonCount(id: number, delta: number) {
  const next = getAddonCount(id) + delta
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
const specialItems = ref<SpecialItem[]>(
  addonFees
    .filter(f => f.item_name !== '大型行李箱' && f.item_name !== '專業裝備')
    .map(f => ({ name: f.item_name, unitPrice: f.unit_price, count: f.quantity })),
)

function addSpecialItem() {
  specialItems.value.push({ name: '', unitPrice: 0, count: 0 })
}

function removeSpecialItem(i: number) {
  specialItems.value.splice(i, 1)
}

const passengerType = ref(order.value?.category ?? '散客')
const passengerName = ref(order.value?.lineName || '王小明')
const passengerPhone = ref(order.value?.phone || '0912345678')
const pickupLocationId = ref(order.value?.pickupLocation?.id ?? '')
const deliveryLocationId = ref(order.value?.deliveryLocation?.id ?? '')
const departureDate = ref(order.value?.deliveryDate ?? '')
const returnDate = ref(order.value?.returnDate ?? '')
const sameAsPassenger = ref(false)
const recipientName = ref(order.value?.recipientName || '李美玲')
const recipientPhone = ref(order.value?.recipientPhone || '0987654321')
const notes = ref(order.value?.notes ?? '')

const df = new DateFormatter('zh-TW', { dateStyle: 'medium' })

const departureDateValue = computed<DateValue | undefined>({
  get: () => departureDate.value ? parseDate(departureDate.value) : undefined,
  set: val => departureDate.value = val ? val.toString() : '',
})

const returnDateValue = computed<DateValue | undefined>({
  get: () => returnDate.value ? parseDate(returnDate.value) : undefined,
  set: val => returnDate.value = val ? val.toString() : '',
})

watch(sameAsPassenger, (val) => {
  if (!val)
    return
  recipientName.value = passengerName.value
  recipientPhone.value = passengerPhone.value
})

const passengerTypes = ['散客', '合作', 'Trip', 'Klook']

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
  (addonPlans.value ?? []).reduce((sum, plan) => sum + getAddonCount(plan.id) * plan.unitPrice, 0),
)
const specialItemsCost = computed(() =>
  specialItems.value.reduce((sum, item) => sum + item.unitPrice * item.count, 0),
)
const addonSubtotal = computed(() => addonPlansCost.value + specialItemsCost.value)
const total = computed(() => baseSubtotal.value + (hasAddons.value ? addonSubtotal.value : 0))

// ── 送出 ─────────────────────────────────────────────
const isSubmitting = ref(false)

async function submitForm() {
  if (isSubmitting.value)
    return
  isSubmitting.value = true
  try {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        servicePlan: orderType.value === 'round-trip' ? 'round_trip' : orderType.value === 'one-way' ? 'one_way' : orderType.value,
        luggageCount: luggageCount.value,
        hasAddons: hasAddons.value,
        passengerType: passengerType.value,
        passengerName: passengerName.value,
        passengerPhone: passengerPhone.value,
        pickupLocationId: pickupLocationId.value,
        deliveryLocationId: deliveryLocationId.value,
        departureDate: departureDate.value,
        returnDate: orderType.value === 'round-trip' ? returnDate.value : undefined,
        sameAsPassenger: sameAsPassenger.value,
        recipientName: recipientName.value,
        recipientPhone: recipientPhone.value,
        notes: notes.value,
        feeItems: hasAddons.value
          ? [
              ...(addonPlans.value ?? [])
                .filter(p => getAddonCount(p.id) > 0)
                .map(p => ({ name: p.name, unitPrice: p.unitPrice, count: getAddonCount(p.id) })),
              ...specialItems.value.filter(s => s.name && s.count > 0),
            ]
          : [],
      }),
    })
    router.push(`/orders/${orderId}`)
  }
  catch (err) {
    console.error('儲存訂單失敗:', err)
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-full bg-neutral-100">
    <!-- 頁面標題列 -->
    <div class="flex items-center gap-2 px-8 py-5">
      <NuxtLink
        :to="`/orders/${orderId}`"
        class="
          flex items-center justify-center rounded-full p-2
          hover:bg-neutral-200
        "
      >
        <ArrowLeft class="size-4 text-neutral-700" />
      </NuxtLink>
      <h1 class="text-2xl font-bold tracking-[1.2px] text-neutral-900">
        編輯訂單
      </h1>
    </div>

    <!-- 表單區域 -->
    <div class="grid grid-cols-12 items-start gap-4 px-8 pb-8">
      <!-- 左欄 -->
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
                flex w-[150px] flex-col gap-3 rounded-xl border p-4
                transition-colors
              "
              :class="orderType === t.key ? 'border-[#4090e8]' : `
                border-neutral-200
              `"
              @click="orderType = t.key"
            >
              <div
                class="flex items-center self-start rounded-full p-2"
                :class="orderType === t.key ? 'bg-primary-200' : `
                  bg-neutral-200
                `"
              >
                <ArrowLeftRight
                  v-if="t.key === 'round-trip'"
                  class="size-4"
                  :class="orderType === t.key ? 'text-primary-400' : `
                    text-neutral-500
                  `"
                />
                <ArrowRight
                  v-else-if="t.key === 'one-way'"
                  class="size-4"
                  :class="orderType === t.key ? 'text-primary-400' : `
                    text-neutral-500
                  `"
                />
                <Store
                  v-else
                  class="size-4"
                  :class="orderType === t.key ? 'text-primary-400' : `
                    text-neutral-500
                  `"
                />
              </div>

              <p
                class="
                  text-start text-base font-bold tracking-[0.8px]
                  text-neutral-900
                "
              >
                {{ t.label }}
              </p>

              <p
                v-if="t.price"
                class="text-start text-sm font-bold tracking-[0.7px]"
                :class="orderType === t.key ? 'text-primary-400' : `
                  text-neutral-900
                `"
              >
                {{ t.price }}
              </p>
            </button>
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
          <div class="flex items-center justify-between">
            <div
              class="flex items-center gap-2"
              :class="hasAddons ? 'mb-4' : ''"
            >
              <Sparkle class="size-5 text-neutral-600" />
              <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
                加值服務
              </h2>
            </div>
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
                    flex items-center gap-3 rounded-xs bg-neutral-100 px-3 py-1
                  "
                >
                  <button
                    type="button"
                    class="
                      flex shrink-0 items-center justify-center rounded-full p-2
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
                      flex shrink-0 items-center justify-center rounded-full p-2
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
                    grid grid-cols-[1fr_1fr_1fr_40px] gap-3 text-sm font-medium
                    text-neutral-600
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
                      flex items-center gap-3 rounded-xs bg-neutral-100 px-3
                      py-1
                    "
                  >
                    <button
                      type="button"
                      class="
                        flex shrink-0 items-center justify-center rounded-full
                        p-1
                        hover:bg-neutral-200
                        disabled:cursor-not-allowed disabled:opacity-40
                      "
                      :disabled="item.count <= 0"
                      @click="item.count--"
                    >
                      <Minus class="size-5" />
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
                        p-1
                        hover:bg-neutral-200
                      "
                      @click="item.count++"
                    >
                      <Plus class="size-5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    class="
                      flex items-center justify-center text-neutral-400
                      hover:text-red-500
                    "
                    @click="removeSpecialItem(i)"
                  >
                    <X class="size-5" />
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
            <!-- 類別 -->
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
                  <SelectItem
                    v-for="pt in passengerTypes"
                    :key="pt"
                    :value="pt"
                  >
                    {{ pt }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <!-- 姓名 -->
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
            <!-- 聯絡電話 -->
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
            <!-- 起始地點 -->
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
            <!-- 送達地點 -->
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
            <!-- 去程 -->
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
                        w-full justify-start rounded-xs border-neutral-200 px-3
                        py-2 text-sm font-normal tracking-wide shadow-none
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
            <!-- 回程（雙程套票才顯示） -->
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
                        w-full justify-start rounded-xs border-neutral-200 px-3
                        py-2 text-sm font-normal tracking-wide shadow-none
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
                    layout="month-and-year"
                  />
                </PopoverContent>
              </Popover>
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
            <!-- 領件人 -->
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
            <!-- 聯絡電話 -->
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
              w-full resize-none rounded-xs border border-neutral-200 px-3 py-2
              text-base text-neutral-900 outline-none
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
            rounded-md bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <div class="mb-4 flex items-center gap-2">
            <CircleDollarSign class="size-5 text-neutral-900" />
            <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
              費用明細
            </h2>
          </div>
          <div class="rounded-md border border-neutral-200 p-4">
            <p class="mb-3 text-base font-bold text-neutral-900">
              {{ orderTypes.find(t => t.key === orderType)?.label }}
            </p>
            <div class="flex flex-col gap-2 text-sm text-neutral-600">
              <div class="flex items-center justify-between">
                <span>單價</span>
                <span class="text-neutral-900">NT$ {{ unitPrice }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>行李數量</span>
                <span class="text-neutral-900">{{ luggageCount }} 件</span>
              </div>
            </div>
            <template v-if="hasAddons && addonSubtotal > 0">
              <hr class="my-3 border-neutral-200">
              <p class="mb-2 text-xs font-medium text-neutral-500">
                加值服務
              </p>
              <div class="flex flex-col gap-2 text-sm text-neutral-600">
                <div
                  v-for="plan in addonPlans.filter(p => getAddonCount(p.id) > 0)"
                  :key="plan.id"
                  class="flex items-center justify-between"
                >
                  <span>{{ plan.name }}</span>
                  <span class="text-neutral-900">NT$ {{ getAddonCount(plan.id) * plan.unitPrice }}</span>
                </div>
                <div
                  v-if="specialItemsCost > 0"
                  class="flex items-center justify-between"
                >
                  <span>特殊物件</span>
                  <span class="text-neutral-900">NT$ {{ specialItemsCost }}</span>
                </div>
              </div>
            </template>
            <hr class="my-4 border-neutral-200">
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold text-neutral-900">總金額</span>
              <span class="text-xl font-bold text-primary-400">NT$ {{ total }}</span>
            </div>
          </div>
          <Button
            class="mt-4 w-full justify-center"
            :disabled="isSubmitting"
            @click="submitForm"
          >
            {{ isSubmitting ? '儲存中...' : '儲存修改' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

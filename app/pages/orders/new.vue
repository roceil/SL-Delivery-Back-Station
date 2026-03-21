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
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot } from 'reka-ui'
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

const orderTypes = [
  { key: 'round-trip' as OrderType, label: '雙程套票', price: 'NT$ 250 / 件' },
  { key: 'one-way' as OrderType, label: '單程運送', price: 'NT$ 130 / 件' },
  { key: 'merchant' as OrderType, label: '商家代售', price: null },
] as const

// ── 雙程 / 單程 共用表單 ─────────────────────────────
const luggageCount = ref(1)

const hasAddons = ref(false)
const largeLuggage = ref(0)
const proEquipment = ref(0)

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
const unitPrice = computed(() => orderType.value === 'round-trip' ? 250 : 130)

const baseSubtotal = computed(() => unitPrice.value * luggageCount.value)

const largeLuggageCost = computed(() => largeLuggage.value * 50)
const proEquipmentCost = computed(() => proEquipment.value * 100)
const specialItemsCost = computed(() =>
  specialItems.value.reduce((sum, item) => sum + item.unitPrice * item.count, 0),
)
const addonSubtotal = computed(() =>
  largeLuggageCost.value + proEquipmentCost.value + specialItemsCost.value,
)
const total = computed(() => baseSubtotal.value + (hasAddons.value ? addonSubtotal.value : 0))

// ── 商家代售 表單 ────────────────────────────────────
const merchantStore = ref('')
const deliveryDate = ref('')
const deliveryDateValue = computed<DateValue | undefined>({
  get: () => deliveryDate.value ? parseDate(deliveryDate.value) : undefined,
  set: val => deliveryDate.value = val ? val.toString() : '',
})
const courier = ref('')
const destination = ref('')
const tripId = ref('')

interface TravelerSpecialItem {
  name: string
  unitPrice: number
  count: number
}

interface Traveler {
  name: string
  phone: string
  luggageCount: number
  hasAddon: boolean
  addonLarge: number
  addonPro: number
  specialItems: TravelerSpecialItem[]
  notes: string
}

function emptyTraveler(): Traveler {
  return { name: '', phone: '', luggageCount: 1, hasAddon: false, addonLarge: 0, addonPro: 0, specialItems: [], notes: '' }
}

const travelers = ref<Traveler[]>([])

const showTravelerModal = ref(false)
const editingTravelerIndex = ref<number | null>(null)

// Modal 內可同時填多筆草稿（新增模式）或單筆（編輯模式）
const travelerDrafts = ref<Traveler[]>([])
const showAddons = ref<boolean[]>([])

function openAddTravelerModal() {
  editingTravelerIndex.value = null
  travelerDrafts.value = [emptyTraveler()]
  showAddons.value = [false]
  showTravelerModal.value = true
}

function openEditTravelerModal(i: number) {
  const src = travelers.value[i]
  if (!src)
    return
  editingTravelerIndex.value = i
  travelerDrafts.value = [{ ...src, specialItems: src.specialItems.map(s => ({ ...s })) }]
  showAddons.value = [src.hasAddon]
  showTravelerModal.value = true
}

function addAnotherTraveler() {
  travelerDrafts.value.push(emptyTraveler())
  showAddons.value.push(false)
}

function confirmTraveler() {
  if (editingTravelerIndex.value === null) {
    for (let di = 0; di < travelerDrafts.value.length; di++) {
      const src = travelerDrafts.value[di]
      if (!src)
        continue
      const draft: Traveler = { ...src, specialItems: src.specialItems.map(s => ({ ...s })) }
      draft.hasAddon = showAddons.value[di] ?? false
      if (!draft.hasAddon) {
        draft.addonLarge = 0
        draft.addonPro = 0
        draft.specialItems = []
      }
      travelers.value.push(draft)
    }
  }
  else {
    const src = travelerDrafts.value[0]
    if (!src)
      return
    const draft: Traveler = { ...src, specialItems: src.specialItems.map(s => ({ ...s })) }
    draft.hasAddon = showAddons.value[0] ?? false
    if (!draft.hasAddon) {
      draft.addonLarge = 0
      draft.addonPro = 0
      draft.specialItems = []
    }
    travelers.value[editingTravelerIndex.value] = draft
  }
  showTravelerModal.value = false
}

function removeTraveler(i: number) {
  travelers.value.splice(i, 1)
}

function addModalSpecialItem(di: number) {
  travelerDrafts.value[di]?.specialItems.push({ name: '', unitPrice: 0, count: 0 })
}

function removeModalSpecialItem(di: number, si: number) {
  travelerDrafts.value[di]?.specialItems.splice(si, 1)
}

// ── 送出 ─────────────────────────────────────────────
const router = useRouter()

async function submitForm() {
  try {
    const body
      = orderType.value === 'merchant'
        ? {
            type: 'merchant',
            merchantStore: merchantStore.value,
            deliveryDate: deliveryDate.value,
            courier: courier.value,
            destination: destination.value,
            tripId: tripId.value,
            travelers: travelers.value,
          }
        : {
            type: orderType.value,
            luggageCount: luggageCount.value,
            hasAddons: hasAddons.value,
            largeLuggage: largeLuggage.value,
            proEquipment: proEquipment.value,
            specialItems: specialItems.value,
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
          }

    await $fetch('/api/orders', { method: 'POST', body })
    router.push('/orders')
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

        <!-- ── 雙程套票 / 單程運送 表單 ── -->
        <template v-if="orderType !== 'merchant'">
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
            <div class="mb-4 flex items-center justify-between">
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
                <!-- 大型行李箱 -->
                <div
                  class="
                    flex flex-1 flex-col gap-3 rounded-sm border
                    border-neutral-200 p-4
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
                            text-base font-bold tracking-[0.8px]
                            text-neutral-900
                          "
                        >
                          大型行李箱
                        </p>
                      </div>
                      <p class="text-sm text-neutral-600">
                        29 寸以上
                      </p>
                    </div>
                    <p class="shrink-0 text-sm font-bold text-primary-300">
                      +NT$ 50 / 件
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
                      :disabled="largeLuggage <= 0"
                      @click="largeLuggage--"
                    >
                      <Minus class="size-6" />
                    </button>
                    <span
                      class="
                        flex-1 text-center text-base tracking-[0.8px]
                        text-neutral-900
                      "
                    >{{ largeLuggage }}</span>
                    <button
                      type="button"
                      class="
                        flex shrink-0 items-center justify-center rounded-full
                        p-2
                        hover:bg-neutral-200
                      "
                      @click="largeLuggage++"
                    >
                      <Plus class="size-6" />
                    </button>
                  </div>
                </div>

                <!-- 專業裝備 -->
                <div
                  class="
                    flex flex-1 flex-col gap-3 rounded-sm border
                    border-neutral-200 p-4
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
                            text-base font-bold tracking-[0.8px]
                            text-neutral-900
                          "
                        >
                          專業裝備
                        </p>
                      </div>
                      <p class="text-sm text-neutral-600">
                        潛水裝備、高爾夫球袋
                      </p>
                    </div>
                    <p class="shrink-0 text-sm font-bold text-primary-300">
                      +NT$ 100 / 件
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
                      :disabled="proEquipment <= 0"
                      @click="proEquipment--"
                    >
                      <Minus class="size-6" />
                    </button>
                    <span
                      class="
                        flex-1 text-center text-base tracking-[0.8px]
                        text-neutral-900
                      "
                    >{{ proEquipment }}</span>
                    <button
                      type="button"
                      class="
                        flex shrink-0 items-center justify-center rounded-full
                        p-2
                        hover:bg-neutral-200
                      "
                      @click="proEquipment++"
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
                        rounded-xs border border-neutral-200 px-3 py-2 text-base
                        outline-none
                        focus:border-primary-300
                      "
                    >
                    <input
                      v-model.number="item.unitPrice"
                      type="number"
                      min="0"
                      class="
                        rounded-xs border border-neutral-200 px-3 py-2 text-base
                        outline-none
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
        </template>

        <!-- ── 商家代售 表單 ── -->
        <template v-else>
          <!-- 運送資訊 -->
          <div
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
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-sm font-medium tracking-[0.7px] text-neutral-600"
                >代售商家</label>
                <Select v-model="merchantStore">
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇商家" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem
                        value="placeholder"
                        disabled
                      >
                        請選擇商家
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-sm font-medium tracking-[0.7px] text-neutral-600"
                >運送日期</label>
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
                        !deliveryDateValue && 'text-neutral-400',
                      )"
                    >
                      <CalendarIcon class="mr-2 size-4" />
                      {{ deliveryDateValue ? df.format(deliveryDateValue.toDate(getLocalTimeZone())) : '選擇日期' }}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0">
                    <Calendar
                      v-model="deliveryDateValue"
                      :initial-focus="true"
                      layout="month-and-year"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-sm font-medium tracking-[0.7px] text-neutral-600"
                >快遞員</label>
                <Select v-model="courier">
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇快遞員" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem
                        value="placeholder"
                        disabled
                      >
                        請選擇快遞員
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-sm font-medium tracking-[0.7px] text-neutral-600"
                >目的地</label>
                <Select v-model="destination">
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇目的地" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem
                        value="placeholder"
                        disabled
                      >
                        請選擇目的地
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-sm font-medium tracking-[0.7px] text-neutral-600"
                >行程編號</label>
                <Select v-model="tripId">
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇行程編號" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem
                        value="placeholder"
                        disabled
                      >
                        請選擇行程編號
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <!-- 旅客資訊（多位） -->
          <div
            class="
              rounded-md bg-white p-6
              shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <div class="mb-4 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Luggage class="size-5 text-neutral-600" />
                <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
                  旅客資訊
                </h2>
              </div>
              <button
                type="button"
                class="
                  flex items-center gap-1.5 rounded-sm border border-primary-300
                  px-3 py-2 text-base font-medium text-primary-300
                  hover:bg-primary-100
                "
                @click="openAddTravelerModal"
              >
                <Plus class="size-5" />
                新增
              </button>
            </div>
            <div class="flex flex-col gap-2">
              <div
                v-if="travelers.length === 0"
                class="
                  flex flex-col items-center justify-center gap-2 rounded-sm
                  border border-neutral-200 bg-neutral-100 p-8
                "
              >
                <p class="text-lg font-bold tracking-[0.9px] text-neutral-900">
                  尚無資訊
                </p>
                <p class="text-center text-sm tracking-[0.7px] text-neutral-600">
                  請點選「新增一筆」將待補登的旅客資訊加入訂單中
                </p>
              </div>
              <div
                v-for="(traveler, i) in travelers"
                :key="i"
                class="flex items-start gap-3"
              >
                <!-- 序號 -->
                <div
                  class="
                    mt-4 flex size-7 shrink-0 items-center justify-center
                    rounded-full bg-neutral-200 text-sm font-medium
                    text-neutral-600
                  "
                >
                  {{ i + 1 }}
                </div>

                <!-- 摘要卡片（view-only） -->
                <div
                  class="
                    flex flex-1 flex-col gap-1 rounded-sm bg-neutral-100 p-4
                  "
                >
                  <div class="flex items-center gap-2">
                    <p
                      class="
                        flex-1 text-lg font-bold tracking-[0.9px]
                        text-neutral-900
                      "
                    >
                      {{ traveler.name || '（未填寫）' }}
                    </p>
                    <div class="flex items-center gap-3">
                      <button
                        type="button"
                        class="
                          text-sm font-medium text-danger-300
                          hover:underline
                        "
                        @click="removeTraveler(i)"
                      >
                        刪除
                      </button>
                      <button
                        type="button"
                        class="
                          text-sm font-medium text-primary-300
                          hover:underline
                        "
                        @click="openEditTravelerModal(i)"
                      >
                        編輯
                      </button>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1 text-base tracking-[0.8px]">
                    <div class="flex gap-2">
                      <span class="min-w-[76px] text-neutral-600">行李件數</span>
                      <span class="text-neutral-900">{{ traveler.luggageCount }} 件</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="min-w-[76px] text-neutral-600">聯絡電話</span>
                      <span class="text-neutral-900">{{ traveler.phone || '—' }}</span>
                    </div>
                    <template v-if="traveler.hasAddon && (traveler.addonLarge > 0 || traveler.addonPro > 0)">
                      <div class="flex items-start gap-2">
                        <span class="min-w-[76px] shrink-0 text-neutral-600">加值服務</span>
                        <span class="text-neutral-900">
                          <template v-if="traveler.addonLarge > 0">大型行李 {{ traveler.addonLarge }} 件</template>
                          <template v-if="traveler.addonLarge > 0 && traveler.addonPro > 0">、</template>
                          <template v-if="traveler.addonPro > 0">專業裝備 {{ traveler.addonPro }} 件</template>
                        </span>
                      </div>
                    </template>
                    <template v-if="traveler.notes">
                      <div class="flex gap-2">
                        <span class="min-w-[76px] text-neutral-600">備註</span>
                        <span class="flex-1 text-neutral-900">{{ traveler.notes }}</span>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 右欄：費用明細 / 訂單摘要 -->
      <div class="sticky top-8 col-span-4">
        <!-- 雙程 / 單程：費用明細 -->
        <div
          v-if="orderType !== 'merchant'"
          class="
            flex flex-col gap-4 rounded-md bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <h2 class="text-base font-bold tracking-[0.8px] text-neutral-900">
            費用明細
          </h2>

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
              <div
                v-if="largeLuggage > 0"
                class="flex justify-between text-neutral-600"
              >
                <span>大型行李箱</span>
                <span>{{ largeLuggage }} 件 · NT$ {{ largeLuggageCost }}</span>
              </div>
              <div
                v-if="proEquipment > 0"
                class="flex justify-between text-neutral-600"
              >
                <span>專業裝備</span>
                <span>{{ proEquipment }} 件 · NT$ {{ proEquipmentCost }}</span>
              </div>
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

        <!-- 商家代售：訂單摘要 -->
        <div
          v-else
          class="
            flex flex-col gap-4 rounded-md bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <h2 class="text-base font-bold tracking-[0.8px] text-neutral-900">
            訂單摘要
          </h2>

          <div class="rounded-sm border border-neutral-200 p-4">
            <!-- 商家代售 -->
            <div class="flex flex-col gap-3">
              <div>
                <p class="mb-2 text-sm font-bold text-neutral-900">
                  商家代售
                </p>
                <div class="flex flex-col gap-2 text-sm">
                  <div class="flex gap-2">
                    <span class="w-[76px] shrink-0 text-neutral-500">代售商家</span>
                    <span class="text-neutral-900">{{ merchantStore || '—' }}</span>
                  </div>
                  <div class="flex gap-2">
                    <span class="w-[76px] shrink-0 text-neutral-500">本次旅客</span>
                    <span class="text-neutral-900">{{ travelers.length }} 位</span>
                  </div>
                </div>
              </div>

              <div class="border-t border-neutral-100"></div>

              <!-- 運送資訊 -->
              <div>
                <p class="mb-2 text-sm font-bold text-neutral-900">
                  運送資訊
                </p>
                <div class="flex flex-col gap-2 text-sm">
                  <div class="flex gap-2">
                    <span class="w-[76px] shrink-0 text-neutral-500">快遞員</span>
                    <span class="text-neutral-900">{{ courier || '—' }}</span>
                  </div>
                  <div class="flex gap-2">
                    <span class="w-[76px] shrink-0 text-neutral-500">運送日期</span>
                    <span class="text-neutral-900">{{ deliveryDate || '—' }}</span>
                  </div>
                  <div class="flex gap-2">
                    <span class="w-[76px] shrink-0 text-neutral-500">目的地</span>
                    <span class="text-neutral-900">{{ destination || '—' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

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

    <!-- 旅客資訊 Modal -->
    <DialogRoot v-model:open="showTravelerModal">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/40" />
        <DialogContent
          class="
            fixed inset-0 z-50 flex items-center justify-center p-6
            focus:outline-none
          "
        >
          <div
            class="
              flex h-[760px] w-[1080px] flex-col overflow-hidden rounded-md
              border border-neutral-200 bg-white
              shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
            "
          >
            <!-- Main -->
            <div class="flex flex-1 overflow-hidden">
              <!-- 左欄 -->
              <div
                class="
                  flex min-h-0 w-[840px] shrink-0 flex-col gap-4 overflow-y-auto
                  bg-neutral-100 p-8
                "
              >
                <!-- Header -->
                <div class="flex items-center gap-1">
                  <h2
                    class="
                      flex-1 text-2xl font-bold tracking-[1.2px]
                      text-neutral-900
                    "
                  >
                    補登訂單
                  </h2>
                  <button
                    type="button"
                    class="
                      rounded-sm border border-primary-300 px-4 py-2 text-sm
                      font-medium text-primary-300
                      hover:bg-primary-100
                    "
                    @click="addAnotherTraveler"
                  >
                    新增一筆
                  </button>
                </div>
                <hr class="border-neutral-200">

                <!-- 旅客表單卡片列表 -->
                <div
                  v-for="(draft, di) in travelerDrafts"
                  :key="di"
                  class="rounded-sm border border-[#8cbcf1] bg-white"
                >
                  <!-- 卡片 header -->
                  <div
                    class="
                      flex items-center gap-2 rounded-t-sm bg-primary-100 px-4
                      py-3
                    "
                  >
                    <span
                      class="
                        flex size-7 items-center justify-center rounded-full
                        bg-[#eaf5ff] text-xs font-medium text-[#3087db]
                      "
                    >{{ di + 1 }}</span>
                    <p class="flex-1 text-base font-bold text-neutral-900">
                      請填寫旅客資訊
                    </p>
                    <button
                      v-if="travelerDrafts.length > 1"
                      type="button"
                      class="
                        flex size-7 items-center justify-center rounded-full
                        text-neutral-500
                        hover:bg-primary-200 hover:text-neutral-700
                      "
                      @click="travelerDrafts.splice(di, 1); showAddons.splice(di, 1)"
                    >
                      <X class="size-4" />
                    </button>
                  </div>

                  <!-- 表單內容 -->
                  <div class="flex flex-col gap-4 p-4">
                    <!-- 姓名 -->
                    <div class="flex flex-col gap-1.5">
                      <label class="text-sm font-medium text-neutral-600">姓名</label>
                      <input
                        v-model="draft.name"
                        type="text"
                        placeholder="旅客姓名"
                        class="
                          rounded-xs border border-neutral-200 bg-white px-3
                          py-2 text-base text-neutral-900 outline-none
                          placeholder:text-neutral-400
                          focus:border-primary-300
                        "
                      >
                    </div>

                    <!-- 聯絡電話 + 行李件數 -->
                    <div class="grid grid-cols-2 gap-3">
                      <div class="flex flex-col gap-1.5">
                        <label class="text-sm font-medium text-neutral-600">聯絡電話</label>
                        <input
                          v-model="draft.phone"
                          type="tel"
                          placeholder="0912345678"
                          class="
                            rounded-xs border border-neutral-200 bg-white px-3
                            py-2 text-base text-neutral-900 outline-none
                            placeholder:text-neutral-400
                            focus:border-primary-300
                          "
                        >
                      </div>
                      <div class="flex flex-col gap-1.5">
                        <label class="text-sm font-medium text-neutral-600">行李件數</label>
                        <div
                          class="
                            flex items-center gap-3 rounded-xs bg-neutral-100
                            px-3 py-1
                          "
                        >
                          <button
                            type="button"
                            class="
                              flex shrink-0 items-center justify-center
                              rounded-full p-2
                              hover:bg-neutral-200
                              disabled:cursor-not-allowed disabled:opacity-40
                            "
                            :disabled="draft.luggageCount <= 1"
                            @click="draft.luggageCount--"
                          >
                            <Minus class="size-5" />
                          </button>
                          <span
                            class="
                              flex-1 text-center text-base tracking-[0.8px]
                              text-neutral-900
                            "
                          >{{ draft.luggageCount }}</span>
                          <button
                            type="button"
                            class="
                              flex shrink-0 items-center justify-center
                              rounded-full p-2
                              hover:bg-neutral-200
                            "
                            @click="draft.luggageCount++"
                          >
                            <Plus class="size-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- 備註 -->
                    <div class="flex flex-col gap-1.5">
                      <label class="text-sm font-medium text-neutral-600">
                        備註（選填）
                      </label>
                      <textarea
                        v-model="draft.notes"
                        rows="3"
                        maxlength="50"
                        placeholder="例如行李尺寸、易碎物品等"
                        class="
                          w-full resize-none rounded-xs border
                          border-neutral-200 bg-white px-3 py-2 text-base
                          text-neutral-900 outline-none
                          placeholder:text-neutral-400
                          focus:border-primary-300
                        "
                      ></textarea>
                      <p class="text-right text-xs font-medium text-neutral-600">
                        {{ draft.notes.length }}/50
                      </p>
                    </div>

                    <!-- 加值服務 -->
                    <div
                      class="
                        rounded-sm border border-neutral-200 bg-neutral-50 p-4
                      "
                    >
                      <div class="flex items-center justify-between">
                        <p class="text-base font-bold text-neutral-900">
                          加值服務
                        </p>
                        <!-- Switch -->
                        <button
                          type="button"
                          role="switch"
                          :aria-checked="showAddons[di]"
                          class="
                            relative inline-flex h-6 w-11 shrink-0
                            cursor-pointer rounded-full border-2
                            border-transparent transition-colors
                            focus-visible:outline-none
                          "
                          :class="showAddons[di] ? 'bg-primary-300' : `
                            bg-neutral-300
                          `"
                          @click="showAddons[di] = !showAddons[di]"
                        >
                          <span
                            class="
                              pointer-events-none inline-block size-5
                              rounded-full bg-white shadow ring-0
                              transition-transform
                            "
                            :class="showAddons[di] ? 'translate-x-5' : `
                              translate-x-0
                            `"
                          ></span>
                        </button>
                      </div>
                      <template v-if="showAddons[di]">
                        <div class="grid grid-cols-2 gap-4">
                          <!-- 大型行李箱 -->
                          <div
                            class="
                              flex flex-col gap-3 rounded-sm border
                              border-neutral-200 bg-white p-4
                            "
                          >
                            <div class="flex items-start gap-3">
                              <div class="flex flex-1 flex-col gap-1">
                                <div class="flex items-center gap-2">
                                  <div
                                    class="
                                      w-1 self-stretch rounded-xs
                                      bg-gradient-to-br from-[#4090e8]
                                      to-[#306cf7]
                                    "
                                  ></div>
                                  <p
                                    class="
                                      text-base font-bold tracking-[0.8px]
                                      text-neutral-900
                                    "
                                  >
                                    大型行李箱
                                  </p>
                                </div>
                                <p class="text-sm text-neutral-600">
                                  29 寸以上
                                </p>
                              </div>
                              <p
                                class="
                                  shrink-0 text-sm font-bold text-primary-300
                                "
                              >
                                +NT$ 50 / 件
                              </p>
                            </div>
                            <div
                              class="
                                flex h-10 items-center gap-3 rounded-xs
                                bg-neutral-100 px-3 py-2
                              "
                            >
                              <button
                                type="button"
                                class="
                                  flex shrink-0 items-center justify-center
                                  rounded-full p-2
                                  hover:bg-neutral-200
                                  disabled:cursor-not-allowed
                                  disabled:opacity-40
                                "
                                :disabled="draft.addonLarge <= 0"
                                @click="draft.addonLarge--"
                              >
                                <Minus class="size-5" />
                              </button>
                              <span
                                class="
                                  flex-1 text-center text-base tracking-[0.8px]
                                  text-neutral-900
                                "
                              >{{ draft.addonLarge }}</span>
                              <button
                                type="button"
                                class="
                                  flex shrink-0 items-center justify-center
                                  rounded-full p-2
                                  hover:bg-neutral-200
                                "
                                @click="draft.addonLarge++"
                              >
                                <Plus class="size-5" />
                              </button>
                            </div>
                          </div>

                          <!-- 專業裝備 -->
                          <div
                            class="
                              flex flex-col gap-3 rounded-sm border
                              border-neutral-200 bg-white p-4
                            "
                          >
                            <div class="flex items-start gap-3">
                              <div class="flex flex-1 flex-col gap-1">
                                <div class="flex items-center gap-2">
                                  <div
                                    class="
                                      w-1 self-stretch rounded-xs
                                      bg-gradient-to-br from-[#4090e8]
                                      to-[#306cf7]
                                    "
                                  ></div>
                                  <p
                                    class="
                                      text-base font-bold tracking-[0.8px]
                                      text-neutral-900
                                    "
                                  >
                                    專業裝備
                                  </p>
                                </div>
                                <p class="text-sm text-neutral-600">
                                  潛水裝備、高爾夫球袋
                                </p>
                              </div>
                              <p
                                class="
                                  shrink-0 text-sm font-bold text-primary-300
                                "
                              >
                                +NT$ 100 / 件
                              </p>
                            </div>
                            <div
                              class="
                                flex h-10 items-center gap-3 rounded-xs
                                bg-neutral-100 px-3 py-2
                              "
                            >
                              <button
                                type="button"
                                class="
                                  flex shrink-0 items-center justify-center
                                  rounded-full p-2
                                  hover:bg-neutral-200
                                  disabled:cursor-not-allowed
                                  disabled:opacity-40
                                "
                                :disabled="draft.addonPro <= 0"
                                @click="draft.addonPro--"
                              >
                                <Minus class="size-5" />
                              </button>
                              <span
                                class="
                                  flex-1 text-center text-base tracking-[0.8px]
                                  text-neutral-900
                                "
                              >{{ draft.addonPro }}</span>
                              <button
                                type="button"
                                class="
                                  flex shrink-0 items-center justify-center
                                  rounded-full p-2
                                  hover:bg-neutral-200
                                "
                                @click="draft.addonPro++"
                              >
                                <Plus class="size-5" />
                              </button>
                            </div>
                          </div>

                          <!-- 特殊物件 — col-span-2 -->
                          <div
                            class="
                              col-span-2 flex flex-col gap-3 rounded-sm border
                              border-neutral-200 bg-white p-4
                            "
                          >
                            <div class="flex items-start justify-between gap-2">
                              <div class="flex flex-col gap-1">
                                <div class="flex items-center gap-2">
                                  <div
                                    class="
                                      w-1 self-stretch rounded-xs
                                      bg-gradient-to-br from-[#4090e8]
                                      to-[#306cf7]
                                    "
                                  ></div>
                                  <p
                                    class="
                                      text-base font-bold tracking-[0.8px]
                                      text-neutral-900
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
                                  flex shrink-0 items-center gap-1.5 rounded-sm
                                  border border-primary-300 px-3 py-1.5 text-sm
                                  font-medium text-primary-300
                                  hover:bg-primary-100
                                "
                                @click="addModalSpecialItem(di)"
                              >
                                <Plus class="size-4" />
                                新增物件
                              </button>
                            </div>
                            <template v-if="draft.specialItems.length > 0">
                              <div
                                class="
                                  grid grid-cols-[1fr_1fr_1fr_32px] gap-3
                                  text-sm font-medium text-neutral-600
                                "
                              >
                                <span>物件</span>
                                <span>單價 NTD</span>
                                <span>件數</span>
                                <span></span>
                              </div>
                              <div
                                v-for="(item, si) in draft.specialItems"
                                :key="si"
                                class="
                                  grid grid-cols-[1fr_1fr_1fr_32px] items-center
                                  gap-3
                                "
                              >
                                <input
                                  v-model="item.name"
                                  type="text"
                                  placeholder="物件名稱"
                                  class="
                                    rounded-xs border border-neutral-200 px-3
                                    py-2 text-sm outline-none
                                    focus:border-primary-300
                                  "
                                >
                                <input
                                  v-model.number="item.unitPrice"
                                  type="number"
                                  min="0"
                                  class="
                                    rounded-xs border border-neutral-200 px-3
                                    py-2 text-sm outline-none
                                    focus:border-primary-300
                                  "
                                >
                                <div
                                  class="
                                    flex items-center gap-2 rounded-xs
                                    bg-neutral-100 px-3 py-1
                                  "
                                >
                                  <button
                                    type="button"
                                    class="
                                      flex shrink-0 items-center justify-center
                                      rounded-full p-1
                                      hover:bg-neutral-200
                                      disabled:opacity-40
                                    "
                                    :disabled="item.count <= 0"
                                    @click="item.count--"
                                  >
                                    <Minus class="size-4" />
                                  </button>
                                  <span
                                    class="
                                      flex-1 text-center text-sm
                                      text-neutral-900
                                    "
                                  >{{ item.count }}</span>
                                  <button
                                    type="button"
                                    class="
                                      flex shrink-0 items-center justify-center
                                      rounded-full p-1
                                      hover:bg-neutral-200
                                    "
                                    @click="item.count++"
                                  >
                                    <Plus class="size-4" />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  class="
                                    flex size-8 items-center justify-center
                                    rounded-full text-neutral-400
                                    hover:bg-neutral-100 hover:text-neutral-600
                                  "
                                  @click="removeModalSpecialItem(di, si)"
                                >
                                  <X class="size-4" />
                                </button>
                              </div>
                            </template>
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 右欄：票券資訊 sidebar -->
              <div
                class="
                  relative flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto
                  p-6
                "
              >
                <p class="text-base font-bold text-neutral-900">
                  票券資訊
                </p>

                <!-- 代售商家 -->
                <div class="rounded-sm border border-neutral-200 p-4">
                  <p class="mb-1 text-xs font-medium text-neutral-500">
                    代售商家
                  </p>
                  <p class="text-base font-bold text-neutral-900">
                    {{ merchantStore || '—' }}
                  </p>
                </div>

                <!-- 剩餘票券 -->
                <div class="rounded-sm border border-neutral-200 p-4">
                  <p class="mb-1 text-xs font-medium text-neutral-500">
                    剩餘票券
                  </p>
                  <p class="text-base font-bold text-neutral-900">
                    —
                  </p>
                </div>

                <!-- 關閉按鈕 -->
                <button
                  type="button"
                  class="
                    absolute top-2 right-2 flex size-8 items-center
                    justify-center rounded-full text-neutral-400
                    hover:bg-neutral-100 hover:text-neutral-600
                  "
                  @click="showTravelerModal = false"
                >
                  <X class="size-4" />
                </button>
              </div>
            </div>

            <!-- Footer -->
            <div
              class="
                flex gap-2 border-t border-neutral-200 bg-white px-8 py-4
                shadow-[0px_-4px_20px_0px_rgba(32,78,184,0.12)]
              "
            >
              <button
                type="button"
                class="
                  flex-1 rounded-sm border border-neutral-200 py-2.5 text-base
                  font-medium text-neutral-700
                  hover:bg-neutral-50
                "
                @click="showTravelerModal = false"
              >
                取消
              </button>
              <button
                type="button"
                class="
                  flex-1 rounded-sm bg-primary-300 py-2.5 text-base font-medium
                  text-white
                  hover:bg-primary-400
                "
                @click="confirmTraveler"
              >
                立即補登
              </button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>

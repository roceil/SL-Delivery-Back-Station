<script lang="ts" setup>
import {
  ChevronRight,
  ClipboardList,
  Copy,
  Edit,
  MapPin,
  Phone,
  Route,
  X,
} from 'lucide-vue-next'

useHead({ title: '行程詳情 - 物流管理系統' })

const router = useRouter()
const route = useRoute()
const tripId = route.params.id as string

interface TripOrder {
  id: string
  lineName: string
  luggageCount: number
  status: string
  pickupLocation: { id: string, name: string }
  deliveryLocation: { id: string, name: string }
  notes: string
}

interface RouteStep {
  name: string
  stationId: string
  totalLuggage: number
  pickups: { count: number }[]
  deliveries: { count: number }[]
}

const { data: trip, error: tripError } = await useFetch(`/api/trips/${tripId}`)
const { data: orders } = await useFetch<TripOrder[]>(`/api/trips/${tripId}/orders`)

if (tripError.value) {
  throw createError({ statusCode: 404, message: '找不到行程' })
}

const tripStatus = computed(() => (trip.value as any)?.status || 'pending')
const tripStatusLabel = computed(() => getTripStatusBadge(tripStatus.value).label)

const orderCount = computed(() => orders.value?.length || 0)
const totalLuggage = computed(() => orders.value?.reduce((s, o) => s + o.luggageCount, 0) || 0)

const routeSteps = computed<RouteStep[]>(() => {
  if (!orders.value?.length)
    return []

  const stops: string[] = []
  const stepMap = new Map<string, RouteStep>()

  for (const order of orders.value) {
    const pickupId = order.pickupLocation.id
    const deliveryId = order.deliveryLocation.id

    if (!stepMap.has(pickupId)) {
      stops.push(pickupId)
      stepMap.set(pickupId, {
        name: order.pickupLocation.name,
        stationId: pickupId,
        totalLuggage: 0,
        pickups: [],
        deliveries: [],
      })
    }
    if (!stepMap.has(deliveryId)) {
      stops.push(deliveryId)
      stepMap.set(deliveryId, {
        name: order.deliveryLocation.name,
        stationId: deliveryId,
        totalLuggage: 0,
        pickups: [],
        deliveries: [],
      })
    }

    stepMap.get(pickupId)!.pickups.push({ count: order.luggageCount })
    stepMap.get(pickupId)!.totalLuggage += order.luggageCount
    stepMap.get(deliveryId)!.deliveries.push({ count: order.luggageCount })
    stepMap.get(deliveryId)!.totalLuggage += order.luggageCount
  }

  return stops.map(id => stepMap.get(id)!)
})

function copyTripName() {
  navigator.clipboard.writeText((trip.value as any)?.name || '')
}
</script>

<template>
  <div class="flex min-h-full flex-col gap-4 bg-neutral-100 p-8">
    <!-- 標題列 -->
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="
          flex items-center justify-center rounded-full p-2
          hover:bg-neutral-200
        "
        @click="router.push('/trips')"
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
        行程編號 {{ (trip as any)?.name }}
      </h4>
      <button
        type="button"
        class="
          flex items-center justify-center rounded-full p-2
          hover:bg-neutral-200
        "
        @click="copyTripName"
      >
        <Copy class="size-4 text-neutral-400" />
      </button>
      <span
        class="
          rounded-full bg-[#fef0f0] px-3 py-1 text-xs font-medium
          tracking-[0.6px] text-[#d74f4f]
        "
      >
        {{ tripStatusLabel }}
      </span>
    </div>

    <!-- 主內容 -->
    <div class="grid grid-cols-12 items-start gap-4">
      <!-- 左欄 -->
      <div class="col-span-8 flex flex-col gap-4">
        <!-- Card 1：運送資訊 -->
        <div
          class="
            flex flex-col gap-4 rounded-2xl bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <div class="flex items-center gap-2">
            <Route class="size-5 text-neutral-900" />
            <span class="text-lg font-bold tracking-[0.9px] text-neutral-900">運送資訊</span>
          </div>

          <div class="grid grid-cols-4 gap-3">
            <div class="flex flex-col gap-1 rounded-sm bg-neutral-100 p-4">
              <span class="text-sm tracking-[0.7px] text-neutral-600">快遞員</span>
              <span
                class="text-base font-medium tracking-[0.8px] text-neutral-900"
              >
                {{ (trip as any)?.courierName || '未分配' }}
              </span>
            </div>
            <div class="flex flex-col gap-1 rounded-sm bg-neutral-100 p-4">
              <span class="text-sm tracking-[0.7px] text-neutral-600">行李件數</span>
              <span
                class="text-base font-medium tracking-[0.8px] text-neutral-900"
              >
                {{ totalLuggage }}
              </span>
            </div>
            <div class="flex flex-col gap-1 rounded-sm bg-neutral-100 p-4">
              <span class="text-sm tracking-[0.7px] text-neutral-600">訂單筆數</span>
              <span
                class="text-base font-medium tracking-[0.8px] text-neutral-900"
              >
                {{ orderCount }}
              </span>
            </div>
            <div class="flex flex-col gap-1 rounded-sm bg-neutral-100 p-4">
              <span class="text-sm tracking-[0.7px] text-neutral-600">運送日期</span>
              <span
                class="text-base font-medium tracking-[0.8px] text-neutral-900"
              >
                {{ (trip as any)?.scheduledDate }}
              </span>
            </div>
          </div>
        </div>

        <!-- Card 2：運送任務 -->
        <div
          class="
            flex flex-col gap-4 rounded-2xl bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <div class="flex items-center gap-2">
            <ClipboardList class="size-5 text-neutral-900" />
            <span class="text-lg font-bold tracking-[0.9px] text-neutral-900">運送任務</span>
          </div>

          <div
            v-if="!orders?.length"
            class="py-4 text-center text-sm text-neutral-400"
          >
            此行程尚無訂單
          </div>

          <div
            v-else
            class="flex flex-col gap-3"
          >
            <div
              v-for="(order, idx) in orders"
              :key="order.id"
              class="flex items-center gap-3"
            >
              <!-- 序號 Badge -->
              <div
                class="
                  flex size-7 shrink-0 items-center justify-center rounded-full
                  bg-neutral-200 text-xs font-medium text-neutral-600
                "
              >
                {{ idx + 1 }}
              </div>

              <!-- 訂單卡片 -->
              <div
                class="
                  flex flex-1 items-center gap-3 rounded-sm bg-neutral-50 p-4
                "
              >
                <div class="flex flex-1 flex-col gap-1">
                  <div class="flex items-center gap-2">
                    <span
                      class="
                        text-base font-bold tracking-[0.8px] text-neutral-900
                      "
                    >
                      {{ order.lineName }}
                    </span>
                    <span
                      class="
                        rounded-full bg-neutral-200 px-2 py-0.5 text-xs
                        font-medium text-neutral-600
                      "
                    >
                      {{ getOrderStatusBadge(order.status).label }}
                    </span>
                  </div>
                  <span class="text-sm tracking-[0.7px] text-neutral-600">
                    {{ order.luggageCount }} 件
                    <span class="text-neutral-400">·</span>
                    {{ order.pickupLocation.name }} → {{ order.deliveryLocation.name }}
                  </span>
                </div>
                <button
                  type="button"
                  class="
                    flex items-center justify-center rounded-full p-1
                    hover:bg-neutral-200
                  "
                  @click="router.push(`/orders/${order.id}`)"
                >
                  <ChevronRight class="size-4 text-neutral-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 3：運送路線 -->
        <div
          class="
            flex flex-col gap-4 rounded-2xl bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <div class="flex items-center gap-2">
            <MapPin class="size-5 text-neutral-900" />
            <span
              class="flex-1 text-lg font-bold tracking-[0.9px] text-neutral-900"
            >
              運送路線
            </span>
            <span class="text-sm tracking-[0.7px] text-neutral-600">
              {{ routeSteps.length }} 個站點 · {{ orderCount }} 筆訂單
            </span>
          </div>

          <div
            v-if="!routeSteps.length"
            class="py-4 text-center text-sm text-neutral-400"
          >
            尚無路線資訊
          </div>

          <!-- Stepper -->
          <div
            v-else
            class="flex flex-col"
          >
            <div
              v-for="(step, idx) in routeSteps"
              :key="step.stationId"
              class="flex gap-3"
            >
              <!-- 左側：圓圈 + 連接線 -->
              <div class="flex flex-col items-center">
                <div
                  class="
                    flex size-8 shrink-0 items-center justify-center
                    rounded-full bg-[#2449a0] text-xs font-bold text-white
                  "
                >
                  {{ idx + 1 }}
                </div>
                <div
                  v-if="idx < routeSteps.length - 1"
                  class="w-px flex-1 bg-[#2449a0]"
                ></div>
              </div>

              <!-- 右側：站點卡片 -->
              <div
                class="flex-1"
                :class="idx < routeSteps.length - 1 ? 'pb-6' : ''"
              >
                <div
                  class="overflow-hidden rounded-xl border border-neutral-200"
                >
                  <!-- 卡片 Header -->
                  <div class="flex items-center gap-2 bg-neutral-100 px-4 py-3">
                    <span
                      class="
                        flex-1 text-base font-bold tracking-[0.8px]
                        text-neutral-900
                      "
                    >{{ step.name }}</span>
                    <span class="text-sm tracking-[0.7px] text-neutral-600">
                      共 {{ step.totalLuggage }} 件
                    </span>
                    <span
                      class="
                        rounded-full bg-neutral-200 px-2 py-0.5 text-xs
                        font-medium text-neutral-600
                      "
                    >未開始</span>
                  </div>

                  <!-- 卡片 Body -->
                  <div class="flex flex-col gap-2 p-4">
                    <div
                      v-if="step.pickups.length > 0"
                      class="flex items-center gap-2"
                    >
                      <div class="size-1.5 shrink-0 rounded-full bg-[#3087db]"></div>
                      <span
                        class="
                          text-base font-medium tracking-[0.8px]
                          text-neutral-900
                        "
                      >攬件</span>
                      <span class="text-neutral-400">·</span>
                      <span
                        class="
                          flex-1 text-base tracking-[0.8px] text-neutral-600
                        "
                      >
                        {{ step.pickups.reduce((s, p) => s + p.count, 0) }} 件行李
                      </span>
                      <button
                        type="button"
                        class="
                          flex items-center justify-center rounded-full p-1
                          hover:bg-neutral-100
                        "
                        @click="router.push(`/trips/${tripId}/stops/${idx}`)"
                      >
                        <ChevronRight class="size-4 text-neutral-400" />
                      </button>
                    </div>
                    <div
                      v-if="step.deliveries.length > 0"
                      class="flex items-center gap-2"
                    >
                      <div class="size-1.5 shrink-0 rounded-full bg-[#229464]"></div>
                      <span
                        class="
                          text-base font-medium tracking-[0.8px]
                          text-neutral-900
                        "
                      >放置</span>
                      <span class="text-neutral-400">·</span>
                      <span
                        class="
                          flex-1 text-base tracking-[0.8px] text-neutral-600
                        "
                      >
                        {{ step.deliveries.reduce((s, d) => s + d.count, 0) }} 件行李
                      </span>
                      <button
                        type="button"
                        class="
                          flex items-center justify-center rounded-full p-1
                          hover:bg-neutral-100
                        "
                        @click="router.push(`/trips/${tripId}/stops/${idx}`)"
                      >
                        <ChevronRight class="size-4 text-neutral-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
            flex w-full items-center gap-3 rounded-sm bg-primary-400 px-4 py-3
            text-base font-medium tracking-[0.8px] text-white transition-colors
            hover:bg-primary-500
          "
        >
          <Phone class="size-4 shrink-0" />
          聯絡快遞員
        </button>

        <button
          type="button"
          class="
            flex w-full items-center gap-3 rounded-sm border border-neutral-200
            bg-white px-4 py-3 text-base font-medium tracking-[0.8px]
            text-neutral-900 transition-colors
            hover:bg-neutral-50
          "
        >
          <MapPin class="size-4 shrink-0 text-neutral-600" />
          查看地圖
        </button>

        <button
          type="button"
          class="
            flex w-full items-center gap-3 rounded-sm border border-neutral-200
            bg-white px-4 py-3 text-base font-medium tracking-[0.8px]
            text-neutral-900 transition-colors
            hover:bg-neutral-50
          "
          @click="router.push(`/trips/${tripId}/edit`)"
        >
          <Edit class="size-4 shrink-0 text-neutral-600" />
          編輯行程
        </button>

        <button
          type="button"
          class="
            flex w-full items-center gap-3 rounded-sm border border-neutral-200
            bg-white px-4 py-3 text-base font-medium tracking-[0.8px]
            text-neutral-900 transition-colors
            hover:bg-neutral-50
          "
        >
          <X class="size-4 shrink-0 text-neutral-600" />
          取消行程
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { DateValue } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone } from '@internationalized/date'
import { ArrowRight, CalendarIcon, ChevronRight, Search } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface Trip {
  date: string
  courier: string
  orders: number
  from: string
  to: string
  luggage: number
  area: string
  status: string
}

const props = defineProps<{
  trips: Trip[]
  startDate: string
  endDate?: string
}>()

const dateLabel = computed(() =>
  props.endDate ? `${props.startDate} ～ ${props.endDate}` : props.startDate,
)

const { getStatus } = useTripStatus()

const df = new DateFormatter('zh-TW', { dateStyle: 'medium' })
const filterDate = ref<DateValue>()
</script>

<template>
  <div class="flex flex-col gap-4 rounded-2xl bg-neutral-100 p-6">
    <!-- Header -->
    <div class="flex items-baseline gap-3">
      <p class="text-h6 shrink-0 font-bold tracking-wider text-neutral-900">
        進行中行程
      </p>
      <div
        class="
          flex flex-1 items-center gap-2 text-xs tracking-wide text-neutral-600
        "
      >
        <span>{{ dateLabel }}</span>
        <span>·</span>
        <span>{{ trips.length }} 趟行程</span>
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          class="text-neutral-600 hover:text-neutral-900"
        >
          清除篩選條件
        </Button>
        <Button
          as-child
          variant="outline-primary"
          size="sm"
          class="bg-transparent hover:bg-primary-300 hover:text-white"
        >
          <NuxtLink to="/trips">
            查看所有行程
          </NuxtLink>
        </Button>
      </div>
    </div>

    <!-- Filter row -->
    <div class="flex items-center gap-3">
      <div
        class="
          flex w-[220px] items-center gap-2 rounded-xs border border-neutral-200
          bg-neutral-0 px-3 py-2
        "
      >
        <Search
          class="size-4 shrink-0 text-neutral-500"
        />
        <input
          type="text"
          placeholder="目的地、行程或訂單編號"
          class="
            flex-1 bg-transparent text-sm tracking-wider text-neutral-900
            outline-none
            placeholder:text-neutral-500
          "
        >
      </div>
      <Select>
        <SelectTrigger class="flex-1">
          <SelectValue placeholder="請選擇區域類型" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="airport">
              機場
            </SelectItem>
            <SelectItem value="hotel">
              飯店
            </SelectItem>
            <SelectItem value="other">
              其他
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger class="flex-1">
          <SelectValue placeholder="請選擇快遞員" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">
              全部
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Popover>
        <PopoverTrigger as-child>
          <Button
            variant="outline"
            :class="cn(
              `
                flex-1 justify-start rounded-xs border-neutral-200 px-3 py-2
                text-sm font-normal tracking-wider shadow-none
              `,
              !filterDate && 'text-neutral-500',
            )"
          >
            <CalendarIcon class="mr-2 size-4" />
            {{ filterDate ? df.format(filterDate.toDate(getLocalTimeZone())) : '選擇日期' }}
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0">
          <Calendar
            v-model="filterDate"
            :initial-focus="true"
            layout="month-and-year"
          />
        </PopoverContent>
      </Popover>
      <Select>
        <SelectTrigger class="flex-1">
          <SelectValue placeholder="請選擇運送狀態" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="pending">
              待處理
            </SelectItem>
            <SelectItem value="in-transit">
              運送中
            </SelectItem>
            <SelectItem value="delivered">
              已完成
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>

    <!-- Table -->
    <div
      class="
        overflow-hidden rounded-xl bg-white
        shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
      "
    >
      <div
        class="grid border-b border-neutral-200"
        style="grid-template-columns: 52px 1fr 1fr 1fr 255px 1fr 1fr 1fr 1fr 56px"
      >
        <div class="flex items-center py-3 pl-4">
          <input
            type="checkbox"
            class="size-4 cursor-pointer accent-primary-300"
          >
        </div>
        <div
          v-for="col in ['運送日期', '快遞員', '訂單資訊', '路線', '行李數量', '區域', '運送狀態', '操作']"
          :key="col"
          class="px-4 py-3 text-sm font-medium tracking-wider text-neutral-600"
        >
          {{ col }}
        </div>
        <div class="px-4 py-3"></div>
      </div>

      <ul>
        <li
          v-for="(trip, i) in trips"
          :key="i"
          class="
            group border-b border-neutral-200 transition-colors
            last:border-b-0
            hover:bg-neutral-50
          "
        >
          <NuxtLink
            :to="`/trips/track/${i}`"
            class="grid"
            style="grid-template-columns: 52px 1fr 1fr 1fr 255px 1fr 1fr 1fr 1fr 56px"
          >
            <div class="flex h-[60px] items-center pl-4">
              <input
                type="checkbox"
                class="size-4 cursor-pointer accent-primary-300"
                @click.prevent
              >
            </div>
            <div
              class="
                flex h-[60px] items-center px-4 text-sm tracking-wider
                text-neutral-900
              "
            >
              {{ trip.date }}
            </div>
            <div
              class="
                flex h-[60px] items-center px-4 text-sm tracking-wider
                text-neutral-900
              "
            >
              {{ trip.courier }}
            </div>
            <div
              class="
                flex h-[60px] items-center px-4 text-sm tracking-wider
                text-neutral-900
              "
            >
              {{ trip.orders }} 筆訂單
            </div>
            <div
              class="
                flex h-[60px] items-center gap-2 px-2 text-sm tracking-wider
                text-neutral-900
              "
            >
              <HoverCard :open-delay="100">
                <HoverCardTrigger class="truncate">
                  {{ trip.from }}
                </HoverCardTrigger>
                <HoverCardContent
                  class="
                    w-auto rounded-full border-none bg-primary-200 px-3 py-1
                    text-sm font-medium tracking-wide text-info-300
                  "
                >
                  {{ trip.from }}
                </HoverCardContent>
              </HoverCard>
              <ArrowRight
                class="size-4 shrink-0 text-neutral-600"
              />
              <HoverCard :open-delay="100">
                <HoverCardTrigger class="truncate">
                  {{ trip.to }}
                </HoverCardTrigger>
                <HoverCardContent
                  class="
                    w-auto rounded-full border-none bg-primary-200 px-3 py-1
                    text-sm font-medium tracking-wide text-info-300
                  "
                >
                  {{ trip.to }}
                </HoverCardContent>
              </HoverCard>
            </div>
            <div
              class="
                flex h-[60px] items-center px-4 text-sm tracking-wider
                text-neutral-900
              "
            >
              {{ trip.luggage }} 件
            </div>
            <div
              class="
                flex h-[60px] items-center px-4 text-sm tracking-wider
                text-neutral-900
              "
            >
              {{ trip.area }}
            </div>
            <div class="flex h-[60px] items-center px-4">
              <Badge
                :label="getStatus(trip.status).label"
                :type="getStatus(trip.status).type"
                size="lg"
              />
            </div>
            <div class="flex h-[60px] items-center px-4">
              <button
                class="
                  cursor-pointer text-sm leading-[1.5] font-medium
                  tracking-[0.7px] text-primary-300 underline-offset-4
                  transition-all duration-300 ease-in-out
                  hover:text-primary-500 hover:underline
                "
                @click.prevent
              >
                查看地圖
              </button>
            </div>
            <div class="flex h-[60px] items-center justify-center px-4">
              <ChevronRight
                class="
                  size-4 text-neutral-600 transition-transform duration-200
                  group-hover:translate-x-1
                "
              />
            </div>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

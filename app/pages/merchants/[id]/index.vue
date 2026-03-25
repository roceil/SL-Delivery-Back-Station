<script lang="ts" setup>
import { ArrowLeft, Clock, Mail, MapPin, Pencil, Phone, Settings2, Tag, UserRound, Zap } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

interface Merchant {
  id: number
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  type: number
  typeName: string
  area: string
  isActive: boolean
  isCollaborate: boolean
  voucherId: string
  usedCounts: number
  maxUsageCounts: number | null
  remarks: string
  createdAt: string
  updatedAt: string
  latitude?: number | null
  longitude?: number | null
}

const route = useRoute()
const router = useRouter()
const merchantId = route.params.id as string

useHead({
  title: '商家詳細 - 物流管理系統',
})

const { setBreadcrumb, clearBreadcrumb } = useBreadcrumb()

const { data: merchantData, error } = await useFetch<Merchant>(`/api/merchants/${merchantId}`)

if (error.value || !merchantData.value) {
  throw createError({ statusCode: 404, message: '找不到此商家' })
}

const merchant = merchantData as Ref<Merchant>

onMounted(() => {
  setBreadcrumb({ label: merchant.value.name })
})

onBeforeRouteLeave(() => {
  clearBreadcrumb()
})

const remainingVouchers = computed(() => {
  const max = merchant.value.maxUsageCounts ?? 0
  const used = merchant.value.usedCounts ?? 0
  return Math.max(0, max - used)
})

const usagePercentage = computed(() => {
  if (!merchant.value.maxUsageCounts)
    return 0
  return Math.round((merchant.value.usedCounts / merchant.value.maxUsageCounts) * 100)
})

const usageStatus = computed(() => {
  const pct = usagePercentage.value
  if (pct >= 90)
    return { text: '即將額滿', color: 'text-danger-300' }
  if (pct >= 70)
    return { text: '使用偏高', color: 'text-warning-300' }
  if (pct >= 50)
    return { text: '使用正常', color: 'text-info-300' }
  return { text: '餘額充裕', color: 'text-success-300' }
})

function formatDate(dateString: string) {
  if (!dateString)
    return '-'
  return new Date(dateString).toLocaleDateString('zh-TW')
}

function getPartnershipDuration(startDate: string) {
  if (!startDate)
    return '-'
  const start = new Date(startDate)
  const now = new Date()
  const diffDays = Math.ceil(Math.abs(now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const months = Math.floor(diffDays / 30)
  const days = diffDays % 30
  if (months > 0)
    return `${months} 個月 ${days} 天`
  return `${days} 天`
}

// 類型 Badge 對應
interface BadgeInfo { type: 'gray' | 'blue' | 'green' | 'orange', label: string }

const typeBadgeMap: Record<string, BadgeInfo> = {
  民宿: { type: 'green', label: '民宿' },
  潛水店: { type: 'blue', label: '潛水店' },
  餐廳: { type: 'orange', label: '餐廳' },
  碼頭: { type: 'gray', label: '碼頭' },
}

function getTypeBadge(typeName: string): BadgeInfo {
  return typeBadgeMap[typeName] ?? { type: 'gray', label: typeName || '-' }
}

function openGoogleMaps(address: string) {
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div class="flex min-h-full flex-col gap-4 bg-neutral-100 p-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
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
          {{ merchant.name }}
        </h4>
        <div class="flex items-center gap-1.5">
          <Badge
            :type="getTypeBadge(merchant.typeName).type"
            :label="getTypeBadge(merchant.typeName).label"
            size="sm"
          />
          <Badge
            :type="merchant.isActive ? 'green' : 'gray'"
            :label="merchant.isActive ? '啟用中' : '已停用'"
            size="sm"
          />
        </div>
      </div>

      <!-- 編輯按鈕 -->
      <button
        type="button"
        class="
          flex cursor-pointer items-center gap-2 rounded-sm border
          border-neutral-200 bg-white px-4 py-2 text-base font-medium
          tracking-[0.8px] text-neutral-900 transition-colors
          hover:bg-neutral-50
        "
        @click="router.push(`/merchants/${merchantId}/edit`)"
      >
        <Pencil class="size-4" />
        編輯
      </button>
    </div>

    <!-- 主要內容 -->
    <div class="grid grid-cols-12 items-start gap-4">
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

          <div class="flex flex-col gap-3 text-base tracking-[0.8px]">
            <div class="flex items-start gap-4">
              <span class="min-w-[100px] text-neutral-600">商家名稱</span>
              <span class="text-neutral-900">{{ merchant.name || '-' }}</span>
            </div>
            <div class="flex items-start gap-4">
              <span class="min-w-[100px] text-neutral-600">聯絡人</span>
              <span class="text-neutral-900">{{ merchant.contactPerson || '-' }}</span>
            </div>
            <div class="flex items-start gap-4">
              <span class="min-w-[100px] text-neutral-600">聯絡電話</span>
              <a
                v-if="merchant.phone"
                :href="`tel:${merchant.phone}`"
                class="text-primary-400 hover:text-primary-500"
              >{{ merchant.phone }}</a>
              <span
                v-else
                class="text-neutral-900"
              >-</span>
            </div>
            <div class="flex items-start gap-4">
              <span class="min-w-[100px] text-neutral-600">Email</span>
              <a
                v-if="merchant.email"
                :href="`mailto:${merchant.email}`"
                class="break-all text-primary-400 hover:text-primary-500"
              >{{ merchant.email }}</a>
              <span
                v-else
                class="text-neutral-900"
              >-</span>
            </div>
            <div class="flex items-start gap-4">
              <span class="min-w-[100px] text-neutral-600">地址</span>
              <span class="text-neutral-900">{{ merchant.address || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 票券資訊 -->
        <div
          class="
            rounded-md bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <div class="mb-4 flex items-center gap-2">
            <Tag class="size-5 text-neutral-600" />
            <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
              票券資訊
            </h2>
          </div>

          <div class="flex flex-col gap-3 text-base tracking-[0.8px]">
            <div class="flex items-start gap-4">
              <span class="min-w-[100px] text-neutral-600">票券 ID</span>
              <span class="font-mono text-neutral-900">{{ merchant.voucherId || '-' }}</span>
            </div>
            <div class="flex items-start gap-4">
              <span class="min-w-[100px] text-neutral-600">已使用次數</span>
              <span class="text-neutral-900">{{ merchant.usedCounts ?? 0 }} 次</span>
            </div>
            <div class="flex items-start gap-4">
              <span class="min-w-[100px] text-neutral-600">可用次數</span>
              <span class="text-neutral-900">{{ merchant.maxUsageCounts ?? '-' }} 次</span>
            </div>
            <div
              v-if="merchant.maxUsageCounts"
              class="flex items-center gap-4"
            >
              <span class="min-w-[100px] text-neutral-600">剩餘次數</span>
              <span
                class="
                  bg-gradient-to-r from-[#4090E8] to-[#306CF7] bg-clip-text
                  text-lg font-bold text-transparent
                "
              >{{ remainingVouchers }} 次</span>
            </div>
          </div>

          <!-- 進度條 -->
          <div
            v-if="merchant.maxUsageCounts"
            class="mt-4"
          >
            <div
              class="
                mb-1.5 flex items-center justify-between text-sm
                tracking-[0.7px]
              "
            >
              <span :class="usageStatus.color">{{ usageStatus.text }}</span>
              <span class="text-neutral-600">已使用 {{ usagePercentage }}%</span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                class="h-full rounded-full bg-success-300 transition-all"
                :style="{ width: `${usagePercentage}%` }"
              ></div>
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

          <div class="flex flex-col gap-3 text-base tracking-[0.8px]">
            <div class="flex items-center gap-4">
              <span class="min-w-[100px] text-neutral-600">啟用狀態</span>
              <Badge
                :type="merchant.isActive ? 'green' : 'gray'"
                :label="merchant.isActive ? '啟用中' : '已停用'"
                size="lg"
              />
            </div>
            <div class="flex items-center gap-4">
              <span class="min-w-[100px] text-neutral-600">合作狀態</span>
              <Badge
                :type="merchant.isCollaborate ? 'green' : 'gray'"
                :label="merchant.isCollaborate ? '合作中' : '暫停合作'"
                size="lg"
              />
            </div>
            <div class="flex items-center gap-4">
              <span class="min-w-[100px] text-neutral-600">商家類型</span>
              <span class="text-neutral-900">{{ merchant.typeName || '-' }}</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="min-w-[100px] text-neutral-600">商家區域</span>
              <span class="text-neutral-900">{{ merchant.area ? `區域 ${merchant.area}` : '-' }}</span>
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

          <div class="flex flex-col gap-3 text-base tracking-[0.8px]">
            <div class="flex items-start gap-4">
              <span class="min-w-[100px] text-neutral-600">經度</span>
              <span class="text-neutral-900">{{ merchant.longitude ?? '-' }}</span>
            </div>
            <div class="flex items-start gap-4">
              <span class="min-w-[100px] text-neutral-600">緯度</span>
              <span class="text-neutral-900">{{ merchant.latitude ?? '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 系統紀錄 -->
        <div
          class="
            rounded-md bg-white p-6
            shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
          "
        >
          <div class="mb-4 flex items-center gap-2">
            <Clock class="size-5 text-neutral-600" />
            <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
              系統紀錄
            </h2>
          </div>

          <div class="flex flex-col gap-3 text-base tracking-[0.8px]">
            <div class="flex items-start gap-4">
              <span class="min-w-[100px] text-neutral-600">建立日期</span>
              <span class="text-neutral-900">{{ formatDate(merchant.createdAt) }}</span>
            </div>
            <div class="flex items-start gap-4">
              <span class="min-w-[100px] text-neutral-600">合作時長</span>
              <span class="text-neutral-900">{{ getPartnershipDuration(merchant.createdAt) }}</span>
            </div>
            <div class="flex items-start gap-4">
              <span class="min-w-[100px] text-neutral-600">最後更新</span>
              <span class="text-neutral-900">{{ formatDate(merchant.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右欄：快速操作 -->
      <div
        class="
          sticky top-8 col-span-4 rounded-md border border-primary-200 bg-white
          p-6 shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
        "
      >
        <div class="mb-4 flex items-center gap-2">
          <Zap class="size-5 text-neutral-600" />
          <h2 class="text-lg font-bold tracking-[0.9px] text-neutral-900">
            快速操作
          </h2>
        </div>

        <div class="flex flex-col gap-3">
          <a
            :href="merchant.phone ? `tel:${merchant.phone}` : undefined"
            :class="merchant.phone ? 'cursor-pointer hover:bg-neutral-50' : `
              cursor-not-allowed opacity-40
            `"
            class="
              flex items-center gap-3 rounded-sm border border-neutral-200
              bg-white px-4 py-3 text-base font-medium tracking-[0.8px]
              text-neutral-900 transition-colors
            "
          >
            <Phone class="size-4 text-neutral-600" />
            聯絡商家
          </a>
          <a
            :href="merchant.email ? `mailto:${merchant.email}` : undefined"
            :class="merchant.email ? 'cursor-pointer hover:bg-neutral-50' : `
              cursor-not-allowed opacity-40
            `"
            class="
              flex items-center gap-3 rounded-sm border border-neutral-200
              bg-white px-4 py-3 text-base font-medium tracking-[0.8px]
              text-neutral-900 transition-colors
            "
          >
            <Mail class="size-4 text-neutral-600" />
            寄送郵件
          </a>
          <button
            type="button"
            :disabled="!merchant.address"
            class="
              flex items-center gap-3 rounded-sm border border-neutral-200
              bg-white px-4 py-3 text-base font-medium tracking-[0.8px]
              text-neutral-900 transition-colors
              hover:bg-neutral-50
              disabled:cursor-not-allowed disabled:opacity-40
            "
            @click="merchant.address && openGoogleMaps(merchant.address)"
          >
            <MapPin class="size-4 text-neutral-600" />
            開啟地圖
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

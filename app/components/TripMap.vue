<script lang="ts" setup>
interface TripItem {
  id: string
  name: string
  senderAddress: string
  receiverAddress: string
}

interface Props {
  tripItems: TripItem[]
  tripName?: string
}

const props = defineProps<Props>()

// 優化路線：將所有地址按順序排列，避免重複往返
const optimizedRoute = computed(() => {
  if (!props.tripItems || props.tripItems.length === 0) return []
  
  const addresses: string[] = []
  const addressMap = new Map<string, { type: 'pickup' | 'delivery', itemName: string }>()
  
  // 收集所有地址並標記類型
  props.tripItems.forEach(item => {
    if (!addressMap.has(item.senderAddress)) {
      addresses.push(item.senderAddress)
      addressMap.set(item.senderAddress, { type: 'pickup', itemName: item.name })
    }
    if (!addressMap.has(item.receiverAddress)) {
      addresses.push(item.receiverAddress)
      addressMap.set(item.receiverAddress, { type: 'delivery', itemName: item.name })
    }
  })
  
  // 簡單的路線優化：先收件，後送件（實際專案中可以用更複雜的算法）
  const pickupAddresses = addresses.filter(addr => addressMap.get(addr)?.type === 'pickup')
  const deliveryAddresses = addresses.filter(addr => addressMap.get(addr)?.type === 'delivery')
  
  return [...pickupAddresses, ...deliveryAddresses].map(addr => ({
    address: addr,
    type: addressMap.get(addr)?.type || 'pickup',
    itemName: addressMap.get(addr)?.itemName || ''
  }))
})

// Google Maps URL for directions
const mapsDirectionsUrl = computed(() => {
  if (optimizedRoute.value.length === 0) return ''
  
  const waypoints = optimizedRoute.value.map(point => encodeURIComponent(point.address)).join('/')
  return `https://www.google.com/maps/dir/${waypoints}`
})

const openInGoogleMaps = () => {
  if (mapsDirectionsUrl.value) {
    window.open(mapsDirectionsUrl.value, '_blank')
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- 路線資訊卡片 -->
    <div class="rounded-lg border border-gray-200 bg-white p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900">
          配送路線規劃
        </h3>
        <button
          @click="openInGoogleMaps"
          class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 flex items-center gap-x-2"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          在 Google 地圖中查看路線
        </button>
      </div>

      <!-- 路線點列表 -->
      <div class="space-y-3">
        <div
          v-for="(point, index) in optimizedRoute"
          :key="index"
          class="flex items-start space-x-3"
        >
          <div class="flex-shrink-0 mt-1">
            <div
              :class="[
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                point.type === 'pickup' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-green-100 text-green-600'
              ]"
            >
              {{ index + 1 }}
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2">
              <span
                :class="[
                  'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                  point.type === 'pickup'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                ]"
              >
                {{ point.type === 'pickup' ? '取件' : '送件' }}
              </span>
              <span class="text-sm font-medium text-gray-900">{{ point.itemName }}</span>
            </div>
            <p class="text-sm text-gray-600 mt-1">{{ point.address }}</p>
          </div>
        </div>
      </div>

      <!-- 路線統計 -->
      <div class="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
        <div>
          <div class="text-2xl font-bold text-blue-600">{{ optimizedRoute.filter(p => p.type === 'pickup').length }}</div>
          <div class="text-xs text-gray-500">取件點</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-green-600">{{ optimizedRoute.filter(p => p.type === 'delivery').length }}</div>
          <div class="text-xs text-gray-500">送件點</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-gray-600">{{ optimizedRoute.length }}</div>
          <div class="text-xs text-gray-500">總站點</div>
        </div>
      </div>
    </div>
  </div>
</template>
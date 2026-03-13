import type { BadgeType } from '@/components/ui/badge'

interface TripStatusConfig {
  label: string
  type: BadgeType
}

const statusMap: Record<string, TripStatusConfig> = {
  'in-transit': { label: '運送中', type: 'blue' },
  'pending': { label: '尚未開始', type: 'orange' },
  'delivered': { label: '已送達', type: 'green' },
  'cancelled': { label: '已取消', type: 'red' },
}

export function useTripStatus() {
  function getStatus(status: string): TripStatusConfig {
    return statusMap[status] ?? { label: status, type: 'gray' }
  }

  return { getStatus }
}

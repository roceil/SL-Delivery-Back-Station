import type { BadgeType } from '@/components/ui/badge/Badge.vue'

export interface StatusBadge {
  type: BadgeType
  label: string
}

// 訂單狀態（orders_status）
export const ORDER_STATUS_MAP: Record<string, StatusBadge> = {
  pending: { type: 'red', label: '待確認' },
  confirmed: { type: 'orange', label: '待交付' },
  assigned: { type: 'blue', label: '已收件' },
  in_delivery: { type: 'blue', label: '運送中' },
  delivered: { type: 'green', label: '已送達' },
  completed: { type: 'gray', label: '已完成' },
  overdue: { type: 'red', label: '逾期未交付' },
  cancelled: { type: 'gray', label: '已取消' },
}

// 行程狀態（schedules_status）
export const TRIP_STATUS_MAP: Record<string, StatusBadge> = {
  pending: { type: 'red', label: '尚未出發' },
  dispatched: { type: 'blue', label: '運送中' },
  completed: { type: 'green', label: '已送達' },
  cancelled: { type: 'gray', label: '已取消' },
}

/**
 * 取得訂單狀態 badge。
 * 傳入 hasSchedule=false 時，confirmed 顯示「待交付（尚未指派行程）」、
 * assigned 顯示「已收件（尚未指派行程）」。
 */
export function getOrderStatusBadge(status?: string, hasSchedule?: boolean): StatusBadge {
  const base = ORDER_STATUS_MAP[status ?? ''] ?? { type: 'gray' as BadgeType, label: status ?? '-' }

  if (hasSchedule === false) {
    if (status === 'confirmed')
      return { type: base.type, label: '待交付（尚未指派行程）' }
    if (status === 'assigned')
      return { type: base.type, label: '已收件（尚未指派行程）' }
  }

  return base
}

export function getTripStatusBadge(status?: string): StatusBadge {
  return TRIP_STATUS_MAP[status ?? ''] ?? { type: 'gray', label: status ?? '-' }
}

// 行程分配狀態（依訂單的去/回程 schedule_id 推算）
export const TRIP_ASSIGNMENT_MAP: Record<string, StatusBadge> = {
  unassigned: { type: 'red', label: '尚未分配' },
  outbound_unassigned: { type: 'orange', label: '去程未分配' },
  return_unassigned: { type: 'orange', label: '回程未分配' },
  assigned: { type: 'gray', label: '已分配' },
}

/**
 * 依去/回程 schedule_id 推算行程分配狀態 key。
 * isRoundTrip 為 false（單程）時只看去程，不會出現 return_unassigned。
 * - 兩者皆無：unassigned
 * - 只有回程有：outbound_unassigned
 * - 只有去程有（雙程）：return_unassigned
 * - 去程有（單程）：assigned
 * - 兩者皆有：assigned
 */
export function getTripAssignmentKey(scheduleId?: string | null, returnScheduleId?: string | null, isRoundTrip?: boolean): string {
  const hasOutbound = !!scheduleId
  const hasReturn = !!returnScheduleId
  if (!isRoundTrip) {
    return hasOutbound ? 'assigned' : 'unassigned'
  }
  if (hasOutbound && hasReturn)
    return 'assigned'
  if (hasOutbound)
    return 'return_unassigned'
  if (hasReturn)
    return 'outbound_unassigned'
  return 'unassigned'
}

export function getTripAssignmentBadge(scheduleId?: string | null, returnScheduleId?: string | null, isRoundTrip?: boolean): StatusBadge {
  const key = getTripAssignmentKey(scheduleId, returnScheduleId, isRoundTrip)
  return TRIP_ASSIGNMENT_MAP[key] ?? { type: 'gray', label: '-' }
}

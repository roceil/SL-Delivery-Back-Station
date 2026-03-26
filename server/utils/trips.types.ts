// Supabase 關聯查詢返回的型別
export interface SupabaseCourier {
  id: number
  name: string
  employee_number: string
  phone?: string
}

export interface SupabaseScheduleStatus {
  id: number
  status: string
  explanation?: string
}

export interface SupabaseStation {
  id: number
  name: string
  address: string
  area: string
}

export interface SupabaseOrderStatus {
  status: string
}

// 訂單 API 回傳型別
export interface OrderResponse {
  id: string
  category: string
  lineName: string
  phone: string
  deliveryDate: string | null
  returnDate: string | null
  pickupTime: string
  luggageCount: number
  servicePlan: string | null
  paymentStatus: string | null
  status: string
  scheduleId: string | null
  pickupLocation: {
    id: string
    name: string
    address: string
  }
  deliveryLocation: {
    id: string
    name: string
    address: string
  }
  notes: string
  createdAt: string
}

export interface OrderDetailResponse {
  id: string
  voucherId: string | null
  userId: number | null
  category: string
  lineName: string
  phone: string
  deliveryDate: string | null
  returnDate: string | null
  pickupTime: string
  luggageCount: number
  servicePlan: string | null
  paymentStatus: string | null
  recipientName: string | null
  recipientPhone: string | null
  status: string
  scheduleId: string | null
  pickupLocation: {
    id: string
    name: string
    address: string
    area: string
  }
  deliveryLocation: {
    id: string
    name: string
    address: string
    area: string
  }
  notes: string
  createdAt: string
  updatedAt: string
}

// 行程 API 回傳型別
export interface TripResponse {
  id: string
  name: string
  description: string
  courierId: string
  courierName: string
  scheduledDate: string
  status: string
  createdAt: string
  dispatchedAt: string | null
  completedAt: string | null
  trackingUrl: string | null
  orderCount: number
  totalLuggage: number
  areas: string[]
}

export interface TripDetailResponse {
  id: string
  name: string
  description: string
  courierId: string
  courierName: string
  courierPhone: string
  courierEmployeeNumber: string
  scheduledDate: string
  status: string
  statusId: number
  statusExplanation: string
  createdAt: string
  updatedAt: string
  dispatchedAt: string | null
  completedAt: string | null
  trackingUrl: string | null
  notes: string
  orderIds: string[]
}

export interface TripOrderResponse {
  id: string
  category: string
  lineName: string
  phone: string
  deliveryDate: string | null
  returnDate: string | null
  pickupTime: string
  luggageCount: number
  servicePlan: string | null
  paymentStatus: string | null
  status: string
  pickupLocation: {
    id: string
    name: string
    address: string
    area: string
  }
  deliveryLocation: {
    id: string
    name: string
    address: string
    area: string
  }
  notes: string
  createdAt: string
}

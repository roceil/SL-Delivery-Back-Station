export interface Location {
  id: string
  name: string
  address: string
  area?: string
}

export interface Order {
  id: string
  lineName: string
  phone: string
  deliveryDate: string
  pickupTime: string
  luggageCount: number
  status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled'
  pickupLocation: Location
  deliveryLocation: Location
  notes?: string
  createdAt: string
  updatedAt: string
}

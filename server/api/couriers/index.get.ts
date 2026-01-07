export default defineEventHandler(async (_event) => {
  const mockCouriers = [
    {
      id: 'courier1',
      name: '張小明',
      phone: '0912-345-678',
      email: 'ming@example.com',
      vehicleType: 'motorcycle',
      licensePlate: 'ABC-1234',
      status: 'available',
      joinDate: '2024-01-01T00:00:00Z',
    },
    {
      id: 'courier2',
      name: '李美華',
      phone: '0923-456-789',
      email: 'hua@example.com',
      vehicleType: 'van',
      licensePlate: 'XYZ-5678',
      status: 'available',
      joinDate: '2024-01-05T00:00:00Z',
    },
    {
      id: 'courier3',
      name: '王大成',
      phone: '0934-567-890',
      email: 'wang@example.com',
      vehicleType: 'motorcycle',
      licensePlate: 'DEF-9012',
      status: 'busy',
      joinDate: '2024-01-10T00:00:00Z',
    },
    {
      id: 'courier4',
      name: '陳淑雯',
      phone: '0945-678-901',
      email: 'chen@example.com',
      vehicleType: 'car',
      licensePlate: 'GHI-3456',
      status: 'available',
      joinDate: '2024-01-15T00:00:00Z',
    },
  ]

  return mockCouriers
})

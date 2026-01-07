export default defineEventHandler(async (_event) => {
  const mockOrders = [
    {
      id: 'order1',
      lineName: '王小明',
      phone: '0912-345-678',
      deliveryDate: '2026-01-10',
      pickupTime: '14:00',
      luggageCount: 2,
      status: 'pending',
      pickupLocation: {
        id: 'donggang-pier',
        name: '東港碼頭',
        address: '屏東縣東港鎮朝安里朝隆路43-5號',
      },
      deliveryLocation: {
        id: 'hostel-beachfront',
        name: '海景民宿',
        address: '屏東縣琉球鄉忠孝路18號',
      },
      createdAt: '2026-01-07T10:30:00Z',
    },
    {
      id: 'order2',
      lineName: '李小華',
      phone: '0923-456-789',
      deliveryDate: '2026-01-11',
      pickupTime: '10:00',
      luggageCount: 1,
      status: 'confirmed',
      pickupLocation: {
        id: 'baisha-pier',
        name: '白沙尾港',
        address: '屏東縣琉球鄉白沙尾觀光港',
      },
      deliveryLocation: {
        id: 'dive-shop-ocean',
        name: '小琉球海洋潛水',
        address: '屏東縣琉球鄉中山路156號',
      },
      createdAt: '2026-01-07T11:20:00Z',
    },
    {
      id: 'order3',
      lineName: '張小美',
      phone: '0934-567-890',
      deliveryDate: '2026-01-09',
      pickupTime: '16:00',
      luggageCount: 3,
      status: 'in_transit',
      pickupLocation: {
        id: 'donggang-pier',
        name: '東港碼頭',
        address: '屏東縣東港鎮朝安里朝隆路43-5號',
      },
      deliveryLocation: {
        id: 'hostel-coral',
        name: '珊瑚礁民宿',
        address: '屏東縣琉球鄉和平路56號',
      },
      createdAt: '2026-01-06T15:45:00Z',
    },
    {
      id: 'order4',
      lineName: '陳大明',
      phone: '0945-678-901',
      deliveryDate: '2026-01-08',
      pickupTime: '09:00',
      luggageCount: 2,
      status: 'delivered',
      pickupLocation: {
        id: 'baisha-pier',
        name: '白沙尾港',
        address: '屏東縣琉球鄉白沙尾觀光港',
      },
      deliveryLocation: {
        id: 'beauty-cave',
        name: '美人洞風景區',
        address: '屏東縣琉球鄉環島公路美人洞',
      },
      createdAt: '2026-01-05T09:15:00Z',
    },
    {
      id: 'order5',
      lineName: '林小芳',
      phone: '0956-789-012',
      deliveryDate: '2026-01-12',
      pickupTime: '13:00',
      luggageCount: 1,
      status: 'cancelled',
      pickupLocation: {
        id: 'donggang-pier',
        name: '東港碼頭',
        address: '屏東縣東港鎮朝安里朝隆路43-5號',
      },
      deliveryLocation: {
        id: 'dive-shop-blue',
        name: '小琉球藍海潛水',
        address: '屏東縣琉球鄉三民路85號',
      },
      createdAt: '2026-01-07T14:00:00Z',
    },
  ]

  return mockOrders
})

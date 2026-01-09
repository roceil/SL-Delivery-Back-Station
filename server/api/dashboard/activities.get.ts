export default defineEventHandler(async (_event) => {
  const mockActivities = [
    {
      id: 1,
      title: '新建訂單',
      description: '王小明的行李運送訂單已建立',
      type: 'order',
      createdAt: '2024-01-18T10:30:00Z',
    },
    {
      id: 2,
      title: '行程派發',
      description: '台北車站→台中火車站路線已指派給張大華',
      type: 'trip',
      createdAt: '2024-01-18T09:15:00Z',
    },
    {
      id: 3,
      title: '訂單完成',
      description: '李先生的3件行李已送達目的地',
      type: 'delivery',
      createdAt: '2024-01-17T16:45:00Z',
    },
    {
      id: 4,
      title: '新增商家',
      description: '藍白航運已加入合作商家',
      type: 'merchant',
      createdAt: '2024-01-17T14:20:00Z',
    },
    {
      id: 5,
      title: '夥伴加入',
      description: '陳配送員已加入配送團隊',
      type: 'courier',
      createdAt: '2024-01-17T11:30:00Z',
    },
  ]

  return mockActivities
})

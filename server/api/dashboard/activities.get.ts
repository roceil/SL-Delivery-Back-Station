export default defineEventHandler(async (_event) => {
  const mockActivities = [
    {
      id: 1,
      title: '新建物品',
      description: '筆記型電腦已新建',
      createdAt: '2024-01-18T10:30:00Z',
    },
    {
      id: 2,
      title: '行程派發',
      description: '台北-台中路線已派發給張小明',
      createdAt: '2024-01-18T09:15:00Z',
    },
    {
      id: 3,
      title: '物品送達',
      description: '手機配件組已送達目的地',
      createdAt: '2024-01-17T16:45:00Z',
    },
    {
      id: 4,
      title: '新增商家',
      description: '電子零件行已加入合作商家',
      createdAt: '2024-01-17T14:20:00Z',
    },
    {
      id: 5,
      title: '結帳完成',
      description: '3C數位專賣店結帳 NT$ 15,600',
      createdAt: '2024-01-17T11:30:00Z',
    },
  ]

  return mockActivities
})

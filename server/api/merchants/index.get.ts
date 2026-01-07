export default defineEventHandler(async (_event) => {
  const mockMerchants = [
    {
      id: 'merchant1',
      name: '3C數位專賣店',
      phone: '02-27123456',
      address: '台北市信義區松高路11號',
      type: 'partner',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'merchant2',
      name: '手機配件王',
      phone: '07-3334444',
      address: '高雄市前金區五福三路57號',
      type: 'partner',
      createdAt: '2024-01-02T00:00:00Z',
    },
    {
      id: 'merchant3',
      name: '電子零件行',
      phone: '04-22567890',
      address: '台中市西區公益路68號',
      type: 'partner',
      createdAt: '2024-01-03T00:00:00Z',
    },
    {
      id: 'merchant4',
      name: '臨時商家範例',
      phone: '03-9876543',
      address: '宜蘭縣羅東鎮中正路99號',
      type: 'temporary',
      createdAt: '2024-01-10T00:00:00Z',
    },
  ]

  return mockMerchants
})

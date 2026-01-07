export default defineEventHandler(async (event) => {
  const mockItems = [
    {
      id: 'item1',
      name: '筆記型電腦',
      description: 'MacBook Pro 16吋',
      dimensions: {
        length: 35.5,
        width: 24.5,
        height: 1.6,
      },
      weight: 2.0,
      senderAddress: '台北市信義區信義路五段7號',
      receiverAddress: '台中市西屯區文心路二段201號',
      merchantId: 'merchant1',
      customMerchant: null,
      status: 'pending',
      createdAt: '2024-01-15T10:30:00Z',
      tripId: null,
    },
    {
      id: 'item2',
      name: '手機配件組',
      description: 'iPhone 保護殼及充電器',
      dimensions: {
        length: 20.0,
        width: 15.0,
        height: 5.0,
      },
      weight: 0.5,
      senderAddress: '高雄市前金區中正四路211號',
      receiverAddress: '台南市中西區民族路二段318號',
      merchantId: 'merchant2',
      customMerchant: null,
      status: 'in_transit',
      createdAt: '2024-01-14T14:20:00Z',
      tripId: 'trip1',
    },
    {
      id: 'item3',
      name: '書籍包裹',
      description: '程式設計相關書籍 5本',
      dimensions: {
        length: 25.0,
        width: 18.0,
        height: 12.0,
      },
      weight: 1.8,
      senderAddress: '桃園市中壢區中大路300號',
      receiverAddress: '新竹市東區光復路二段101號',
      merchantId: null,
      customMerchant: {
        name: '小明書店',
        phone: '03-1234567',
        address: '桃園市中壢區中正路123號',
      },
      status: 'delivered',
      createdAt: '2024-01-13T09:15:00Z',
      tripId: 'trip2',
    },
  ]

  return mockItems
})

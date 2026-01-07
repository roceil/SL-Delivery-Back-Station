export default defineEventHandler(async (event) => {
  const mockAvailableItems = [
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
      status: 'pending',
    },
    {
      id: 'item4',
      name: '平板電腦',
      description: 'iPad Pro 12.9吋',
      dimensions: {
        length: 28.0,
        width: 21.5,
        height: 0.6,
      },
      weight: 0.7,
      senderAddress: '新北市板橋區文化路一段188號',
      receiverAddress: '桃園市桃園區復興路21號',
      merchantId: 'merchant1',
      status: 'pending',
    },
    {
      id: 'item5',
      name: '相機鏡頭',
      description: 'Canon 24-70mm f/2.8L',
      dimensions: {
        length: 11.0,
        width: 8.8,
        height: 8.8,
      },
      weight: 0.8,
      senderAddress: '台中市北區學士路91號',
      receiverAddress: '台南市安平區健康路三段257號',
      merchantId: 'merchant3',
      status: 'pending',
    },
  ]

  return mockAvailableItems
})

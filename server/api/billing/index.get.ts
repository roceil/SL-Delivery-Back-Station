export default defineEventHandler(async (_event) => {
  const mockBillingData = [
    {
      id: 'bill1',
      fromMerchantId: 'merchant1',
      toMerchantId: 'merchant2',
      itemCount: 5,
      amount: 2500,
      status: 'pending',
      createdAt: '2024-01-15T10:00:00Z',
      paidAt: null,
    },
    {
      id: 'bill2',
      fromMerchantId: 'merchant2',
      toMerchantId: 'merchant1',
      itemCount: 3,
      amount: 1800,
      status: 'paid',
      createdAt: '2024-01-12T14:30:00Z',
      paidAt: '2024-01-14T09:15:00Z',
    },
    {
      id: 'bill3',
      fromMerchantId: 'merchant3',
      toMerchantId: 'merchant1',
      itemCount: 8,
      amount: 4200,
      status: 'pending',
      createdAt: '2024-01-10T11:20:00Z',
      paidAt: null,
    },
    {
      id: 'bill4',
      fromMerchantId: 'merchant1',
      toMerchantId: 'merchant3',
      itemCount: 2,
      amount: 950,
      status: 'overdue',
      createdAt: '2024-01-05T16:45:00Z',
      paidAt: null,
    },
  ]

  return mockBillingData
})

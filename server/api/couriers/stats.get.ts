export default defineEventHandler(async (event) => {
  const mockCourierStats = [
    {
      courierId: 'courier1',
      completedTrips: 23,
      totalEarnings: 15600,
      rating: 4.8,
    },
    {
      courierId: 'courier2',
      completedTrips: 18,
      totalEarnings: 12300,
      rating: 4.6,
    },
    {
      courierId: 'courier3',
      completedTrips: 31,
      totalEarnings: 21800,
      rating: 4.9,
    },
    {
      courierId: 'courier4',
      completedTrips: 12,
      totalEarnings: 8400,
      rating: 4.5,
    },
  ]

  return mockCourierStats
})

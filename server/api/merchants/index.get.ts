export default defineEventHandler(async (_event) => {
  const partnerLocations = [
    {
      id: 'donggang-pier',
      name: '東港碼頭',
      address: '屏東縣東港鎮朝安里朝隆路43-5號',
      type: 'pier',
      area: 'A',
    },
    {
      id: 'baisha-pier',
      name: '白沙尾港',
      address: '屏東縣琉球鄉白沙尾觀光港',
      type: 'pier',
      area: 'A',
    },
    {
      id: 'dive-shop-ocean',
      name: '小琉球海洋潛水',
      address: '屏東縣琉球鄉中山路156號',
      type: 'dive_shop',
      area: 'B',
    },
    {
      id: 'dive-shop-blue',
      name: '小琉球藍海潛水',
      address: '屏東縣琉球鄉三民路85號',
      type: 'dive_shop',
      area: 'B',
    },
    {
      id: 'hostel-beachfront',
      name: '海景民宿',
      address: '屏東縣琉球鄉忠孝路18號',
      type: 'hostel',
      area: 'C',
    },
    {
      id: 'hostel-coral',
      name: '珊瑚礁民宿',
      address: '屏東縣琉球鄉和平路56號',
      type: 'hostel',
      area: 'C',
    },
    {
      id: 'beauty-cave',
      name: '美人洞風景區',
      address: '屏東縣琉球鄉環島公路美人洞',
      type: 'attraction',
      area: 'D',
    },
    {
      id: 'vase-rock',
      name: '花瓶岩',
      address: '屏東縣琉球鄉花瓶岩',
      type: 'attraction',
      area: 'D',
    },
  ]

  return partnerLocations
})

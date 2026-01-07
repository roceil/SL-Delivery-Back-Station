export interface QuickActionLink {
  label: string
  to: string
}

export interface QuickAction {
  id: string
  title: string
  description: string
  colorTheme: 'blue' | 'purple' | 'orange' | 'green' | 'indigo'
  iconPath: string
  links: QuickActionLink[]
}

export const TIME_RANGE_OPTIONS = [
  { label: '今日概覽', value: 'today', active: true },
  { label: '本週統計', value: 'week', active: false },
  { label: '本月報告', value: 'month', active: false },
] as const

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'orders',
    title: '訂單總覽',
    description: '管理所有物品，查看寄送狀態',
    colorTheme: 'blue',
    iconPath: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
    links: [
      { label: '新建訂單', to: '/orders/new' },
      { label: '訂單總覽', to: '/orders' },
    ],
  },
  {
    id: 'trips',
    title: '行程管理',
    description: '創建和管理配送行程',
    colorTheme: 'purple',
    iconPath: 'M8.25 18.75a1.5 1.5 0 01-3 0V6.375a1.5 1.5 0 013-3h6.75a1.5 1.5 0 013 3v12.75a1.5 1.5 0 01-3 0 1.5 1.5 0 00-3 0zm-3-3.75a1.5 1.5 0 003 0 1.5 1.5 0 003 0zm-3-7.5a1.5 1.5 0 003 0 1.5 1.5 0 003 0z',
    links: [
      { label: '新建行程', to: '/trips/new' },
      { label: '行程總表', to: '/trips' },
    ],
  },
  {
    id: 'merchants',
    title: '商家管理',
    description: '管理合作商家和臨時商家',
    colorTheme: 'orange',
    iconPath: 'M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.001 3.001 0 01-.621-1.82c0-.84.353-1.608.982-2.16m16.5 3.98a3.001 3.001 0 01-.621-1.82c0-.84.353-1.608.982-2.16',
    links: [
      { label: '新增商家', to: '/merchants/new' },
      { label: '商家總覽', to: '/merchants' },
    ],
  },
  {
    id: 'billing',
    title: '財務管理',
    description: '查看收支和結帳記錄',
    colorTheme: 'green',
    iconPath: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    links: [
      { label: '結帳總覽', to: '/billing' },
    ],
  },
  {
    id: 'couriers',
    title: '快遞員管理',
    description: '管理快遞員和績效統計',
    colorTheme: 'indigo',
    iconPath: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    links: [
      { label: '快遞員總覽', to: '/couriers' },
    ],
  },
]

export const COLOR_THEME_CLASSES = {
  blue: {
    background: 'bg-blue-500/10',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    linkColor: 'text-blue-600 hover:text-blue-700',
  },
  purple: {
    background: 'bg-purple-500/10',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    linkColor: 'text-purple-600 hover:text-purple-700',
  },
  orange: {
    background: 'bg-orange-500/10',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    linkColor: 'text-orange-600 hover:text-orange-700',
  },
  green: {
    background: 'bg-green-500/10',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    linkColor: 'text-green-600 hover:text-green-700',
  },
  indigo: {
    background: 'bg-indigo-500/10',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    linkColor: 'text-indigo-600 hover:text-indigo-700',
  },
} as const

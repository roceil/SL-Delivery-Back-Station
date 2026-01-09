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
    title: '訂單管理',
    description: '管理行李運送訂單，追蹤配送狀態',
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
    description: '安排配送路線，優化運送效率',
    colorTheme: 'purple',
    iconPath: 'M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z',
    links: [
      { label: '新建行程', to: '/trips/new' },
      { label: '行程總表', to: '/trips' },
    ],
  },
  {
    id: 'merchants',
    title: '商家管理',
    description: '管理合作商家與臨時客戶資訊',
    colorTheme: 'green',
    iconPath: 'M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.001 3.001 0 01-.621-1.82c0-.84.353-1.608.982-2.16m16.5 3.98a3.001 3.001 0 01-.621-1.82c0-.84.353-1.608.982-2.16',
    links: [
      { label: '新增商家', to: '/merchants/new' },
      { label: '商家總覽', to: '/merchants' },
    ],
  },
  {
    id: 'delivery-points',
    title: '運送點管理',
    description: '管理取件點和配送點資訊',
    colorTheme: 'orange',
    iconPath: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
    links: [
      { label: '新增運送點', to: '/delivery-points/new' },
      { label: '運送點總覽', to: '/delivery-points' },
    ],
  },

  {
    id: 'billing',
    title: '結帳總覽',
    description: '查看收支與結帳記錄',
    colorTheme: 'purple',
    iconPath: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z',
    links: [
      { label: '結帳總覽', to: '/billing' },
    ],
  },
  {
    id: 'couriers',
    title: '夥伴管理',
    description: '管理配送夥伴與工作分配',
    colorTheme: 'indigo',
    iconPath: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    links: [
      { label: '新增夥伴', to: '/couriers/new' },
      { label: '夥伴總覽', to: '/couriers' },
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

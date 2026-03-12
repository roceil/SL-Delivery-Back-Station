import tailwindcss from '@tailwindcss/vite'
import { appDescription } from './app/constants/index'

export default defineNuxtConfig({
  devtools: { enabled: true },

  devServer: {
    port: 3001,
    host: ' ',
  },

  modules: [
    '@nuxt/ui',
    '@nuxt/fonts',
    '@nuxtjs/color-mode',
    '@nuxt/icon',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
    'shadcn-nuxt',
  ],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [
      tailwindcss() as never,
    ],
  },

  ui: {
    colorMode: false,
  },

  shadcn: {
    /**
     * Prefix for all the imported component.
     * @default "Ui"
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * Will respect the Nuxt aliases.
     * @link https://nuxt.com/docs/api/nuxt-config#alias
     * @default "@/components/ui"
     */
    componentDir: '@/components/ui',
  },

  app: {
    head: {
      meta: [
        { name: 'description', content: appDescription },
      ],
    },
  },

  icon: {
    mode: 'css',
    cssLayer: 'base', // for TailwindCSS v4
  },

  colorMode: {
    classSuffix: '',
  },

  pinia: {
    storesDirs: ['./app/stores/**'],
  },

  eslint: {
    config: {
      standalone: false,
    },
  },

  compatibilityDate: '2025-08-01',

  // nitro: {
  //   preset: 'node-server',
  //   // 確保 Nitro 從環境變數讀取 PORT
  //   experimental: {
  //     envExpansion: true,
  //   },
  // },

  runtimeConfig: {
    // 伺服器端環境變數（不會暴露給客戶端）
    // Nuxt 會自動從 .env 檔案讀取對應的環境變數
    googleServiceAccountEmail: '',
    googlePrivateKey: '',
    googleProjectId: '',
    googleSheetsId: '',
    // Supabase Service Role Key（只能在後端使用，可繞過 RLS）
    supabaseServiceRoleKey: '',

    // 公開環境變數（客戶端也可存取）
    public: {
      supabaseUrl: '',
      supabaseAnonKey: '',
    },
  },

})

import tailwindcss from '@tailwindcss/vite'
import { appDescription } from './app/constants/index'

export default defineNuxtConfig({
  devtools: { enabled: true },

  devServer: {
    port: 3001,
    host: ' ',
  },

  vite: {
    plugins: [
      tailwindcss(),
    ],
    server: {
      allowedHosts: ['27f6fe13f9c7.ngrok-free.app'],
    },
  },

  modules: [
    '@nuxt/fonts',
    '@nuxtjs/color-mode',
    '@nuxt/icon',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
  ],

  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
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

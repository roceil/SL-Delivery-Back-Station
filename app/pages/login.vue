<script lang="ts" setup>
import { Eye, EyeOff, MoveRight } from 'lucide-vue-next'

definePageMeta({ layout: 'auth' })

useHead({ title: '登入 - 你行李來後台管理系統' })

const { signIn } = useAuth()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  if (!email.value || !password.value)
    return

  loading.value = true
  errorMessage.value = ''

  try {
    await signIn(email.value, password.value)
    await navigateTo('/')
  }
  catch {
    errorMessage.value = '帳號或密碼錯誤，請重新確認'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-8">
    <!-- 標題 -->
    <div class="flex flex-col items-center gap-2 text-center">
      <p class="text-h5 font-medium tracking-[1px] text-neutral-600">
        你行李來
      </p>
      <h1 class="text-h2 font-bold tracking-[1.6px] text-neutral-900">
        後台管理系統
      </h1>
    </div>

    <!-- 登入卡片 -->
    <div
      class="
        flex w-[680px] flex-col gap-4 rounded-md bg-neutral-0 p-6
        shadow-[0px_4px_12px_0px_rgba(32,78,184,0.04)]
      "
    >
      <!-- 標頭 -->
      <h2 class="text-h6 font-bold tracking-[0.9px] text-neutral-900">
        登入
      </h2>

      <!-- 欄位 -->
      <div class="flex flex-col gap-4">
        <!-- 帳號 -->
        <div class="flex flex-col gap-1">
          <label class="text-h8 font-medium tracking-[0.7px] text-neutral-600">
            帳號
          </label>
          <input
            v-model="email"
            type="email"
            placeholder="test@package.com.tw"
            autocomplete="email"
            class="
              rounded-xs border border-neutral-200 bg-neutral-0 px-3 py-2 text-base
              tracking-wider text-neutral-900 outline-none transition-colors
              placeholder:text-neutral-500
              focus:border-primary-300
            "
            @keyup.enter="handleSubmit"
          >
        </div>

        <!-- 密碼 -->
        <div class="flex flex-col gap-1">
          <label class="text-h8 font-medium tracking-[0.7px] text-neutral-600">
            密碼
          </label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="current-password"
              class="
                w-full rounded-xs border border-neutral-200 bg-neutral-0 px-3 py-2
                pr-10 text-base tracking-wider text-neutral-900 outline-none
                transition-colors
                placeholder:text-neutral-500
                focus:border-primary-300
              "
              @keyup.enter="handleSubmit"
            >
            <button
              type="button"
              class="
                absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500
                hover:text-neutral-700
              "
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" class="size-5" />
              <Eye v-else class="size-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- 錯誤訊息 -->
      <p v-if="errorMessage" class="text-sm tracking-wider text-danger-300">
        {{ errorMessage }}
      </p>

      <!-- 忘記密碼 -->
      <button
        type="button"
        class="self-start text-base font-medium tracking-[0.8px] text-primary-300 hover:text-primary-400"
      >
        忘記密碼
      </button>

      <!-- 登入按鈕 -->
      <button
        type="button"
        :disabled="loading || !email || !password"
        class="
          flex items-center justify-center gap-2 rounded-sm bg-primary-300 px-4 py-2
          text-base font-medium tracking-[0.8px] text-neutral-0 transition-colors
          hover:bg-primary-400
          disabled:cursor-not-allowed disabled:opacity-50
        "
        @click="handleSubmit"
      >
        <span>{{ loading ? '登入中...' : '立即登入' }}</span>
        <MoveRight v-if="!loading" class="size-5" />
      </button>
    </div>
  </div>
</template>

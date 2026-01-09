import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 建立使用 Service Role Key 的 Supabase Client
 * 此 client 可以繞過 RLS，擁有完整的資料庫存取權限
 * ⚠️ 只能在 server/api 中使用，絕對不要在前端使用
 */
export function useServiceRoleClient(): SupabaseClient {
  const config = useRuntimeConfig()

  if (!config.public.supabaseUrl) {
    throw new Error('Missing NUXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!config.supabaseServiceRoleKey) {
    throw new Error('Missing NUXT_SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  return createClient(
    config.public.supabaseUrl,
    config.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

/**
 * 建立使用 Anon Key 的 Supabase Client
 * 此 client 受 RLS 限制，適合前端使用
 * 在後端通常不需要使用此 client
 */
export function useAnonClient(): SupabaseClient {
  const config = useRuntimeConfig()

  if (!config.public.supabaseUrl) {
    throw new Error('Missing NUXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!config.public.supabaseAnonKey) {
    throw new Error('Missing NUXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  }

  return createClient(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey,
  )
}

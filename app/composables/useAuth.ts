import { createClient } from '@supabase/supabase-js'

export function useAuth() {
  const config = useRuntimeConfig()
  const token = useCookie('sb_token', {
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
    path: '/',
  })

  async function signIn(email: string, password: string) {
    const supabase = createClient(config.public.supabaseUrl, config.public.supabaseAnonKey)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error)
      throw error
    token.value = data.session?.access_token ?? null
  }

  function signOut() {
    token.value = null
    return navigateTo('/login')
  }

  return { signIn, signOut, token }
}

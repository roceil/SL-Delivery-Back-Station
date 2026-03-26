export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie('sb_token')

  if (to.path === '/login') {
    if (token.value)
      return navigateTo('/')
    return
  }

  if (!token.value)
    return navigateTo('/login')
})

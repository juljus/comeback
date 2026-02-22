const isAuthenticated = ref(false)
const githubLogin = ref('')
const isCheckingAuth = ref(false)

export function useAuth() {
  async function checkAuth() {
    isCheckingAuth.value = true
    try {
      const data = await $fetch<{
        authenticated: boolean
        login?: string
        avatarUrl?: string
      }>('/api/auth/me')
      isAuthenticated.value = data.authenticated
      githubLogin.value = data.login ?? ''
    } catch {
      isAuthenticated.value = false
      githubLogin.value = ''
    } finally {
      isCheckingAuth.value = false
    }
  }

  function login() {
    window.location.href = '/api/auth/login'
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    isAuthenticated.value = false
    githubLogin.value = ''
  }

  return {
    isAuthenticated: readonly(isAuthenticated),
    githubLogin: readonly(githubLogin),
    isCheckingAuth: readonly(isCheckingAuth),
    login,
    logout,
    checkAuth,
  }
}

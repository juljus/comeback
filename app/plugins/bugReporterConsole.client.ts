export default defineNuxtPlugin(() => {
  const { login, logout, checkAuth } = useAuth()

  // Expose to browser console
  window.__login = login
  window.__logout = logout

  // If gh_user cookie exists, validate the session
  const hasUserCookie = document.cookie.split(';').some((c) => c.trim().startsWith('gh_user='))
  if (hasUserCookie) {
    checkAuth()
  }
})

// Type augmentation for window
declare global {
  interface Window {
    __login: () => void
    __logout: () => Promise<void>
  }
}

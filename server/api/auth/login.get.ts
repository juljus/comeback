import { setCookie, sendRedirect } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const state = crypto.randomUUID()

  setCookie(event, 'gh_oauth_state', state, {
    httpOnly: true,
    secure: !import.meta.dev,
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
  })

  const params = new URLSearchParams({
    client_id: config.public.githubClientId,
    redirect_uri: `${getRequestURL(event).origin}/api/auth/callback`,
    scope: 'repo user:email',
    state,
  })

  return sendRedirect(event, `https://github.com/login/oauth/authorize?${params}`)
})

import { getCookie, setCookie, deleteCookie, sendRedirect, getQuery } from 'h3'
import { githubApiFetch } from '~~/server/utils/github'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const code = query.code as string | undefined
  const state = query.state as string | undefined
  const storedState = getCookie(event, 'gh_oauth_state')

  deleteCookie(event, 'gh_oauth_state')

  if (!code || !state || state !== storedState) {
    return sendRedirect(event, '/game?auth=denied')
  }

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: config.public.githubClientId,
      client_secret: config.githubClientSecret,
      code,
    }),
  })

  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string }
  if (!tokenData.access_token) {
    return sendRedirect(event, '/game?auth=denied')
  }

  const token = tokenData.access_token

  // Check email allowlist
  const allowedEmails = config.bugReporterAllowedEmails
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean)

  if (allowedEmails.length > 0) {
    const emailsRes = await githubApiFetch(token, '/user/emails')
    const emails = (await emailsRes.json()) as Array<{
      email: string
      verified: boolean
      primary: boolean
    }>

    const userEmails = emails.filter((e) => e.verified).map((e) => e.email.toLowerCase())

    const isAllowed = userEmails.some((email) => allowedEmails.includes(email))
    if (!isAllowed) {
      // Revoke the token
      await fetch(`https://api.github.com/applications/${config.public.githubClientId}/token`, {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${btoa(`${config.public.githubClientId}:${config.githubClientSecret}`)}`,
          Accept: 'application/vnd.github+json',
        },
        body: JSON.stringify({ access_token: token }),
      }).catch(() => {})

      return sendRedirect(event, '/game?auth=denied')
    }
  }

  // Fetch user profile
  const userRes = await githubApiFetch(token, '/user')
  const user = (await userRes.json()) as { login: string; avatar_url: string }

  const cookieOpts = {
    secure: !import.meta.dev,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    sameSite: 'lax' as const,
  }

  setCookie(event, 'gh_token', token, { ...cookieOpts, httpOnly: true })
  setCookie(event, 'gh_user', user.login, { ...cookieOpts, httpOnly: false })

  return sendRedirect(event, '/game')
})

import { getGitHubToken, githubApiFetch } from '~~/server/utils/github'
import { deleteCookie } from 'h3'

export default defineEventHandler(async (event) => {
  const token = getGitHubToken(event)
  if (!token) {
    return { authenticated: false }
  }

  const res = await githubApiFetch(token, '/user')
  if (!res.ok) {
    deleteCookie(event, 'gh_token')
    deleteCookie(event, 'gh_user')
    return { authenticated: false }
  }

  const user = (await res.json()) as { login: string; avatar_url: string }
  return {
    authenticated: true,
    login: user.login,
    avatarUrl: user.avatar_url,
  }
})

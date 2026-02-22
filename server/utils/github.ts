import type { H3Event } from 'h3'
import { getCookie } from 'h3'

export function getGitHubToken(event: H3Event): string | undefined {
  return getCookie(event, 'gh_token')
}

export async function githubApiFetch(
  token: string,
  path: string,
  opts: RequestInit = {},
): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...opts.headers,
    },
  })
}

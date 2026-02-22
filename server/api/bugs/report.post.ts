import { readBody } from 'h3'
import { getGitHubToken, githubApiFetch } from '~~/server/utils/github'

export default defineEventHandler(async (event) => {
  const token = getGitHubToken(event)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  const config = useRuntimeConfig()
  const repo = config.bugReporterRepo
  if (!repo) {
    throw createError({ statusCode: 500, statusMessage: 'Bug reporter repo not configured' })
  }

  const body = await readBody<{
    title: string
    description?: string
    screenshot?: string // base64 data URL
    gameState?: string
  }>(event)

  if (!body.title?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Title is required' })
  }

  let screenshotUrl = ''

  // Upload screenshot as a release asset (avoids committing to repo)
  if (body.screenshot) {
    try {
      const base64Data = body.screenshot.replace(/^data:image\/\w+;base64,/, '')
      const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))
      const filename = `bug-${Date.now()}.png`

      // Find or create the "bug-screenshots" release
      let releaseId: number | null = null
      const relRes = await githubApiFetch(token, `/repos/${repo}/releases/tags/bug-screenshots`)
      if (relRes.ok) {
        const rel = (await relRes.json()) as { id: number }
        releaseId = rel.id
      } else {
        const createRes = await githubApiFetch(token, `/repos/${repo}/releases`, {
          method: 'POST',
          body: JSON.stringify({
            tag_name: 'bug-screenshots',
            name: 'Bug Screenshots',
            body: 'Automatically uploaded bug report screenshots.',
            draft: false,
          }),
        })
        if (createRes.ok) {
          const rel = (await createRes.json()) as { id: number }
          releaseId = rel.id
        }
      }

      if (releaseId) {
        const uploadUrl = `https://uploads.github.com/repos/${repo}/releases/${releaseId}/assets?name=${filename}`
        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'image/png',
          },
          body: binaryData,
        })

        if (uploadRes.ok) {
          const asset = (await uploadRes.json()) as { browser_download_url: string }
          screenshotUrl = asset.browser_download_url
        }
      }
    } catch {
      // Screenshot upload failure is non-blocking
    }
  }

  // Build issue body
  let issueBody = body.description || ''

  if (screenshotUrl) {
    issueBody += `\n\n### Screenshot\n![Bug Screenshot](${screenshotUrl})`
  }

  if (body.gameState) {
    issueBody += `\n\n<details>\n<summary>Game State</summary>\n\n\`\`\`json\n${body.gameState}\n\`\`\`\n\n</details>`
  }

  // Create issue
  const issueRes = await githubApiFetch(token, `/repos/${repo}/issues`, {
    method: 'POST',
    body: JSON.stringify({
      title: `[Bug] ${body.title}`,
      body: issueBody,
      labels: ['bug'],
    }),
  })

  if (!issueRes.ok) {
    const err = await issueRes.text()
    throw createError({
      statusCode: issueRes.status,
      statusMessage: `Failed to create issue: ${err}`,
    })
  }

  const issue = (await issueRes.json()) as { html_url: string; number: number }
  return { url: issue.html_url, number: issue.number }
})

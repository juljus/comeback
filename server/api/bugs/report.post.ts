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

  // Upload screenshot if provided
  if (body.screenshot) {
    try {
      const base64Data = body.screenshot.replace(/^data:image\/\w+;base64,/, '')
      const filename = `bug-${Date.now()}.png`
      const path = `.github/bug-screenshots/${filename}`

      const uploadRes = await githubApiFetch(token, `/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        body: JSON.stringify({
          message: `Bug screenshot: ${body.title}`,
          content: base64Data,
        }),
      })

      if (uploadRes.ok) {
        const uploadData = (await uploadRes.json()) as {
          content: { download_url: string }
        }
        screenshotUrl = uploadData.content.download_url
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

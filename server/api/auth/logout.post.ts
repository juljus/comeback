import { deleteCookie } from 'h3'

export default defineEventHandler((event) => {
  deleteCookie(event, 'gh_token')
  deleteCookie(event, 'gh_user')
  return { ok: true }
})

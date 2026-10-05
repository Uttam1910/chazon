import { slugify, type PublicSeo } from '@chazon/shared'
import { prisma } from '../db'
import { env } from '../env'

/** Uploaded media is stored as /uploads/… paths; public responses expose absolute URLs. */
export const absolute = (url: string | null | undefined) => (url && url.startsWith('/uploads/') && env.API_URL ? env.API_URL + url : url ?? null)
export const absoluteMarkdown = (source: string) => (env.API_URL ? source.replace(/\]\(\/uploads\//g, `](${env.API_URL}/uploads/`) : source)

export async function getSettings() {
  return prisma.websiteSettings.upsert({ where: { id: 'default' }, update: {}, create: { id: 'default' } })
}

export async function getSeo(): Promise<Record<string, PublicSeo>> {
  const rows = await prisma.seoSetting.findMany()
  return Object.fromEntries(rows.map(({ page, title, description, canonicalUrl, ogTitle, ogDescription, ogImage, noindex, nofollow }) =>
    [page, { title, description, canonicalUrl, ogTitle, ogDescription, ogImage: absolute(ogImage), noindex, nofollow }]))
}

/** Returns `base`, or `base-2`, `base-3`… — the first slug `exists` says is free. */
export async function uniqueSlug(value: string, exists: (slug: string) => Promise<boolean>) {
  const base = slugify(value) || 'item'
  for (let n = 1; n < 500; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`
    if (!(await exists(candidate))) return candidate
  }
  return `${base}-${Date.now()}`
}

/** Sets publishedAt the first time content is published (or uses an explicit date). */
export function publishDate(status: string | undefined, requested: Date | null | undefined, current: Date | null | undefined) {
  if (requested !== undefined) return requested ?? (status === 'PUBLISHED' ? current ?? new Date() : null)
  if (status === 'PUBLISHED' && !current) return new Date()
  return undefined
}

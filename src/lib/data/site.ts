import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { demoRows } from '../demo/data'
import { queryOne } from '../db'
import { isDbConfigured } from '../env'
import { buildSiteData, type CatalogProduct, type CategoryNode, type SiteData } from './build'
import { fetchSiteRows } from './rows'

export const SITE_TAG = 'site'

/**
 * One cached snapshot of everything public. Admin saves call updateTag('site'), the
 * offer scheduler calls /api/revalidate, and it also refreshes on its own every hour.
 * Prices (offers with start and end dates) are worked out when the snapshot is built.
 */
export async function getSiteData(): Promise<SiteData> {
  'use cache'
  cacheLife('hours')
  cacheTag(SITE_TAG)
  const rows = isDbConfigured ? await fetchSiteRows() : demoRows
  return buildSiteData(rows, Date.now())
}

export async function getSettings() {
  return (await getSiteData()).settings
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const data = await getSiteData()
  return data.products.find((p) => p.slug === slug) ?? null
}

export async function getCategoryBySlug(slug: string): Promise<CategoryNode | null> {
  const data = await getSiteData()
  return data.categories.find((c) => c.slug === slug) ?? null
}

export async function getPage(slug: string) {
  const data = await getSiteData()
  return data.pages.find((p) => p.slug === slug) ?? null
}

/** Looks up a renamed product/category so old links redirect instead of 404ing. */
export async function findRedirect(entity: 'product' | 'category' | 'collection', oldSlug: string): Promise<string | null> {
  if (!isDbConfigured) return null
  return lookupRedirect(entity, oldSlug)
}

async function lookupRedirect(entity: string, oldSlug: string): Promise<string | null> {
  'use cache'
  cacheLife('hours')
  cacheTag(SITE_TAG)
  const row = await queryOne<{ slug: string | null }>('select public.resolve_slug_redirect($1, $2) as slug', [entity, oldSlug])
  return row?.slug ?? null
}

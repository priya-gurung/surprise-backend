import * as cheerio from 'cheerio'
import { prisma } from './prisma.js'
import { env } from '../config/env.js'

const CACHE_TTL_MS = env.LINK_PREVIEW_CACHE_TTL_HOURS * 60 * 60 * 1000

function normalizeCacheKey(url) {
  try {
    const u = new URL(url)
    u.hash = ''
    return u.toString()
  } catch {
    return url
  }
}

async function readCache(url) {
  const cached = await prisma.linkPreviewCache.findUnique({ where: { url } })
  if (!cached) return undefined // no entry at all
  const isFresh = Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS
  return isFresh ? cached.imageUrl : undefined // stale -> treat as no entry
}

async function writeCache(url, imageUrl) {
  await prisma.linkPreviewCache
    .upsert({
      where: { url },
      create: { url, imageUrl },
      update: { imageUrl, fetchedAt: new Date() },
    })
    .catch((err) => {
      // Caching is a nice-to-have; never let it break the request.
      console.error('link preview cache write failed', err)
    })
}

function extractImage(html, pageUrl) {
  const $ = cheerio.load(html)
  const candidates = [
    $('meta[property="og:image"]').attr('content'),
    $('meta[property="og:image:url"]').attr('content'),
    $('meta[name="twitter:image"]').attr('content'),
    $('meta[name="twitter:image:src"]').attr('content'),
    $('link[rel="image_src"]').attr('href'),
  ].filter(Boolean)

  if (candidates.length === 0) return null

  let image = candidates[0]
  if (!/^https?:\/\//i.test(image)) {
    try {
      image = new URL(image, new URL(pageUrl).origin).toString()
    } catch {
      return null
    }
  }
  return image
}

/**
 * Fetches `url`, extracts an Open Graph / Twitter preview image, and caches
 * the result. Returns null (never throws) if anything goes wrong — a
 * missing preview image should never break adding an item.
 */
export async function getLinkPreview(url) {
  const key = normalizeCacheKey(url)

  const cached = await readCache(key)
  if (cached !== undefined) return cached

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), env.LINK_PREVIEW_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        // Some sites refuse requests with no user agent / accept headers.
        'User-Agent':
          'Mozilla/5.0 (compatible; TiedWithStringBot/1.0; +https://example.com/bot)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) {
      await writeCache(key, null)
      return null
    }

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      await writeCache(key, null)
      return null
    }

    const html = await res.text()
    const image = extractImage(html, url)
    await writeCache(key, image)
    return image
  } catch (err) {
    clearTimeout(timeout)
    await writeCache(key, null)
    return null
  }
}

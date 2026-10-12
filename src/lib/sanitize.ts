import 'server-only'
import sanitizeHtml from 'sanitize-html'

/** Allow-list for rich text written in the admin (TipTap output). */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote', 'hr'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? '#'
        const external = /^https?:/i.test(href)
        const out: Record<string, string> = external ? { href, target: '_blank', rel: 'noopener noreferrer' } : { href }
        return { tagName, attribs: out }
      },
      b: 'strong',
      i: 'em',
    },
  })
}

/** Plain text (for meta descriptions, JSON-LD). */
export function htmlToText(html: string | null | undefined, max = 300): string {
  if (!html) return ''
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim()
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

/** Adds ids to <h2> headings (after sanitising) and returns a table of contents. */
export function withHeadingIds(html: string): { html: string; toc: { id: string; label: string }[] } {
  const toc: { id: string; label: string }[] = []
  const used = new Set<string>()
  const out = sanitizeRichText(html).replace(/<h2>([\s\S]*?)<\/h2>/g, (_, inner: string) => {
    const label = inner.replace(/<[^>]+>/g, '').trim()
    let id = label
      .toLowerCase()
      .replace(/&amp;/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    while (used.has(id)) id += '-2'
    used.add(id)
    toc.push({ id, label })
    return `<h2 id="${id}">${inner}</h2>`
  })
  return { html: out, toc }
}

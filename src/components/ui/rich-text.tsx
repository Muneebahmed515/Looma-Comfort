import { cn } from '@/lib/cn'
import { sanitizeRichText } from '@/lib/sanitize'

/** Renders admin-authored HTML. It is sanitised on save and again here. */
export function RichText({ html, className }: { html: string | null | undefined; className?: string }) {
  if (!html) return null
  return <div className={cn('prose-looma', className)} dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }} />
}

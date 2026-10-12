import Link from 'next/link'
import { IconArrowRight } from '@/components/icons'
import { cn } from '@/lib/cn'

interface SectionHeadingProps {
  eyebrow?: string | null
  title?: string | null
  subtitle?: string | null
  link?: { label: string; href: string } | null
  align?: 'start' | 'center'
  as?: 'h1' | 'h2'
  className?: string
  /** Visible on first paint (no scroll reveal). */
  static?: boolean
}

/** Eyebrow with the logo's flanking rules, a serif heading that reveals line by line, and an optional link. */
export function SectionHeading({ eyebrow, title, subtitle, link, align = 'start', as: Tag = 'h2', className, static: isStatic }: SectionHeadingProps) {
  const center = align === 'center'
  return (
    <div
      className={cn(
        'flex gap-6',
        center ? 'flex-col items-center text-center' : 'flex-col md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className={cn('max-w-2xl', center && 'mx-auto')}>
        {eyebrow && (
          <p
            className="eyebrow-rule t-eyebrow mb-4 text-gold-text"
            data-align={center ? undefined : 'start'}
            data-reveal-rule={isStatic ? undefined : ''}
          >
            {eyebrow}
          </p>
        )}
        {title && (
          <Tag className={Tag === 'h1' ? 't-h1' : 't-h2'} data-reveal={isStatic ? undefined : 'lines'}>
            {title}
          </Tag>
        )}
        {subtitle && (
          <p className="t-lead mt-4 text-taupe" data-reveal={isStatic ? undefined : 'up'}>
            {subtitle}
          </p>
        )}
      </div>
      {link && (
        <Link
          href={link.href}
          className="link-arrow link-u t-label shrink-0 self-start text-walnut md:self-auto"
          data-reveal={isStatic ? undefined : 'up'}
        >
          {link.label}
          <IconArrowRight size={16} />
        </Link>
      )}
    </div>
  )
}

import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export const inputClass =
  'h-12 w-full rounded-[2px] border border-line-strong bg-surface px-4 text-[1rem] text-walnut placeholder:text-taupe/60 transition-colors focus:border-walnut focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold aria-[invalid=true]:border-error'

export function Field({
  label,
  error,
  optional,
  hint,
  className,
  children,
}: {
  label: string
  error?: string
  optional?: boolean
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-2 flex items-baseline justify-between text-[0.85rem] text-walnut">
        {label}
        {optional && <span className="text-[0.75rem] text-taupe">Optional</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-[0.78rem] text-taupe">{hint}</span>}
      {error && (
        <span className="mt-1.5 block text-[0.8rem] text-error" role="alert">
          {error}
        </span>
      )}
    </label>
  )
}

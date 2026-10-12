'use client'

import { AnimatePresence } from 'framer-motion'
import * as m from 'framer-motion/m'
import { useId, useState, type ReactNode } from 'react'
import { IconMinus, IconPlus } from '@/components/icons'
import { cn } from '@/lib/cn'
import { DUR, EASE_LOOMA } from '@/lib/motion-tokens'

interface AccordionItemProps {
  title: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
  titleClassName?: string
  /** Heading level for the trigger, to keep the page outline correct. */
  level?: 'h2' | 'h3'
}

export function AccordionItem({ title, children, defaultOpen = false, className, titleClassName, level = 'h3' }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  const Heading = level
  return (
    <div className={cn('border-b border-line', className)}>
      <Heading className="m-0 font-sans text-base">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          id={`${id}-button`}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'flex w-full items-center justify-between gap-6 py-5 text-left text-[0.95rem] font-medium tracking-[0.01em] text-walnut',
            titleClassName,
          )}
        >
          <span>{title}</span>
          <span className="relative grid size-5 shrink-0 place-items-center text-gold-text">
            <IconPlus size={18} className={cn('absolute transition-all duration-300', open && 'rotate-90 opacity-0')} />
            <IconMinus size={18} className={cn('absolute transition-all duration-300', !open && '-rotate-90 opacity-0')} />
          </span>
        </button>
      </Heading>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-button`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DUR.ui, ease: EASE_LOOMA }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-[0.95rem] text-walnut/90">{children}</div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

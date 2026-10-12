'use client'

import { AnimatePresence } from 'framer-motion'
import * as m from 'framer-motion/m'
import { Dialog } from 'radix-ui'
import type { ReactNode } from 'react'
import { IconClose } from '@/components/icons'
import { cn } from '@/lib/cn'
import { DUR, EASE_LOOMA } from '@/lib/motion-tokens'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  side: 'left' | 'right' | 'bottom' | 'top'
  title: string
  /** Hide the visual title (still announced to screen readers). */
  hideTitle?: boolean
  children: ReactNode
  footer?: ReactNode
  className?: string
}

const offscreen = {
  left: { x: '-100%' },
  right: { x: '100%' },
  bottom: { y: '100%' },
  top: { y: '-100%' },
}

/** Drawer / bottom sheet: Radix Dialog (focus trap, Esc, scroll lock) animated with Motion. */
export function Sheet({ open, onOpenChange, side, title, hideTitle, children, footer, className }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <m.div
                className="fixed inset-0 z-[60] bg-walnut-deep/35"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.ui }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <m.div
                data-lenis-prevent
                className={cn(
                  'fixed z-[61] flex flex-col bg-ivory shadow-[0_8px_40px_rgb(58_37_25/0.18)] outline-none',
                  side === 'left' && 'inset-y-0 left-0 w-[min(88vw,420px)]',
                  side === 'right' && 'inset-y-0 right-0 w-[min(92vw,460px)]',
                  side === 'bottom' && 'inset-x-0 bottom-0 max-h-[90svh] rounded-t-[6px]',
                  side === 'top' && 'inset-x-0 top-0 max-h-[100svh]',
                  className,
                )}
                initial={offscreen[side]}
                animate={{ x: 0, y: 0 }}
                exit={offscreen[side]}
                transition={{ duration: 0.45, ease: EASE_LOOMA }}
              >
                <div className={cn('flex items-center justify-between px-5 py-4', !hideTitle && 'border-b border-line')}>
                  <Dialog.Title className={cn('t-label text-walnut', hideTitle && 'sr-only')}>{title}</Dialog.Title>
                  <Dialog.Close className="-mr-2 grid size-11 place-items-center text-walnut" aria-label="Close">
                    <IconClose size={22} />
                  </Dialog.Close>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
                {footer && <div className="safe-bottom border-t border-line bg-ivory">{footer}</div>}
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

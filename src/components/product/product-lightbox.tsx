'use client'

import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'

interface Props {
  open: boolean
  index: number
  slides: { src: string; alt?: string; width?: number; height?: number }[]
  onClose: () => void
  onIndex: (i: number) => void
}

/** Full-screen gallery with pinch / double-tap zoom and swipe-down to close. Loaded only when opened. */
export default function ProductLightbox({ open, index, slides, onClose, onIndex }: Props) {
  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={slides}
      plugins={[Zoom]}
      on={{ view: ({ index: i }) => onIndex(i) }}
      animation={{ fade: 400, swipe: 450, easing: { fade: 'cubic-bezier(0.22, 1, 0.36, 1)', swipe: 'cubic-bezier(0.22, 1, 0.36, 1)', navigation: 'cubic-bezier(0.22, 1, 0.36, 1)' } }}
      controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
      zoom={{ maxZoomPixelRatio: 2.5, scrollToZoom: true }}
      carousel={{ finite: slides.length < 3 }}
      styles={{ container: { backgroundColor: 'rgba(248, 245, 239, 0.98)' }, button: { color: '#4a3022', filter: 'none' }, icon: { color: '#4a3022' } }}
      render={{ buttonPrev: slides.length > 1 ? undefined : () => null, buttonNext: slides.length > 1 ? undefined : () => null }}
    />
  )
}

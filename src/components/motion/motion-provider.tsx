'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * The site's scroll-driven motion, in one place:
 *  - Lenis smooth scrolling (desktop pointer devices only; phones keep native scrolling)
 *  - GSAP reveals, driven by data attributes rendered on the server:
 *      data-reveal="up"     fade + rise
 *      data-reveal="lines"  heading lines rise from a mask (SplitText)
 *      data-reveal="image"  soft curtain wipe (+ slight zoom-out)
 *      data-reveal="card"   staggered entrance for product/category cards
 *      data-reveal-rule     eyebrow rules draw outwards
 *      data-count="5000"    number counter
 *  - GSAP ScrollTrigger for effects tied to scroll position:
 *      data-parallax        slow parallax on large editorial images (desktop only)
 *      data-draw            line that draws with scroll progress
 *      data-hscroll         pinned horizontal scroll section (desktop only)
 *
 * Performance: everything loads after the page is idle, and each element is only set up
 * when it approaches the screen (IntersectionObserver), so nothing measures layout up front.
 */

type GsapModule = typeof import('gsap')['gsap']
type ScrollTriggerType = typeof import('gsap/ScrollTrigger')['ScrollTrigger']
type SplitTextType = typeof import('gsap/SplitText')['SplitText']
type LenisType = import('lenis').default

interface Engine {
  gsap: GsapModule
  /** Loaded only on pages that have scroll-linked effects. */
  scrollTrigger: ScrollTriggerType | null
  loadScrollTrigger: () => Promise<ScrollTriggerType>
  /** Loaded when the first heading reveal plays. */
  loadSplitText: () => Promise<SplitTextType>
  lenis: LenisType | null
  desktop: boolean
  reveal: IntersectionObserver
  prepare: IntersectionObserver
}

declare global {
  interface Window {
    __lenis?: LenisType | null
  }
}

const DESKTOP_QUERY = '(min-width: 1024px) and (hover: hover) and (pointer: fine)'
const REVEAL_SELECTOR = '[data-reveal], [data-reveal-rule], [data-count]'
const SCRUB_SELECTOR = '[data-parallax], [data-draw], [data-hscroll]'

function whenIdle(): Promise<void> {
  return new Promise((resolve) => {
    const go = () => {
      if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => resolve(), { timeout: 1200 })
      else setTimeout(resolve, 200)
    }
    if (document.readyState === 'complete') go()
    else window.addEventListener('load', go, { once: true })
  })
}

export function MotionProvider() {
  const pathname = usePathname()
  const engineRef = useRef<Engine | null>(null)

  useEffect(() => {
    const html = document.documentElement
    if (!html.classList.contains('motion-ok')) return
    let cancelled = false
    let mutations: MutationObserver | null = null
    let lockObserver: MutationObserver | null = null

    ;(async () => {
      // Start after the page has loaded and the browser is idle, so animation setup never
      // competes with the hero image or hydration on slower phones.
      await whenIdle()
      if (cancelled || !html.classList.contains('motion-ok')) return
      const desktop = window.matchMedia(DESKTOP_QUERY).matches
      const [{ gsap }, { CustomEase }, lenisMod] = await Promise.all([
        import('gsap'),
        import('gsap/CustomEase'),
        desktop ? import('lenis') : Promise.resolve(null),
      ])
      if (cancelled || !html.classList.contains('motion-ok')) return
      gsap.registerPlugin(CustomEase)
      CustomEase.create('looma', '0.22,1,0.36,1')
      CustomEase.create('curtain', '0.65,0,0.35,1')

      let lenis: LenisType | null = null
      if (lenisMod) {
        const Lenis = lenisMod.default
        lenis = new Lenis({ lerp: 0.1, smoothWheel: true, autoRaf: false, anchors: { offset: -110 } })
        gsap.ticker.add((time) => lenis?.raf(time * 1000))
        gsap.ticker.lagSmoothing(0)
        window.__lenis = lenis
        // Pause smooth scrolling while a dialog/drawer locks the page.
        lockObserver = new MutationObserver(() => {
          if (document.body.hasAttribute('data-scroll-locked')) lenis?.stop()
          else lenis?.start()
        })
        lockObserver.observe(document.body, { attributes: true, attributeFilter: ['data-scroll-locked'] })
      }

      await document.fonts?.ready
      if (cancelled) return

      const engine = {} as Engine
      let stPromise: Promise<ScrollTriggerType> | null = null
      let splitPromise: Promise<SplitTextType> | null = null
      Object.assign(engine, {
        gsap,
        scrollTrigger: null,
        loadScrollTrigger: () =>
          (stPromise ??= import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
            gsap.registerPlugin(ScrollTrigger)
            ScrollTrigger.config({ ignoreMobileResize: true })
            if (lenis) lenis.on('scroll', ScrollTrigger.update)
            engine.scrollTrigger = ScrollTrigger
            return ScrollTrigger
          })),
        loadSplitText: () =>
          (splitPromise ??= import('gsap/SplitText').then(({ SplitText }) => {
            gsap.registerPlugin(SplitText)
            return SplitText
          })),
        lenis,
        desktop,
        // Plays a reveal once the element is just inside the screen.
        reveal: new IntersectionObserver(
          (entries) => {
            const entering = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement)
            entering.forEach((el) => engine.reveal.unobserve(el))
            playReveals(engine, entering)
          },
          { rootMargin: '0px 0px -8% 0px' },
        ),
        // Creates scroll-linked effects shortly before they are needed.
        prepare: new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (!e.isIntersecting) continue
              engine.prepare.unobserve(e.target)
              void prepareScrub(engine, e.target as HTMLElement)
            }
          },
          { rootMargin: '600px 0px 600px 0px' },
        ),
      })
      engineRef.current = engine
      html.classList.add('motion-ready')
      scan(engine)

      // Content added later (load more, client navigation) gets picked up automatically.
      let timer = 0
      mutations = new MutationObserver((records) => {
        if (!records.some((r) => r.addedNodes.length)) return
        window.clearTimeout(timer)
        timer = window.setTimeout(() => scan(engine), 60)
      })
      mutations.observe(document.body, { childList: true, subtree: true })
    })()

    return () => {
      cancelled = true
      mutations?.disconnect()
      lockObserver?.disconnect()
      engineRef.current?.reveal.disconnect()
      engineRef.current?.prepare.disconnect()
    }
  }, [])

  // On navigation: jump to top without smoothing, drop triggers for removed elements, rescan.
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    if (!window.location.hash) engine.lenis?.scrollTo(0, { immediate: true, force: true })
    engine.scrollTrigger?.getAll().forEach((st) => {
      const trigger = st.trigger as Element | undefined
      if (trigger && !document.contains(trigger)) st.kill()
    })
    const id = window.setTimeout(() => {
      scan(engine)
      engine.scrollTrigger?.refresh()
    }, 80)
    return () => window.clearTimeout(id)
  }, [pathname])

  return null
}

/** Registers new elements with the observers (cheap: no layout reads). */
function scan(engine: Engine) {
  for (const el of document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)) {
    if (el.dataset.motionInit) continue
    el.dataset.motionInit = '1'
    if (el.dataset.count) el.textContent = `0${el.dataset.countSuffix ?? ''}`
    engine.reveal.observe(el)
  }
  for (const el of document.querySelectorAll<HTMLElement>(SCRUB_SELECTOR)) {
    if (el.dataset.scrubInit) continue
    el.dataset.scrubInit = '1'
    engine.prepare.observe(el)
  }
}

function playReveals({ gsap, loadSplitText, desktop }: Engine, elements: HTMLElement[]) {
  const dist = desktop ? 24 : 16
  const dur = desktop ? 0.9 : 0.7
  let cardIndex = 0
  for (const el of elements) {
    // Eyebrow rules (CSS transition, toggled here)
    if (el.hasAttribute('data-reveal-rule') && !el.dataset.reveal) {
      el.classList.add('is-revealed')
      continue
    }

    // Number counters
    if (el.dataset.count) {
      const target = Number(el.dataset.count)
      const suffix = el.dataset.countSuffix ?? ''
      const fmt = new Intl.NumberFormat('en-US')
      const state = { v: 0 }
      gsap.to(state, {
        v: target,
        duration: 1.6,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = `${fmt.format(Math.round(state.v))}${suffix}`
        },
      })
      continue
    }

    const kind = el.dataset.reveal
    if (kind === 'lines') {
      void loadSplitText().then((SplitText) => {
        el.classList.add('is-revealed')
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          linesClass: 'split-line',
          onSplit: (self) => gsap.from(self.lines, { yPercent: 105, duration: 0.95, stagger: 0.1, ease: 'looma' }),
        })
      })
    } else if (kind === 'image') {
      const curtain = el.querySelector<HTMLElement>('.reveal-curtain')
      const media = el.querySelector<HTMLElement>('img')
      if (curtain) gsap.set(curtain, { scaleY: 1, transformOrigin: 'top center' })
      el.classList.add('is-revealed')
      if (curtain) gsap.to(curtain, { scaleY: 0, duration: 1, ease: 'curtain' })
      if (media) gsap.fromTo(media, { scale: 1.12 }, { scale: 1, duration: 1.4, ease: 'looma', clearProps: 'scale' })
    } else {
      // "up" and "card": fade and rise; cards that enter together get a gentle stagger.
      const delay = kind === 'card' ? Math.min(cardIndex++, 5) * 0.08 : Number(el.dataset.revealDelay ?? 0)
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: dist },
        {
          autoAlpha: 1,
          y: 0,
          duration: dur,
          delay,
          ease: 'looma',
          clearProps: 'transform,opacity,visibility',
          onStart: () => el.classList.add('is-revealed'),
        },
      )
    }
    if (el.hasAttribute('data-reveal-rule')) el.classList.add('is-revealed')
  }
}

async function prepareScrub({ gsap, desktop, loadScrollTrigger }: Engine, el: HTMLElement) {
  const needsTrigger = el.hasAttribute('data-draw') || desktop
  if (!needsTrigger) return
  await loadScrollTrigger()
  if (el.hasAttribute('data-draw')) {
    gsap.fromTo(
      el,
      { scaleY: 0, transformOrigin: 'top center' },
      { scaleY: 1, ease: 'none', scrollTrigger: { trigger: el.parentElement ?? el, start: 'top 70%', end: 'bottom 60%', scrub: 0.6 } },
    )
    return
  }
  if (!desktop) return

  if (el.hasAttribute('data-parallax')) {
    const target = el.querySelector<HTMLElement>('[data-parallax-target]') ?? el
    gsap.fromTo(target, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
    return
  }

  if (el.hasAttribute('data-hscroll')) {
    const track = el.querySelector<HTMLElement>('[data-hscroll-track]')
    const progress = el.querySelector<HTMLElement>('[data-hscroll-progress]')
    if (!track) return
    const distance = () => Math.max(0, track.scrollWidth - el.clientWidth)
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: () => `+=${Math.min(distance(), window.innerHeight * 1.5)}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (progress) progress.style.transform = `scaleX(${self.progress})`
        },
      },
    })
  }
}

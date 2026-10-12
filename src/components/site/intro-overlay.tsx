/* eslint-disable @next/next/no-img-element */

/**
 * First-visit intro (home page only). Pure CSS, toggled by html.intro-play from the head
 * script, so it starts with first paint and never waits for JavaScript. The hero is already
 * rendered underneath; the curtain simply lifts away.
 */
export function IntroOverlay() {
  return (
    <div className="intro-overlay" aria-hidden>
      <img src="/brand/logo-mark-192.webp" alt="" width={97} height={96} className="h-24 w-auto" loading="lazy" />
    </div>
  )
}

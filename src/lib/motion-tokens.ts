// Shared timing so CSS, Motion and GSAP feel like one system. Mirrors the CSS variables in globals.css.
export const EASE_LOOMA = [0.22, 1, 0.36, 1] as const
export const EASE_CURTAIN = [0.65, 0, 0.35, 1] as const

export const DUR = {
  micro: 0.2,
  ui: 0.4,
  reveal: 0.9,
  image: 1,
  count: 1.6,
} as const

export const STAGGER = 0.08

import { domAnimation } from 'framer-motion'

// Loaded asynchronously by <LazyMotion> so animation features never block first paint.
// domAnimation covers animate/exit/variants/gestures (no layout or drag needed on this site).
export default domAnimation

import { PageTransition } from '@/components/motion/page-transition'

// Templates remount on every navigation, so the page cross-fade runs between routes.
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}

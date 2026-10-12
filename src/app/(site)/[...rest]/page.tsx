import { notFound } from 'next/navigation'

export const instant = false

// Any unknown URL renders the branded 404 inside the site layout (with header and footer).
export default function CatchAll() {
  notFound()
}

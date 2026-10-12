import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AuthCard } from '@/components/admin/auth-card'
import { LoginForm } from '@/components/admin/login-form'

// Per-user page: allowed to wait for the server on navigation.
export const instant = false

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage(props: PageProps<'/admin/login'>) {
  return (
    <AuthCard title="Sign in">
      <Suspense fallback={<div className="h-56" />}>
        <LoginContent searchParams={props.searchParams} />
      </Suspense>
    </AuthCard>
  )
}

async function LoginContent({ searchParams }: Pick<PageProps<'/admin/login'>, 'searchParams'>) {
  const sp = await searchParams
  const next = typeof sp.next === 'string' ? sp.next : '/admin'
  const notice =
    sp.error === 'not-admin'
      ? 'This account does not have admin access. Ask the owner to add you.'
      : sp.reset === '1'
        ? 'Your password has been updated. Please sign in.'
        : undefined
  return <LoginForm next={next} notice={notice} />
}

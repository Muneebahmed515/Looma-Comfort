import type { Metadata } from 'next'
import { AuthCard } from '@/components/admin/auth-card'
import { ForgotPasswordForm } from '@/components/admin/password-forms'

// Per-user page: allowed to wait for the server on navigation.
export const instant = false

export const metadata: Metadata = { title: 'Reset password' }

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset password">
      <ForgotPasswordForm />
    </AuthCard>
  )
}

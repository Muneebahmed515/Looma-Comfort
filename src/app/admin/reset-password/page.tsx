import type { Metadata } from 'next'
import { AuthCard } from '@/components/admin/auth-card'
import { ResetPasswordForm } from '@/components/admin/password-forms'

// Per-user page: allowed to wait for the server on navigation.
export const instant = false

export const metadata: Metadata = { title: 'Choose a new password' }

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Choose a new password">
      <ResetPasswordForm />
    </AuthCard>
  )
}

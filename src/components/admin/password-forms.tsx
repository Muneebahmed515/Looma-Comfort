import Link from 'next/link'

/** There is no email service: the owner resets passwords from Team, and the owner's own from the command line. */
export function ForgotPasswordForm() {
  return (
    <div className="space-y-5">
      <p className="text-[0.92rem] text-taupe">
        <strong className="text-walnut">Team members:</strong> ask the owner to open <em>Admin → Team</em> and choose <em>New password</em>. You will get a one-time password to sign in with, then you can choose your own under <em>Account</em>.
      </p>
      <p className="text-[0.92rem] text-taupe">
        <strong className="text-walnut">Owner:</strong> whoever manages the website code can set a new password by running{' '}
        <code className="rounded-[2px] bg-beige-soft px-1.5 py-0.5 text-[0.8rem]">npm run admin:create -- you@example.com</code> (see the README).
      </p>
      <Link href="/admin/login" className="btn btn-secondary btn-block">
        Back to sign in
      </Link>
    </div>
  )
}

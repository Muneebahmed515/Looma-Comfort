import Image from 'next/image'
import type { ReactNode } from 'react'

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="grid min-h-svh place-items-center bg-ivory px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-10 flex justify-center">
          <Image src="/brand/logo-full.png" alt="Looma Comfort" width={940} height={778} sizes="200px" className="h-auto w-[180px]" />
        </div>
        <div className="rounded-[2px] border border-line bg-surface p-7 sm:p-9">
          <h1 className="mb-6 text-center font-serif text-[1.8rem] text-walnut">{title}</h1>
          {children}
        </div>
        <p className="mt-6 text-center text-[0.78rem] text-taupe">Looma Comfort admin · authorised staff only</p>
      </div>
    </main>
  )
}

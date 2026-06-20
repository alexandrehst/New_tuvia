import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-brand-tint/40 p-4">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">O</span>
        <span className="text-lg font-semibold tracking-tight text-foreground">OKR</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}

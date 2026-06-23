import Link from 'next/link'

// Variância proposital em relação a `(auth)/layout.tsx`: mesmo visual centrado,
// porém SEM o guard `getUser() -> redirect('/planos')`. O link de recovery
// estabelece uma sessão (o usuário fica "autenticado"); se este grupo tivesse o
// guard, o usuário seria expulso antes de conseguir redefinir a senha (AC-6).
export default function RecoveryLayout({ children }: { children: React.ReactNode }) {
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

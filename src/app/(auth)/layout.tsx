import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Usuário já autenticado não deve ver login/cadastro/reset — manda pra app.
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/planos')

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

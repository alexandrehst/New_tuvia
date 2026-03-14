import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col p-4 gap-2">
        <div className="font-bold text-lg text-blue-600 mb-4">OKR</div>
        <nav className="flex flex-col gap-1">
          <Link href="/planos" className="rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Planos
          </Link>
          <Link href="/criador" className="rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Criar Plano
          </Link>
          <Link href="/usuarios" className="rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Usuários
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}

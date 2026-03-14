import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top header */}
      <header style={{ background: 'var(--navy)' }} className="h-14 flex items-center px-6 shrink-0">
        <div className="flex items-center gap-2 flex-1">
          {/* Logo */}
          <Link href="/planos" className="flex items-center gap-1.5">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1L2 5v8l7 4 7-4V5L9 1z" stroke="#c9a54c" strokeWidth="1.5" fill="none"/>
              <path d="M9 1v16M2 5l7 4 7-4" stroke="#c9a54c" strokeWidth="1.5"/>
            </svg>
            <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.08em' }}>
              TUVIA
            </span>
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button className="relative flex items-center gap-1.5 text-white/70 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 17H20L18.6 15.6C18.2 15.2 18 14.6 18 14V11C18 8.3 16.3 6 14 5.3V5C14 3.9 13.1 3 12 3C10.9 3 10 3.9 10 5V5.3C7.7 6 6 8.3 6 11V14C6 14.6 5.8 15.2 5.4 15.6L4 17H9M15 17C15 18.7 13.7 20 12 20C10.3 20 9 18.7 9 17M15 17H9"/>
            </svg>
            <span className="absolute -top-1 -right-1 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium" style={{ fontSize: '10px', background: 'var(--teal)' }}>7</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-medium">
            {session.user.email?.[0]?.toUpperCase()}
          </div>
        </div>
      </header>

      {/* Green accent line */}
      <div style={{ height: '3px', background: 'var(--green-accent)' }} className="shrink-0" />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside style={{ background: 'var(--navy)', width: '160px' }} className="shrink-0 flex flex-col pt-4">
          <nav className="flex flex-col gap-1 px-3">
            <Link
              href="/planos"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 text-sm transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              Todos os planos
            </Link>
            <Link
              href="/criador"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 text-sm transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>
              </svg>
              Criar plano
            </Link>
            <Link
              href="/usuarios"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 text-sm transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.85"/>
              </svg>
              Usuários
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <main style={{ background: 'var(--bg)' }} className="flex-1 min-h-full">
          {children}
        </main>
      </div>
    </div>
  )
}

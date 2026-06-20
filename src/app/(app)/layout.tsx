import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'
import { getSidebarData } from '@/features/plano/queries'
import { AppSidebar } from './components/app-sidebar'
import { Topbar } from './components/topbar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const email = session.user.email ?? ''
  const sidebarData = await getSidebarData(email)
  const nome = sidebarData?.user?.nome
  const clienteNome = sidebarData?.user?.cliente?.nome

  return (
    <SidebarProvider>
      <AppSidebar userEmail={email} clienteNome={clienteNome} />
      <SidebarInset>
        <Topbar userEmail={email} nome={nome} />
        <main className="flex-1 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

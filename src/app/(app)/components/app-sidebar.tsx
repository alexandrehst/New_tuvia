'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'

interface AppSidebarProps {
  userEmail: string
  clienteNome?: string
}

const navItems = [
  { href: '/planos', label: 'Planos', icon: LayoutDashboard },
  { href: '/usuarios', label: 'Usuários', icon: Users },
]

export function AppSidebar({ userEmail, clienteNome }: AppSidebarProps) {
  const pathname = usePathname()
  // Identidade do tenant: o modelo tem 1 Cliente por usuário (sem troca de workspace).
  const workspaceName = clienteNome || userEmail
  const initials = (clienteNome?.[0] || userEmail[0] || '?').toUpperCase()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<div />} className="cursor-default hover:bg-transparent active:bg-transparent">
              <Avatar className="size-8 rounded-lg shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground rounded-lg font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-sm font-semibold truncate">{workspaceName}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Workspace</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === '/planos'
                    ? pathname.startsWith('/planos')
                    : pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} aria-current={isActive ? 'page' : undefined} />}
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-1 group-data-[collapsible=icon]:justify-center">
          <span className="text-sm text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Modo escuro
          </span>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

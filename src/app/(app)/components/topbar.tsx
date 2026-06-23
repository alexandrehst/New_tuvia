'use client'

import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/features/auth/actions'

function titleFor(pathname: string): string {
  if (pathname.startsWith('/usuarios')) return 'Usuários'
  if (pathname === '/criador') return 'Novo plano'
  if (pathname.startsWith('/planos/')) return '' // a página mostra o breadcrumb de hierarquia (Story 1.5)
  if (pathname.startsWith('/planos')) return 'Planos'
  return 'OKR'
}

interface TopbarProps {
  userEmail: string
  nome?: string
}

export function Topbar({ userEmail, nome }: TopbarProps) {
  const pathname = usePathname()
  const initials = (nome?.[0] ?? userEmail[0] ?? '?').toUpperCase()
  const title = titleFor(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />
      {title && <h1 className="text-base font-semibold">{title}</h1>}

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Conta" className="rounded-full" />
            }
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate">{nome ?? userEmail}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

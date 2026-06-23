'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { definirNovaSenha } from '@/features/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function NovaSenhaPage() {
  const [state, action, isPending] = useActionState(definirNovaSenha, null)

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Definir nova senha</CardTitle>
        <CardDescription>Escolha uma nova senha para a sua conta</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {state?.error && (
            <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {state.error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmar">Confirmar nova senha</Label>
            <Input
              id="confirmar"
              name="confirmar"
              type="password"
              autoComplete="new-password"
              required
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="mt-2 w-full" disabled={isPending}>
            {isPending ? 'Salvando…' : 'Redefinir senha'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Voltar ao login
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

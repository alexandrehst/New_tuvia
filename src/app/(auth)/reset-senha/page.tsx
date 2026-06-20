'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { resetPassword } from '@/features/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function ResetSenhaPage() {
  const [state, action, isPending] = useActionState(resetPassword, null)

  return (
    <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Recuperar senha</CardTitle>
          <CardDescription>Enviaremos um link para o seu email</CardDescription>
        </CardHeader>
        <CardContent>
          {state?.success ? (
            <div className="flex items-center gap-2 rounded-lg border border-status-no-prazo/20 bg-status-no-prazo-bg px-4 py-3 text-sm text-status-no-prazo">
              <CheckCircle2 className="size-4 shrink-0" />
              Email enviado! Verifique sua caixa de entrada.
            </div>
          ) : (
            <form action={action} className="space-y-4">
              {state?.error && (
                <div role="alert" className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm bg-destructive/10 text-destructive border border-destructive/20">
                  <AlertCircle className="size-4 shrink-0" />
                  {state.error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="seu@email.com"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Enviando...' : 'Enviar link'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  Voltar ao login
                </Link>
              </p>
            </form>
          )}
        </CardContent>
    </Card>
  )
}

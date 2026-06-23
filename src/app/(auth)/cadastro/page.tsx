'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { AlertCircle, MailCheck } from 'lucide-react'
import { signUp } from '@/features/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function CadastroPage() {
  const [state, action, isPending] = useActionState(signUp, null)

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Criar conta</CardTitle>
        <CardDescription>
          Já tem conta?{' '}
          <Link href="/login" className="text-primary hover:underline">Entrar</Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state?.success ? (
          <div role="status" className="flex flex-col items-center gap-3 py-4 text-center">
            <MailCheck className="size-10 text-primary" />
            <p className="text-sm text-muted-foreground">
              Conta criada! Enviamos um link de confirmação para o seu email.
              Confirme para entrar.
            </p>
            <Link href="/login" className="text-sm text-primary hover:underline">
              Voltar para o login
            </Link>
          </div>
        ) : (
        <>
        {state?.error && (
          <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" type="text" autoComplete="name" required placeholder="Seu nome" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="seu@email.com" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required placeholder="••••••••" />
          </div>

          <Button type="submit" disabled={isPending} className="mt-2 w-full">
            {isPending ? 'Criando…' : 'Criar conta'}
          </Button>
        </form>
        </>
        )}
      </CardContent>
    </Card>
  )
}

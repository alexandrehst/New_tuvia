'use client'

import { useActionState } from 'react'
import { signUp } from '@/features/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CadastroPage() {
  const [state, action, isPending] = useActionState(signUp, null)

  return (
    <div className="bg-white shadow rounded-lg p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Criar conta</h1>

      {state?.error && (
        <div role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" name="nome" type="text" autoComplete="name" required />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>

        <div>
          <Label htmlFor="password">Senha</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Criando...' : 'Criar conta'}
        </Button>
      </form>
    </div>
  )
}

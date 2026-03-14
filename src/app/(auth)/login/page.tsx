'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn } from '@/features/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [state, action, isPending] = useActionState(signIn, null)

  return (
    <div className="bg-white shadow rounded-lg p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Entrar</h1>

      {state?.error && (
        <div role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>

        <div>
          <Label htmlFor="password">Senha</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <div className="mt-4 text-center text-sm">
        <Link href="/reset-senha" className="text-blue-600 hover:underline">
          Esqueci a senha
        </Link>
      </div>
    </div>
  )
}

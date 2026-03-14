'use client'

import { useActionState } from 'react'
import { resetPassword } from '@/features/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetSenhaPage() {
  const [state, action, isPending] = useActionState(resetPassword, null)

  if (state?.success) {
    return (
      <div className="bg-white shadow rounded-lg p-8">
        <p className="text-green-700">Email enviado. Verifique sua caixa de entrada.</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Recuperar senha</h1>

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

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Enviando...' : 'Enviar'}
        </Button>
      </form>
    </div>
  )
}

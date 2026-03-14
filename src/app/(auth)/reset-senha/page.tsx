'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/features/auth/actions'

export default function ResetSenhaPage() {
  const [state, action, isPending] = useActionState(resetPassword, null)

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8" style={{ border: '1px solid var(--border)' }}>
        <div className="mb-6">
          <Link href="/login" className="flex items-center gap-1.5 mb-6">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M9 1L2 5v8l7 4 7-4V5L9 1z" stroke="#c9a54c" strokeWidth="1.5" fill="none"/>
              <path d="M9 1v16M2 5l7 4 7-4" stroke="#c9a54c" strokeWidth="1.5"/>
            </svg>
            <span style={{ color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.08em' }}>TUVIA</span>
          </Link>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Recuperar senha</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Enviaremos um link para o seu email
          </p>
        </div>

        {state?.success ? (
          <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#d1fae5', color: '#065f46' }}>
            Email enviado! Verifique sua caixa de entrada.
          </div>
        ) : (
          <form action={action} className="space-y-4">
            {state?.error && (
              <div role="alert" className="rounded-lg px-4 py-3 text-sm" style={{ background: '#fef2f2', color: '#b91c1c' }}>
                {state.error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                id="email" name="email" type="email" required placeholder="seu@email.com"
                className="w-full px-3 py-2.5 text-sm rounded-lg outline-none"
                style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <button
              type="submit" disabled={isPending}
              className="w-full py-3 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              style={{ background: 'var(--teal)' }}
            >
              {isPending ? 'Enviando...' : 'Enviar'}
            </button>
            <div className="text-center text-sm">
              <Link href="/login" style={{ color: 'var(--teal)' }} className="hover:underline">Voltar ao login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn } from '@/features/auth/actions'

export default function LoginPage() {
  const [state, action, isPending] = useActionState(signIn, null)

  return (
    <div className="flex min-h-screen">
      {/* Left — form */}
      <div className="flex flex-col justify-center w-full max-w-md px-10 py-12 bg-white">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Entrar</h1>
        </div>

        {state?.error && (
          <div role="alert" className="mb-4 rounded-lg px-4 py-3 text-sm flex items-center gap-2"
            style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="seu@email.com"
              className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--teal)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--teal)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link href="/reset-senha" className="hover:underline" style={{ color: 'var(--teal)' }}>
              Esqueci a senha
            </Link>
            <Link href="/cadastro" className="hover:underline" style={{ color: 'var(--teal)' }}>
              Criar conta
            </Link>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 mt-2"
            style={{ background: 'var(--teal)' }}
          >
            {isPending ? 'Entrando...' : 'Avançar'}
          </button>
        </form>
      </div>

      {/* Right — brand mosaic */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden" style={{ background: 'var(--navy)' }}>
        {/* Mosaic grid */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-3 gap-0">
          <div style={{ background: '#f5e6c8' }} className="relative overflow-hidden">
            <div className="absolute bottom-4 left-4 w-20 h-20 rounded-full" style={{ background: '#e8c976' }} />
          </div>
          <div style={{ background: '#d4a843' }} className="relative overflow-hidden flex items-center justify-center">
            <div className="w-16 h-16 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
          </div>
          <div style={{ background: '#2b6478' }} className="flex items-center justify-center">
            <div className="w-24 h-24 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
          </div>
          <div style={{ background: '#0d2535' }} className="flex items-center justify-center">
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                  <path d="M9 1L2 5v8l7 4 7-4V5L9 1z" stroke="#c9a54c" strokeWidth="1.5" fill="none"/>
                  <path d="M9 1v16M2 5l7 4 7-4" stroke="#c9a54c" strokeWidth="1.5"/>
                </svg>
                <span style={{ color: '#c9a54c', fontWeight: 700, fontSize: '1.3rem', letterSpacing: '0.1em' }}>TUVIA</span>
              </div>
            </div>
          </div>
          <div style={{ background: '#e8d5f0' }} className="relative overflow-hidden">
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full" style={{ background: '#c9a3d4' }} />
          </div>
          <div style={{ background: '#f0e8d8' }} className="relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-full h-16 rounded-tl-full" style={{ background: '#e8c976', opacity: 0.5 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

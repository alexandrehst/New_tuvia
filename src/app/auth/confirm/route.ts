import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

// Callback de auth (não é API de dados): troca o `code` do link de recovery
// (fluxo PKCE) por uma sessão e grava os cookies no servidor antes de
// encaminhar o usuário para a página que redefine a senha.
/** Aceita apenas paths internos relativos (começam com "/" e não com "//" ou "/\"),
 *  evitando redirecionamento para outro host após o exchange de sessão. */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return '/nova-senha'
  }
  return raw
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  if (!code) {
    return NextResponse.redirect(`${origin}/reset-senha?erro=link-invalido`)
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/reset-senha?erro=link-invalido`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}

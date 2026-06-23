import { getCurrentUser } from './guards'

/**
 * Para uso em Route Handlers (rotas de API). Diferente de `requireUser()`,
 * NÃO lança — retorna o usuário autenticado ou `null`, para que a rota
 * possa devolver uma Response 401 explicitamente.
 */
export async function requireApiUser() {
  return getCurrentUser()
}

/** Resposta padrão para requisições não autenticadas. */
export function unauthorizedResponse() {
  return new Response('Unauthorized', { status: 401 })
}

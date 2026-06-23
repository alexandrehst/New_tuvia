/**
 * Busca sugestões de IA para um campo do wizard.
 * Lança em falha (para o chamador exibir erro inline); retorna a lista em sucesso.
 * Endpoints `/api/ai/*` retornam text/plain, uma sugestão por linha.
 */
export async function fetchSugestoes(endpoint: string, body: object): Promise<string[]> {
  const res = await fetch(`/api/ai/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error('Falha ao gerar sugestões')
  }
  const text = await res.text()
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5)
}

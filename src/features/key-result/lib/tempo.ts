/**
 * Tempo relativo em pt-BR para timestamps ("atualizado há X").
 * Função pura de módulo (fora de corpo de componente) — usa `Date.now()` sem violar regras de hooks.
 */
export function tempoRelativo(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date)
  const ms = Date.now() - d.getTime()
  if (Number.isNaN(ms)) return ''
  const min = Math.floor(ms / 60_000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const dias = Math.floor(h / 24)
  if (dias < 30) return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

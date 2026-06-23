import { z } from 'zod'

/**
 * Schemas Zod para o corpo JSON das rotas de IA (`/api/ai/*`).
 * Limites de tamanho (`.max`) reduzem o raio de prompt-injection / abuso.
 */

const CURTO = 200 // nomes de empresa, ramo
const MEDIO = 1000 // descrições, situação atual, missão, visão
const LONGO = 4000 // listas (ex.: objetivos existentes)

export const sugerirObjetivoSchema = z.object({
  empresa: z.string().max(CURTO),
  ramo: z.string().max(CURTO),
  ondeEstamos: z.string().max(MEDIO).optional(),
  objetivosExistentes: z.string().max(LONGO).optional(),
})

export const missaoSchema = z.object({
  empresa: z.string().max(CURTO).optional(),
  ramo: z.string().max(CURTO),
  descricaoNegocio: z.string().max(MEDIO),
})

export const objetivosSchema = z.object({
  empresa: z.string().max(CURTO),
  ramo: z.string().max(CURTO),
  descricaoNegocio: z.string().max(MEDIO),
  missao: z.string().max(MEDIO).optional(),
  visao: z.string().max(MEDIO).optional(),
  ondeEstamos: z.string().max(MEDIO).optional(),
})

export const visaoSchema = z.object({
  empresa: z.string().max(CURTO).optional(),
  ramo: z.string().max(CURTO),
  descricaoNegocio: z.string().max(MEDIO),
  missao: z.string().max(MEDIO).optional(),
})

export const oportunidadesSchema = z.object({
  ramo: z.string().max(CURTO),
  descricaoNegocio: z.string().max(MEDIO),
})

export const valoresSchema = z.object({
  empresa: z.string().max(CURTO).optional(),
  ramo: z.string().max(CURTO),
  descricaoNegocio: z.string().max(MEDIO),
})

export const ameacasSchema = z.object({
  ramo: z.string().max(CURTO),
  descricaoNegocio: z.string().max(MEDIO),
})

export const keyResultsSchema = z.object({
  objetivo: z.string().max(MEDIO),
  empresa: z.string().max(CURTO),
  ramo: z.string().max(CURTO),
})

import { z } from 'zod'

export const createKeyResultSchema = z.object({
  objetivoId: z.string().cuid(),
  descricao: z.string().min(3),
  tipoMetrica: z.enum(['aumentar', 'reduzir', 'simNao']).default('aumentar'),
  valorInicial: z.number().default(0),
  valorAlvo: z.number(),
  unidade: z.string().optional(),
  peso: z.number().positive().default(1),
})

export const updateKeyResultValorSchema = z.object({
  krId: z.string().cuid(),
  valor: z.number(),
  comentario: z.string().optional(),
})

export const updateKeyResultSchema = createKeyResultSchema
  .omit({ objetivoId: true })
  .partial()

export type CreateKeyResultInput = z.infer<typeof createKeyResultSchema>
export type UpdateKeyResultValorInput = z.infer<typeof updateKeyResultValorSchema>
export type UpdateKeyResultInput = z.infer<typeof updateKeyResultSchema>

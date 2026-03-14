import { z } from 'zod'

export const createObjetivoSchema = z.object({
  planoId: z.string().cuid(),
  titulo: z.string().min(3),
  descricao: z.string().optional(),
  numero: z.number().int().positive(),
  responsaveisIds: z.array(z.string().cuid()).optional(),
  objetivoVinculadoId: z.string().cuid().optional(),
})

export const updateObjetivoSchema = createObjetivoSchema
  .omit({ planoId: true })
  .partial()

export type CreateObjetivoInput = z.infer<typeof createObjetivoSchema>
export type UpdateObjetivoInput = z.infer<typeof updateObjetivoSchema>

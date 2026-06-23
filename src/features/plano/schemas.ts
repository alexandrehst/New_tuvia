import { z } from 'zod'

export const createPlanoSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date(),
  frequenciaAtualizacao: z.enum(['semanal', 'quinzenal', 'mensal']).default('mensal'),
  departamentoId: z.string().cuid().optional(),
  planoPaiId: z.string().cuid().optional(),
  planoEstrategicoId: z.string().cuid().optional(),
})

export const updatePlanoSchema = createPlanoSchema.partial()

export const createPlanoApoioSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  planoPaiId: z.string().cuid(),
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date(),
})

export type CreatePlanoInput = z.infer<typeof createPlanoSchema>
export type UpdatePlanoInput = z.infer<typeof updatePlanoSchema>
export type CreatePlanoApoioInput = z.infer<typeof createPlanoApoioSchema>

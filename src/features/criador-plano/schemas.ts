import { z } from 'zod'

export const step1EmpresaSchema = z.object({
  empresa: z.string().min(2),
  ramo: z.string().min(2),
  descricaoNegocio: z.string().min(10),
  missao: z.string().min(5),
  visao: z.string().min(5),
  valores: z.array(z.string()).min(1),
})

export const step2SwotSchema = z.object({
  oportunidades: z.array(z.string()).min(1),
  ameacas: z.array(z.string()).min(1),
  forcas: z.array(z.string()).optional().default([]),
  fraquezas: z.array(z.string()).optional().default([]),
})

export const step3DiagnosticoSchema = z.object({
  ondeEstamos: z.string().min(10),
  comecar: z.array(z.string()).min(1),
  manter: z.array(z.string()).optional().default([]),
  parar: z.array(z.string()).optional().default([]),
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date(),
})

export const criadorPlanoSchema = step1EmpresaSchema
  .merge(step2SwotSchema)
  .merge(step3DiagnosticoSchema)

export type Step1EmpresaInput = z.infer<typeof step1EmpresaSchema>
export type Step2SwotInput = z.infer<typeof step2SwotSchema>
export type Step3DiagnosticoInput = z.infer<typeof step3DiagnosticoSchema>
export type CriadorPlanoInput = z.infer<typeof criadorPlanoSchema>

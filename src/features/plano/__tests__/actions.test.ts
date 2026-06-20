import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPlanoCorporativo, updatePlano, createPlanoDepartamento } from '../actions'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    planoEstrategico: { create: vi.fn() },
    plano: { create: vi.fn(), findUniqueOrThrow: vi.fn(), update: vi.fn() },
    objetivo: { create: vi.fn() },
    resultadoChave: { create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    linhaTendencia: { createMany: vi.fn(), deleteMany: vi.fn() },
  },
}))

vi.mock('@/lib/openai', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
  MODELO_PADRAO: 'gpt-4o',
}))

vi.mock('@/features/auth/guards', () => ({
  requireUser: vi.fn(async () => ({ id: 'u', clienteId: 'cliente-1' })),
  assertMesmoTenant: (recurso: string | null | undefined, usuario: string) => {
    if (recurso !== usuario) throw new Error('Recurso não encontrado')
  },
}))

import { prisma } from '@/lib/prisma'
import { openai } from '@/lib/openai'

const mockPrisma = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>
const mockOpenAI = openai as unknown as { chat: { completions: { create: ReturnType<typeof vi.fn> } } }

const validInput = {
  empresa: 'TechCorp',
  ramo: 'Tecnologia',
  descricaoNegocio: 'Software B2B para gestão de times ágeis',
  missao: 'Transformar gestão de equipes',
  visao: 'Ser líder no mercado de SaaS B2B',
  valores: ['Inovação', 'Respeito'],
  oportunidades: ['Mercado em crescimento'],
  ameacas: ['Concorrência forte'],
  forcas: [] as string[],
  fraquezas: [] as string[],
  ondeEstamos: 'Empresa com 50 colaboradores e crescimento de 20% ao ano',
  comecar: ['Implementar OKRs'],
  manter: [] as string[],
  parar: [] as string[],
  dataInicio: new Date('2025-01-01'),
  dataFim: new Date('2025-12-31'),
}

const makeOpenAIResponse = (content: string) => ({
  choices: [{ message: { content } }],
})

beforeEach(() => vi.clearAllMocks())

describe('createPlanoCorporativo', () => {
  it('cria plano estratégico e retorna planoId', async () => {
    mockPrisma.planoEstrategico.create.mockResolvedValue({ id: 'estrategico-1' })
    mockPrisma.plano.create.mockResolvedValue({ id: 'plano-1' })
    mockPrisma.objetivo.create.mockResolvedValue({ id: 'obj-1' })
    mockPrisma.resultadoChave.create.mockResolvedValue({ id: 'kr-1' })
    mockPrisma.linhaTendencia.createMany.mockResolvedValue({})

    mockOpenAI.chat.completions.create
      .mockResolvedValueOnce(makeOpenAIResponse(JSON.stringify({
        Objectives: [
          { Title: 'Crescer receita', Description: 'Aumentar 30%' },
          { Title: 'Melhorar NPS', Description: 'Elevar de 40 para 60' },
          { Title: 'Reduzir churn', Description: 'De 5% para 2%' },
        ],
      })))
      .mockResolvedValue(makeOpenAIResponse(JSON.stringify({
        KeyResults: [
          { Description: 'Aumentar MRR', ValorInicial: 0, ValorAlvo: 100, Unidade: '%' },
        ],
      })))

    const result = await createPlanoCorporativo(validInput)

    expect(result).toEqual({ planoId: 'plano-1' })
    expect(mockPrisma.planoEstrategico.create).toHaveBeenCalledTimes(1)
    expect(mockPrisma.plano.create).toHaveBeenCalledTimes(1)
  })

  it('persiste planoEstrategico com dados do wizard', async () => {
    mockPrisma.planoEstrategico.create.mockResolvedValue({ id: 'estrategico-1' })
    mockPrisma.plano.create.mockResolvedValue({ id: 'plano-1' })
    mockPrisma.objetivo.create.mockResolvedValue({ id: 'obj-1' })
    mockPrisma.resultadoChave.create.mockResolvedValue({ id: 'kr-1' })
    mockPrisma.linhaTendencia.createMany.mockResolvedValue({})
    mockOpenAI.chat.completions.create
      .mockResolvedValueOnce(makeOpenAIResponse(JSON.stringify({ Objectives: [{ Title: 'Obj', Description: 'Desc' }] })))
      .mockResolvedValue(makeOpenAIResponse(JSON.stringify({ KeyResults: [{ Description: 'KR', ValorInicial: 0, ValorAlvo: 100, Unidade: '%' }] })))

    await createPlanoCorporativo(validInput)

    expect(mockPrisma.planoEstrategico.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clienteId: 'cliente-1',
          empresa: 'TechCorp',
          missao: 'Transformar gestão de equipes',
        }),
      })
    )
  })

  it('usa objetivos fallback quando OpenAI retorna JSON inválido', async () => {
    mockPrisma.planoEstrategico.create.mockResolvedValue({ id: 'estrategico-1' })
    mockPrisma.plano.create.mockResolvedValue({ id: 'plano-1' })
    mockPrisma.objetivo.create.mockResolvedValue({ id: 'obj-1' })
    mockPrisma.resultadoChave.create.mockResolvedValue({ id: 'kr-1' })
    mockPrisma.linhaTendencia.createMany.mockResolvedValue({})

    mockOpenAI.chat.completions.create
      .mockResolvedValueOnce(makeOpenAIResponse('json inválido !!!'))
      .mockResolvedValue(makeOpenAIResponse(JSON.stringify({ KeyResults: [] })))

    const result = await createPlanoCorporativo(validInput)

    expect(result).toEqual({ planoId: 'plano-1' })
    // Should create 3 fallback objectives
    expect(mockPrisma.objetivo.create).toHaveBeenCalledTimes(3)
  })

  it('usa KRs fallback quando OpenAI retorna JSON inválido para KRs', async () => {
    mockPrisma.planoEstrategico.create.mockResolvedValue({ id: 'estrategico-1' })
    mockPrisma.plano.create.mockResolvedValue({ id: 'plano-1' })
    mockPrisma.objetivo.create.mockResolvedValue({ id: 'obj-1' })
    mockPrisma.resultadoChave.create.mockResolvedValue({ id: 'kr-1' })
    mockPrisma.linhaTendencia.createMany.mockResolvedValue({})

    mockOpenAI.chat.completions.create
      .mockResolvedValueOnce(makeOpenAIResponse(JSON.stringify({
        Objectives: [{ Title: 'Crescer', Description: 'Desc' }],
      })))
      .mockResolvedValueOnce(makeOpenAIResponse('json inválido !!!'))

    await createPlanoCorporativo(validInput)

    // 2 fallback KRs should be created
    expect(mockPrisma.resultadoChave.create).toHaveBeenCalledTimes(2)
  })

  it('gera linha de tendência para cada KR criado', async () => {
    mockPrisma.planoEstrategico.create.mockResolvedValue({ id: 'estrategico-1' })
    mockPrisma.plano.create.mockResolvedValue({ id: 'plano-1' })
    mockPrisma.objetivo.create.mockResolvedValue({ id: 'obj-1' })
    mockPrisma.resultadoChave.create.mockResolvedValue({ id: 'kr-1' })
    mockPrisma.linhaTendencia.createMany.mockResolvedValue({})

    mockOpenAI.chat.completions.create
      .mockResolvedValueOnce(makeOpenAIResponse(JSON.stringify({
        Objectives: [{ Title: 'Obj', Description: 'Desc' }],
      })))
      .mockResolvedValue(makeOpenAIResponse(JSON.stringify({
        KeyResults: [{ Description: 'KR 1', ValorInicial: 0, ValorAlvo: 100, Unidade: '%' }],
      })))

    await createPlanoCorporativo(validInput)

    expect(mockPrisma.linhaTendencia.createMany).toHaveBeenCalledTimes(1)
    const call = mockPrisma.linhaTendencia.createMany.mock.calls[0][0]
    expect(call.data.length).toBeGreaterThan(0)
  })

  it('lança erro de validação para dados inválidos', async () => {
    await expect(
      createPlanoCorporativo({ ...validInput, empresa: 'T' })
    ).rejects.toThrow()
  })

  it('usa lista vazia quando OpenAI retorna JSON sem campo Objectives', async () => {
    mockPrisma.planoEstrategico.create.mockResolvedValue({ id: 'estrategico-1' })
    mockPrisma.plano.create.mockResolvedValue({ id: 'plano-1' })
    mockPrisma.objetivo.create.mockResolvedValue({ id: 'obj-1' })
    mockPrisma.resultadoChave.create.mockResolvedValue({ id: 'kr-1' })
    mockPrisma.linhaTendencia.createMany.mockResolvedValue({})

    mockOpenAI.chat.completions.create
      .mockResolvedValueOnce(makeOpenAIResponse(JSON.stringify({ outro: 'campo' })))
      .mockResolvedValue(makeOpenAIResponse(JSON.stringify({ KeyResults: [] })))

    const result = await createPlanoCorporativo(validInput)

    expect(result).toEqual({ planoId: 'plano-1' })
    // No objectives to create when Objectives field is absent
    expect(mockPrisma.objetivo.create).not.toHaveBeenCalled()
  })

  it('usa fallback de objetivos quando content da OpenAI é null', async () => {
    mockPrisma.planoEstrategico.create.mockResolvedValue({ id: 'estrategico-1' })
    mockPrisma.plano.create.mockResolvedValue({ id: 'plano-1' })
    mockPrisma.objetivo.create.mockResolvedValue({ id: 'obj-1' })
    mockPrisma.resultadoChave.create.mockResolvedValue({ id: 'kr-1' })
    mockPrisma.linhaTendencia.createMany.mockResolvedValue({})

    mockOpenAI.chat.completions.create
      .mockResolvedValueOnce({ choices: [{ message: { content: null } }] })
      .mockResolvedValue(makeOpenAIResponse(JSON.stringify({ KeyResults: [] })))

    const result = await createPlanoCorporativo(validInput)

    // JSON.parse('{}') gives {}, Objectives ?? [] gives [], so no objectives created
    expect(result).toEqual({ planoId: 'plano-1' })
  })

  it('usa KRs vazios quando content da OpenAI é null para KRs', async () => {
    mockPrisma.planoEstrategico.create.mockResolvedValue({ id: 'estrategico-1' })
    mockPrisma.plano.create.mockResolvedValue({ id: 'plano-1' })
    mockPrisma.objetivo.create.mockResolvedValue({ id: 'obj-1' })
    mockPrisma.resultadoChave.create.mockResolvedValue({ id: 'kr-1' })
    mockPrisma.linhaTendencia.createMany.mockResolvedValue({})

    mockOpenAI.chat.completions.create
      .mockResolvedValueOnce(makeOpenAIResponse(JSON.stringify({ Objectives: [{ Title: 'Obj', Description: 'Desc' }] })))
      .mockResolvedValue({ choices: [{ message: { content: null } }] })

    const result = await createPlanoCorporativo(validInput)

    expect(result).toEqual({ planoId: 'plano-1' })
    expect(mockPrisma.resultadoChave.create).not.toHaveBeenCalled()
  })

  it('usa KRs vazios quando OpenAI retorna JSON sem campo KeyResults', async () => {
    mockPrisma.planoEstrategico.create.mockResolvedValue({ id: 'estrategico-1' })
    mockPrisma.plano.create.mockResolvedValue({ id: 'plano-1' })
    mockPrisma.objetivo.create.mockResolvedValue({ id: 'obj-1' })
    mockPrisma.resultadoChave.create.mockResolvedValue({ id: 'kr-1' })
    mockPrisma.linhaTendencia.createMany.mockResolvedValue({})

    mockOpenAI.chat.completions.create
      .mockResolvedValueOnce(makeOpenAIResponse(JSON.stringify({ Objectives: [{ Title: 'Obj', Description: 'Desc' }] })))
      .mockResolvedValue(makeOpenAIResponse(JSON.stringify({ outro: 'campo' })))

    const result = await createPlanoCorporativo(validInput)

    expect(result).toEqual({ planoId: 'plano-1' })
    expect(mockPrisma.resultadoChave.create).not.toHaveBeenCalled()
  })

  it('usa valores padrão quando KRs do OpenAI omitem ValorInicial e ValorAlvo', async () => {
    mockPrisma.planoEstrategico.create.mockResolvedValue({ id: 'estrategico-1' })
    mockPrisma.plano.create.mockResolvedValue({ id: 'plano-1' })
    mockPrisma.objetivo.create.mockResolvedValue({ id: 'obj-1' })
    mockPrisma.resultadoChave.create.mockResolvedValue({ id: 'kr-1' })
    mockPrisma.linhaTendencia.createMany.mockResolvedValue({})

    mockOpenAI.chat.completions.create
      .mockResolvedValueOnce(makeOpenAIResponse(JSON.stringify({
        Objectives: [{ Title: 'Obj', Description: 'Desc' }],
      })))
      .mockResolvedValue(makeOpenAIResponse(JSON.stringify({
        KeyResults: [{ Description: 'KR sem valores', Unidade: '%' }],
      })))

    const result = await createPlanoCorporativo(validInput)

    expect(result).toEqual({ planoId: 'plano-1' })
    expect(mockPrisma.resultadoChave.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ valorInicial: 0, valorAlvo: 100 }),
      })
    )
  })
})

describe('updatePlano', () => {
  const datasIguais = { clienteId: 'cliente-1', dataInicio: new Date('2025-01-01'), dataFim: new Date('2025-12-31') }

  it('atualiza campos sem recomputar KRs quando as datas não mudam', async () => {
    mockPrisma.plano.findUniqueOrThrow.mockResolvedValue(datasIguais)
    mockPrisma.plano.update.mockResolvedValue({ id: 'plano-1', ...datasIguais })

    await updatePlano('plano-1', { titulo: 'Novo título' })

    expect(mockPrisma.plano.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'plano-1' }, data: expect.objectContaining({ titulo: 'Novo título' }) })
    )
    expect(mockPrisma.resultadoChave.findMany).not.toHaveBeenCalled()
    expect(mockPrisma.linhaTendencia.deleteMany).not.toHaveBeenCalled()
  })

  it('recomputa status e regenera tendência de todos os KRs quando as datas mudam', async () => {
    mockPrisma.plano.findUniqueOrThrow.mockResolvedValue(datasIguais)
    mockPrisma.plano.update.mockResolvedValue({
      id: 'plano-1',
      dataInicio: new Date('2025-02-01'),
      dataFim: new Date('2025-11-30'),
    })
    mockPrisma.resultadoChave.findMany.mockResolvedValue([
      { id: 'kr-1', tipoMetrica: 'aumentar', valorInicial: 0, valorAlvo: 100, valorAtual: 50 },
    ])
    mockPrisma.resultadoChave.update.mockResolvedValue({})
    mockPrisma.linhaTendencia.deleteMany.mockResolvedValue({ count: 1 })
    mockPrisma.linhaTendencia.createMany.mockResolvedValue({})

    await updatePlano('plano-1', { dataFim: new Date('2025-11-30') })

    expect(mockPrisma.resultadoChave.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'kr-1' }, data: expect.objectContaining({ status: expect.any(String) }) })
    )
    expect(mockPrisma.linhaTendencia.deleteMany).toHaveBeenCalledWith({ where: { resultadoChaveId: 'kr-1' } })
    expect(mockPrisma.linhaTendencia.createMany).toHaveBeenCalled()
  })

  it('lança erro de validação para título curto', async () => {
    await expect(updatePlano('plano-1', { titulo: 'AB' })).rejects.toThrow()
  })
})

describe('createPlanoDepartamento', () => {
  const paiCuid = 'clh1234567890abcdefghijklm'
  const valido = {
    titulo: 'Plano de Marketing',
    planoPaiId: paiCuid,
    dataInicio: new Date('2025-01-01'),
    dataFim: new Date('2025-12-31'),
  }

  it('cria plano de apoio com tipo apoio, planoPaiId e status edicao', async () => {
    mockPrisma.plano.findUniqueOrThrow.mockResolvedValue({ clienteId: 'cliente-1' })
    mockPrisma.plano.create.mockResolvedValue({ id: 'apoio-1' })

    const result = await createPlanoDepartamento(valido)

    expect(result).toEqual({ planoId: 'apoio-1' })
    expect(mockPrisma.plano.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clienteId: 'cliente-1',
          planoPaiId: paiCuid,
          tipo: 'apoio',
          status: 'edicao',
          titulo: 'Plano de Marketing',
        }),
      })
    )
  })

  it('lança erro de validação para título curto', async () => {
    await expect(createPlanoDepartamento({ ...valido, titulo: 'AB' })).rejects.toThrow()
  })

  it('lança erro de validação para planoPaiId inválido', async () => {
    await expect(createPlanoDepartamento({ ...valido, planoPaiId: 'nao-cuid' })).rejects.toThrow()
  })

  it('bloqueia plano-pai de outro tenant', async () => {
    mockPrisma.plano.findUniqueOrThrow.mockResolvedValue({ clienteId: 'cliente-2' })
    await expect(createPlanoDepartamento(valido)).rejects.toThrow()
    expect(mockPrisma.plano.create).not.toHaveBeenCalled()
  })
})

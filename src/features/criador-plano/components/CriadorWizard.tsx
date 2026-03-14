'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPlanoCorporativo } from '@/features/plano/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Step1Data = {
  empresa: string
  ramo: string
  descricaoNegocio: string
  missao: string
  visao: string
  valores: string[]
}

type Step2Data = {
  oportunidades: string[]
  ameacas: string[]
  forcas: string[]
  fraquezas: string[]
}

type Step3Data = {
  ondeEstamos: string
  comecar: string[]
  manter: string[]
  parar: string[]
  dataInicio: string
  dataFim: string
}

const initialStep1: Step1Data = {
  empresa: '',
  ramo: '',
  descricaoNegocio: '',
  missao: '',
  visao: '',
  valores: [],
}

const initialStep2: Step2Data = {
  oportunidades: [],
  ameacas: [],
  forcas: [],
  fraquezas: [],
}

const initialStep3: Step3Data = {
  ondeEstamos: '',
  comecar: [],
  manter: [],
  parar: [],
  dataInicio: '',
  dataFim: '',
}

interface CriadorWizardProps {
  clienteId: string
}

export function CriadorWizard({ clienteId }: CriadorWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [step1, setStep1] = useState<Step1Data>(initialStep1)
  const [step2, setStep2] = useState<Step2Data>(initialStep2)
  const [step3, setStep3] = useState<Step3Data>(initialStep3)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sugestoesMissao, setSugestoesMissao] = useState<string[]>([])
  const [loadingSugestoes, setLoadingSugestoes] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch mission suggestions when empresa, ramo, descricaoNegocio are filled
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (
      step === 1 &&
      step1.empresa.length >= 2 &&
      step1.ramo.length >= 2 &&
      step1.descricaoNegocio.length >= 10 &&
      !hasFetchedRef.current
    ) {
      hasFetchedRef.current = true
      fetchSugestoesMissao()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step1.empresa, step1.ramo, step1.descricaoNegocio])

  async function fetchSugestoesMissao() {
    setLoadingSugestoes(true)
    setSugestoesMissao([])

    try {
      const res = await fetch('/api/ai/missao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ramo: step1.ramo,
          descricaoNegocio: step1.descricaoNegocio,
          empresa: step1.empresa,
        }),
      })

      if (!res.ok || !res.body) return

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
      }

      // Parse lines — each line is a suggestion
      const suggestions = buffer
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 5)

      setSugestoesMissao(suggestions)
    } catch {
      // Non-fatal
    } finally {
      setLoadingSugestoes(false)
    }
  }

  function validateStep1() {
    const errs: Record<string, string> = {}
    if (!step1.empresa) errs.empresa = 'Informe o nome da empresa'
    if (!step1.ramo) errs.ramo = 'Informe o ramo de atuação'
    if (!step1.descricaoNegocio) errs.descricaoNegocio = 'Informe a descrição do negócio'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return
    if (step < 3) setStep((s) => (s + 1) as 1 | 2 | 3)
  }

  function handleBack() {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3)
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      const result = await createPlanoCorporativo(clienteId, {
        ...step1,
        ...step2,
        ondeEstamos: step3.ondeEstamos,
        comecar: step3.comecar.length > 0 ? step3.comecar : ['Iniciar'],
        manter: step3.manter,
        parar: step3.parar,
        dataInicio: new Date(step3.dataInicio),
        dataFim: new Date(step3.dataFim),
        missao: step1.missao || 'Missão a definir',
        visao: step1.visao || 'Visão a definir',
        valores: step1.valores.length > 0 ? step1.valores : ['Excelência'],
        oportunidades: step2.oportunidades.length > 0 ? step2.oportunidades : ['Crescimento'],
        ameacas: step2.ameacas.length > 0 ? step2.ameacas : ['Concorrência'],
      })
      router.push(`/planos/${result.planoId}`)
    } catch {
      setErrors({ submit: 'Erro ao criar plano. Tente novamente.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step === n ? 'bg-blue-600 text-white' : step > n ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {n}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div data-testid="step-1" className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Empresa e Identidade</h2>

          <div>
            <Label htmlFor="empresa">Empresa</Label>
            <Input
              id="empresa"
              value={step1.empresa}
              onChange={(e) => {
                setStep1((p) => ({ ...p, empresa: e.target.value }))
                hasFetchedRef.current = false
              }}
            />
            {errors.empresa && <p className="text-red-600 text-sm mt-1">{errors.empresa}</p>}
          </div>

          <div>
            <Label htmlFor="ramo">Ramo de atuação</Label>
            <Input
              id="ramo"
              value={step1.ramo}
              onChange={(e) => {
                setStep1((p) => ({ ...p, ramo: e.target.value }))
                hasFetchedRef.current = false
              }}
            />
            {errors.ramo && <p className="text-red-600 text-sm mt-1">{errors.ramo}</p>}
          </div>

          <div>
            <Label htmlFor="descricaoNegocio">Descrição do negócio</Label>
            <Input
              id="descricaoNegocio"
              value={step1.descricaoNegocio}
              onChange={(e) => {
                setStep1((p) => ({ ...p, descricaoNegocio: e.target.value }))
                hasFetchedRef.current = false
              }}
            />
            {errors.descricaoNegocio && <p className="text-red-600 text-sm mt-1">{errors.descricaoNegocio}</p>}
          </div>

          {loadingSugestoes && (
            <p className="text-sm text-gray-500">Gerando sugestões de missão...</p>
          )}

          {sugestoesMissao.length > 0 && (
            <div data-testid="sugestoes-missao" className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Sugestões de missão:</p>
              {sugestoesMissao.map((s, i) => (
                <div
                  key={i}
                  data-testid="sugestao-missao-item"
                  className="p-3 rounded-md border border-blue-200 bg-blue-50 text-sm cursor-pointer hover:bg-blue-100"
                  onClick={() => setStep1((p) => ({ ...p, missao: s }))}
                >
                  {s}
                </div>
              ))}
            </div>
          )}

          {step1.missao && (
            <div>
              <Label htmlFor="missao">Missão selecionada</Label>
              <Input
                id="missao"
                value={step1.missao}
                onChange={(e) => setStep1((p) => ({ ...p, missao: e.target.value }))}
              />
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div data-testid="step-2" className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Análise SWOT</h2>

          <div>
            <Label htmlFor="oportunidades">Oportunidades (uma por linha)</Label>
            <textarea
              id="oportunidades"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              value={step2.oportunidades.join('\n')}
              onChange={(e) => setStep2((p) => ({ ...p, oportunidades: e.target.value.split('\n').filter(Boolean) }))}
            />
          </div>

          <div>
            <Label htmlFor="ameacas">Ameaças (uma por linha)</Label>
            <textarea
              id="ameacas"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              value={step2.ameacas.join('\n')}
              onChange={(e) => setStep2((p) => ({ ...p, ameacas: e.target.value.split('\n').filter(Boolean) }))}
            />
          </div>

          <div>
            <Label htmlFor="forcas">Forças (uma por linha)</Label>
            <textarea
              id="forcas"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              value={step2.forcas.join('\n')}
              onChange={(e) => setStep2((p) => ({ ...p, forcas: e.target.value.split('\n').filter(Boolean) }))}
            />
          </div>

          <div>
            <Label htmlFor="fraquezas">Fraquezas (uma por linha)</Label>
            <textarea
              id="fraquezas"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              value={step2.fraquezas.join('\n')}
              onChange={(e) => setStep2((p) => ({ ...p, fraquezas: e.target.value.split('\n').filter(Boolean) }))}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div data-testid="step-3" className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Diagnóstico e Datas</h2>

          <div>
            <Label htmlFor="ondeEstamos">Onde estamos</Label>
            <textarea
              id="ondeEstamos"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={4}
              value={step3.ondeEstamos}
              onChange={(e) => setStep3((p) => ({ ...p, ondeEstamos: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="comecar">O que começar (uma por linha)</Label>
            <textarea
              id="comecar"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              value={step3.comecar.join('\n')}
              onChange={(e) => setStep3((p) => ({ ...p, comecar: e.target.value.split('\n').filter(Boolean) }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dataInicio">Data início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={step3.dataInicio}
                onChange={(e) => setStep3((p) => ({ ...p, dataInicio: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="dataFim">Data fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={step3.dataFim}
                onChange={(e) => setStep3((p) => ({ ...p, dataFim: e.target.value }))}
              />
            </div>
          </div>

          {errors.submit && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{errors.submit}</div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
        >
          Voltar
        </Button>

        {step < 3 ? (
          <Button type="button" onClick={handleNext}>
            Próximo
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Criando plano...' : 'Criar plano'}
          </Button>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

import { createPlanoCorporativo } from '@/features/plano/actions'
import { fetchSugestoes } from '@/features/criador-plano/lib/sugestoes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// ─── Types ───────────────────────────────────────────────────────────────────

type WizardData = {
  empresa: string
  ramo: string
  descricaoNegocio: string
  visao: string
  missao: string
  valores: string[]
  comecar: string[]
  manter: string[]
  parar: string[]
  ondeEstamos: string
  oportunidades: string[]
  ameacas: string[]
  dataInicio: string
  dataFim: string
}

const initial: WizardData = {
  empresa: '', ramo: '', descricaoNegocio: '',
  visao: '', missao: '',
  valores: [], comecar: [], manter: [], parar: [],
  ondeEstamos: '',
  oportunidades: [], ameacas: [],
  dataInicio: '', dataFim: '',
}

const STEPS = [
  'Descrição da empresa',
  'Visão',
  'Missão',
  'Valores',
  'O que devemos começar a fazer?',
  'O que precisamos manter?',
  'O que precisamos parar de fazer?',
  'Onde estamos hoje',
  'Oportunidades',
  'Ameaças',
  'Datas do plano',
]

// ─── Reusable sub-components ─────────────────────────────────────────────────

function SuggestButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={loading} className="gap-1.5">
      <Sparkles className="size-3.5" />
      {loading ? 'Gerando…' : 'Sugerir'}
    </Button>
  )
}

function ListInput({ items, onChange, placeholder }: {
  items: string[]; onChange: (v: string[]) => void; placeholder?: string
}) {
  const [input, setInput] = useState('')
  const add = () => {
    if (!input.trim()) return
    onChange([...items, input.trim()])
    setInput('')
  }
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
          <span className="flex-1 text-sm text-foreground">{item}</span>
          <button
            type="button"
            aria-label={`Remover ${item}`}
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="text-muted-foreground transition-colors hover:text-destructive"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder ?? 'Adicionar item…'}
        />
        <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1.5 shrink-0">
          <Plus className="size-3.5" /> Adicionar
        </Button>
      </div>
    </div>
  )
}

function Suggestions({ items, onPick, testIdPrefix }: {
  items: string[]; onPick: (s: string) => void; testIdPrefix?: string
}) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">Nenhuma sugestão gerada; escreva manualmente.</p>
  }
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">Sugestões — clique para usar:</p>
      {items.map((s, i) => (
        <button
          key={i}
          type="button"
          data-testid={testIdPrefix ? `${testIdPrefix}-item` : undefined}
          onClick={() => onPick(s)}
          className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {s}
        </button>
      ))}
    </div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function CriadorWizard() {
  const router = useRouter()
  const [active, setActive] = useState(0)
  const [data, setData] = useState<WizardData>(initial)
  const [loadingAI, setLoadingAI] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({})
  const [erros, setErros] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const set = (key: keyof WizardData, value: unknown) =>
    setData(prev => ({ ...prev, [key]: value }))

  const suggest = async (key: string, endpoint: string, body: object) => {
    setLoadingAI(key)
    setErros(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    try {
      const results = await fetchSugestoes(endpoint, body)
      setSuggestions(prev => ({ ...prev, [key]: results }))
    } catch {
      setErros(prev => ({ ...prev, [key]: 'Não foi possível gerar sugestões. Escreva manualmente.' }))
    } finally {
      setLoadingAI(null)
    }
  }

  // Footer de campo assistido: erro inline + lista de sugestões (pick explícito)
  const assistedExtras = (key: string, onPick: (s: string) => void, testIdPrefix?: string) => (
    <>
      {erros[key] && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erros[key]}
        </p>
      )}
      {suggestions[key] && <Suggestions items={suggestions[key]} onPick={onPick} testIdPrefix={testIdPrefix} />}
    </>
  )

  const appendUnico = (key: keyof WizardData, atual: string[], valor: string) => {
    if (!atual.includes(valor)) set(key, [...atual, valor])
  }

  const next = () => setActive(s => Math.min(s + 1, STEPS.length - 1))
  const back = () => setActive(s => Math.max(s - 1, 0))

  const isFirst = active === 0
  const isLast = active === STEPS.length - 1
  const nextDisabled = active === 0 && (!data.empresa || !data.ramo)

  const handleGenerate = async () => {
    setStatus('loading')
    try {
      const result = await createPlanoCorporativo({
        empresa: data.empresa,
        ramo: data.ramo,
        descricaoNegocio: data.descricaoNegocio || data.empresa,
        visao: data.visao || 'Visão a definir',
        missao: data.missao || 'Missão a definir',
        valores: data.valores.length > 0 ? data.valores : ['Excelência'],
        comecar: data.comecar.length > 0 ? data.comecar : ['Iniciar planejamento'],
        manter: data.manter,
        parar: data.parar,
        ondeEstamos: data.ondeEstamos || 'Em fase inicial',
        oportunidades: data.oportunidades.length > 0 ? data.oportunidades : ['Crescimento'],
        ameacas: data.ameacas.length > 0 ? data.ameacas : ['Concorrência'],
        forcas: [],
        fraquezas: [],
        dataInicio: new Date(data.dataInicio || new Date()),
        dataFim: new Date(data.dataFim || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
      })
      setStatus('done')
      setTimeout(() => router.push(`/planos/${result.planoId}`), 1500)
    } catch {
      setStatus('error')
    }
  }

  // ── Loading / done / error states ──────────────────────────────────────────

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-24" aria-live="polite">
        <Loader2 className="mb-6 size-12 animate-spin text-primary" />
        <p className="mb-1 text-lg font-semibold text-foreground">Gerando seu plano…</p>
        <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos</p>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="flex flex-col items-center justify-center py-24" aria-live="polite">
        <CheckCircle2 className="mb-6 size-14 text-status-no-prazo" />
        <p className="text-lg font-semibold text-foreground">Plano criado com sucesso!</p>
        <p className="mt-1 text-sm text-muted-foreground">Redirecionando…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-24" aria-live="assertive">
        <AlertCircle className="mb-6 size-14 text-destructive" />
        <p className="mb-1 text-lg font-semibold text-foreground">Ops… algo deu errado</p>
        <p className="mb-6 text-sm text-muted-foreground">Tente novamente</p>
        <Button onClick={() => setStatus('idle')}>Tentar novamente</Button>
      </div>
    )
  }

  // ── Step content ───────────────────────────────────────────────────────────

  const stepContent = (index: number) => {
    switch (index) {
      case 0: return (
        <div className="flex flex-col gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="w-empresa">Nome da empresa</Label>
            <Input id="w-empresa" value={data.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Ex: Acme Corp" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="w-ramo">Ramo de atuação</Label>
            <Input id="w-ramo" value={data.ramo} onChange={e => set('ramo', e.target.value)} placeholder="Ex: Tecnologia B2B" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="w-descricao">Descrição do negócio</Label>
            <Textarea id="w-descricao" rows={3} value={data.descricaoNegocio} onChange={e => set('descricaoNegocio', e.target.value)} placeholder="O que a empresa faz?" />
          </div>
        </div>
      )

      case 1: return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="w-visao">Visão da empresa</Label>
            <SuggestButton
              loading={loadingAI === 'visao'}
              onClick={() => suggest('visao', 'visao', { empresa: data.empresa, ramo: data.ramo, descricaoNegocio: data.descricaoNegocio })}
            />
          </div>
          <Textarea id="w-visao" rows={3} value={data.visao} onChange={e => set('visao', e.target.value)} placeholder="Onde a empresa quer chegar?" />
          {assistedExtras('visao', s => set('visao', s))}
        </div>
      )

      case 2: return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="w-missao">Missão da empresa</Label>
            <SuggestButton
              loading={loadingAI === 'missao'}
              onClick={() => suggest('missao', 'missao', { empresa: data.empresa, ramo: data.ramo, descricaoNegocio: data.descricaoNegocio })}
            />
          </div>
          <Textarea id="w-missao" rows={4} value={data.missao} onChange={e => set('missao', e.target.value)} placeholder="Por que a empresa existe?" />
          {assistedExtras('missao', s => set('missao', s), 'sugestao-missao')}
        </div>
      )

      case 3: return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label>Valores organizacionais</Label>
            <SuggestButton
              loading={loadingAI === 'valores'}
              onClick={() => suggest('valores', 'valores', { empresa: data.empresa, ramo: data.ramo, descricaoNegocio: data.descricaoNegocio })}
            />
          </div>
          <ListInput items={data.valores} onChange={v => set('valores', v)} placeholder="Ex: Inovação" />
          {assistedExtras('valores', s => appendUnico('valores', data.valores, s))}
        </div>
      )

      case 4: return (
        <div className="flex flex-col gap-3">
          <Label>O que devemos começar a fazer?</Label>
          <ListInput items={data.comecar} onChange={v => set('comecar', v)} placeholder="Ex: Investir em marketing digital" />
        </div>
      )

      case 5: return (
        <div className="flex flex-col gap-3">
          <Label>O que precisamos manter?</Label>
          <ListInput items={data.manter} onChange={v => set('manter', v)} placeholder="Ex: Qualidade no atendimento" />
        </div>
      )

      case 6: return (
        <div className="flex flex-col gap-3">
          <Label>O que precisamos parar de fazer?</Label>
          <ListInput items={data.parar} onChange={v => set('parar', v)} placeholder="Ex: Processos manuais" />
        </div>
      )

      case 7: return (
        <div className="flex flex-col gap-3">
          <Label htmlFor="w-onde">Onde estamos hoje</Label>
          <Textarea id="w-onde" rows={4} value={data.ondeEstamos} onChange={e => set('ondeEstamos', e.target.value)} placeholder="Descreva a situação atual da empresa…" />
        </div>
      )

      case 8: return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label>Oportunidades</Label>
            <SuggestButton
              loading={loadingAI === 'oportunidades'}
              onClick={() => suggest('oportunidades', 'oportunidades', { ramo: data.ramo, descricaoNegocio: data.descricaoNegocio })}
            />
          </div>
          <ListInput items={data.oportunidades} onChange={v => set('oportunidades', v)} placeholder="Ex: Expansão para novos mercados" />
          {assistedExtras('oportunidades', s => appendUnico('oportunidades', data.oportunidades, s))}
        </div>
      )

      case 9: return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label>Ameaças</Label>
            <SuggestButton
              loading={loadingAI === 'ameacas'}
              onClick={() => suggest('ameacas', 'ameacas', { ramo: data.ramo, descricaoNegocio: data.descricaoNegocio })}
            />
          </div>
          <ListInput items={data.ameacas} onChange={v => set('ameacas', v)} placeholder="Ex: Aumento da concorrência" />
          {assistedExtras('ameacas', s => appendUnico('ameacas', data.ameacas, s))}
        </div>
      )

      case 10: return (
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="w-inicio">Data início</Label>
            <Input id="w-inicio" type="date" value={data.dataInicio} onChange={e => set('dataInicio', e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="w-fim">Data fim</Label>
            <Input id="w-fim" type="date" value={data.dataFim} onChange={e => set('dataFim', e.target.value)} />
          </div>
        </div>
      )

      default: return null
    }
  }

  // ── Main wizard ────────────────────────────────────────────────────────────

  const pct = Math.round(((active + 1) / STEPS.length) * 100)

  return (
    <div className="mx-auto max-w-xl">
      {/* Progresso */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Passo {active + 1} de {STEPS.length}
          </span>
          <span className="text-xs text-muted-foreground">{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Anúncio do passo para leitores de tela */}
      <div aria-live="polite" className="sr-only">
        Passo {active + 1} de {STEPS.length}: {STEPS[active]}
      </div>

      {/* Cartão do passo */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">{STEPS[active]}</h2>
        {stepContent(active)}

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <Button type="button" variant="outline" size="sm" onClick={back} disabled={isFirst} className="gap-1.5">
            <ChevronLeft className="size-4" /> Voltar
          </Button>
          {!isLast && (
            <Button type="button" size="sm" onClick={next} disabled={nextDisabled} className="gap-1.5">
              Próximo <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Geração — no último passo */}
      {isLast && (
        <div className="mt-6 rounded-xl border border-border bg-card p-6 text-center">
          <p className="mb-1 text-sm font-medium text-foreground">Tudo pronto para a geração do plano estratégico</p>
          <p className="mb-5 text-xs text-muted-foreground">
            A IA vai criar os objetivos e resultados-chave com base nas suas respostas
          </p>
          <Button onClick={handleGenerate} className="gap-2">
            <Check className="size-4" /> Gerar plano
          </Button>
        </div>
      )}
    </div>
  )
}

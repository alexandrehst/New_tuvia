'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPlanoCorporativo } from '@/features/plano/actions'

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

// ─── Step definitions ─────────────────────────────────────────────────────────

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

// ─── AI fetch helper ──────────────────────────────────────────────────────────

async function fetchAI(endpoint: string, body: object): Promise<string[]> {
  const res = await fetch(`/api/ai/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok || !res.body) return []
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
  }
  return buffer.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 5)
}

// ─── Reusable sub-components ─────────────────────────────────────────────────

function StepHeader({ title, index, active, done, onClick }: {
  title: string; index: number; active: boolean; done: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors rounded-lg"
      style={{
        background: active ? 'white' : 'transparent',
        border: active ? '1px solid var(--border)' : '1px solid transparent',
        color: active ? 'var(--text-primary)' : done ? 'var(--text-secondary)' : 'var(--text-muted)',
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
          style={{
            background: done ? 'var(--teal)' : active ? 'var(--navy)' : '#e5e7eb',
            color: done || active ? 'white' : 'var(--text-muted)',
          }}
        >
          {done ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          ) : index + 1}
        </span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        style={{ transform: active ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
      >
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  )
}

function SuggestButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
      style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
      {loading ? 'Gerando...' : 'Sugerir'}
    </button>
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
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#f9fafb', border: '1px solid var(--border)' }}>
          <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{item}</span>
          <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder ?? 'Adicionar item...'}
          className="flex-1 px-3 py-2 text-sm rounded-lg outline-none"
          style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
        <button
          type="button" onClick={add}
          className="px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#f3f4f6', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          + Adicionar
        </button>
      </div>
    </div>
  )
}

function NavButtons({ onBack, onNext, isFirst, isLast, disabled }: {
  onBack: () => void; onNext: () => void; isFirst: boolean; isLast: boolean; disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
      <button
        type="button" onClick={onBack} disabled={isFirst}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-30 transition-colors hover:bg-gray-100"
        style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        Voltar
      </button>
      {!isLast && (
        <button
          type="button" onClick={onNext} disabled={disabled}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ background: 'var(--teal)' }}
        >
          Próximo
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      )}
    </div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function CriadorWizard({ clienteId }: { clienteId: string }) {
  const router = useRouter()
  const [active, setActive] = useState(0)
  const [data, setData] = useState<WizardData>(initial)
  const [loadingAI, setLoadingAI] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const set = (key: keyof WizardData, value: unknown) =>
    setData(prev => ({ ...prev, [key]: value }))

  const suggest = async (key: string, endpoint: string, body: object) => {
    setLoadingAI(key)
    const results = await fetchAI(endpoint, body)
    setSuggestions(prev => ({ ...prev, [key]: results }))
    setLoadingAI(null)
  }

  const go = (i: number) => setActive(i)
  const next = () => setActive(s => Math.min(s + 1, STEPS.length - 1))
  const back = () => setActive(s => Math.max(s - 1, 0))

  const handleGenerate = async () => {
    setStatus('loading')
    try {
      const result = await createPlanoCorporativo(clienteId, {
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

  const fieldStyle = {
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
  }

  const stepContent = (index: number) => {
    switch (index) {
      case 0: return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nome da empresa</label>
            <input style={fieldStyle} value={data.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Ex: Acme Corp" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Ramo de atuação</label>
            <input style={fieldStyle} value={data.ramo} onChange={e => set('ramo', e.target.value)} placeholder="Ex: Tecnologia B2B" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Descrição do negócio</label>
            <textarea rows={3} style={{ ...fieldStyle, resize: 'none' }} value={data.descricaoNegocio} onChange={e => set('descricaoNegocio', e.target.value)} placeholder="O que a empresa faz?" />
          </div>
          <NavButtons onBack={back} onNext={next} isFirst={true} isLast={false} disabled={!data.empresa || !data.ramo} />
        </div>
      )

      case 1: return (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Visão da empresa</label>
            <SuggestButton
              loading={loadingAI === 'visao'}
              onClick={() => suggest('visao', 'visao', { empresa: data.empresa, ramo: data.ramo, descricaoNegocio: data.descricaoNegocio })}
            />
          </div>
          <textarea rows={3} style={{ ...fieldStyle, resize: 'none' }} value={data.visao} onChange={e => set('visao', e.target.value)} placeholder="Onde a empresa quer chegar?" />
          {suggestions.visao && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Sugestões — clique para usar:</p>
              {suggestions.visao.map((s, i) => (
                <button key={i} onClick={() => set('visao', s)} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <NavButtons onBack={back} onNext={next} isFirst={false} isLast={false} />
        </div>
      )

      case 2: return (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Missão da empresa</label>
            <SuggestButton
              loading={loadingAI === 'missao'}
              onClick={() => suggest('missao', 'missao', { empresa: data.empresa, ramo: data.ramo, descricaoNegocio: data.descricaoNegocio })}
            />
          </div>
          <textarea rows={4} style={{ ...fieldStyle, resize: 'none' }} value={data.missao} onChange={e => set('missao', e.target.value)} placeholder="Por que a empresa existe?" />
          {suggestions.missao && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Sugestões — clique para usar:</p>
              {suggestions.missao.map((s, i) => (
                <button key={i} data-testid="sugestao-missao-item" onClick={() => set('missao', s)} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <NavButtons onBack={back} onNext={next} isFirst={false} isLast={false} />
        </div>
      )

      case 3: return (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Valores organizacionais</label>
            <SuggestButton
              loading={loadingAI === 'valores'}
              onClick={async () => {
                const res = await fetchAI('valores', { empresa: data.empresa, ramo: data.ramo, descricaoNegocio: data.descricaoNegocio })
                set('valores', [...data.valores, ...res.filter(r => !data.valores.includes(r))])
              }}
            />
          </div>
          <ListInput items={data.valores} onChange={v => set('valores', v)} placeholder="Ex: Inovação" />
          <NavButtons onBack={back} onNext={next} isFirst={false} isLast={false} />
        </div>
      )

      case 4: return (
        <div className="space-y-3">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>O que devemos começar a fazer?</label>
          <ListInput items={data.comecar} onChange={v => set('comecar', v)} placeholder="Ex: Investir em marketing digital" />
          <NavButtons onBack={back} onNext={next} isFirst={false} isLast={false} />
        </div>
      )

      case 5: return (
        <div className="space-y-3">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>O que precisamos manter?</label>
          <ListInput items={data.manter} onChange={v => set('manter', v)} placeholder="Ex: Qualidade no atendimento" />
          <NavButtons onBack={back} onNext={next} isFirst={false} isLast={false} />
        </div>
      )

      case 6: return (
        <div className="space-y-3">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>O que precisamos parar de fazer?</label>
          <ListInput items={data.parar} onChange={v => set('parar', v)} placeholder="Ex: Processos manuais" />
          <NavButtons onBack={back} onNext={next} isFirst={false} isLast={false} />
        </div>
      )

      case 7: return (
        <div className="space-y-3">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Onde estamos hoje</label>
          <textarea rows={4} style={{ ...fieldStyle, resize: 'none' }} value={data.ondeEstamos} onChange={e => set('ondeEstamos', e.target.value)} placeholder="Descreva a situação atual da empresa..." />
          <NavButtons onBack={back} onNext={next} isFirst={false} isLast={false} />
        </div>
      )

      case 8: return (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Oportunidades</label>
            <SuggestButton
              loading={loadingAI === 'oportunidades'}
              onClick={async () => {
                const res = await fetchAI('oportunidades', { ramo: data.ramo, descricaoNegocio: data.descricaoNegocio })
                set('oportunidades', [...data.oportunidades, ...res.filter(r => !data.oportunidades.includes(r))])
              }}
            />
          </div>
          <ListInput items={data.oportunidades} onChange={v => set('oportunidades', v)} placeholder="Ex: Expansão para novos mercados" />
          <NavButtons onBack={back} onNext={next} isFirst={false} isLast={false} />
        </div>
      )

      case 9: return (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Ameaças</label>
            <SuggestButton
              loading={loadingAI === 'ameacas'}
              onClick={async () => {
                const res = await fetchAI('ameacas', { ramo: data.ramo, descricaoNegocio: data.descricaoNegocio })
                set('ameacas', [...data.ameacas, ...res.filter(r => !data.ameacas.includes(r))])
              }}
            />
          </div>
          <ListInput items={data.ameacas} onChange={v => set('ameacas', v)} placeholder="Ex: Aumento da concorrência" />
          <NavButtons onBack={back} onNext={next} isFirst={false} isLast={false} />
        </div>
      )

      case 10: return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Data início</label>
              <input type="date" style={fieldStyle} value={data.dataInicio} onChange={e => set('dataInicio', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Data fim</label>
              <input type="date" style={fieldStyle} value={data.dataFim} onChange={e => set('dataFim', e.target.value)} />
            </div>
          </div>
          <NavButtons onBack={back} onNext={next} isFirst={false} isLast={true} />
        </div>
      )

      default: return null
    }
  }

  // ── Loading / done / error states ──────────────────────────────────────────

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin mb-6" style={{ borderColor: 'var(--teal)', borderTopColor: 'transparent' }} />
        <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Gerando seu plano...</p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Isso pode levar alguns segundos</p>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: '#d1fae5' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Plano criado com sucesso!</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Redirecionando...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: '#fee2e2' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </div>
        <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Ops... algo deu errado</p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Tente novamente</p>
        <button onClick={() => setStatus('idle')} className="px-5 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--teal)' }}>
          Tentar novamente
        </button>
      </div>
    )
  }

  // ── Main wizard ────────────────────────────────────────────────────────────

  const allDone = active >= STEPS.length

  return (
    <div className="max-w-xl mx-auto">

      {/* Step list */}
      <div className="space-y-1 mb-2">
        {STEPS.map((title, i) => (
          <div key={i} className="rounded-xl overflow-hidden" style={{ border: active === i ? '1px solid var(--border)' : '1px solid transparent' }}>
            <StepHeader
              title={title}
              index={i}
              active={active === i}
              done={i < active}
              onClick={() => go(i)}
            />
            {active === i && (
              <div className="px-4 pb-4 pt-2 bg-white rounded-b-xl">
                {stepContent(i)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Generate button — shown after last step */}
      {active >= STEPS.length - 1 && (
        <div className="mt-6 rounded-xl p-6 text-center" style={{ background: 'white', border: '1px solid var(--border)' }}>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tudo pronto para a geração do plano estratégico</p>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            A IA vai criar os objetivos e resultados-chave com base nas suas respostas
          </p>
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: 'var(--teal)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Gerar plano
          </button>
        </div>
      )}
    </div>
  )
}

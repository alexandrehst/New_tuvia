import Link from "next/link"
import { LineChart, Sparkles, Users, ArrowRight, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CurrentYear } from "@/components/current-year"

const BENEFICIOS = [
  {
    icon: LineChart,
    titulo: "Acompanhamento em tempo real",
    texto: "Progresso ponderado, status de risco e linha de tendência de cada resultado-chave numa única tela.",
  },
  {
    icon: Sparkles,
    titulo: "Planejamento guiado por IA",
    texto: "Um wizard em passos sugere missão, visão, SWOT e objetivos — você edita e mantém o controle.",
  },
  {
    icon: Users,
    titulo: "Visibilidade por toda a empresa",
    texto: "Planos corporativos e de apoio, papéis por plano e notificações por e-mail para os responsáveis.",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">O</span>
          <span className="text-lg font-semibold tracking-tight">OKR</span>
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link href="/login" />}>Entrar</Button>
          <Button size="sm" render={<Link href="/cadastro" />}>Comece agora</Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="bg-brand-tint/40">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              Gestão de OKRs
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              OKRs que a sua equipe realmente acompanha
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              Do planejamento estratégico ao resultado do dia a dia — crie, acompanhe e ajuste os objetivos da empresa num só lugar.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="gap-2" render={<Link href="/cadastro" />}>
                Comece agora <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/login" />}>
                Entrar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Sem cartão de crédito. Configure seu primeiro plano em minutos.</p>
          </div>

          {/* Preview estilizado do painel (mock em tokens) */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-3 w-28 rounded bg-muted" />
              <span className="rounded-full bg-status-no-prazo-bg px-2 py-0.5 text-xs font-medium text-status-no-prazo">No prazo</span>
            </div>
            <div className="flex flex-col gap-3">
              {[72, 45, 90].map((pct, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="h-2.5 w-32 rounded bg-muted" />
                    <span className="text-metric text-sm font-semibold text-foreground">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Tudo para operar a estratégia</h2>
          <p className="mt-3 text-muted-foreground">Do topo da empresa até cada resultado-chave, com clareza e sem planilhas.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {BENEFICIOS.map((b) => (
            <div key={b.titulo} className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <b.icon className="size-5" />
              </div>
              <h3 className="mb-2 text-base font-semibold">{b.titulo}</h3>
              <p className="text-sm text-muted-foreground">{b.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prova / faixa */}
      <section className="bg-brand-tint/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-16 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-foreground">
            {["Planos corporativos e de apoio", "Risco e tendência automáticos", "Notificações por e-mail"].map((p) => (
              <span key={p} className="flex items-center gap-1.5">
                <Check className="size-4 text-primary" /> {p}
              </span>
            ))}
          </div>
          <h2 className="max-w-xl text-2xl font-bold tracking-tight">
            A credibilidade se decide no painel. Veja o seu em minutos.
          </h2>
          <Button size="lg" className="gap-2" render={<Link href="/cadastro" />}>
            Comece agora <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">O</span>
            <span className="font-medium text-foreground">OKR</span>
          </div>
          <p>© <CurrentYear /> OKR. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

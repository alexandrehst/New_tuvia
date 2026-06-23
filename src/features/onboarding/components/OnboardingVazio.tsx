import Link from 'next/link'
import { Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Estado de boas-vindas do primeiro acesso (onboarding).
 *
 * É a camada de orientação sobre o estado vazio de `/planos` (AC-3): mesma tela,
 * copy de boas-vindas reforçado quando o tenant ainda não tem nenhum plano. O CTA
 * conduz ao wizard `/criador` (Epic 3). Server Component sem estado.
 */
export function OnboardingVazio({ nome }: { nome: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <Rocket className="size-8 text-primary" />
      </div>
      <div>
        <p className="text-lg font-semibold text-foreground mb-1">
          Bem-vindo(a), {nome}! Vamos começar?
        </p>
        <p className="text-sm text-muted-foreground max-w-md">
          Seu próximo passo é criar o primeiro plano estratégico para definir
          objetivos e resultados-chave.
        </p>
      </div>
      <Button render={<Link href="/criador" />}>
        Criar primeiro plano
      </Button>
    </div>
  )
}

# Plano de Testes — Sistema OKR

## 1. Estratégia Geral

| Camada | Ferramenta | Cobertura alvo | O que testa |
|---|---|---|---|
| Unitários | Vitest | ≥ 90% | Lógica pura: cálculos, schemas Zod, transformações |
| Integração | Vitest | ≥ 90% | Server Actions com Prisma mockado |
| E2E | Playwright | Fluxos críticos | UI completa em browser real |

**Regra:** chamadas externas (OpenAI, Prisma, Supabase, Brevo) são sempre mockadas nos testes unitários e de integração. Apenas testes E2E usam ambiente real (staging).

---

## 2. Testes Unitários

### 2.1 `features/key-result/lib/calculos.ts`

| Teste | Cenário |
|---|---|
| `calcularProgresso` | tipo aumentar, meio do caminho → 50% |
| `calcularProgresso` | tipo aumentar, valor abaixo do inicial → 0% |
| `calcularProgresso` | tipo aumentar, valor acima do alvo → > 100% |
| `calcularProgresso` | tipo reduzir, meio do caminho → 50% |
| `calcularProgresso` | tipo reduzir, valor acima do inicial → 0% |
| `calcularProgresso` | tipo simNao, valor truthy → 100% |
| `calcularProgresso` | tipo simNao, valor 0 → 0% |
| `calcularProgresso` | range zero → 100% (evita divisão por zero) |
| `calcularRisco` | exatamente no valor esperado → no_prazo |
| `calcularRisco` | 10% abaixo do esperado → em_atraso |
| `calcularRisco` | 30% abaixo do esperado → em_risco |
| `calcularRisco` | 60% abaixo do esperado → risco_alto |
| `calcularRisco` | antes da data início → no_prazo |
| `calcularRisco` | tipo reduzir, valor menor que esperado → em_atraso |
| `calcularProgressoObjetivo` | lista vazia → 0 |
| `calcularProgressoObjetivo` | KRs com pesos diferentes → média ponderada correta |
| `calcularProgressoObjetivo` | todos com peso 1 → média simples |
| `gerarLinhaTendencia` | duração < 6 meses → N pontos = N meses |
| `gerarLinhaTendencia` | duração ≥ 6 meses → 6 pontos |
| `gerarLinhaTendencia` | primeiro ponto = valorInicial, último = valorAlvo |
| `gerarLinhaTendencia` | progressão linear uniforme |

### 2.2 `features/auth/schemas.ts`

| Teste | Cenário |
|---|---|
| `signInSchema` | email inválido → erro |
| `signInSchema` | senha < 6 chars → erro |
| `signInSchema` | dados válidos → ok |
| `signUpSchema` | nome < 2 chars → erro |
| `signUpSchema` | senha < 8 chars → erro |
| `signUpSchema` | dados válidos → ok |
| `inviteUserSchema` | email inválido → erro |

### 2.3 `features/key-result/schemas.ts`

| Teste | Cenário |
|---|---|
| `createKeyResultSchema` | sem valorAlvo → erro |
| `createKeyResultSchema` | peso negativo → erro |
| `createKeyResultSchema` | dados válidos com defaults → ok |
| `updateKeyResultValorSchema` | valor ausente → erro |
| `updateKeyResultValorSchema` | comentário opcional → ok sem comentário |

### 2.4 `features/plano/schemas.ts`

| Teste | Cenário |
|---|---|
| `createPlanoSchema` | título < 3 chars → erro |
| `createPlanoSchema` | dataFim antes de dataInicio → deve validar na action |
| `createPlanoSchema` | dados válidos → ok |

### 2.5 `features/criador-plano/schemas.ts`

| Teste | Cenário |
|---|---|
| `step1EmpresaSchema` | empresa vazia → erro |
| `step2SwotSchema` | oportunidades vazias → erro |
| `step3DiagnosticoSchema` | ondeEstamos < 10 chars → erro |
| `criadorPlanoSchema` | merge dos 3 steps válido → ok |

---

## 3. Testes de Integração (Server Actions com mocks)

### 3.1 `features/key-result/actions.ts` — `updateKeyResultValor`

```
Mock: prisma.resultadoChave.findUnique, prisma.resultadoChave.update,
      prisma.historicoValores.create, prisma.objetivo.findUnique,
      prisma.objetivo.update, sendEmail (brevo)
```

| Teste | Cenário |
|---|---|
| KR não encontrado → lança erro |
| Atualiza valorAtual, progresso e status no banco |
| Cria registro em HistoricoValores |
| Recalcula e atualiza progresso do Objetivo pai |
| Envia email se `atualizacaoEmailResultado = true` |
| Não envia email se `atualizacaoEmailResultado = false` |
| Retorna `{ ok: true, progresso, status }` |

### 3.2 `features/plano/actions.ts` — `createPlanoCorporativo`

```
Mock: prisma.plano.create, prisma.objetivo.createMany,
      prisma.resultadoChave.createMany, prisma.linhaTendencia.createMany,
      openai.chat.completions.create
```

| Teste | Cenário |
|---|---|
| Chama OpenAI com o prompt correto |
| Persiste Plano, Objetivos e KRs no banco |
| Gera LinhaTendencia para cada KR |
| Retorna `{ planoId }` após sucesso |
| OpenAI retorna resposta malformada → lança erro tratável |
| Erro no banco → propaga erro |

### 3.3 `features/auth/actions.ts` — `signIn`

```
Mock: createSupabaseServerClient
```

| Teste | Cenário |
|---|---|
| Credenciais corretas → retorna sessão |
| Credenciais incorretas → retorna erro |
| Dados inválidos (schema) → retorna erro de validação |

### 3.4 `features/auth/actions.ts` — `inviteUser`

```
Mock: prisma.user.create, sendEmail (brevo)
```

| Teste | Cenário |
|---|---|
| Cria usuário com `temConvite = true` |
| Envia email Brevo template 5 |
| Email já existente → lança erro |

### 3.5 `features/objetivo/actions.ts` — `createObjetivo`

| Teste | Cenário |
|---|---|
| Cria objetivo com número sequencial |
| Cria ObjetivoResponsavel para cada responsável |
| Plano inexistente → lança erro |

---

## 4. Testes E2E (Playwright)

### Setup global
- Criar usuário de teste via seed antes dos testes
- Salvar `storageState` após login para reutilizar

### 4.1 `auth.spec.ts`

| Teste | Passos |
|---|---|
| Login com credenciais válidas | Preenche form → submit → redirecionado para `/planos` |
| Login com senha errada | Preenche form → submit → mensagem de erro visível |
| Esqueci a senha | Clica link → preenche email → toast de confirmação |
| Logout | Clica menu → sair → redirecionado para `/login` |
| Rota autenticada sem sessão | Acessa `/planos` diretamente → redirecionado para `/login` |

### 4.2 `criar-plano.spec.ts`

| Teste | Passos |
|---|---|
| Criação completa (happy path) | Step 1 → Step 2 → Step 3 → confirma → plano aparece em `/planos` |
| Sugestões de missão carregam | Step 1: após preencher empresa → spinner → 5 opções aparecem |
| Validação Step 1 | Submit sem preencher empresa → erros inline nos campos |
| Voltar entre steps | Step 2 → clica Voltar → está em Step 1 com dados preservados |

### 4.3 `acompanhamento.spec.ts`

| Teste | Passos |
|---|---|
| Árvore de planos expande | Clica em plano → objetivos aparecem → clica objetivo → KRs aparecem |
| Atualizar valor de KR | Abre painel KR → informa novo valor → confirma → progresso atualizado |
| Status de risco visível | KR atrasado → badge "Em risco" aparece na UI |
| Sugerir objetivo com IA | Clica "Sugerir objetivo" → loading → novo objetivo aparece para confirmar |

### 4.4 `usuarios.spec.ts`

| Teste | Passos |
|---|---|
| Convidar usuário | Preenche email → envia → usuário aparece como "pendente" |
| Alterar papel de usuário | Seleciona usuário → muda de viewer para editor → salva → reflete na lista |

---

## 5. Cobertura Mínima

| Diretório | Meta |
|---|---|
| `features/key-result/lib/` | 100% (lógica crítica de negócio) |
| `features/*/schemas.ts` | 100% |
| `features/*/actions.ts` | ≥ 90% |
| `features/*/queries.ts` | ≥ 80% |
| `lib/` | ≥ 80% |

Páginas (`app/`) são excluídas da cobertura unitária — cobertas pelos E2E.

---

## 6. Convenções

```
// Estrutura padrão de um teste de action:
describe('updateKeyResultValor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve atualizar valorAtual e recalcular progresso', async () => {
    // Arrange
    vi.mocked(prisma.resultadoChave.findUnique).mockResolvedValue(mockKR)

    // Act
    const result = await updateKeyResultValor({ krId: '...', valor: 80 })

    // Assert
    expect(prisma.resultadoChave.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ valorAtual: 80 }) })
    )
    expect(result.ok).toBe(true)
  })
})
```

**Factories de dados de teste:** criar em `src/tests/factories/` para evitar repetição de `mockKR`, `mockObjetivo`, etc.

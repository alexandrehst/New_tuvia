-- ════════════════════════════════════════════════════════════════════════════
-- RLS — Isolamento multi-tenant por clienteId  (Story 6.6, Opção C)
-- ════════════════════════════════════════════════════════════════════════════
--
-- Story: _bmad-output/implementation-artifacts/6-6-rls-no-postgres.md
-- Decisão de arquitetura: _bmad-output/planning-artifacts/architecture-epic6-seguranca.md (D4 = Opção C)
--
-- CONTEXTO IMPORTANTE (leia antes de aplicar):
--   • Todo o acesso a dados de domínio é via PRISMA, que conecta com o role
--     `postgres` (superuser do Supabase) — esse role tem o atributo BYPASSRLS,
--     portanto IGNORA estas policies por completo.
--   • Logo, hoje a RLS NÃO cobre o caminho do Prisma. A defesa PRIMÁRIA contra
--     vazamento cross-tenant é o GUARD DE APLICAÇÃO:
--       - `assertMesmoTenant` em src/features/auth/guards.ts
--       - filtro `clienteId` no `where` das queries/actions
--         (ex.: IDOR corrigido em src/features/plano/queries.ts)
--   • Esta RLS é uma REDE SECUNDÁRIA: só passa a atuar se/quando algo acessar o
--     banco por uma conexão SUJEITA a RLS — i.e. via supabase-js (roles
--     `authenticated`/`anon`), ou via Prisma sob um role não-privilegiado
--     (Opção B — FORA do escopo desta story; ver follow-up no arquivo da story).
--
-- FONTE DO TENANT NAS POLICIES:
--   As policies derivam o tenant corrente de `current_setting('app.current_tenant', true)`.
--   O 2º argumento `true` faz a função retornar NULL (em vez de erro) quando o
--   GUC não está setado — caso em que NENHUMA linha casa (nega por padrão).
--   Para conexões via supabase-js no futuro, a injeção desse GUC pode ser feita
--   por um claim do JWT; a ativação real do enforcement é a Opção B (follow-up).
--
-- IDEMPOTÊNCIA:
--   • `ENABLE ROW LEVEL SECURITY` é idempotente por natureza.
--   • Cada policy usa `DROP POLICY IF EXISTS ... ; CREATE POLICY ...` para poder
--     ser reaplicada sem erro.
--   • Os nomes de tabela/coluna respeitam o casing do Prisma (PascalCase entre
--     aspas duplas), idêntico ao prisma/schema.prisma.
--
-- COMO APLICAR: ver prisma/sql/README.md (NÃO usar `db push`/`migrate deploy`
--   para isto — é DDL versionada aplicada explicitamente; ver doc).
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: tenant corrente da conexão.
-- STABLE + retorna NULL quando o GUC não está setado (nega por padrão).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION app_current_tenant()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_tenant', true), '')
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Revogar acesso do role `anon` às tabelas de domínio (defesa explícita).
-- RLS já nega por padrão quando nenhuma policy casa, mas remover o GRANT é a
-- camada mais robusta para o role anônimo (AC-3).
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE
      "Cliente", "User", "Departamento", "PlanoEstrategico", "Plano",
      "Dominio", "PlanoUsuario", "Objetivo", "ObjetivoResponsavel",
      "ResultadoChave", "HistoricoValores", "LinhaTendencia"
    FROM anon;
  END IF;
END
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- Tabelas com clienteId DIRETO
-- ════════════════════════════════════════════════════════════════════════════

-- ── Cliente (tenant raiz: o próprio `id` é o clienteId) ──────────────────────
ALTER TABLE "Cliente" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "Cliente";
CREATE POLICY "tenant_isolation" ON "Cliente"
  USING ("id" = app_current_tenant())
  WITH CHECK ("id" = app_current_tenant());

-- ── User ─────────────────────────────────────────────────────────────────────
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "User";
CREATE POLICY "tenant_isolation" ON "User"
  USING ("clienteId" = app_current_tenant())
  WITH CHECK ("clienteId" = app_current_tenant());

-- ── Departamento ─────────────────────────────────────────────────────────────
ALTER TABLE "Departamento" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "Departamento";
CREATE POLICY "tenant_isolation" ON "Departamento"
  USING ("clienteId" = app_current_tenant())
  WITH CHECK ("clienteId" = app_current_tenant());

-- ── PlanoEstrategico ─────────────────────────────────────────────────────────
ALTER TABLE "PlanoEstrategico" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "PlanoEstrategico";
CREATE POLICY "tenant_isolation" ON "PlanoEstrategico"
  USING ("clienteId" = app_current_tenant())
  WITH CHECK ("clienteId" = app_current_tenant());

-- ── Plano ────────────────────────────────────────────────────────────────────
ALTER TABLE "Plano" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "Plano";
CREATE POLICY "tenant_isolation" ON "Plano"
  USING ("clienteId" = app_current_tenant())
  WITH CHECK ("clienteId" = app_current_tenant());

-- ── Dominio ──────────────────────────────────────────────────────────────────
ALTER TABLE "Dominio" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "Dominio";
CREATE POLICY "tenant_isolation" ON "Dominio"
  USING ("clienteId" = app_current_tenant())
  WITH CHECK ("clienteId" = app_current_tenant());

-- ════════════════════════════════════════════════════════════════════════════
-- Tabelas-FILHAS (sem clienteId próprio) — tenant derivado por saltos de FK.
-- Cada policy usa EXISTS subindo a cadeia até Plano.clienteId.
-- Os índices @@index([planoId])/([objetivoId])/([resultadoChaveId]) já
-- existentes no schema cobrem estes joins.
-- ════════════════════════════════════════════════════════════════════════════

-- ── PlanoUsuario  →  Plano ───────────────────────────────────────────────────
ALTER TABLE "PlanoUsuario" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "PlanoUsuario";
CREATE POLICY "tenant_isolation" ON "PlanoUsuario"
  USING (
    EXISTS (
      SELECT 1 FROM "Plano" p
      WHERE p."id" = "PlanoUsuario"."planoId"
        AND p."clienteId" = app_current_tenant()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Plano" p
      WHERE p."id" = "PlanoUsuario"."planoId"
        AND p."clienteId" = app_current_tenant()
    )
  );

-- ── Objetivo  →  Plano ───────────────────────────────────────────────────────
ALTER TABLE "Objetivo" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "Objetivo";
CREATE POLICY "tenant_isolation" ON "Objetivo"
  USING (
    EXISTS (
      SELECT 1 FROM "Plano" p
      WHERE p."id" = "Objetivo"."planoId"
        AND p."clienteId" = app_current_tenant()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Plano" p
      WHERE p."id" = "Objetivo"."planoId"
        AND p."clienteId" = app_current_tenant()
    )
  );

-- ── ObjetivoResponsavel  →  Objetivo  →  Plano (2 saltos) ────────────────────
ALTER TABLE "ObjetivoResponsavel" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "ObjetivoResponsavel";
CREATE POLICY "tenant_isolation" ON "ObjetivoResponsavel"
  USING (
    EXISTS (
      SELECT 1
      FROM "Objetivo" o
      JOIN "Plano" p ON p."id" = o."planoId"
      WHERE o."id" = "ObjetivoResponsavel"."objetivoId"
        AND p."clienteId" = app_current_tenant()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "Objetivo" o
      JOIN "Plano" p ON p."id" = o."planoId"
      WHERE o."id" = "ObjetivoResponsavel"."objetivoId"
        AND p."clienteId" = app_current_tenant()
    )
  );

-- ── ResultadoChave  →  Objetivo  →  Plano (2 saltos) ─────────────────────────
ALTER TABLE "ResultadoChave" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "ResultadoChave";
CREATE POLICY "tenant_isolation" ON "ResultadoChave"
  USING (
    EXISTS (
      SELECT 1
      FROM "Objetivo" o
      JOIN "Plano" p ON p."id" = o."planoId"
      WHERE o."id" = "ResultadoChave"."objetivoId"
        AND p."clienteId" = app_current_tenant()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "Objetivo" o
      JOIN "Plano" p ON p."id" = o."planoId"
      WHERE o."id" = "ResultadoChave"."objetivoId"
        AND p."clienteId" = app_current_tenant()
    )
  );

-- ── HistoricoValores  →  ResultadoChave  →  Objetivo  →  Plano (3 saltos) ────
ALTER TABLE "HistoricoValores" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "HistoricoValores";
CREATE POLICY "tenant_isolation" ON "HistoricoValores"
  USING (
    EXISTS (
      SELECT 1
      FROM "ResultadoChave" rc
      JOIN "Objetivo" o ON o."id" = rc."objetivoId"
      JOIN "Plano" p ON p."id" = o."planoId"
      WHERE rc."id" = "HistoricoValores"."resultadoChaveId"
        AND p."clienteId" = app_current_tenant()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "ResultadoChave" rc
      JOIN "Objetivo" o ON o."id" = rc."objetivoId"
      JOIN "Plano" p ON p."id" = o."planoId"
      WHERE rc."id" = "HistoricoValores"."resultadoChaveId"
        AND p."clienteId" = app_current_tenant()
    )
  );

-- ── LinhaTendencia  →  ResultadoChave  →  Objetivo  →  Plano (3 saltos) ──────
ALTER TABLE "LinhaTendencia" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "LinhaTendencia";
CREATE POLICY "tenant_isolation" ON "LinhaTendencia"
  USING (
    EXISTS (
      SELECT 1
      FROM "ResultadoChave" rc
      JOIN "Objetivo" o ON o."id" = rc."objetivoId"
      JOIN "Plano" p ON p."id" = o."planoId"
      WHERE rc."id" = "LinhaTendencia"."resultadoChaveId"
        AND p."clienteId" = app_current_tenant()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "ResultadoChave" rc
      JOIN "Objetivo" o ON o."id" = rc."objetivoId"
      JOIN "Plano" p ON p."id" = o."planoId"
      WHERE rc."id" = "LinhaTendencia"."resultadoChaveId"
        AND p."clienteId" = app_current_tenant()
    )
  );

-- ════════════════════════════════════════════════════════════════════════════
-- NOTA sobre FORCE ROW LEVEL SECURITY (deliberadamente NÃO aplicado aqui):
--   `FORCE ROW LEVEL SECURITY` faz a RLS valer também para o OWNER da tabela.
--   Só é necessário quando o Prisma passar a rodar como owner sob role sujeito
--   a RLS (Opção B). Como nesta story (Opção C) o Prisma segue como `postgres`
--   (BYPASSRLS), `FORCE` não muda nada para o caminho atual e seria adicionado
--   junto com a Opção B. Mantido como follow-up para evitar surpresas em DDL/seed.
-- ════════════════════════════════════════════════════════════════════════════

COMMIT;

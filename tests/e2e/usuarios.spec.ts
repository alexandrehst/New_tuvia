import { test, expect } from '@playwright/test'

test.describe('Gestão de usuários', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/usuarios')
  })

  test('página de usuários carrega', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible()
  })

  test('abrir "Convidar membro" mostra o painel', async ({ page }) => {
    await page.getByRole('button', { name: /convidar membro/i }).click()
    await expect(page.getByRole('heading', { name: /convidar membro/i })).toBeVisible()
    await expect(page.getByLabel('E-mail')).toBeVisible()
  })

  test('enviar convite sem e-mail mostra erro inline', async ({ page }) => {
    await page.getByRole('button', { name: /convidar membro/i }).click()
    await page.getByRole('button', { name: /enviar convite/i }).click()
    await expect(page.getByRole('alert')).toContainText(/informe um e-mail/i)
  })

  // Requer e-mail único por execução + Supabase/seed → validar em ambiente com dados.
  test.fixme('convite com e-mail novo exibe "Convite enviado"', async () => {})

  // Requer fixture de usuário NÃO-admin (segundo storageState) — cobre a autorização
  // do guard `requireAdmin` (L2): um membro comum não deve conseguir mudar papéis/remover.
  test.fixme('não-admin não consegue alterar papéis nem remover membros (L2)', async () => {})
})

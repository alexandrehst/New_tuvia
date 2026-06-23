import { test, expect } from '@playwright/test'

test.describe('Acompanhamento de OKRs (board)', () => {
  test('abrir um plano leva ao workspace de acompanhamento', async ({ page }) => {
    await page.goto('/planos')
    await expect(page.getByRole('heading', { name: /bem-vindo/i })).toBeVisible()

    // A lista usa cartões navegáveis (não árvore inline)
    const primeiroPlano = page.getByTestId('plano-card').first()
    await primeiroPlano.click()

    // Workspace dedicado do plano
    await expect(page).toHaveURL(/\/planos\/.+/)
    // Seção de objetivos (board em colunas)
    await expect(page.getByRole('heading', { name: /objetivos/i })).toBeVisible()
  })

  test('cabeçalho do plano oferece editar e (em corporativo) criar plano de apoio', async ({ page }) => {
    await page.goto('/planos')
    await page.getByTestId('plano-card').first().click()

    await expect(page.getByRole('button', { name: /editar plano/i })).toBeVisible()
  })

  // Requer um plano seedado com objetivos/KRs (colunas "objetivo-coluna" + cartões de KR).
  // Cobrir: abrir "Atualizar" de um KR (Sheet), enviar novo valor e ver progresso/risco refletidos.
  test.fixme('atualizar valor de um KR reflete progresso/risco', async () => {})
})

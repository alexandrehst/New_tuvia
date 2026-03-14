import { test, expect } from '@playwright/test'

test.describe('Acompanhamento de OKRs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/planos')
  })

  test('árvore expande plano → objetivos → KRs', async ({ page }) => {
    const planoRow = page.getByTestId('plano-row').first()
    await planoRow.click()

    const objetivoRow = page.getByTestId('objetivo-row').first()
    await expect(objetivoRow).toBeVisible()
    await objetivoRow.click()

    await expect(page.getByTestId('kr-row').first()).toBeVisible()
  })

  test('atualizar valor de KR reflete progresso na UI', async ({ page }) => {
    // Expande árvore
    await page.getByTestId('plano-row').first().click()
    await page.getByTestId('objetivo-row').first().click()

    // Abre painel do KR
    await page.getByTestId('kr-row').first().click()
    await expect(page.getByTestId('kr-panel')).toBeVisible()

    // Preenche novo valor
    await page.getByLabel('Novo valor').fill('500000')
    await page.getByLabel('Comentário').fill('Bom mês de vendas')
    await page.getByRole('button', { name: /salvar/i }).click()

    // Progresso deve atualizar
    await expect(page.getByTestId('kr-progresso')).not.toHaveText('0%')
    await expect(page.getByTestId('toast-sucesso')).toBeVisible()
  })

  test('badge de risco aparece para KR atrasado', async ({ page }) => {
    // Este teste assume que o seed criou um KR em risco
    await expect(
      page.getByTestId('status-risco').filter({ hasText: /em risco|risco alto/i }).first()
    ).toBeVisible({ timeout: 5_000 })
  })
})

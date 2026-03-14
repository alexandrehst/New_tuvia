import { test, expect } from '@playwright/test'

test.describe('Criação de Plano', () => {
  test.beforeEach(async ({ page }) => {
    // Assume que o storageState de auth foi salvo pelo global.setup
    await page.goto('/criador')
  })

  test('step 1: campos obrigatórios mostram erros inline', async ({ page }) => {
    await page.getByRole('button', { name: /próximo/i }).click()

    await expect(page.getByText(/empresa/i)).toBeVisible()
    await expect(page.getByText(/ramo/i)).toBeVisible()
  })

  test('step 1: sugestões de missão carregam após preencher empresa', async ({ page }) => {
    await page.getByLabel('Empresa').fill('TechCorp')
    await page.getByLabel('Ramo de atuação').fill('Tecnologia')
    await page.getByLabel('Descrição do negócio').fill('Empresa de software B2B para gestão de times')

    // Aguarda as sugestões de missão aparecerem (streaming)
    await expect(page.getByTestId('sugestoes-missao')).toBeVisible({ timeout: 30_000 })
    const sugestoes = page.getByTestId('sugestao-missao-item')
    await expect(sugestoes).toHaveCount(5, { timeout: 30_000 })
  })

  test('navegar entre steps preserva dados', async ({ page }) => {
    await page.getByLabel('Empresa').fill('TechCorp')
    await page.getByLabel('Ramo de atuação').fill('Tecnologia')
    await page.getByLabel('Descrição do negócio').fill('Empresa de software B2B para gestão')
    // Seleciona primeira sugestão de missão
    await page.getByTestId('sugestao-missao-item').first().click({ timeout: 30_000 })

    await page.getByRole('button', { name: /próximo/i }).click()
    await expect(page.getByTestId('step-2')).toBeVisible()

    await page.getByRole('button', { name: /voltar/i }).click()
    await expect(page.getByLabel('Empresa')).toHaveValue('TechCorp')
  })
})

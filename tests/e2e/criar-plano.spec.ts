import { test, expect } from '@playwright/test'

test.describe('Criação de Plano (wizard)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/criador')
  })

  test('mostra "Passo 1 de N" e desabilita Próximo até empresa e ramo', async ({ page }) => {
    await expect(page.getByText(/passo 1 de/i)).toBeVisible()

    const proximo = page.getByRole('button', { name: /próximo/i })
    await expect(proximo).toBeDisabled()

    await page.getByLabel('Nome da empresa').fill('TechCorp')
    await page.getByLabel('Ramo de atuação').fill('Tecnologia')

    await expect(proximo).toBeEnabled()
  })

  test('avança para o passo 2 (Visão)', async ({ page }) => {
    await page.getByLabel('Nome da empresa').fill('TechCorp')
    await page.getByLabel('Ramo de atuação').fill('Tecnologia')
    await page.getByRole('button', { name: /próximo/i }).click()

    await expect(page.getByText(/passo 2 de/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Visão' })).toBeVisible()
  })

  test('navegar entre passos preserva os dados', async ({ page }) => {
    await page.getByLabel('Nome da empresa').fill('TechCorp')
    await page.getByLabel('Ramo de atuação').fill('Tecnologia')
    await page.getByRole('button', { name: /próximo/i }).click()
    await page.getByRole('button', { name: /voltar/i }).click()

    await expect(page.getByLabel('Nome da empresa')).toHaveValue('TechCorp')
  })

  // Requer OpenAI/streaming (rota /api/ai/*) → validar em ambiente com chave configurada.
  test.fixme('sugestões de IA preenchem o campo (visão/missão)', async () => {})
})

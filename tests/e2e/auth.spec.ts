import { test, expect } from '@playwright/test'

test.describe('Autenticação', () => {
  test('login com credenciais válidas redireciona para /planos', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL ?? 'admin@demo.com')
    await page.getByLabel('Senha').fill(process.env.TEST_USER_PASSWORD ?? 'demo1234')
    await page.getByRole('button', { name: /avançar|entrar/i }).click()

    await expect(page).toHaveURL('/planos')
    await expect(page.getByRole('heading', { name: /bem-vindo/i })).toBeVisible()
  })

  test('login com senha errada exibe mensagem de erro', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('admin@demo.com')
    await page.getByLabel('Senha').fill('senha-errada')
    await page.getByRole('button', { name: /avançar|entrar/i }).click()

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('rota autenticada sem sessão redireciona para /login', async ({ page }) => {
    // Acessa diretamente sem estar logado
    await page.goto('/planos')
    await expect(page).toHaveURL('/login')
  })

  test('usuário autenticado em rota pública é redirecionado para /planos', async ({ page }) => {
    // Contrato de auth (Story 6.1): logado não vê login/cadastro/reset.
    await page.goto('/login')
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL ?? 'admin@demo.com')
    await page.getByLabel('Senha').fill(process.env.TEST_USER_PASSWORD ?? 'demo1234')
    await page.getByRole('button', { name: /avançar|entrar/i }).click()
    await expect(page).toHaveURL('/planos')

    // Já autenticado, tentar abrir rotas públicas devolve para a app.
    await page.goto('/login')
    await expect(page).toHaveURL('/planos')
    await page.goto('/cadastro')
    await expect(page).toHaveURL('/planos')
  })

  test('esqueci a senha exibe confirmação', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /esqueci/i }).click()
    await page.getByLabel('Email').fill('admin@demo.com')
    await page.getByRole('button', { name: /enviar/i }).click()

    await expect(page.getByText(/email enviado/i)).toBeVisible()
  })
})

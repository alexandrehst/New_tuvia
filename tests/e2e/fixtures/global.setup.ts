import { test as setup, expect } from '@playwright/test'
import path from 'path'

export const AUTH_FILE = path.join(__dirname, '../.auth/user.json')

setup('authenticate', async ({ page }) => {
  await page.goto('/login')

  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL ?? 'admin@demo.com')
  await page.getByLabel('Senha').fill(process.env.TEST_USER_PASSWORD ?? 'demo1234')
  await page.getByRole('button', { name: /avançar|entrar/i }).click()

  await expect(page).toHaveURL('/planos', { timeout: 15_000 })

  await page.context().storageState({ path: AUTH_FILE })
})

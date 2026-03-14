import { test as setup } from '@playwright/test'

// Aqui vai setup global: criar usuário de teste, fazer login, salvar estado de auth
setup('global setup', async ({ page }) => {
  // TODO: criar usuário de teste via API ou seed
  // TODO: fazer login e salvar storageState para reutilizar nos testes
  await page.goto('/')
})

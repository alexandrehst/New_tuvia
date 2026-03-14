import OpenAI from 'openai'

const globalForOpenAI = globalThis as unknown as { openai: OpenAI | undefined }

function getOpenAIClient(): OpenAI {
  if (!globalForOpenAI.openai) {
    globalForOpenAI.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return globalForOpenAI.openai
}

// Lazy proxy — client is only instantiated on first actual call, not at import time
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop: string | symbol) {
    return (getOpenAIClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export const MODELO_PADRAO = 'gpt-4o'

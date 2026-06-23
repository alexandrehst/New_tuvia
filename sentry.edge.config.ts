import * as Sentry from '@sentry/nextjs'

// Runtime edge (proxy/middleware). Inicializa apenas com DSN configurado.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1,
    enabled: process.env.NODE_ENV === 'production',
  })
}

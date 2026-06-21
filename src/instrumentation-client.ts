import * as Sentry from '@sentry/nextjs'

// Inicializa apenas quando há DSN configurado (no-op em dev/CI sem env).
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1,
    enabled: process.env.NODE_ENV === 'production',
  })
}

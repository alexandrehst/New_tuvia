"use client"

/** Ano atual renderizado no cliente — evita ficar congelado no build em páginas estáticas. */
export function CurrentYear() {
  return <>{new Date().getFullYear()}</>
}

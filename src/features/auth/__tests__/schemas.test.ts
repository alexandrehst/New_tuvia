import { describe, it, expect } from 'vitest'
import { signInSchema, signUpSchema, resetPasswordSchema, inviteUserSchema } from '../schemas'

describe('signInSchema', () => {
  it('aceita dados válidos', () => {
    const result = signInSchema.safeParse({ email: 'user@test.com', password: '123456' })
    expect(result.success).toBe(true)
  })

  it('rejeita email inválido', () => {
    const result = signInSchema.safeParse({ email: 'nao-é-email', password: '123456' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('email')
  })

  it('rejeita senha com menos de 6 caracteres', () => {
    const result = signInSchema.safeParse({ email: 'user@test.com', password: '12345' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('password')
  })
})

describe('signUpSchema', () => {
  it('aceita dados válidos', () => {
    const result = signUpSchema.safeParse({
      nome: 'João Silva',
      email: 'joao@test.com',
      password: '12345678',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita nome com menos de 2 caracteres', () => {
    const result = signUpSchema.safeParse({
      nome: 'J',
      email: 'joao@test.com',
      password: '12345678',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('nome')
  })

  it('rejeita senha com menos de 8 caracteres', () => {
    const result = signUpSchema.safeParse({
      nome: 'João',
      email: 'joao@test.com',
      password: '1234567',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('password')
  })
})

describe('resetPasswordSchema', () => {
  it('aceita email válido', () => {
    expect(resetPasswordSchema.safeParse({ email: 'a@b.com' }).success).toBe(true)
  })

  it('rejeita email inválido', () => {
    expect(resetPasswordSchema.safeParse({ email: 'invalido' }).success).toBe(false)
  })
})

describe('inviteUserSchema', () => {
  it('aceita dados válidos', () => {
    const result = inviteUserSchema.safeParse({ email: 'x@y.com', nome: 'Ana' })
    expect(result.success).toBe(true)
  })

  it('rejeita email inválido', () => {
    const result = inviteUserSchema.safeParse({ email: 'sem-arroba', nome: 'Ana' })
    expect(result.success).toBe(false)
  })
})

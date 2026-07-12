import { describe, expect, it } from 'vitest'
import { formatDate, formatCurrency, normalizePlaka } from './dateFormat'

describe('formatDate', () => {
  it('formats ISO dates into Turkish display format', () => {
    expect(formatDate('2026-08-15')).toBe('15.08.2026')
    expect(formatDate('')).toBe('')
  })
})

describe('formatCurrency', () => {
  it('formats numbers with Turkish thousands separator and decimal comma', () => {
    expect(formatCurrency(1500)).toBe('1.500,00')
    expect(formatCurrency(null)).toBe('')
  })
})

describe('normalizePlaka', () => {
  it('normalizes license plates to uppercase without spaces', () => {
    expect(normalizePlaka('34 abc 123')).toBe('34ABC123')
  })
})

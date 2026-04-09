import { describe, it, expect } from 'vitest'
import { validateNIF, nifErrorMessage } from '../utils/nifValidation'

describe('validateNIF', () => {
  it('accepts a valid 9-digit NIF', () => {
    expect(validateNIF('200123456')).toBe(true)
  })

  it('accepts another valid NIF', () => {
    expect(validateNIF('123456789')).toBe(true)
  })

  it('rejects NIF with fewer than 9 digits', () => {
    expect(validateNIF('12345678')).toBe(false)
  })

  it('rejects NIF with more than 9 digits', () => {
    expect(validateNIF('1234567890')).toBe(false)
  })

  it('rejects NIF containing letters', () => {
    expect(validateNIF('20012345A')).toBe(false)
  })

  it('rejects NIF with spaces', () => {
    expect(validateNIF('200 12345')).toBe(false)
  })

  it('accepts empty string (field is optional)', () => {
    expect(validateNIF('')).toBe(true)
  })

  it('accepts null (field is optional)', () => {
    expect(validateNIF(null)).toBe(true)
  })

  it('accepts undefined (field is optional)', () => {
    expect(validateNIF(undefined)).toBe(true)
  })

  it('trims whitespace before validating', () => {
    expect(validateNIF('  200123456  ')).toBe(true)
  })

  it('returns a non-empty error message', () => {
    expect(typeof nifErrorMessage()).toBe('string')
    expect(nifErrorMessage().length).toBeGreaterThan(0)
  })
})

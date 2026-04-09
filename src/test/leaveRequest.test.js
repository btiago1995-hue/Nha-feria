import { describe, it, expect } from 'vitest'
import { getBusinessDays } from '../utils/dateUtils'

// Leave request validation helpers (inline — logic lives in the component today,
// these tests document the expected behaviour and serve as regression anchors)

function isEndBeforeStart(startDate, endDate) {
  return endDate < startDate
}

function isPastDate(startDate, referenceDate = new Date().toISOString().split('T')[0]) {
  // Allow today and future; reject dates more than 1 day in the past
  return startDate < referenceDate
}

function hasOverlap(newStart, newEnd, existing) {
  return existing.some(r => newStart <= r.endDate && newEnd >= r.startDate)
}

describe('Leave request date validation', () => {
  it('rejects when end date is before start date', () => {
    expect(isEndBeforeStart('2026-05-10', '2026-05-05')).toBe(true)
  })

  it('accepts when start equals end (single day)', () => {
    expect(isEndBeforeStart('2026-05-10', '2026-05-10')).toBe(false)
  })

  it('accepts valid range', () => {
    expect(isEndBeforeStart('2026-05-10', '2026-05-20')).toBe(false)
  })

  it('rejects date in the past', () => {
    expect(isPastDate('2020-01-01')).toBe(true)
  })

  it('accepts today as start date', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(isPastDate(today)).toBe(false)
  })

  it('accepts future start date', () => {
    expect(isPastDate('2030-01-01')).toBe(false)
  })
})

describe('Leave request overlap detection', () => {
  const existing = [
    { startDate: '2026-06-01', endDate: '2026-06-10' },
    { startDate: '2026-07-15', endDate: '2026-07-20' },
  ]

  it('detects overlap with existing request', () => {
    expect(hasOverlap('2026-06-05', '2026-06-12', existing)).toBe(true)
  })

  it('detects overlap when new request contains existing', () => {
    expect(hasOverlap('2026-05-28', '2026-06-15', existing)).toBe(true)
  })

  it('accepts non-overlapping request before existing', () => {
    expect(hasOverlap('2026-05-01', '2026-05-31', existing)).toBe(false)
  })

  it('accepts non-overlapping request between existing', () => {
    expect(hasOverlap('2026-06-11', '2026-07-14', existing)).toBe(false)
  })

  it('accepts non-overlapping request after existing', () => {
    expect(hasOverlap('2026-07-21', '2026-07-31', existing)).toBe(false)
  })
})

describe('Business days calculation for leave requests', () => {
  it('a 2-week request (Mon-Fri x2) = 10 business days', () => {
    expect(getBusinessDays('2026-05-04', '2026-05-15')).toBe(10)
  })

  it('weekend-only range = 0 business days', () => {
    expect(getBusinessDays('2026-05-09', '2026-05-10')).toBe(0)
  })

  it('single working day = 1 business day', () => {
    expect(getBusinessDays('2026-05-04', '2026-05-04')).toBe(1)
  })
})

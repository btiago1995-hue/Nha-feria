import { describe, it, expect } from 'vitest'
import { getBusinessDays, formatPeriod } from '../utils/dateUtils'

describe('getBusinessDays', () => {
  it('counts working days between two dates, excluding weekends', () => {
    // Monday 2026-03-02 to Friday 2026-03-06 = 5 business days
    expect(getBusinessDays('2026-03-02', '2026-03-06')).toBe(5)
  })

  it('excludes Cape Verde public holidays', () => {
    // 2026-05-01 is Dia do Trabalhador — week of Apr 27-May 1
    // Mon-Fri = 5 days, minus 1 holiday = 4
    expect(getBusinessDays('2026-04-27', '2026-05-01')).toBe(4)
  })

  it('returns 0 when start is after end', () => {
    expect(getBusinessDays('2026-03-10', '2026-03-05')).toBe(0)
  })

  it('returns 1 for a single business day', () => {
    expect(getBusinessDays('2026-03-02', '2026-03-02')).toBe(1)
  })

  it('returns 0 for a weekend day', () => {
    // 2026-03-07 is Saturday
    expect(getBusinessDays('2026-03-07', '2026-03-08')).toBe(0)
  })
})

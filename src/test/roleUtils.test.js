import { describe, it, expect } from 'vitest'
import {
  isManager, isAdmin, isEmployee,
  canApprove, canViewAllCompany,
  canAccessManagerDashboard, canManageTeam,
} from '../utils/roleUtils'

describe('isManager', () => {
  it('returns true for manager role', () => expect(isManager('manager')).toBe(true))
  it('returns false for admin', () => expect(isManager('admin')).toBe(false))
  it('returns false for employee', () => expect(isManager('employee')).toBe(false))
})

describe('isAdmin', () => {
  it('returns true for admin role', () => expect(isAdmin('admin')).toBe(true))
  it('returns false for manager', () => expect(isAdmin('manager')).toBe(false))
  it('returns false for employee', () => expect(isAdmin('employee')).toBe(false))
})

describe('isEmployee', () => {
  it('returns true for employee role', () => expect(isEmployee('employee')).toBe(true))
  it('returns false for manager', () => expect(isEmployee('manager')).toBe(false))
  it('returns false for admin', () => expect(isEmployee('admin')).toBe(false))
})

describe('canApprove', () => {
  it('managers can approve', () => expect(canApprove('manager')).toBe(true))
  it('admins can approve', () => expect(canApprove('admin')).toBe(true))
  it('employees cannot approve', () => expect(canApprove('employee')).toBe(false))
})

describe('canViewAllCompany', () => {
  it('only admin can view all company data', () => expect(canViewAllCompany('admin')).toBe(true))
  it('manager cannot view all company data', () => expect(canViewAllCompany('manager')).toBe(false))
  it('employee cannot view all company data', () => expect(canViewAllCompany('employee')).toBe(false))
})

describe('canAccessManagerDashboard', () => {
  it('managers can access dashboard', () => expect(canAccessManagerDashboard('manager')).toBe(true))
  it('admins can access dashboard', () => expect(canAccessManagerDashboard('admin')).toBe(true))
  it('employees cannot access dashboard', () => expect(canAccessManagerDashboard('employee')).toBe(false))
})

describe('canManageTeam', () => {
  it('only admins can manage team', () => expect(canManageTeam('admin')).toBe(true))
  it('managers cannot manage team', () => expect(canManageTeam('manager')).toBe(false))
  it('employees cannot manage team', () => expect(canManageTeam('employee')).toBe(false))
})

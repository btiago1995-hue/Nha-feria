/**
 * Role hierarchy utilities for Nha Féria.
 * Roles: 'admin' > 'manager' > 'employee'
 */

export const isManager = (role) => role === 'manager';
export const isAdmin   = (role) => role === 'admin';
export const isEmployee = (role) => role === 'employee';

/** Can approve or reject leave requests */
export const canApprove = (role) => role === 'manager' || role === 'admin';

/** Can view all company data (all employees, all requests) */
export const canViewAllCompany = (role) => role === 'admin';

/** Can access the manager dashboard */
export const canAccessManagerDashboard = (role) => role === 'manager' || role === 'admin';

/** Can manage team (invite, edit roles, set manager_id) */
export const canManageTeam = (role) => role === 'admin';

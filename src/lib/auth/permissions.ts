import { ROLE_PERMISSIONS } from '@/lib/constants'
import type { UserRole } from '@/lib/types'

type PermissionModule = keyof typeof ROLE_PERMISSIONS

export const permissionHelpers = {
  /**
   * Check if a user role can read a module
   */
  canRead: (role: UserRole | null, module: PermissionModule): boolean => {
    if (!role) return false
    const config = ROLE_PERMISSIONS[module]
    return config[role as keyof typeof config] || false
  },

  /**
   * Check if a user role can create/add items in a module
   */
  canCreate: (role: UserRole | null, module: PermissionModule): boolean => {
    if (!role) return false
    if (role === 'super_admin' || role === 'salon_owner') return true
    if (role === 'manager') return true
    
    // Receptionists can register customers, appointments, POS invoices
    if (role === 'receptionist') {
      return ['appointments', 'customers', 'billing'].includes(module)
    }

    // Stylists/Beauticians can schedule/create appointments (but only for themselves; handled in service layer)
    if (role === 'stylist' || role === 'beautician') {
      return module === 'appointments'
    }

    return false
  },

  /**
   * Check if a user role can edit/update items in a module
   */
  canUpdate: (role: UserRole | null, module: PermissionModule): boolean => {
    return permissionHelpers.canCreate(role, module)
  },

  /**
   * Check if a user role can delete/remove items in a module
   */
  canDelete: (role: UserRole | null, module: PermissionModule): boolean => {
    if (!role) return false
    if (role === 'super_admin' || role === 'salon_owner') return true
    if (role === 'manager') {
      return module !== 'settings'
    }
    return false
  },

  /**
   * Check if a user role can export reports or records
   */
  canExport: (role: UserRole | null, module: PermissionModule): boolean => {
    if (!role) return false
    if (role === 'super_admin' || role === 'salon_owner' || role === 'manager') return true
    if (role === 'accountant') return module === 'reports' || module === 'billing'
    return false
  },

  /**
   * Checks full admin settings access
   */
  canManage: (role: UserRole | null): boolean => {
    return role === 'super_admin' || role === 'salon_owner'
  }
}

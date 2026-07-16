import { SuperAdminRepository } from '@/lib/repositories/repositories'
import { AuditService } from './audit-service'

export const SuperAdminService = {
  listTenants: async (): Promise<any[]> => {
    return SuperAdminRepository.listTenants()
  },

  createTenant: async (data: any, userId: string, userName: string): Promise<any> => {
    const defaultLimits = { staff: 10, branches: 3, appointments: 500, storage_gb: 5 }
    const defaultFlags = { ai: true, marketing: true, inventory: true, portal: true }
    
    const tenant = await SuperAdminRepository.createTenant({
      ...data,
      limits: defaultLimits,
      flags: defaultFlags
    })

    await AuditService.log(
      'system',
      userId,
      userName,
      'create_tenant',
      'tenant',
      tenant.id,
      null,
      { name: tenant.name, owner: tenant.owner_email }
    )

    return tenant
  },

  updateSubscription: async (tenantId: string, planName: string, limits: any, userId: string, userName: string): Promise<void> => {
    const original = (await SuperAdminRepository.listTenants()).find(t => t.id === tenantId)
    await SuperAdminRepository.updateTenant(tenantId, {
      plan: planName,
      limits
    })

    await AuditService.log(
      'system',
      userId,
      userName,
      'update_tenant_subscription',
      'tenant',
      tenantId,
      { plan: original?.plan, limits: original?.limits },
      { plan: planName, limits }
    )
  },

  toggleFeatureFlag: async (tenantId: string, flagKey: string, enabled: boolean, userId: string, userName: string): Promise<void> => {
    const original = (await SuperAdminRepository.listTenants()).find(t => t.id === tenantId)
    const updatedFlags = { ...original?.flags, [flagKey]: enabled }
    
    await SuperAdminRepository.updateTenant(tenantId, { flags: updatedFlags })

    await AuditService.log(
      'system',
      userId,
      userName,
      'toggle_tenant_feature_flag',
      'tenant',
      tenantId,
      { flag: flagKey, was_enabled: original?.flags?.[flagKey] },
      { flag: flagKey, is_enabled: enabled }
    )
  },

  suspendTenant: async (tenantId: string, userId: string, userName: string): Promise<void> => {
    const original = (await SuperAdminRepository.listTenants()).find(t => t.id === tenantId)
    const newStatus = original?.status === 'suspended' ? 'active' : 'suspended'
    
    await SuperAdminRepository.updateTenant(tenantId, { status: newStatus })

    await AuditService.log(
      'system',
      userId,
      userName,
      'suspend_tenant',
      'tenant',
      tenantId,
      { status: original?.status },
      { status: newStatus }
    )
  },

  listAuditLogs: async (): Promise<any[]> => {
    const { AuditRepository } = require('@/lib/repositories/repositories')
    return AuditRepository.listAll()
  },

  resetPassword: async (tenantId: string, userId: string, userName: string): Promise<string> => {
    const tempPassword = Math.random().toString(36).substring(2, 10)
    await AuditService.log(
      'system',
      userId,
      userName,
      'reset_tenant_password',
      'tenant',
      tenantId,
      null,
      { temp_password: tempPassword }
    )
    return tempPassword
  },

  backupDatabase: (): string => {
    const backup: Record<string, any> = {}
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('salon_ai_')) {
          backup[key] = localStorage.getItem(key)
        }
      }
    }
    return JSON.stringify(backup, null, 2)
  },

  restoreDatabase: (jsonString: string): void => {
    try {
      const data = JSON.parse(jsonString)
      if (typeof window !== 'undefined') {
        Object.keys(data).forEach(key => {
          if (key.startsWith('salon_ai_')) {
            localStorage.setItem(key, data[key])
          }
        })
      }
    } catch (e: any) {
      throw new Error('Invalid backup file: ' + e.message)
    }
  },

  listPlans: async (): Promise<any[]> => {
    const { SuperAdminRepository } = require('@/lib/repositories/repositories')
    return SuperAdminRepository.listPlans()
  },

  savePlans: async (plans: any[]): Promise<void> => {
    const { SuperAdminRepository } = require('@/lib/repositories/repositories')
    await SuperAdminRepository.savePlans(plans)
  },

  listCoupons: async (): Promise<any[]> => {
    const { SuperAdminRepository } = require('@/lib/repositories/repositories')
    return SuperAdminRepository.listCoupons()
  },

  saveCoupons: async (coupons: any[]): Promise<void> => {
    const { SuperAdminRepository } = require('@/lib/repositories/repositories')
    await SuperAdminRepository.saveCoupons(coupons)
  },

  getGlobalSettings: async (): Promise<any> => {
    const { SuperAdminRepository } = require('@/lib/repositories/repositories')
    return SuperAdminRepository.getGlobalSettings()
  },

  saveGlobalSettings: async (settings: any): Promise<void> => {
    const { SuperAdminRepository } = require('@/lib/repositories/repositories')
    await SuperAdminRepository.saveGlobalSettings(settings)
  },

  factoryReset: async (): Promise<void> => {
    const { SuperAdminRepository } = require('@/lib/repositories/repositories')
    await SuperAdminRepository.factoryResetSaaS()
  }
}

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
  }
}

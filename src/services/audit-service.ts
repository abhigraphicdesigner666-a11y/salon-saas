import { AuditRepository } from '@/lib/repositories/repositories'

export const AuditService = {
  log: async (tenantId: string, userId: string, userName: string, action: string, entityType: string, entityId: string, oldValues?: any, newValues?: any) => {
    try {
      await AuditRepository.log({
        tenant_id: tenantId,
        user_id: userId,
        user_name: userName,
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_values: oldValues || {},
        new_values: newValues || {},
        ip_address: '127.0.0.1',
      } as any)
    } catch (e) {
      console.error('Audit logging failed:', e)
    }
  }
}

import { ServiceRepository } from '@/lib/repositories/repositories'
import type { Service, ServiceCategory } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { AuditService } from './audit-service'
import { NotificationService } from './notification-service'

export const ServiceCatalogService = {
  list: async (tenantId: string): Promise<Service[]> => {
    return await ServiceRepository.list(tenantId)
  },

  listCategories: async (tenantId: string): Promise<ServiceCategory[]> => {
    return await ServiceRepository.listCategories(tenantId)
  },

  create: async (tenantId: string, serviceData: any, userId: string, userName: string): Promise<Service> => {
    const service = await ServiceRepository.create({
      tenant_id: tenantId,
      ...serviceData,
      is_active: true,
    })

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'create_service',
      'service',
      service.id,
      null,
      { name: service.name, price: service.price }
    )

    await NotificationService.send(
      tenantId,
      'New Service Added',
      `${service.name} has been published to catalog at ${formatCurrency(service.price)}.`,
      'success',
      '/dashboard/services'
    )

    return service
  },

  update: async (id: string, tenantId: string, updates: any, userId: string, userName: string): Promise<Service> => {
    const original = (await ServiceRepository.list(tenantId)).find(s => s.id === id)
    const updated = await ServiceRepository.update(id, updates)

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'update_service',
      'service',
      id,
      { name: original?.name, price: original?.price },
      updates
    )

    return updated
  }
}

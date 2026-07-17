import { CustomerRepository, CustomerValueRepository } from '@/lib/repositories/repositories'
import type { Customer } from '@/lib/types'
import { AuditService } from './audit-service'
import { NotificationService } from './notification-service'

export const CustomerService = {
  list: async (tenantId: string): Promise<Customer[]> => {
    return await CustomerRepository.list(tenantId)
  },

  getById: async (id: string): Promise<Customer | null> => {
    return await CustomerRepository.getById(id)
  },

  create: async (tenantId: string, customerData: any, userId: string, userName: string): Promise<Customer> => {
    const customer = await CustomerRepository.create({
      tenant_id: tenantId,
      ...customerData,
      loyalty_points: 0,
      total_spent: 0,
      total_visits: 0,
      is_active: true,
    })

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'create',
      'customer',
      customer.id,
      null,
      { first_name: customer.first_name, phone: customer.phone }
    )

    await NotificationService.send(
      tenantId,
      'New Customer Registered',
      `${customer.first_name} ${customer.last_name || ''} has been registered to your CRM database.`,
      'success',
      '/dashboard/customers'
    )

    return customer
  },

  update: async (id: string, tenantId: string, updates: any, userId: string, userName: string): Promise<Customer> => {
    const original = await CustomerRepository.getById(id)
    const updated = await CustomerRepository.update(id, updates)

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'update',
      'customer',
      id,
      { first_name: original?.first_name, phone: original?.phone },
      updates
    )

    return updated
  },

  deactivate: async (id: string, tenantId: string, userId: string, userName: string): Promise<void> => {
    const customer = await CustomerRepository.getById(id)
    if (!customer) throw new Error('Customer profile not found')
    
    await CustomerRepository.update(id, { is_active: false })
    
    await AuditService.log(
      tenantId,
      userId,
      userName,
      'deactivate',
      'customer',
      id,
      { is_active: true },
      { is_active: false }
    )

    await NotificationService.send(
      tenantId,
      'Customer Profile Deactivated',
      `CRM file for ${customer.first_name} has been set to inactive.`,
      'info'
    )
  },

  merge: async (mainId: string, duplicateId: string, tenantId: string, userId: string, userName: string): Promise<void> => {
    const mainCustomer = await CustomerRepository.getById(mainId)
    const duplicateCustomer = await CustomerRepository.getById(duplicateId)
    if (!mainCustomer || !duplicateCustomer) throw new Error('Could not resolve customer records for merge.')

    await CustomerRepository.merge(mainId, duplicateId)

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'merge_customers',
      'customer',
      mainId,
      { duplicate_name: duplicateCustomer.first_name },
      { main_name: mainCustomer.first_name }
    )

    await NotificationService.send(
      tenantId,
      'Customer Profiles Merged',
      `Duplicate file for ${duplicateCustomer.first_name} merged into main profile ${mainCustomer.first_name}.`,
      'success',
      '/dashboard/customers'
    )
  },

  sendMessage: async (id: string, tenantId: string, messageData: { channel: 'sms' | 'whatsapp' | 'email'; content: string }, userId: string, userName: string): Promise<void> => {
    const customer = await CustomerRepository.getById(id)
    if (!customer) throw new Error('Customer profile not found')

    await AuditService.log(
      tenantId,
      userId,
      userName,
      `send_${messageData.channel}`,
      'customer',
      id,
      null,
      { content: messageData.content }
    )

    await NotificationService.send(
      tenantId,
      'Outbound Message Sent',
      `Simulated ${messageData.channel.toUpperCase()} message sent to ${customer.first_name}.`,
      'success'
    )
  },

  delete: async (id: string, tenantId: string, userId: string, userName: string): Promise<void> => {
    const original = await CustomerRepository.getById(id)
    await CustomerRepository.delete(id)

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'delete',
      'customer',
      id,
      { first_name: original?.first_name },
      null
    )
  },

  listMemberships: async (tenantId: string): Promise<any[]> => {
    return await CustomerValueRepository.listMemberships(tenantId)
  },

  createMembership: async (tenantId: string, data: any, userId: string, userName: string): Promise<any> => {
    const newM = await CustomerValueRepository.createMembership(tenantId, data)
    await AuditService.log(tenantId, userId, userName, 'create_membership_plan', 'membership', newM.id, null, data)
    return newM
  },

  updateMembership: async (id: string, tenantId: string, updates: any, userId: string, userName: string): Promise<any> => {
    const updated = await CustomerValueRepository.updateMembership(id, updates)
    await AuditService.log(tenantId, userId, userName, 'update_membership_plan', 'membership', id, null, updates)
    return updated
  },

  deleteMembership: async (id: string, tenantId: string, userId: string, userName: string): Promise<void> => {
    await CustomerValueRepository.deleteMembership(id)
    await AuditService.log(tenantId, userId, userName, 'delete_membership_plan', 'membership', id, null, null)
  }
}

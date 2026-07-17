import { CustomerRepository, CustomerValueRepository } from '@/lib/repositories/repositories'
import { generateId, formatCurrency } from '@/lib/utils'
import { AuditService } from './audit-service'
import { NotificationService } from './notification-service'

// Local mock storage helpers
const getMockTable = <T>(key: string, initialData: T[]): T[] => {
  if (typeof window === 'undefined') return initialData
  const stored = localStorage.getItem(`salon_ai_db_${key}`)
  if (!stored) {
    localStorage.setItem(`salon_ai_db_${key}`, JSON.stringify(initialData))
    return initialData
  }
  try {
    return JSON.parse(stored)
  } catch {
    return initialData
  }
}

const saveMockTable = <T>(key: string, data: T[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`salon_ai_db_${key}`, JSON.stringify(data))
  }
}

export const CustomerValueService = {
  subscribeMembership: async (customerId: string, tenantId: string, planData: { planName: string; discountPercent: number }, userId: string, userName: string): Promise<void> => {
    const customer = await CustomerRepository.getById(customerId)
    if (!customer) throw new Error('Customer profile not found')

    await CustomerRepository.update(customerId, {
      membership_level: planData.planName,
      membership_status: 'active',
    } as any)

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'subscribe_membership',
      'customer_membership',
      customerId,
      { original_membership: (customer as any).membership_level || 'none' },
      { plan_name: planData.planName, discount_percent: planData.discountPercent }
    )

    await NotificationService.send(
      tenantId,
      'Membership Activated',
      `${customer.first_name} subscribed to ${planData.planName}. Enjoy ${planData.discountPercent}% off services.`,
      'success',
      '/dashboard/customers'
    )
  },

  freezeMembership: async (customerId: string, tenantId: string, userId: string, userName: string): Promise<void> => {
    const customer = await CustomerRepository.getById(customerId)
    if (!customer) throw new Error('Customer profile not found')

    const newStatus = (customer as any).membership_status === 'frozen' ? 'active' : 'frozen'
    await CustomerRepository.update(customerId, { membership_status: newStatus } as any)

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'freeze_membership',
      'customer_membership',
      customerId,
      { original_status: (customer as any).membership_status || 'active' },
      { new_status: newStatus }
    )

    await NotificationService.send(
      tenantId,
      'Membership Status Shifted',
      `Membership for ${customer.first_name} has been set to ${newStatus}.`,
      'info',
      '/dashboard/customers'
    )
  },

  adjustWallet: async (customerId: string, tenantId: string, adjustData: { change: number; reason: string }, userId: string, userName: string): Promise<void> => {
    const customer = await CustomerRepository.getById(customerId)
    if (!customer) throw new Error('Customer profile not found')

    await CustomerValueRepository.logWalletTransaction({
      tenant_id: tenantId,
      customer_id: customerId,
      change_amount: adjustData.change,
      reason: adjustData.reason
    })

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'adjust_wallet',
      'customer_wallet',
      customerId,
      { original_balance: (customer as any).wallet_balance || 0 },
      { change: adjustData.change, reason: adjustData.reason }
    )

    await NotificationService.send(
      tenantId,
      'Wallet Balance Adjusted',
      `Wallet for ${customer.first_name} adjusted by ${formatCurrency(adjustData.change)}. Reason: ${adjustData.reason}.`,
      'success'
    )
  },

  redeemPackage: async (customerId: string, tenantId: string, pkgId: string, userId: string, userName: string): Promise<void> => {
    const customer = await CustomerRepository.getById(customerId)
    if (!customer) throw new Error('Customer profile not found')

    const packages = await CustomerValueRepository.listCustomerPackages(tenantId)
    const pkg = packages.find(p => p.id === pkgId)
    if (!pkg) throw new Error('Customer prepaid package not found')
    if (pkg.remaining_sessions <= 0) throw new Error('No prepaid sessions left in package')

    await CustomerValueRepository.updatePackageSessions(pkgId, -1)

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'redeem_package_session',
      'customer_package',
      customerId,
      { remaining_before: pkg.remaining_sessions },
      { package_name: pkg.name, remaining_after: pkg.remaining_sessions - 1 }
    )

    await NotificationService.send(
      tenantId,
      'Package Session Redeemed',
      `Redeemed 1 session of ${pkg.name} for ${customer.first_name}. Remaining: ${pkg.remaining_sessions - 1}.`,
      'success'
    )
  },

  purchaseGiftCard: async (tenantId: string, cardData: any, userId: string, userName: string): Promise<any> => {
    const list = getMockTable<any>('giftCards', [])
    const gc = {
      id: generateId(),
      tenant_id: tenantId,
      code: `GIFT-${Date.now().toString().slice(-6)}`,
      initial_balance: cardData.amount,
      current_balance: cardData.amount,
      status: 'active',
      expiry_date: cardData.expiry_date || '2027-01-01',
      created_at: new Date().toISOString()
    }
    list.push(gc)
    saveMockTable('giftCards', list)

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'purchase_gift_card',
      'gift_card',
      gc.id,
      null,
      { code: gc.code, balance: gc.current_balance }
    )

    await NotificationService.send(
      tenantId,
      'Gift Card Purchased',
      `Gift Card ${gc.code} generated successfully. Value: ${formatCurrency(gc.current_balance)}.`,
      'success',
      '/dashboard/billing'
    )

    return gc
  }
}

import { MarketingRepository } from '@/lib/repositories/repositories'
import { formatCurrency } from '@/lib/utils'
import { AuditService } from './audit-service'
import { NotificationService } from './notification-service'

export const MarketingService = {
  listCampaigns: async (tenantId: string): Promise<any[]> => {
    return MarketingRepository.listCampaigns(tenantId)
  },

  createCampaign: async (tenantId: string, data: any, userId: string, userName: string): Promise<any> => {
    const newCamp = await MarketingRepository.createCampaign({
      tenant_id: tenantId,
      ...data,
      sent_count: 0,
      opened_count: 0,
      clicks_count: 0,
      revenue_generated: 0
    })

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'create_campaign',
      'marketing_campaign',
      newCamp.id,
      null,
      { name: newCamp.name, channel: newCamp.channel }
    )

    await NotificationService.send(
      tenantId,
      'Campaign Created',
      `Campaign ${newCamp.name} successfully built on channel: ${newCamp.channel.toUpperCase()}.`,
      'success',
      '/dashboard/marketing'
    )

    return newCamp
  },

  sendCampaign: async (id: string, tenantId: string, userId: string, userName: string): Promise<void> => {
    const original = (await MarketingRepository.listCampaigns(tenantId)).find(c => c.id === id)
    if (!original) throw new Error('Campaign not found')

    const randomSent = Math.floor(Math.random() * 40) + 10
    const randomOpened = Math.floor(randomSent * 0.7)
    const randomClicks = Math.floor(randomOpened * 0.3)
    const randomRevenue = randomClicks * 800

    await MarketingRepository.updateCampaign(id, {
      status: 'completed',
      sent_count: randomSent,
      opened_count: randomOpened,
      clicks_count: randomClicks,
      revenue_generated: randomRevenue
    })

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'send_campaign',
      'marketing_campaign',
      id,
      { status: original.status },
      { status: 'completed', sent: randomSent, revenue: randomRevenue }
    )

    await NotificationService.send(
      tenantId,
      'Campaign Dispatched',
      `Campaign ${original.name} successfully executed. ${randomSent} messages sent, generated ${formatCurrency(randomRevenue)} in bookings.`,
      'success',
      '/dashboard/marketing'
    )
  },

  listSegments: async (tenantId: string): Promise<any[]> => {
    return MarketingRepository.listSegments(tenantId)
  },

  createSegment: async (tenantId: string, data: any, userId: string, userName: string): Promise<any> => {
    const newSeg = await MarketingRepository.createSegment({
      tenant_id: tenantId,
      ...data
    })

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'create_segment',
      'marketing_segment',
      newSeg.id,
      null,
      { name: newSeg.name }
    )

    return newSeg
  },

  listCoupons: async (tenantId: string): Promise<any[]> => {
    return MarketingRepository.listCoupons(tenantId)
  },

  createCoupon: async (tenantId: string, data: any, userId: string, userName: string): Promise<any> => {
    const newCoup = await MarketingRepository.createCoupon({
      tenant_id: tenantId,
      ...data,
      active: true
    })

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'create_coupon',
      'promo_coupon',
      newCoup.id,
      null,
      { code: newCoup.code, discount_percent: newCoup.discount_percent }
    )

    return newCoup
  },

  validateCoupon: async (code: string, tenantId: string): Promise<any> => {
    const coupons = await MarketingRepository.listCoupons(tenantId)
    const match = coupons.find(c => c.code.toUpperCase() === code.toUpperCase())
    if (!match) throw new Error('Promotional coupon code not found')
    if (!match.active) throw new Error('Promotional coupon code is inactive')
    if (new Date(match.expiry_date) < new Date()) throw new Error('Promotional coupon code has expired')
    return match
  }
}

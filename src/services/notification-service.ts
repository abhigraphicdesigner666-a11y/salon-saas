import { NotificationRepository } from '@/lib/repositories/repositories'

export const NotificationService = {
  send: async (tenantId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'appointment' | 'payment' | 'marketing', actionUrl?: string) => {
    try {
      await NotificationRepository.send({
        tenant_id: tenantId,
        title,
        message,
        type,
        action_url: actionUrl,
      } as any)
    } catch (e) {
      console.error('Notification dispatch failed:', e)
    }
  }
}

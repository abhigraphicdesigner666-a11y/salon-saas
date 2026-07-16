import { AppointmentRepository, CustomerRepository, ProductRepository } from '@/lib/repositories/repositories'
import type { Appointment } from '@/lib/types'
import { AuditService } from './audit-service'
import { NotificationService } from './notification-service'

export const AppointmentService = {
  list: async (tenantId: string): Promise<Appointment[]> => {
    return await AppointmentRepository.list(tenantId)
  },

  getById: async (id: string): Promise<Appointment | null> => {
    return await AppointmentRepository.getById(id)
  },

  getAvailableSlots: async (tenantId: string, dateStr: string, staffId: string, durationMinutes: number = 30): Promise<string[]> => {
    const appointments = await AppointmentRepository.list(tenantId)
    
    const startHour = 9
    const endHour = 19
    const slots: string[] = []

    const targetDate = new Date(dateStr)
    const targetDateStr = targetDate.toDateString()

    const staffDayBookings = appointments.filter(a => {
      if (a.staff_id !== staffId) return false
      if (['cancelled', 'no_show'].includes(a.status)) return false
      return new Date(a.start_time).toDateString() === targetDateStr
    })

    for (let hour = startHour; hour < endHour; hour++) {
      for (const minute of [0, 30]) {
        const candidateStart = new Date(dateStr)
        candidateStart.setHours(hour, minute, 0, 0)
        
        const candidateEnd = new Date(candidateStart.getTime() + durationMinutes * 60000)

        if (candidateEnd.getHours() > endHour || (candidateEnd.getHours() === endHour && candidateEnd.getMinutes() > 0)) {
          continue
        }

        const candStartMs = candidateStart.getTime()
        const candEndMs = candidateEnd.getTime()

        const isConflict = staffDayBookings.some(b => {
          const bStart = new Date(b.start_time).getTime()
          const bEnd = new Date(b.end_time).getTime()
          return candStartMs < bEnd && candEndMs > bStart
        })

        if (!isConflict) {
          slots.push(candidateStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
        }
      }
    }

    return slots
  },

  create: async (tenantId: string, aptData: any, userId: string, userName: string): Promise<Appointment> => {
    const existing = await AppointmentRepository.list(tenantId)
    const newStart = new Date(aptData.start_time).getTime()
    const newEnd = new Date(aptData.end_time).getTime()

    const hasConflict = existing.some(a => {
      if (a.staff_id !== aptData.staff_id) return false
      if (['cancelled', 'no_show'].includes(a.status)) return false
      
      const start = new Date(a.start_time).getTime()
      const end = new Date(a.end_time).getTime()

      return newStart < end && newEnd > start
    })

    if (hasConflict) {
      throw new Error(' Roster Scheduling Conflict: The selected stylist is already booked during this time slot.')
    }

    const customer = await CustomerRepository.getById(aptData.customer_id)
    const customerName = customer ? `${customer.first_name} ${customer.last_name || ''}`.trim() : 'Walk-in Client'

    const createdApt = await AppointmentRepository.create({
      tenant_id: tenantId,
      customer_id: aptData.customer_id,
      customer_name: customerName,
      staff_id: aptData.staff_id,
      staff_name: aptData.staff_name || 'Staff Stylist',
      start_time: aptData.start_time,
      end_time: aptData.end_time,
      status: 'scheduled',
      services: aptData.services || [],
      notes: aptData.notes || '',
      total_amount: aptData.total_amount || 0,
      discount_amount: aptData.discount_amount || 0,
      tax_amount: aptData.tax_amount || 0,
      final_amount: aptData.final_amount || 0,
      source: aptData.source || 'walk_in',
    } as any)

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'create',
      'appointment',
      createdApt.id,
      null,
      { customer_name: customerName, start_time: aptData.start_time }
    )

    await NotificationService.send(
      tenantId,
      'New Appointment Scheduled',
      `Booking registered for ${customerName} at ${new Date(aptData.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      'appointment',
      '/dashboard/appointments'
    )

    return createdApt
  },

  update: async (id: string, tenantId: string, updates: any, userId: string, userName: string): Promise<Appointment> => {
    const original = await AppointmentRepository.getById(id)
    if (!original) throw new Error('Appointment not found')

    if (
      (updates.staff_id && updates.staff_id !== original.staff_id) ||
      (updates.start_time && updates.start_time !== original.start_time) ||
      (updates.end_time && updates.end_time !== original.end_time)
    ) {
      const staffId = updates.staff_id || original.staff_id
      const startStr = updates.start_time || original.start_time
      const endStr = updates.end_time || original.end_time

      const startMs = new Date(startStr).getTime()
      const endMs = new Date(endStr).getTime()

      const existing = await AppointmentRepository.list(tenantId)
      const hasConflict = existing.some(a => {
        if (a.id === id) return false
        if (a.staff_id !== staffId) return false
        if (['cancelled', 'no_show'].includes(a.status)) return false

        const aStart = new Date(a.start_time).getTime()
        const aEnd = new Date(a.end_time).getTime()
        return startMs < aEnd && endMs > aStart
      })

      if (hasConflict) {
        throw new Error('Scheduling Conflict: The stylist has another appointment during this rescheduled time slot.')
      }
    }

    const updated = await AppointmentRepository.update(id, updates)

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'update',
      'appointment',
      id,
      { start_time: original.start_time, staff_id: original.staff_id },
      updates
    )

    await NotificationService.send(
      tenantId,
      'Appointment Modified',
      `Rescheduled booking for ${updated.customer_name} to ${new Date(updated.start_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}.`,
      'appointment',
      '/dashboard/appointments'
    )

    return updated
  },

  updateStatus: async (id: string, tenantId: string, status: string, userId: string, userName: string): Promise<Appointment> => {
    const original = await AppointmentRepository.getById(id)
    if (!original) throw new Error('Appointment not found')
    
    const updated = await AppointmentRepository.updateStatus(id, status)

    if (status === 'completed' && original.status !== 'completed') {
      const consumed: any[] = []
      if (original.service_name?.toLowerCase().includes('color') || original.service_name?.toLowerCase().includes('haircut') || original.services?.some((s: any) => s.name?.toLowerCase().includes('color'))) {
        consumed.push({ id: 'p1', name: 'Loreal Color Gel', qty: 1 })
      }
      if (original.service_name?.toLowerCase().includes('facial') || original.services?.some((s: any) => s.name?.toLowerCase().includes('facial'))) {
        consumed.push({ id: 'p2', name: 'O3+ Facial Kit', qty: 1 })
      }
      
      for (const item of consumed) {
        await ProductRepository.updateStock(item.id, -item.qty)
        await ProductRepository.logTransaction({
          tenant_id: tenantId,
          product_name: item.name,
          change_quantity: -item.qty,
          type: 'outgoing',
          reason: `Service Consumption: ${original.service_name || 'Salon Session'} (Apt #${original.id.slice(-4)})`
        })
        
        const p = await ProductRepository.getById(item.id)
        if (p && p.stock_quantity <= 5) {
          await NotificationService.send(
            tenantId,
            'Low Stock Alert',
            `Product ${p.name} has fallen below threshold. Current stock: ${p.stock_quantity}.`,
            'warning',
            '/dashboard/inventory'
          )
        }
      }
    }
    
    await AuditService.log(
      tenantId,
      userId,
      userName,
      'update_status',
      'appointment',
      id,
      { status: original.status },
      { status }
    )

    await NotificationService.send(
      tenantId,
      'Appointment Status Changed',
      `Booking status for ${updated.customer_name} set to: ${status.replace('_', ' ')}.`,
      'appointment',
      '/dashboard/appointments'
    )

    return updated
  },

  delete: async (id: string, tenantId: string, userId: string, userName: string): Promise<void> => {
    const original = await AppointmentRepository.getById(id)
    if (!original) throw new Error('Appointment not found')

    await AppointmentRepository.delete(id)

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'delete',
      'appointment',
      id,
      { customer_name: original.customer_name },
      null
    )
  }
}

import { StaffRepository, AppointmentRepository } from '@/lib/repositories/repositories'
import type { Staff } from '@/lib/types'
import { generateId } from '@/lib/utils'
import { AuditService } from './audit-service'
import { NotificationService } from './notification-service'

export const StaffService = {
  list: async (tenantId: string): Promise<Staff[]> => {
    return await StaffRepository.list(tenantId)
  },

  getById: async (id: string): Promise<Staff | null> => {
    return await StaffRepository.getById(id)
  },

  create: async (tenantId: string, staffData: any, userId: string, userName: string): Promise<Staff> => {
    const staff = await StaffRepository.create({
      tenant_id: tenantId,
      ...staffData,
      is_active: true,
    })

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'create_staff_profile',
      'staff',
      staff.id,
      null,
      { first_name: staff.first_name, role: staff.role }
    )

    await NotificationService.send(
      tenantId,
      'New Staff Added',
      `${staff.first_name} has been onboarded as a ${staff.role}.`,
      'success',
      '/dashboard/staff'
    )

    return staff
  },

  update: async (id: string, tenantId: string, updates: any, userId: string, userName: string): Promise<Staff> => {
    const original = await StaffRepository.getById(id)
    const updated = await StaffRepository.update(id, updates)

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'update_staff_profile',
      'staff',
      id,
      { first_name: original?.first_name, role: original?.role },
      updates
    )

    return updated
  },

  clockIn: async (staffId: string, tenantId: string, userId: string, userName: string): Promise<void> => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    await StaffRepository.logAttendance({
      tenant_id: tenantId,
      staff_id: staffId,
      clock_in: time,
      status: 'present'
    })

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'clock_in',
      'staff_attendance',
      staffId,
      null,
      { clock_in_time: time }
    )

    await NotificationService.send(
      tenantId,
      'Employee Clocked In',
      `${userName} logged in to work at ${time}.`,
      'info'
    )
  },

  clockOut: async (staffId: string, tenantId: string, userId: string, userName: string): Promise<void> => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    await StaffRepository.logAttendance({
      tenant_id: tenantId,
      staff_id: staffId,
      clock_out: time,
      status: 'present'
    })

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'clock_out',
      'staff_attendance',
      staffId,
      null,
      { clock_out_time: time }
    )

    await NotificationService.send(
      tenantId,
      'Employee Clocked Out',
      `${userName} completed their shift at ${time}.`,
      'info'
    )
  },

  submitLeave: async (staffId: string, tenantId: string, leaveData: { start_date: string; end_date: string; reason: string }, userId: string, userName: string): Promise<void> => {
    await StaffRepository.createLeave({
      tenant_id: tenantId,
      staff_id: staffId,
      ...leaveData,
      status: 'pending'
    })

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'request_leave',
      'staff_leave',
      staffId,
      null,
      leaveData
    )

    await NotificationService.send(
      tenantId,
      'Leave Request Submitted',
      `Shift leave requested by ${userName} from ${leaveData.start_date} to ${leaveData.end_date}.`,
      'warning',
      '/dashboard/staff'
    )
  },

  saveShifts: async (staffId: string, tenantId: string, shifts: any[], userId: string, userName: string): Promise<void> => {
    const allShifts = await StaffRepository.listShifts(tenantId)
    const filtered = allShifts.filter(s => s.staff_id !== staffId)
    const newShifts = [...filtered, ...shifts.map(s => ({ ...s, id: s.id || generateId(), tenant_id: tenantId, staff_id: staffId }))]
    
    await StaffRepository.saveShifts(newShifts)

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'update_roster_schedule',
      'staff_schedule',
      staffId,
      null,
      { shifts_count: shifts.length }
    )

    await NotificationService.send(
      tenantId,
      'Shift Schedule Adjusted',
      `Roster shifts rewritten for employee schedule files.`,
      'info',
      '/dashboard/staff'
    )
  },

  calculateCommissionPreview: async (staffId: string, tenantId: string): Promise<{ totalRevenue: number; commissionDues: number; appointmentsCount: number }> => {
    const staff = await StaffRepository.getById(staffId)
    if (!staff) return { totalRevenue: 0, commissionDues: 0, appointmentsCount: 0 }

    const appointments = await AppointmentRepository.list(tenantId)
    const completed = appointments.filter(a => a.staff_id === staffId && a.status === 'completed')

    const totalRevenue = completed.reduce((sum, a) => sum + (a.final_amount || 0), 0)
    const percent = staff.commission_percent || 0
    const commissionDues = Math.floor(totalRevenue * (percent / 100))

    return {
      totalRevenue,
      commissionDues,
      appointmentsCount: completed.length
    }
  }
}

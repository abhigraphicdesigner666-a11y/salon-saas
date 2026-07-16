'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, DollarSign, User, Scissors, AlignLeft, AlertCircle, RefreshCw, Copy, Trash2, CheckCircle2, Loader2, ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { AppointmentService, AuditService } from '@/services/business-services'
import { AuditRepository, StaffRepository } from '@/lib/repositories/repositories'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { permissionHelpers } from '@/lib/auth/permissions'

interface AppointmentDetailsModalProps {
  appointmentId: string | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AppointmentDetailsModal({ appointmentId, isOpen, onClose, onSuccess }: AppointmentDetailsModalProps) {
  const { tenant, user, role } = useAuth()
  const { success, error } = useToast()
  const activeTenantId = tenant?.id || 'demo-tenant-001'

  const [appointment, setAppointment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  
  // Edit mode toggles
  const [isEditing, setIsEditing] = useState(false)
  const [editStaff, setEditStaff] = useState<string>('')
  const [editDate, setEditDate] = useState<string>('')
  const [editTime, setEditTime] = useState<string>('')
  const [editNotes, setEditNotes] = useState<string>('')
  const [staffList, setStaffList] = useState<any[]>([])

  // Load appointment details & timeline logs
  const loadDetails = async () => {
    if (!appointmentId) return
    try {
      setLoading(true)
      const apt = await AppointmentService.getById(appointmentId)
      if (apt) {
        setAppointment(apt)
        setEditStaff(apt.staff_id)
        setEditNotes(apt.notes)
        const d = new Date(apt.start_time)
        setEditDate(d.toISOString().split('T')[0])
        setEditTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
        
        // Load audit logs
        const logs = await AuditRepository.list(activeTenantId)
        const filtered = logs.filter(l => l.entity_id === appointmentId)
        setAuditLogs(filtered)
      }
    } catch (e) {
      console.error('Failed to load details', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && appointmentId) {
      loadDetails()
      // Load staff list for rescheduling
      StaffRepository.list(activeTenantId).then(setStaffList)
    }
    setIsEditing(false)
  }, [isOpen, appointmentId])

  // Status transitions workflow
  const handleStatusChange = async (newStatus: string) => {
    if (!appointment) return

    // Role-gating check: Stylists can only set status to 'completed' or 'checked_in' for themselves
    if (role === 'stylist' || role === 'beautician') {
      if (appointment.staff_id !== user?.id) {
        error('Action Prohibited', 'Stylists can only modify their own appointments.')
        return
      }
    }

    // Gating check: Receptionist cannot edit cancelled/completed appointments
    if (role === 'receptionist' && ['completed', 'cancelled', 'no_show'].includes(appointment.status)) {
      error('Access Denied', 'Completed or cancelled appointments cannot be edited by receptionists.')
      return
    }

    try {
      setSubmitting(true)
      await AppointmentService.updateStatus(
        appointment.id,
        activeTenantId,
        newStatus,
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Status Updated', `Appointment set to ${newStatus.replace('_', ' ')}.`)
      loadDetails()
      onSuccess()
    } catch (e: any) {
      error('Update failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Update details (rescheduling, stylist change)
  const handleUpdate = async () => {
    if (!appointment) return
    try {
      setSubmitting(true)
      
      const start = new Date(editDate)
      const [h, m] = editTime.split(':')
      start.setHours(parseInt(h), parseInt(m), 0, 0)
      
      const totalDuration = appointment.services.reduce((sum: number, s: any) => sum + s.duration_minutes, 0)
      const end = new Date(start.getTime() + totalDuration * 60000)

      const selectedSt = staffList.find(s => s.id === editStaff)
      const staffName = selectedSt ? `${selectedSt.first_name} ${selectedSt.last_name || ''}`.trim() : appointment.staff_name

      await AppointmentService.update(
        appointment.id,
        activeTenantId,
        {
          staff_id: editStaff,
          staff_name: staffName,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          notes: editNotes,
        },
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )

      success('Appointment Updated', 'Rescheduled details applied successfully.')
      setIsEditing(false)
      loadDetails()
      onSuccess()
    } catch (e: any) {
      error('Update failed', e.message || 'Could not reschedule.')
    } finally {
      setSubmitting(false)
    }
  }

  // Duplicate booking to tomorrow same time
  const handleDuplicate = async () => {
    if (!appointment) return
    try {
      setSubmitting(true)
      const originalStart = new Date(appointment.start_time)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0)

      const tomorrowEnd = new Date(tomorrow.getTime() + (new Date(appointment.end_time).getTime() - originalStart.getTime()))

      await AppointmentService.create(
        activeTenantId,
        {
          customer_id: appointment.customer_id,
          staff_id: appointment.staff_id,
          staff_name: appointment.staff_name,
          start_time: tomorrow.toISOString(),
          end_time: tomorrowEnd.toISOString(),
          services: appointment.services,
          notes: `[Duplicated] ${appointment.notes || ''}`,
          total_amount: appointment.total_amount,
          discount_amount: appointment.discount_amount,
          tax_amount: appointment.tax_amount,
          final_amount: appointment.final_amount,
          source: 'walk_in',
        },
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Duplicated', 'Appointment duplicated to tomorrow successfully.')
      onClose()
      onSuccess()
    } catch (e: any) {
      error('Conflict', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Delete appointment
  const handleDelete = async () => {
    if (!appointment) return
    if (!permissionHelpers.canDelete(role, 'appointments')) {
      error('Access Denied', 'Your account role is not authorized to delete appointments.')
      return
    }
    try {
      setSubmitting(true)
      await AppointmentService.delete(
        appointment.id,
        activeTenantId,
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Removed', 'Appointment deleted successfully.')
      onClose()
      onSuccess()
    } catch (e: any) {
      error('Delete failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const statusWorkflowOptions = [
    { value: 'scheduled', label: 'Booked', color: 'bg-indigo-500' },
    { value: 'confirmed', label: 'Confirm', color: 'bg-teal-500' },
    { value: 'checked_in', label: 'Check In', color: 'bg-emerald-500' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-sky-500' },
    { value: 'completed', label: 'Complete', color: 'bg-green-500' },
    { value: 'no_show', label: 'No Show', color: 'bg-amber-500' },
    { value: 'cancelled', label: 'Cancel', color: 'bg-rose-500' },
  ]

  const totalServicesPrice = appointment?.services.reduce((sum: number, s: any) => sum + s.price, 0) || 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-xs text-muted-foreground">Retrieving appointment record...</span>
          </div>
        ) : appointment ? (
          <div className="flex flex-col">
            <DialogHeader className="p-6 border-b pb-4 flex flex-row items-center justify-between">
              <div className="text-left">
                <DialogTitle className="text-xl">Appointment Details</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="capitalize">{appointment.source.replace('_', ' ')}</Badge>
                  <Badge variant="secondary" className="capitalize">{appointment.status.replace('_', ' ')}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handleDuplicate} disabled={submitting} title="Duplicate booking to tomorrow">
                  <Copy className="h-4 w-4" />
                </Button>
                {permissionHelpers.canDelete(role, 'appointments') && (
                  <Button variant="destructive" size="icon" onClick={handleDelete} disabled={submitting} title="Delete appointment">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </DialogHeader>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="mx-6 mt-4 w-[calc(100%-48px)]">
                <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                <TabsTrigger value="workflow" className="flex-1">Status Workflow</TabsTrigger>
                <TabsTrigger value="edit" className="flex-1">Edit / Reschedule</TabsTrigger>
                <TabsTrigger value="timeline" className="flex-1">Timeline Logs</TabsTrigger>
              </TabsList>

              {/* TABS 1: Details summary */}
              <TabsContent value="details" className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2.5">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Client Name</div>
                      <div className="font-semibold">{appointment.customer_name}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Scissors className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Assigned Stylist</div>
                      <div className="font-semibold">{appointment.staff_name}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Schedule Date</div>
                      <div className="font-semibold">{formatDate(appointment.start_time)}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Duration / Time</div>
                      <div className="font-semibold">
                        {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-2xl p-4 bg-muted/20">
                  <div className="text-xs font-bold text-muted-foreground uppercase mb-2">Services Selected</div>
                  <div className="space-y-1.5">
                    {appointment.services.map((s: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{s.name} ({s.duration_minutes} mins)</span>
                        <span className="font-semibold">{formatCurrency(s.price)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-bold text-primary mt-2">
                      <span>Total Amount</span>
                      <span>{formatCurrency(appointment.final_amount || totalServicesPrice)}</span>
                    </div>
                  </div>
                </div>

                {appointment.notes && (
                  <div className="flex items-start gap-2 text-sm bg-muted/30 p-3 rounded-xl">
                    <AlignLeft className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">Internal Notes</div>
                      <p className="mt-0.5">{appointment.notes}</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* TABS 2: Status transitions */}
              <TabsContent value="workflow" className="p-6 space-y-4">
                <div className="text-sm text-muted-foreground">
                  Select a workflow state to advance the appointment booking status. Transitions automatically notify users and write audit logs.
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusWorkflowOptions.map(opt => {
                    const isCurrent = appointment.status === opt.value
                    return (
                      <Button
                        key={opt.value}
                        type="button"
                        variant={isCurrent ? 'default' : 'outline'}
                        onClick={() => handleStatusChange(opt.value)}
                        disabled={submitting || isCurrent}
                        className="text-xs font-semibold"
                      >
                        {isCurrent && <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-400" />}
                        {opt.label}
                      </Button>
                    )
                  })}
                </div>
              </TabsContent>

              {/* TABS 3: Edit / Reschedule */}
              <TabsContent value="edit" className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Assign Staff</Label>
                    <Select value={editStaff} onValueChange={setEditStaff} disabled={submitting}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {staffList.map(st => (
                          <SelectItem key={st.id} value={st.id}>
                            {st.first_name} {st.last_name || ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} disabled={submitting} />
                  </div>
                  <div className="space-y-2">
                    <Label>Time Slot</Label>
                    <Input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} disabled={submitting} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Notes</Label>
                    <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} disabled={submitting} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={submitting}>Cancel</Button>
                  <Button variant="gradient" onClick={handleUpdate} disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Reschedule / Apply Changes
                  </Button>
                </div>
              </TabsContent>

              {/* TABS 4: Timeline logs */}
              <TabsContent value="timeline" className="p-6 max-h-[300px] overflow-y-auto">
                <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
                  {auditLogs.map((log, idx) => (
                    <div key={log.id || idx} className="flex gap-4 relative pl-8 text-sm">
                      <div className="absolute left-1.5 top-1.5 h-3.5 w-3.5 rounded-full bg-primary border-4 border-card" />
                      <div className="flex-1">
                        <div className="font-semibold capitalize">{log.action.replace('_', ' ')}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          By {log.user_name} on {new Date(log.created_at).toLocaleString()}
                        </div>
                        {log.new_values && Object.keys(log.new_values).length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1 bg-muted/40 p-2 rounded-lg">
                            {Object.entries(log.new_values).map(([k, v]) => (
                              <div key={k} className="flex items-center gap-1.5">
                                <span className="font-medium capitalize">{k.replace('_', ' ')}:</span>
                                {log.old_values?.[k] ? (
                                  <>
                                    <span>{String(log.old_values[k])}</span>
                                    <ArrowRight className="h-3 w-3" />
                                  </>
                                ) : null}
                                <span>{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <p className="text-muted-foreground text-center py-4 text-xs">No audit events recorded for this booking yet.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="p-6 border-t bg-muted/20">
              <Button variant="outline" onClick={onClose} disabled={submitting}>
                Dismiss Panel
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <AlertCircle className="h-8 w-8 text-rose-500 mb-2" />
            <span className="text-sm font-semibold">Appointment Record Not Found</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, DollarSign, User, Award, CheckSquare, ShieldCheck, Loader2, Save, LogIn, LogOut, Check, ListChecks } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { StaffService, ServiceCatalogService } from '@/services/business-services'
import { StaffRepository } from '@/lib/repositories/repositories'
import { formatCurrency, getInitials } from '@/lib/utils'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { permissionHelpers } from '@/lib/auth/permissions'

interface StaffDetailsModalProps {
  staffId: string | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function StaffDetailsModal({ staffId, isOpen, onClose, onSuccess }: StaffDetailsModalProps) {
  const { tenant, user, role } = useAuth()
  const { success, error } = useToast()
  const activeTenantId = tenant?.id || 'demo-tenant-001'

  const [staff, setStaff] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Sub-data pools
  const [shifts, setShifts] = useState<any[]>([])
  const [leaves, setLeaves] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [commissionPreview, setCommissionPreview] = useState<any>(null)

  // Leaves application form
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ start_date: '', end_date: '', reason: '' })

  // Shifts assignment form
  const [isEditingShifts, setIsEditingShifts] = useState(false)
  const [shiftRoster, setShiftRoster] = useState<any[]>([])

  // Services Matrix
  const [staffServices, setStaffServices] = useState<string[]>([])

  const loadStaffDetails = async () => {
    if (!staffId) return
    try {
      setLoading(true)
      const data = await StaffRepository.getById(staffId)
      if (data) {
        setStaff(data)
        
        // Load shifts
        const sh = await StaffRepository.listShifts(activeTenantId)
        const myShifts = sh.filter(s => s.staff_id === staffId)
        setShifts(myShifts)
        setShiftRoster(myShifts)

        // Load leaves
        const lv = await StaffRepository.listLeaves(activeTenantId)
        setLeaves(lv.filter(l => l.staff_id === staffId))

        // Load attendance
        const att = await StaffRepository.listAttendance(activeTenantId)
        setAttendance(att.filter(a => a.staff_id === staffId))

        // Load services catalog
        const srv = await ServiceCatalogService.list(activeTenantId)
        setServices(srv)
        
        // Initialize stylist service capability lists
        setStaffServices(data.specializations || [])

        // Load commission preview
        const comm = await StaffService.calculateCommissionPreview(staffId, activeTenantId)
        setCommissionPreview(comm)
      }
    } catch (e) {
      console.error('Failed to load employee details', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && staffId) {
      loadStaffDetails()
    }
    setShowLeaveForm(false)
    setIsEditingShifts(false)
  }, [isOpen, staffId])

  // Clock In
  const handleClockIn = async () => {
    if (!staff) return
    try {
      setSubmitting(true)
      await StaffService.clockIn(
        staff.id,
        activeTenantId,
        user?.id || 'anonymous',
        `${staff.first_name} ${staff.last_name || ''}`.trim()
      )
      success('Clocked In', 'Shift attendance successfully logged.')
      loadStaffDetails()
      onSuccess()
    } catch (e: any) {
      error('Clock in failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Clock Out
  const handleClockOut = async () => {
    if (!staff) return
    try {
      setSubmitting(true)
      await StaffService.clockOut(
        staff.id,
        activeTenantId,
        user?.id || 'anonymous',
        `${staff.first_name} ${staff.last_name || ''}`.trim()
      )
      success('Clocked Out', 'Shift completion logged.')
      loadStaffDetails()
      onSuccess()
    } catch (e: any) {
      error('Clock out failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit Leave Request
  const handleLeaveSubmit = async () => {
    if (!staff || !leaveForm.start_date || !leaveForm.end_date || !leaveForm.reason) return
    try {
      setSubmitting(true)
      await StaffService.submitLeave(
        staff.id,
        activeTenantId,
        leaveForm,
        user?.id || 'anonymous',
        `${staff.first_name} ${staff.last_name || ''}`.trim()
      )
      success('Leave Submitted', 'Leave application sent for review.')
      setShowLeaveForm(false)
      setLeaveForm({ start_date: '', end_date: '', reason: '' })
      loadStaffDetails()
    } catch (e: any) {
      error('Submit failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Save Shifts Roster
  const handleSaveShifts = async () => {
    if (!staff) return
    try {
      setSubmitting(true)
      await StaffService.saveShifts(
        staff.id,
        activeTenantId,
        shiftRoster,
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Roster Saved', 'Shifts configuration updated successfully.')
      setIsEditingShifts(false)
      loadStaffDetails()
    } catch (e: any) {
      error('Roster save failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle Roster day active/inactive
  const handleToggleDay = (dayNum: number) => {
    const idx = shiftRoster.findIndex(s => s.day_of_week === dayNum)
    if (idx !== -1) {
      const updated = [...shiftRoster]
      updated[idx].is_working = !updated[idx].is_working
      setShiftRoster(updated)
    } else {
      setShiftRoster([...shiftRoster, { day_of_week: dayNum, start_time: '09:00', end_time: '18:00', is_working: true }])
    }
  }

  // Edit Shift times
  const handleTimeChange = (dayNum: number, field: 'start_time' | 'end_time', value: string) => {
    const idx = shiftRoster.findIndex(s => s.day_of_week === dayNum)
    if (idx !== -1) {
      const updated = [...shiftRoster]
      updated[idx][field] = value
      setShiftRoster(updated)
    }
  }

  // Toggle Stylist Qualification Matrix
  const handleToggleServiceMatrix = async (srvName: string) => {
    if (!staff) return
    const hasSrv = staffServices.includes(srvName)
    const updatedMatrix = hasSrv ? staffServices.filter(s => s !== srvName) : [...staffServices, srvName]
    
    try {
      setSubmitting(true)
      await StaffService.update(
        staff.id,
        activeTenantId,
        { specializations: updatedMatrix },
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      setStaffServices(updatedMatrix)
      success('Matrix Updated', `${srvName} qualifications status toggled.`)
    } catch (e: any) {
      error('Failed to toggle matrix', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const daysOfWeek = [
    { num: 1, label: 'Monday' },
    { num: 2, label: 'Tuesday' },
    { num: 3, label: 'Wednesday' },
    { num: 4, label: 'Thursday' },
    { num: 5, label: 'Friday' },
    { num: 6, label: 'Saturday' },
    { num: 0, label: 'Sunday' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-xs text-muted-foreground">Retrieving employee file...</span>
          </div>
        ) : staff ? (
          <div className="flex flex-col text-left">
            {/* Header Block */}
            <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="text-lg">{getInitials(staff.first_name, staff.last_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{staff.first_name} {staff.last_name || ''}</h2>
                    <Badge variant="secondary" className="capitalize">{staff.role}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {staff.email} • {staff.phone || 'No phone set'}
                  </div>
                </div>
              </div>

              {/* Attendance triggers */}
              {user?.id === staff.id && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleClockIn} disabled={submitting}>
                    <LogIn className="h-4 w-4 mr-1.5 text-emerald-500" /> Clock In
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClockOut} disabled={submitting}>
                    <LogOut className="h-4 w-4 mr-1.5 text-rose-500" /> Clock Out
                  </Button>
                </div>
              )}
            </div>

            {/* Quick KPI stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 bg-muted/20 border-b">
              <Card className="bg-card shadow-none border-none"><CardContent className="p-3 text-center"><Clock className="h-4 w-4 mx-auto text-violet-500 mb-1" /><div className="text-lg font-bold">{staff.total_appointments || 0}</div><div className="text-[10px] text-muted-foreground uppercase font-semibold">Total Sessions</div></CardContent></Card>
              <Card className="bg-card shadow-none border-none"><CardContent className="p-3 text-center"><DollarSign className="h-4 w-4 mx-auto text-emerald-500 mb-1" /><div className="text-lg font-bold">{formatCurrency(staff.revenue_generated || 0)}</div><div className="text-[10px] text-muted-foreground uppercase font-semibold">Revenue Generated</div></CardContent></Card>
              <Card className="bg-card shadow-none border-none"><CardContent className="p-3 text-center"><Award className="h-4 w-4 mx-auto text-amber-500 mb-1" /><div className="text-lg font-bold">{staff.rating || '4.8'} ★</div><div className="text-[10px] text-muted-foreground uppercase font-semibold">Stylist Rating</div></CardContent></Card>
              <Card className="bg-card shadow-none border-none"><CardContent className="p-3 text-center"><ListChecks className="h-4 w-4 mx-auto text-rose-500 mb-1" /><div className="text-lg font-bold">{commissionPreview?.commissionDues ? formatCurrency(commissionPreview.commissionDues) : '₹0'}</div><div className="text-[10px] text-muted-foreground uppercase font-semibold">Commission Preview ({staff.commission_percent}%)</div></CardContent></Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="roster" className="w-full">
              <TabsList className="mx-6 mt-4 w-[calc(100%-48px)]">
                <TabsTrigger value="roster" className="flex-1">Shift Schedule</TabsTrigger>
                <TabsTrigger value="attendance" className="flex-1">Clock Log</TabsTrigger>
                <TabsTrigger value="leaves" className="flex-1">Leaves ({leaves.length})</TabsTrigger>
                <TabsTrigger value="matrix" className="flex-1">Qualifications</TabsTrigger>
                <TabsTrigger value="details" className="flex-1">Profile Files</TabsTrigger>
              </TabsList>

              {/* TABS 1: Shift roster */}
              <TabsContent value="roster" className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-semibold">Weekly Shifts Schedule</div>
                  {role !== 'stylist' && role !== 'beautician' && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditingShifts(!isEditingShifts)}>
                      {isEditingShifts ? 'Cancel' : 'Modify Roster'}
                    </Button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {daysOfWeek.map(day => {
                    const shift = (isEditingShifts ? shiftRoster : shifts).find(s => s.day_of_week === day.num)
                    const isWorking = shift?.is_working || false

                    return (
                      <div key={day.num} className="flex items-center justify-between p-3 border rounded-xl bg-card">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => isEditingShifts && handleToggleDay(day.num)}
                            disabled={!isEditingShifts}
                            className={cn(
                              "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                              isWorking ? "bg-primary border-primary text-white" : "border-muted"
                            )}
                          >
                            {isWorking && <Check className="h-3.5 w-3.5" />}
                          </button>
                          <span className="text-sm font-semibold">{day.label}</span>
                        </div>

                        {isWorking && shift ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {isEditingShifts ? (
                              <div className="flex items-center gap-1.5">
                                <Input
                                  type="time"
                                  className="w-[100px] h-8"
                                  value={shift.start_time}
                                  onChange={e => handleTimeChange(day.num, 'start_time', e.target.value)}
                                />
                                <span>to</span>
                                <Input
                                  type="time"
                                  className="w-[100px] h-8"
                                  value={shift.end_time}
                                  onChange={e => handleTimeChange(day.num, 'end_time', e.target.value)}
                                />
                              </div>
                            ) : (
                              <strong>{shift.start_time} - {shift.end_time}</strong>
                            )}
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Off Duty</Badge>
                        )}
                      </div>
                    )
                  })}
                </div>

                {isEditingShifts && (
                  <div className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="outline" size="sm" onClick={() => setIsEditingShifts(false)} disabled={submitting}>Cancel</Button>
                    <Button variant="gradient" size="sm" onClick={handleSaveShifts} disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                      Save Shift Changes
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* TABS 2: Attendance Logs */}
              <TabsContent value="attendance" className="p-6 max-h-[300px] overflow-y-auto">
                <div className="space-y-2">
                  {attendance.map((att, idx) => (
                    <div key={att.id || idx} className="flex justify-between items-center p-3 border rounded-xl hover:bg-muted/10">
                      <div>
                        <div className="text-sm font-semibold">{att.date}</div>
                        <div className="text-xs text-muted-foreground">Clock-in: {att.clock_in}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant="success" className="text-[10px] capitalize">Present</Badge>
                        {att.clock_out && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">Clock-out: {att.clock_out}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {attendance.length === 0 && (
                    <p className="text-muted-foreground text-center py-4 text-xs">No check-in logs recorded.</p>
                  )}
                </div>
              </TabsContent>

              {/* TABS 3: Leaves */}
              <TabsContent value="leaves" className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-semibold">Absence Calendar & Leaves History</div>
                  {user?.id === staff.id && (
                    <Button variant="outline" size="sm" onClick={() => setShowLeaveForm(!showLeaveForm)}>
                      Apply Leave
                    </Button>
                  )}
                </div>

                {showLeaveForm && (
                  <div className="grid grid-cols-2 gap-3 p-4 border rounded-2xl bg-muted/20">
                    <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase">Submit Shift Leave Request</div>
                    <div>
                      <Label>Start Date</Label>
                      <Input type="date" value={leaveForm.start_date} onChange={e => setLeaveForm({ ...leaveForm, start_date: e.target.value })} />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input type="date" value={leaveForm.end_date} onChange={e => setLeaveForm({ ...leaveForm, end_date: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                      <Label>Reason</Label>
                      <Input placeholder="Sick leave, personal break..." value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
                    </div>
                    <div className="col-span-2 flex justify-end gap-2 mt-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowLeaveForm(false)}>Cancel</Button>
                      <Button variant="gradient" size="sm" onClick={handleLeaveSubmit} disabled={submitting}>Submit Request</Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {leaves.map((lv, idx) => (
                    <div key={lv.id || idx} className="p-3 border rounded-xl flex justify-between items-center">
                      <div>
                        <div className="text-sm font-semibold">{lv.reason}</div>
                        <div className="text-xs text-muted-foreground">From: {lv.start_date} to {lv.end_date}</div>
                      </div>
                      <Badge variant={lv.status === 'approved' ? 'success' : 'warning'} className="capitalize text-[10px]">
                        {lv.status}
                      </Badge>
                    </div>
                  ))}
                  {leaves.length === 0 && (
                    <p className="text-muted-foreground text-center py-4 text-xs">No leave history records found.</p>
                  )}
                </div>
              </TabsContent>

              {/* TABS 4: Service Matrix */}
              <TabsContent value="matrix" className="p-6 space-y-4">
                <div className="text-sm text-muted-foreground">
                  Stylist capabilities matrix. Toggling certifications updates staff eligibility during appointments scheduling.
                </div>

                <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                  {services.map(srv => {
                    const isQualified = staffServices.includes(srv.name) || staff.specializations?.includes(srv.name)
                    return (
                      <div
                        key={srv.id}
                        onClick={() => handleToggleServiceMatrix(srv.name)}
                        className={cn(
                          "flex items-center justify-between p-3 border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors",
                          isQualified && "border-primary bg-primary/5"
                        )}
                      >
                        <div>
                          <div className="text-sm font-semibold">{srv.name}</div>
                          <div className="text-xs text-muted-foreground">{srv.duration_minutes} mins • {srv.category_name}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={isQualified ? 'default' : 'secondary'} className="text-[10px]">
                            {isQualified ? 'Certified' : 'Not Certified'}
                          </Badge>
                          <div className={cn("w-5 h-5 rounded border flex items-center justify-center", isQualified && "bg-primary border-primary text-white")}>
                            {isQualified && <Check className="h-3.5 w-3.5" />}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </TabsContent>

              {/* TABS 5: Details profile */}
              <TabsContent value="details" className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">Commission Structure</span>
                    <strong>{staff.commission_percent}% of service revenue</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Stylist Role</span>
                    <strong className="capitalize">{staff.role}</strong>
                  </div>
                  {staff.bio && (
                    <div className="col-span-2 bg-muted/30 p-3 rounded-xl">
                      <span className="text-muted-foreground block text-xs">Employee Bio</span>
                      <p className="mt-0.5 text-muted-foreground">{staff.bio}</p>
                    </div>
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
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, ChevronLeft, ChevronRight, Clock, Filter, Loader2, Calendar as CalendarIcon, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn, formatCurrency, formatTime, getStatusColor, getInitials } from '@/lib/utils'
import { AppointmentService } from '@/services/business-services'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { AppointmentWizard } from '@/components/shared/appointment-wizard'
import { AppointmentDetailsModal } from '@/components/shared/appointment-details-modal'
import { permissionHelpers } from '@/lib/auth/permissions'
import type { Appointment } from '@/lib/types'

export default function AppointmentsPage() {
  const { tenant, user, role } = useAuth()
  const { error } = useToast()
  
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'day' | 'week' | 'month'>('day')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showNewWizard, setShowNewWizard] = useState(false)
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null)

  const activeTenantId = tenant?.id || 'demo-tenant-001'

  // Fetch appointments list
  const fetchAppointments = async () => {
    try {
      setLoading(true)
      let data = await AppointmentService.list(activeTenantId)
      
      // Stylists/Beauticians can only see their own appointments
      if (role === 'stylist' || role === 'beautician') {
        data = data.filter(a => a.staff_id === user?.id)
      }
      
      setAppointmentsList(data)
    } catch (e: any) {
      error('Failed to load appointments', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [activeTenantId, role, user?.id])

  const today = new Date()
  const hours = Array.from({ length: 11 }, (_, i) => i + 9) // 9 AM to 7 PM business hours

  // Current Day appointments
  const dayApts = appointmentsList.filter(a => {
    const d = new Date(a.start_time)
    return d.toDateString() === currentDate.toDateString()
  }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  const getWeekDays = () => {
    const start = new Date(currentDate)
    start.setDate(start.getDate() - start.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return d
    })
  }

  const getMonthDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    const startPad = first.getDay()
    const days: (Date | null)[] = Array.from({ length: startPad }, () => null)
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
    return days
  }

  const navigate = (dir: number) => {
    const d = new Date(currentDate)
    if (view === 'day') d.setDate(d.getDate() + dir)
    else if (view === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setMonth(d.getMonth() + dir)
    setCurrentDate(d)
  }

  const aptsByDay = (date: Date) => appointmentsList.filter(a => new Date(a.start_time).toDateString() === date.toDateString())

  // KPI Calculations
  const stats = {
    total: dayApts.length,
    confirmed: dayApts.filter(a => a.status === 'confirmed').length,
    completed: dayApts.filter(a => a.status === 'completed').length,
    cancelled: dayApts.filter(a => a.status === 'cancelled').length,
  }

  const dateStr = currentDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const canCreateAppointment = permissionHelpers.canCreate(role, 'appointments')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">Manage bookings and scheduling rosters</p>
        </div>
        {canCreateAppointment && (
          <Button variant="gradient" onClick={() => setShowNewWizard(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Appointment
          </Button>
        )}
      </div>

      {/* Stats KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Today', value: stats.total, color: 'text-foreground' },
          { label: 'Confirmed Today', value: stats.confirmed, color: 'text-indigo-500' },
          { label: 'Completed Today', value: stats.completed, color: 'text-emerald-500' },
          { label: 'Cancelled Today', value: stats.cancelled, color: 'text-rose-500' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <div className={cn('text-2xl font-bold', s.color)}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
            <Button variant="outline" size="icon" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
            <span className="text-sm font-semibold">{dateStr}</span>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as 'day' | 'week' | 'month')}>
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Day View */}
              {view === 'day' && (
                <div className="space-y-1">
                  {hours.map(hour => {
                    const hourApts = dayApts.filter(a => new Date(a.start_time).getHours() === hour)
                    return (
                      <div key={hour} className="flex gap-4 min-h-[65px] group">
                        <div className="w-16 shrink-0 text-xs text-muted-foreground pt-2.5 text-right font-medium">
                          {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                        </div>
                        <div className="flex-1 border-t border-border pt-2 group-hover:bg-muted/20 rounded-xl px-2 transition-colors">
                          {hourApts.length > 0 ? (
                            <div className="space-y-2">
                              {hourApts.map(apt => {
                                const initialText = getInitials(apt.customer_name.split(' ')[0], apt.customer_name.split(' ')[1] || '')
                                return (
                                  <div
                                    key={apt.id}
                                    onClick={() => setSelectedAptId(apt.id)}
                                    className="flex items-center gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors"
                                  >
                                    <div className="w-1 h-10 rounded-full bg-primary shrink-0" />
                                    <Avatar className="h-8 w-8 shrink-0"><AvatarFallback className="text-[10px]">{initialText}</AvatarFallback></Avatar>
                                    <div className="flex-1 min-w-0 text-left">
                                      <div className="text-sm font-semibold">{apt.customer_name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {apt.services?.[0]?.service_name || 'Beauty Service'} • Stylist: {apt.staff_name}
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <div className="text-xs font-semibold">{formatTime(apt.start_time)}</div>
                                      <Badge className={cn('text-[10px] mt-1', getStatusColor(apt.status))}>
                                        {apt.status.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="h-full flex items-center">
                              {canCreateAppointment && (
                                <button
                                  onClick={() => {
                                    const d = new Date(currentDate)
                                    d.setHours(hour, 0, 0, 0)
                                    // Preselect date for wizard
                                    const dateInput = d.toISOString().split('T')[0]
                                    setShowNewWizard(true)
                                  }}
                                  className="text-xs text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity font-semibold"
                                >
                                  + Create booking at {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Week View */}
              {view === 'week' && (
                <div className="grid grid-cols-7 gap-2">
                  {getWeekDays().map(day => {
                    const dayApts = aptsByDay(day)
                    const isToday = day.toDateString() === today.toDateString()
                    return (
                      <div key={day.toISOString()} className={cn('min-h-[220px] rounded-2xl border p-3.5 transition-colors', isToday ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30')}>
                        <div className={cn('text-xs font-medium mb-3 text-center', isToday ? 'text-primary' : 'text-muted-foreground')}>
                          {day.toLocaleDateString('en-IN', { weekday: 'short' })}
                          <div className={cn('text-lg font-bold mt-0.5', isToday ? 'text-primary' : 'text-foreground')}>{day.getDate()}</div>
                        </div>
                        <div className="space-y-1.5">
                          {dayApts.slice(0, 3).map(apt => (
                            <div
                              key={apt.id}
                              onClick={() => setSelectedAptId(apt.id)}
                              className="p-2 rounded-xl bg-primary/5 border border-primary/10 text-[10px] cursor-pointer hover:bg-primary/10 text-left font-medium"
                            >
                              <div className="font-semibold truncate">{formatTime(apt.start_time)}</div>
                              <div className="text-muted-foreground truncate">{apt.customer_name}</div>
                            </div>
                          ))}
                          {dayApts.length > 3 && <div className="text-[10px] text-center text-muted-foreground font-semibold">+{dayApts.length - 3} more</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Month View */}
              {view === 'month' && (
                <div>
                  <div className="grid grid-cols-7 gap-px mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-px bg-muted/20 rounded-2xl overflow-hidden border">
                    {getMonthDays().map((day, i) => {
                      if (!day) return <div key={`pad-${i}`} className="h-20 bg-background/50" />
                      const dayApts = aptsByDay(day)
                      const isToday = day.toDateString() === today.toDateString()
                      return (
                        <div
                          key={day.toISOString()}
                          onClick={() => { setCurrentDate(day); setView('day') }}
                          className={cn('h-20 bg-card p-2 cursor-pointer border-r border-b border-muted/20 hover:bg-muted/10 transition-colors text-left flex flex-col justify-between', isToday && 'bg-primary/5')}
                        >
                          <div className={cn('text-xs font-medium', isToday ? 'font-bold text-primary' : 'text-muted-foreground')}>{day.getDate()}</div>
                          {dayApts.length > 0 && (
                            <div className="flex items-center gap-1.5 bg-primary/10 rounded-lg px-1.5 py-0.5 w-fit">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                              <span className="text-[10px] font-bold text-primary">{dayApts.length}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Appointment Creation Wizard Dialog */}
      <AppointmentWizard
        isOpen={showNewWizard}
        onClose={() => setShowNewWizard(false)}
        onSuccess={fetchAppointments}
      />

      {/* Appointment Detail Dialog */}
      <AppointmentDetailsModal
        appointmentId={selectedAptId}
        isOpen={!!selectedAptId}
        onClose={() => setSelectedAptId(null)}
        onSuccess={fetchAppointments}
      />
    </motion.div>
  )
}


'use client'

import React, { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, Users, BookOpen, UserPlus, Check, ChevronRight, ChevronLeft, Loader2, Star } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CustomerRepository, ServiceRepository, StaffRepository } from '@/lib/repositories/repositories'
import { AppointmentService, CustomerService } from '@/services/business-services'
import { formatCurrency, getInitials } from '@/lib/utils'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'

interface AppointmentWizardProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AppointmentWizard({ isOpen, onClose, onSuccess }: AppointmentWizardProps) {
  const { tenant, user } = useAuth()
  const { success, error } = useToast()
  const activeTenantId = tenant?.id || 'demo-tenant-001'

  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  // Data pools
  const [customers, setCustomers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Form selections
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showInlineCustomerAdd, setShowInlineCustomerAdd] = useState(false)
  const [newCustomerData, setNewCustomerData] = useState({ first_name: '', last_name: '', phone: '', email: '' })

  const [selectedServices, setSelectedServices] = useState<any[]>([])
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [source, setSource] = useState('walk_in')

  // Load wizard options
  useEffect(() => {
    if (!isOpen) return
    const loadData = async () => {
      try {
        const cList = await CustomerRepository.list(activeTenantId)
        const sList = await ServiceRepository.list(activeTenantId)
        const stList = await StaffRepository.list(activeTenantId)
        setCustomers(cList)
        setServices(sList)
        setStaff(stList)
      } catch (e) {
        console.error('Wizard load failed', e)
      }
    }
    loadData()
  }, [isOpen, activeTenantId])

  // Get available slots when Date/Staff changes
  useEffect(() => {
    if (!selectedDate || !selectedStaff) return
    const fetchSlots = async () => {
      try {
        setLoadingSlots(true)
        const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0) || 30
        const slots = await AppointmentService.getAvailableSlots(activeTenantId, selectedDate, selectedStaff.id, totalDuration)
        setAvailableSlots(slots)
      } catch (e) {
        console.error('Slots fetch failed', e)
      } finally {
        setLoadingSlots(false)
      }
    }
    fetchSlots()
  }, [selectedDate, selectedStaff, selectedServices, activeTenantId])

  // Handle step increments
  const nextStep = () => setStep((s) => Math.min(s + 1, 6))
  const prevStep = () => setStep((s) => Math.max(s - 1, 1))

  // Inline Customer Addition
  const handleInlineCustomerCreate = async () => {
    if (!newCustomerData.first_name || !newCustomerData.phone) {
      error('Fields required', 'First name and phone number are required.')
      return
    }
    try {
      setSubmitting(true)
      const created = await CustomerService.create(
        activeTenantId,
        newCustomerData,
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      setSelectedCustomer(created)
      setShowInlineCustomerAdd(false)
      setNewCustomerData({ first_name: '', last_name: '', phone: '', email: '' })
      // Refresh customer list
      const cList = await CustomerRepository.list(activeTenantId)
      setCustomers(cList)
      success('Customer Registered', `${created.first_name} is now selected.`)
    } catch (e: any) {
      error('Creation failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle service selection
  const toggleService = (srv: any) => {
    const exists = selectedServices.some(s => s.id === srv.id)
    if (exists) {
      setSelectedServices(selectedServices.filter(s => s.id !== srv.id))
    } else {
      setSelectedServices([...selectedServices, srv])
    }
  }

  // Submit Booking
  const handleBookingSubmit = async () => {
    if (!selectedCustomer || selectedServices.length === 0 || !selectedStaff || !selectedDate || !selectedTime) {
      error('Missing fields', 'Please complete all steps of the wizard.')
      return
    }

    try {
      setSubmitting(true)
      
      const start = new Date(selectedDate)
      const [h, m] = selectedTime.split(':')
      start.setHours(parseInt(h), parseInt(m), 0, 0)
      
      const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0)
      const end = new Date(start.getTime() + totalDuration * 60000)

      const totalAmt = selectedServices.reduce((sum, s) => sum + s.price, 0)
      const taxAmt = Math.floor(totalAmt * 0.18) // 18% Tax
      const finalAmt = totalAmt + taxAmt

      await AppointmentService.create(
        activeTenantId,
        {
          customer_id: selectedCustomer.id,
          staff_id: selectedStaff.id,
          staff_name: `${selectedStaff.first_name} ${selectedStaff.last_name || ''}`.trim(),
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          services: selectedServices.map(s => ({
            service_id: s.id,
            name: s.name,
            price: s.price,
            duration_minutes: s.duration_minutes
          })),
          notes,
          total_amount: totalAmt,
          discount_amount: 0,
          tax_amount: taxAmt,
          final_amount: finalAmt,
          source,
        },
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )

      success('Booking Created', `Appointment scheduled for ${selectedCustomer.first_name}.`)
      onSuccess()
      onClose()
      resetWizard()
    } catch (e: any) {
      error('Conflict Detected', e.message || 'The selected slot overlaps with another booking.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetWizard = () => {
    setStep(1)
    setSelectedCustomer(null)
    setSelectedServices([])
    setSelectedStaff(null)
    setSelectedDate('')
    setSelectedTime('')
    setNotes('')
    setSource('walk_in')
  }

  // Filtered Customer Pool
  const filteredCustomers = customers.filter(c =>
    `${c.first_name} ${c.last_name} ${c.phone}`.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const stepsInfo = [
    { label: 'Client', icon: Users },
    { label: 'Services', icon: BookOpen },
    { label: 'Stylist', icon: Star },
    { label: 'Date', icon: CalendarIcon },
    { label: 'Time', icon: Clock },
    { label: 'Confirm', icon: Check },
  ]

  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0)
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 border-b pb-4">
          <DialogTitle className="text-xl">Appointment Scheduler Wizard</DialogTitle>
          {/* Step Indicators */}
          <div className="flex items-center justify-between mt-4">
            {stepsInfo.map((s, idx) => {
              const num = idx + 1
              const isActive = step === num
              const isPast = step > num
              return (
                <div key={num} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-colors",
                      isActive && "bg-primary border-primary text-white",
                      isPast && "bg-primary/10 border-primary text-primary",
                      !isActive && !isPast && "bg-card text-muted-foreground"
                    )}>
                      {isPast ? <Check className="h-4 w-4" /> : num}
                    </div>
                    <span className="text-[10px] mt-1 font-medium hidden sm:inline">{s.label}</span>
                  </div>
                  {idx < stepsInfo.length - 1 && (
                    <div className={cn("h-0.5 flex-1 mx-2 mb-4 bg-muted", step > num && "bg-primary")} />
                  )}
                </div>
              )
            })}
          </div>
        </DialogHeader>

        {/* Wizard Pages Scroll Container */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[380px]">
          {/* STEP 1: Select Customer */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-2">
                <h3 className="font-bold">Select Client</h3>
                <Button variant="outline" size="sm" onClick={() => setShowInlineCustomerAdd(!showInlineCustomerAdd)}>
                  <UserPlus className="h-4 w-4 mr-2" /> Quick Add
                </Button>
              </div>

              {showInlineCustomerAdd ? (
                <div className="grid grid-cols-2 gap-3 p-4 border rounded-2xl bg-muted/30">
                  <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase">Inline Customer Registry</div>
                  <div><Label>First Name</Label><Input placeholder="Priya" value={newCustomerData.first_name} onChange={e => setNewCustomerData({...newCustomerData, first_name: e.target.value})} /></div>
                  <div><Label>Last Name</Label><Input placeholder="Sharma" value={newCustomerData.last_name} onChange={e => setNewCustomerData({...newCustomerData, last_name: e.target.value})} /></div>
                  <div><Label>Phone</Label><Input placeholder="9876543210" value={newCustomerData.phone} onChange={e => setNewCustomerData({...newCustomerData, phone: e.target.value})} /></div>
                  <div><Label>Email</Label><Input placeholder="priya@email.com" value={newCustomerData.email} onChange={e => setNewCustomerData({...newCustomerData, email: e.target.value})} /></div>
                  <div className="col-span-2 flex justify-end gap-2 mt-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowInlineCustomerAdd(false)}>Cancel</Button>
                    <Button variant="gradient" size="sm" onClick={handleInlineCustomerCreate} disabled={submitting}>Register</Button>
                  </div>
                </div>
              ) : null}

              <Input placeholder="Search existing CRM profiles by name or phone..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
              
              <div className="grid gap-2 max-h-[220px] overflow-y-auto">
                {filteredCustomers.map(c => {
                  const isSelected = selectedCustomer?.id === c.id
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className={cn(
                        "flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors",
                        isSelected && "border-primary bg-primary/5"
                      )}
                    >
                      <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{getInitials(c.first_name, c.last_name)}</AvatarFallback></Avatar>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-semibold">{c.first_name} {c.last_name || ''}</div>
                        <div className="text-xs text-muted-foreground">{c.phone}</div>
                      </div>
                      {isSelected && <Badge variant="default" className="rounded-full h-5 w-5 p-0 flex items-center justify-center"><Check className="h-3 w-3" /></Badge>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Select Services */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold">Select Services</h3>
              <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                {services.map(srv => {
                  const isSelected = selectedServices.some(s => s.id === srv.id)
                  return (
                    <div
                      key={srv.id}
                      onClick={() => toggleService(srv)}
                      className={cn(
                        "flex items-center justify-between p-3 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors",
                        isSelected && "border-primary bg-primary/5"
                      )}
                    >
                      <div className="text-left">
                        <div className="text-sm font-semibold">{srv.name}</div>
                        <div className="text-xs text-muted-foreground">{srv.duration_minutes} mins • {srv.category_name}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-sm">{formatCurrency(srv.price)}</div>
                        <div className={cn("w-5 h-5 rounded border flex items-center justify-center", isSelected && "bg-primary border-primary text-white")}>
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Assign Staff */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold">Assign Stylist</h3>
              <div className="grid gap-2">
                {staff.map(st => {
                  const isSelected = selectedStaff?.id === st.id
                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStaff(st)}
                      className={cn(
                        "flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors",
                        isSelected && "border-primary bg-primary/5"
                      )}
                    >
                      <Avatar className="h-9 w-9"><AvatarFallback className="text-xs">{getInitials(st.first_name, st.last_name)}</AvatarFallback></Avatar>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-semibold">{st.first_name} {st.last_name || ''}</div>
                        <div className="text-xs text-muted-foreground capitalize">{st.role} • Rating: {st.rating || '4.8'} ★</div>
                      </div>
                      {isSelected && <Badge variant="default" className="rounded-full h-5 w-5 p-0 flex items-center justify-center"><Check className="h-3 w-3" /></Badge>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Select Date */}
          {step === 4 && (
            <div className="space-y-4 text-center">
              <h3 className="font-bold">Select Date</h3>
              <div className="flex justify-center">
                <Input
                  type="date"
                  className="max-w-xs text-center text-base py-3 h-12"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Appointments must fall inside normal business hours (9:00 AM to 7:00 PM).
              </p>
            </div>
          )}

          {/* STEP 5: Select Time */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="font-bold">Select Time Slot</h3>
              {loadingSlots ? (
                <div className="flex flex-col items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                  <span className="text-xs text-muted-foreground">Checking stylist availability...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No slots available for this stylist on {selectedDate}. Try selecting another date or stylist.
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {availableSlots.map(slot => {
                    const isSelected = selectedTime === slot
                    return (
                      <Button
                        key={slot}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => setSelectedTime(slot)}
                        className="text-xs font-semibold"
                      >
                        {slot}
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Confirmation & Notes */}
          {step === 6 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 text-left pb-2 border-b">
                <h3 className="font-bold text-base">Booking Summary</h3>
                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  <div><span className="text-muted-foreground">Client:</span> <strong>{selectedCustomer?.first_name} {selectedCustomer?.last_name || ''}</strong></div>
                  <div><span className="text-muted-foreground">Stylist:</span> <strong>{selectedStaff?.first_name} {selectedStaff?.last_name || ''}</strong></div>
                  <div><span className="text-muted-foreground">Date:</span> <strong>{selectedDate}</strong></div>
                  <div><span className="text-muted-foreground">Time:</span> <strong>{selectedTime}</strong></div>
                  <div><span className="text-muted-foreground">Est. Duration:</span> <strong>{totalDuration} mins</strong></div>
                  <div><span className="text-muted-foreground">Total Services:</span> <strong>{selectedServices.length} selected</strong></div>
                </div>
                <div className="mt-3 text-lg font-bold text-primary">
                  Est. Subtotal: {formatCurrency(totalPrice)}
                </div>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="source">Booking Source</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger id="source"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk_in">Walk-in</SelectItem>
                    <SelectItem value="phone">Phone Booking</SelectItem>
                    <SelectItem value="online">Online Booker</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Notes / Instructions</Label>
                <Textarea id="notes" placeholder="Customer requests, product preferences, or alerts..." rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <DialogFooter className="p-6 border-t bg-muted/20">
          <div className="flex justify-between w-full">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={prevStep} disabled={submitting}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            ) : (
              <div />
            )}
            
            {step < 6 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={
                  (step === 1 && !selectedCustomer) ||
                  (step === 2 && selectedServices.length === 0) ||
                  (step === 3 && !selectedStaff) ||
                  (step === 4 && !selectedDate) ||
                  (step === 5 && !selectedTime)
                }
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="button" variant="gradient" onClick={handleBookingSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm Booking
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

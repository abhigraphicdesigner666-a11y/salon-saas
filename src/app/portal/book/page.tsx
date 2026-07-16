'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Sparkles, Scissors, User, Star, Tag, Landmark, Loader2, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CustomerRepository, StaffRepository, ServiceRepository, AppointmentRepository } from '@/lib/repositories/repositories'
import { AppointmentService, CustomerValueService, MarketingService } from '@/services/business-services'

export default function OnlineBookingPage() {
  const router = useRouter()
  const { success, error } = useToast()

  const activeTenantId = 'demo-tenant-001'
  const activeCustomerId = 'c1' // Priya Sharma (Gold Member)

  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [customer, setCustomer] = useState<any>(null)

  // Booking states
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedStylist, setSelectedStylist] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState('2026-07-20')
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM')

  // Payments / Coupon states
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [paymentMode, setPaymentMode] = useState<'cash' | 'wallet'>('wallet')

  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadPortalData = async () => {
      try {
        setLoading(true)
        const srvList = await ServiceRepository.list(activeTenantId)
        setServices(srvList.filter(s => s.is_active))

        const empList = await StaffRepository.list(activeTenantId)
        setStaff(empList.filter(e => e.role === 'stylist' || e.role === 'beautician'))

        const cust = await CustomerRepository.getById(activeCustomerId)
        setCustomer(cust)
      } catch (e) {
        console.error('Failed to load online booking catalogs', e)
      } finally {
        setLoading(false)
      }
    }
    loadPortalData()
  }, [])

  // Calculations
  const basePrice = selectedService ? selectedService.price : 0
  const membershipDiscount = (customer?.membership_status === 'active' && customer.membership_level === 'Gold Membership') ? Math.round(basePrice * 0.15) : 0
  const couponAmt = Math.round((basePrice - membershipDiscount) * (couponDiscount / 100))
  const finalTotal = Math.max(basePrice - membershipDiscount - couponAmt, 0)

  const handleApplyCoupon = async () => {
    try {
      const match = await MarketingService.validateCoupon(couponCode, activeTenantId)
      setCouponDiscount(match.discount_percent)
      success('Promo Applied', `${match.discount_percent}% coupon applied!`)
    } catch (e: any) {
      error('Coupon invalid', e.message)
    }
  }

  const handleBooking = async () => {
    try {
      setSubmitting(true)
      
      // If paying by wallet, deduct
      if (paymentMode === 'wallet') {
        const balance = customer?.wallet_balance || 0
        if (balance < finalTotal) {
          error('Insufficient wallet credits', 'Please select cash on checkout.')
          return
        }
        await CustomerValueService.adjustWallet(
          activeCustomerId,
          activeTenantId,
          { change: -finalTotal, reason: `Booking payment: ${selectedService.name}` },
          'customer-portal',
          'Priya Sharma'
        )
      }

      // Schedule appointment
      await AppointmentService.schedule(
        activeTenantId,
        {
          customer_id: activeCustomerId,
          customer_name: customer ? `${customer.first_name} ${customer.last_name || ''}`.trim() : 'Priya Sharma',
          customer_phone: customer?.phone || '9988776655',
          stylist_id: selectedStylist.id,
          stylist_name: selectedStylist.first_name,
          start_time: `${selectedDate}T${selectedSlot === '10:00 AM' ? '10:00:00' : '11:30:00'}.000Z`,
          status: 'confirmed',
          service_id: selectedService.id,
          service_name: selectedService.name,
          price: finalTotal,
          duration_minutes: selectedService.duration_minutes
        },
        'customer-portal',
        'Priya Sharma'
      )

      success('Booking Confirmed', 'Your appointment has been successfully scheduled!')
      router.push('/portal/appointments')
    } catch (e: any) {
      error('Booking failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <span className="text-xs text-muted-foreground">Opening catalog...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-violet-500" />
        <h2 className="text-lg font-bold">Online Booking</h2>
      </div>

      {step === 1 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Scissors className="h-4 w-4 text-primary" /> Select Service</CardTitle>
            <CardDescription className="text-xs">Browse our current bookable catalog options.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {services.map(srv => (
              <div key={srv.id} className="p-3 border rounded-xl hover:bg-muted/30 cursor-pointer flex justify-between items-center transition-colors" onClick={() => { setSelectedService(srv); setStep(2) }}>
                <div>
                  <div className="text-xs font-semibold">{srv.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{srv.duration_minutes} min</div>
                </div>
                <strong className="text-xs">{formatCurrency(srv.price)}</strong>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {step === 2 && selectedService && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5"><User className="h-4 w-4 text-primary" /> Select Artist</CardTitle>
            <CardDescription className="text-xs">Choose employee or select first available.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {staff.map(st => (
              <div key={st.id} className="p-3 border rounded-xl hover:bg-muted/30 cursor-pointer flex justify-between items-center transition-colors" onClick={() => { setSelectedStylist(st); setStep(3) }}>
                <div>
                  <div className="text-xs font-semibold">{st.first_name} {st.last_name || ''}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 capitalize">{st.role}</div>
                </div>
                <Badge variant="secondary" className="text-[9px] flex items-center gap-0.5"><Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {st.rating || '4.8'}</Badge>
              </div>
            ))}
            <Button variant="outline" className="w-full text-xs" onClick={() => setStep(1)}>Back</Button>
          </CardContent>
        </Card>
      )}

      {step === 3 && selectedService && selectedStylist && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Calendar className="h-4 w-4 text-primary" /> Schedule Date & Time</CardTitle>
            <CardDescription className="text-xs">Select preferred appointment slot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase">Date</Label>
                <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase">Slot</Label>
                <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                  <SelectTrigger className="h-8 text-xs bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                    <SelectItem value="11:30 AM">11:30 AM</SelectItem>
                    <SelectItem value="02:00 PM">02:00 PM</SelectItem>
                    <SelectItem value="03:30 PM">03:30 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 text-xs" onClick={() => setStep(2)}>Back</Button>
              <Button className="flex-1 text-xs" onClick={() => setStep(4)}>Confirm Details</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && selectedService && selectedStylist && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Summary & Checkout</CardTitle>
            <CardDescription className="text-xs">Review values and pay.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="border rounded-2xl p-3 bg-muted/20 space-y-1.5">
              <div className="flex justify-between"><span>Service:</span><strong>{selectedService.name}</strong></div>
              <div className="flex justify-between"><span>Stylist:</span><strong>{selectedStylist.first_name}</strong></div>
              <div className="flex justify-between"><span>Schedule:</span><strong>{formatDate(selectedDate)} at {selectedSlot}</strong></div>
            </div>

            {/* Memberships & Coupons */}
            <div className="space-y-2">
              {customer?.membership_status === 'active' && (
                <div className="p-2 border border-emerald-500/20 bg-emerald-500/5 rounded-xl flex items-center justify-between text-[11px] text-emerald-600">
                  <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 fill-emerald-500" /> Gold Member Discount (15%)</span>
                  <strong>-{formatCurrency(membershipDiscount)}</strong>
                </div>
              )}

              <div className="flex gap-2">
                <Input placeholder="Coupon code (e.g. WELCOME10)" value={couponCode} onChange={e => setCouponCode(e.target.value)} className="h-8 text-xs bg-card" />
                <Button size="sm" variant="outline" className="h-8" onClick={handleApplyCoupon}><Tag className="h-3 w-3 mr-1" /> Apply</Button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground uppercase">Payment Mode</Label>
              <Select value={paymentMode} onValueChange={(val: any) => setPaymentMode(val)}>
                <SelectTrigger className="h-8 bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="wallet">Pay with Store Wallet (Balance: {formatCurrency(customer?.wallet_balance || 0)})</SelectItem>
                  <SelectItem value="cash">Pay at Counter (Cash/Card/UPI)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(basePrice)}</span></div>
              {membershipDiscount > 0 && <div className="flex justify-between text-emerald-500"><span>Gold Discount:</span><span>-{formatCurrency(membershipDiscount)}</span></div>}
              {couponDiscount > 0 && <div className="flex justify-between text-amber-500"><span>Coupon Applied:</span><span>-{formatCurrency(couponAmt)}</span></div>}
              <div className="flex justify-between font-bold text-sm border-t pt-1.5 mt-1"><span>Total Due:</span><span>{formatCurrency(finalTotal)}</span></div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 text-xs" onClick={() => setStep(3)} disabled={submitting}>Back</Button>
              <Button className="flex-1 text-xs" onClick={handleBooking} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Confirm Appointment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

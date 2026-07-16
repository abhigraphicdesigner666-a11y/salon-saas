'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'
import { AppointmentRepository } from '@/lib/repositories/repositories'
import { AppointmentService, CustomerValueService } from '@/services/business-services'

export default function ClientAppointmentsPage() {
  const { success, error } = useToast()
  const activeTenantId = 'demo-tenant-001'
  const activeCustomerId = 'c1' // Priya Sharma

  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<any[]>([])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const list = await AppointmentRepository.list(activeTenantId)
      setAppointments(list.filter(a => a.customer_id === activeCustomerId))
    } catch (e) {
      console.error('Failed to load appointments', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const handleCancel = async (id: string, refundPrice: number) => {
    try {
      setLoading(true)
      await AppointmentService.updateStatus(
        id,
        activeTenantId,
        'cancelled',
        'customer-portal',
        'Priya Sharma'
      )

      // Refund to wallet
      await CustomerValueService.adjustWallet(
        activeCustomerId,
        activeTenantId,
        { change: refundPrice, reason: 'Appointment Cancellation Refund' },
        'customer-portal',
        'Priya Sharma'
      )

      success('Cancelled', 'Appointment cancelled successfully and refunded to wallet.')
      loadAppointments()
    } catch (e: any) {
      error('Cancellation failed', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-violet-500" />
        <h2 className="text-lg font-bold">My Bookings</h2>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <span className="text-xs text-muted-foreground">Loading appointment list...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt, idx) => (
            <Card key={apt.id || idx} className="border bg-card">
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-sm">{apt.service_name}</h4>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Stylist: {apt.stylist_name}</div>
                  </div>
                  <Badge variant={apt.status === 'confirmed' ? 'success' : 'secondary'} className="capitalize">
                    {apt.status}
                  </Badge>
                </div>

                <div className="flex justify-between items-center text-muted-foreground border-t pt-2.5">
                  <div className="flex gap-3">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(apt.start_time)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatTime(apt.start_time)}</span>
                  </div>
                  <strong className="text-foreground">{formatCurrency(apt.price)}</strong>
                </div>

                {apt.status === 'confirmed' && (
                  <div className="flex gap-2 border-t pt-2.5 justify-end">
                    <Button size="sm" variant="outline" className="h-7 text-[10px] text-rose-500 hover:text-rose-600" onClick={() => handleCancel(apt.id, apt.price)}>
                      Cancel Booking
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {appointments.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">No appointment bookings found.</p>
          )}
        </div>
      )}
    </div>
  )
}

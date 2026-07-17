'use client'

import React, { useState } from 'react'
import { Loader2, Plus, Users, Mail, Phone, DollarSign, Award, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { StaffService } from '@/services/business-services'

interface AddStaffModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddStaffModal({ isOpen, onClose, onSuccess }: AddStaffModalProps) {
  const { tenant, user } = useAuth()
  const { success, error } = useToast()
  const activeTenantId = tenant?.id || 'demo-tenant-001'

  const [submitting, setSubmitting] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'stylist' | 'beautician' | 'manager' | 'receptionist'>('stylist')
  const [commissionPercent, setCommissionPercent] = useState<number>(10)
  const [specializations, setSpecializations] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim()) {
      error('Validation Error', 'First name is required.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      error('Validation Error', 'A valid email is required.')
      return
    }

    try {
      setSubmitting(true)
      const specArray = specializations
        ? specializations.split(',').map(s => s.trim()).filter(Boolean)
        : []

      await StaffService.create(
        activeTenantId,
        {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role,
          commission_percent: Number(commissionPercent) || 0,
          specializations: specArray,
        },
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )

      success('Employee Registered', `${firstName} has been successfully registered.`)
      
      // Reset form
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      setRole('stylist')
      setCommissionPercent(10)
      setSpecializations('')
      
      onClose()
      onSuccess()
    } catch (e: any) {
      error('Failed to register employee', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Register New Employee
          </DialogTitle>
          <DialogDescription className="text-xs">
            Enter basic profile details to onboard a new stylist or manager.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="staff_first_name" className="text-xs font-semibold">First Name *</Label>
              <Input
                id="staff_first_name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Rahul"
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff_last_name" className="text-xs font-semibold">Last Name</Label>
              <Input
                id="staff_last_name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Sharma"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staff_email" className="text-xs font-semibold">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="staff_email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                className="pl-9 h-9 text-xs"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staff_phone" className="text-xs font-semibold">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="staff_phone"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="9876543210"
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="staff_role" className="text-xs font-semibold">Role *</Label>
              <Select value={role} onValueChange={(val: any) => setRole(val)}>
                <SelectTrigger id="staff_role" className="h-9 text-xs">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stylist">Stylist</SelectItem>
                  <SelectItem value="beautician">Beautician</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff_commission" className="text-xs font-semibold">Commission (%)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="staff_commission"
                  type="number"
                  value={commissionPercent}
                  onChange={e => setCommissionPercent(Number(e.target.value))}
                  placeholder="10"
                  className="pl-9 h-9 text-xs"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staff_specializations" className="text-xs font-semibold">Specializations (comma separated)</Label>
            <div className="relative">
              <Award className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="staff_specializations"
                value={specializations}
                onChange={e => setSpecializations(e.target.value)}
                placeholder="Haircut, Hair Spa, Shaving"
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2 border-t mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="h-9 text-xs">
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={submitting} className="h-9 text-xs">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Register Staff
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

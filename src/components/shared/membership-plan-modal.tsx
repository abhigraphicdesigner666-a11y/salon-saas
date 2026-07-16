'use client'

import React, { useState } from 'react'
import { Award, ShieldAlert, Loader2, Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CustomerValueService } from '@/services/business-services'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { permissionHelpers } from '@/lib/auth/permissions'

interface MembershipPlanModalProps {
  customerId: string
  currentPlan: string | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function MembershipPlanModal({ customerId, currentPlan, isOpen, onClose, onSuccess }: MembershipPlanModalProps) {
  const { tenant, role, user } = useAuth()
  const { success, error } = useToast()
  const activeTenantId = tenant?.id || 'demo-tenant-001'

  const [submitting, setSubmitting] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('Gold Membership')

  const handleSubscribe = async () => {
    if (!permissionHelpers.canUpdate(role, 'customers')) {
      error('Access Denied', 'Your role is not authorized to adjust customer memberships.')
      return
    }

    try {
      setSubmitting(true)
      const discount = selectedPlan === 'Gold Membership' ? 15 : 25
      await CustomerValueService.subscribeMembership(
        customerId,
        activeTenantId,
        { planName: selectedPlan, discountPercent: discount },
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Membership Activated', `Subscribed customer to ${selectedPlan}.`)
      onClose()
      onSuccess()
    } catch (e: any) {
      error('Subscription failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md text-left">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" /> Subscription Manager
          </DialogTitle>
          <DialogDescription>Assign membership tier or upgrade the client profile plan benefits.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-1">
            <Label>Select Tier</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Gold Membership">Gold Membership (15% service discount)</SelectItem>
                <SelectItem value="VIP Platinum">VIP Platinum (25% service discount)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button variant="gradient" onClick={handleSubscribe} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Subscribe Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

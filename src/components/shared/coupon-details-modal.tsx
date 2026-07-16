'use client'

import React, { useState } from 'react'
import { Tag, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { MarketingService } from '@/services/business-services'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { permissionHelpers } from '@/lib/auth/permissions'

interface CouponDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CouponDetailsModal({ isOpen, onClose, onSuccess }: CouponDetailsModalProps) {
  const { tenant, role, user } = useAuth()
  const { success, error } = useToast()
  const activeTenantId = tenant?.id || 'demo-tenant-001'

  const [submitting, setSubmitting] = useState(false)
  const [code, setCode] = useState('WELCOME25')
  const [discountPercent, setDiscountPercent] = useState<number>(25)
  const [expiryDate, setExpiryDate] = useState('2026-12-31')

  const handleCreate = async () => {
    if (!permissionHelpers.canCreate(role, 'marketing')) {
      error('Access Denied', 'Your role is not authorized to configure discount coupons.')
      return
    }

    try {
      setSubmitting(true)
      await MarketingService.createCoupon(
        activeTenantId,
        {
          code: code.toUpperCase().trim(),
          discount_percent: discountPercent,
          expiry_date: expiryDate
        },
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Coupon Configured', `Promo code ${code.toUpperCase()} successfully initialized.`)
      onClose()
      onSuccess()
    } catch (e: any) {
      error('Configuration failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md text-left">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-amber-500" /> New Coupon Manager
          </DialogTitle>
          <DialogDescription>Setup promo code rules to apply in the POS checkout terminals.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-1">
            <Label>Coupon Promo Code</Label>
            <Input placeholder="E.g. SUMMER15, MONSOON30" value={code} onChange={e => setCode(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Discount Percent (%)</Label>
              <Input type="number" value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Expiry Date</Label>
              <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button variant="gradient" onClick={handleCreate} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Generate Promo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

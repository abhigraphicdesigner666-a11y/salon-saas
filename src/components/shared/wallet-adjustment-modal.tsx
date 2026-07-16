'use client'

import React, { useState } from 'react'
import { Landmark, ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CustomerValueService } from '@/services/business-services'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { permissionHelpers } from '@/lib/auth/permissions'

interface WalletAdjustmentModalProps {
  customerId: string
  currentBalance: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function WalletAdjustmentModal({ customerId, currentBalance, isOpen, onClose, onSuccess }: WalletAdjustmentModalProps) {
  const { tenant, role, user } = useAuth()
  const { success, error } = useToast()
  const activeTenantId = tenant?.id || 'demo-tenant-001'

  const [submitting, setSubmitting] = useState(false)
  const [adjustAmount, setAdjustAmount] = useState<number>(500)
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit')
  const [adjustReason, setAdjustReason] = useState('Advance deposit')

  const handleAdjust = async () => {
    if (!permissionHelpers.canUpdate(role, 'customers')) {
      error('Access Denied', 'Your role is not authorized to edit client wallet credits.')
      return
    }

    try {
      setSubmitting(true)
      const change = adjustType === 'credit' ? adjustAmount : -adjustAmount
      await CustomerValueService.adjustWallet(
        customerId,
        activeTenantId,
        { change, reason: adjustReason },
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Wallet Adjusted', 'Transactions successfully saved.')
      onClose()
      onSuccess()
    } catch (e: any) {
      error('Wallet adjustment failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md text-left">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" /> Wallet Adjuster
          </DialogTitle>
          <DialogDescription>Credit or debit store balances for checkout payments.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Adjustment Type</Label>
              <Select value={adjustType} onValueChange={(val: any) => setAdjustType(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit Balance (+)</SelectItem>
                  <SelectItem value="debit">Debit Balance (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Amount (₹)</Label>
              <Input type="number" value={adjustAmount} onChange={e => setAdjustAmount(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Reason</Label>
            <Input placeholder="E.g. Refund credit, promotional bonus..." value={adjustReason} onChange={e => setAdjustReason(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button variant="gradient" onClick={handleAdjust} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Adjust Balance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

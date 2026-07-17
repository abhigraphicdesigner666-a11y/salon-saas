'use client'

import React, { useState, useEffect } from 'react'
import { ClipboardList, Users, Loader2, Info, AlertTriangle, CheckCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { StaffRepository, ProductRepository } from '@/lib/repositories/repositories'
import { NotificationService } from '@/services/notification-service'
import { AuditService } from '@/services/audit-service'

interface EODInventorySummaryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EODInventorySummaryModal({ isOpen, onClose, onSuccess }: EODInventorySummaryModalProps) {
  const { tenant, user } = useAuth()
  const { success, error } = useToast()
  const activeTenantId = tenant?.id || 'demo-tenant-001'

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [staffList, setStaffList] = useState<any[]>([])
  const [productsList, setProductsList] = useState<any[]>([])

  // Form states
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [finishedProductIds, setFinishedProductIds] = useState<string[]>([])
  const [damagedProductIds, setDamagedProductIds] = useState<string[]>([])
  const [summaryNotes, setSummaryNotes] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [staff, products] = await Promise.all([
          StaffRepository.list(activeTenantId),
          ProductRepository.list(activeTenantId)
        ])
        setStaffList(staff)
        setProductsList(products)
        if (staff.length > 0) setSelectedStaffId(staff[0].id)
      } catch (e) {
        console.error('Failed to load EOD data', e)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      loadData()
      setFinishedProductIds([])
      setDamagedProductIds([])
      setSummaryNotes('')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaffId) {
      error('Validation Error', 'Please select the staff member submitting this EOD report.')
      return
    }

    try {
      setSubmitting(true)
      const staffMember = staffList.find(s => s.id === selectedStaffId)
      const staffName = staffMember ? `${staffMember.first_name} ${staffMember.last_name || ''}`.trim() : 'Unknown Staff'

      const finishedNames = productsList
        .filter(p => finishedProductIds.includes(p.id))
        .map(p => p.name)
        .join(', ') || 'None'

      const damagedNames = productsList
        .filter(p => damagedProductIds.includes(p.id))
        .map(p => p.name)
        .join(', ') || 'None'

      // Send a high-priority EOD notification to the system/owner dashboard
      await NotificationService.send(
        activeTenantId,
        `EOD Inventory Summary: ${staffName}`,
        `Submitted EOD Inventory Check. Finished/Needs Order: [${finishedNames}]. Damaged/Replaced: [${damagedNames}]. Notes: "${summaryNotes || 'No notes'}"`,
        'success',
        '/dashboard/inventory'
      )

      // Log audit
      await AuditService.log(
        activeTenantId,
        selectedStaffId,
        staffName,
        'submit_eod_inventory',
        'inventory',
        activeTenantId,
        null,
        {
          finished_products: finishedNames,
          damaged_products: damagedNames,
          notes: summaryNotes
        }
      )

      success('EOD Summary Submitted', 'Inventory summary logged. Owner has been notified successfully.')
      onClose()
      onSuccess()
    } catch (e: any) {
      error('Failed to submit EOD Summary', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleFinished = (id: string) => {
    setFinishedProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleToggleDamaged = (id: string) => {
    setDamagedProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" /> Daily EOD Inventory Summary
          </DialogTitle>
          <DialogDescription className="text-xs">
            Confirm stock status and report finished or damaged products before closing the salon.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[250px]">
            <Loader2 className="h-7 w-7 animate-spin text-primary mb-2" />
            <span className="text-xs text-muted-foreground">Loading inventory list...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="eod_staff" className="text-xs font-semibold">Submitting Staff Member *</Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger id="eod_staff" className="h-9 text-xs">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map(s => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.first_name} {s.last_name || ''} ({s.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Checklist: Finished Products (Needs Order) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Finished Products (Needs to Order New)
              </Label>
              <div className="border rounded-xl p-3 bg-muted/20 max-h-[100px] overflow-y-auto space-y-2">
                {productsList.map(p => (
                  <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={finishedProductIds.includes(p.id)}
                      onChange={() => handleToggleFinished(p.id)}
                      className="rounded border-gray-300 text-primary accent-primary h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>{p.name} <span className="text-[10px] text-muted-foreground">(Stock: {p.stock_quantity})</span></span>
                  </label>
                ))}
                {productsList.length === 0 && <span className="text-xs text-muted-foreground">No products in catalog.</span>}
              </div>
            </div>

            {/* Checklist: Damaged Products (Needs to Replace) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-rose-500" /> Damaged/Wasted Products (Needs to Replace)
              </Label>
              <div className="border rounded-xl p-3 bg-muted/20 max-h-[100px] overflow-y-auto space-y-2">
                {productsList.map(p => (
                  <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={damagedProductIds.includes(p.id)}
                      onChange={() => handleToggleDamaged(p.id)}
                      className="rounded border-gray-300 text-primary accent-primary h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>{p.name}</span>
                  </label>
                ))}
                {productsList.length === 0 && <span className="text-xs text-muted-foreground">No products in catalog.</span>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="eod_notes" className="text-xs font-semibold">Daily Usage & Closing Notes</Label>
              <Textarea
                id="eod_notes"
                placeholder="List any color shades that ran low or highlights about product usage today..."
                value={summaryNotes}
                onChange={e => setSummaryNotes(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2 gap-2 border-t mt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={submitting} className="h-9 text-xs">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Submit EOD Report
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

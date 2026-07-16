'use client'

import React, { useState, useEffect } from 'react'
import { Printer, Download, Clock, PackageCheck, AlertTriangle, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { InventoryService } from '@/services/business-services'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { permissionHelpers } from '@/lib/auth/permissions'

interface POReceiptModalProps {
  poId: string | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function POReceiptModal({ poId, isOpen, onClose, onSuccess }: POReceiptModalProps) {
  const { tenant, role, user } = useAuth()
  const { success, error } = useToast()
  const activeTenantId = tenant?.id || 'demo-tenant-001'

  const [po, setPo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const loadPO = async () => {
    if (!poId) return
    try {
      setLoading(true)
      const list = await InventoryService.listPurchaseOrders(activeTenantId)
      const data = list.find(p => p.id === poId)
      if (data) {
        setPo(data)
      }
    } catch (e) {
      console.error('Failed to load purchase order', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && poId) {
      loadPO()
    }
  }, [isOpen, poId])

  // Process Goods Receipt
  const handleGRNConfirm = async () => {
    if (!po) return
    if (!permissionHelpers.canUpdate(role, 'inventory')) {
      error('Access Denied', 'Only inventory managers and owners can receive stock shipments.')
      return
    }

    try {
      setSubmitting(true)
      await InventoryService.receivePurchaseOrder(
        po.id,
        activeTenantId,
        {},
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Goods Received', 'Purchase order completed and inventory restocked.')
      onClose()
      onSuccess()
    } catch (e: any) {
      error('GRN confirmation failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto p-0 text-left">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-xs text-muted-foreground">Retrieving procurement sheets...</span>
          </div>
        ) : po ? (
          <div className="flex flex-col">
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center bg-muted/10">
              <div>
                <h2 className="text-lg font-bold">Purchase Order PO-{po.id.slice(-4)}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={po.status === 'completed' ? 'success' : 'warning'} className="capitalize text-[10px]">
                    {po.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">• Expected: {po.expected_delivery}</span>
                </div>
              </div>
              <strong className="text-lg text-primary">{formatCurrency(po.total_cost)}</strong>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="text-xs">
                <span className="text-muted-foreground block mb-0.5">Supplier Supplier</span>
                <strong>{po.supplier_name}</strong>
              </div>

              {/* Items */}
              <div className="border rounded-2xl p-4 space-y-2.5">
                <div className="text-xs font-bold text-muted-foreground uppercase border-b pb-2 mb-1">Ordered items catalog</div>
                {po.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs py-1">
                    <span>{item.name} x {item.quantity}</span>
                    <strong>{formatCurrency(item.unit_cost * item.quantity)}</strong>
                  </div>
                ))}
              </div>

              {/* GRN triggers */}
              {po.status !== 'completed' && permissionHelpers.canUpdate(role, 'inventory') && (
                <div className="border border-violet-500/20 bg-violet-500/5 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase">
                    <PackageCheck className="h-4 w-4" /> Receive Confirmation (GRN)
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Confirming will automatically receive all shipped items, incrementing product inventory counts.
                  </p>
                  <Button variant="gradient" size="sm" onClick={handleGRNConfirm} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                    Confirm Goods Received (GRN)
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="p-6 border-t bg-muted/20">
              <Button variant="outline" onClick={onClose} disabled={submitting}>
                Dismiss sheet
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

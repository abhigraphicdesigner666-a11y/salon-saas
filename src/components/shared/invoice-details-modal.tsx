'use client'

import React, { useState, useEffect } from 'react'
import { Printer, Download, Eye, RotateCcw, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { BillingService } from '@/services/business-services'
import { InvoiceRepository } from '@/lib/repositories/repositories'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { permissionHelpers } from '@/lib/auth/permissions'

interface InvoiceDetailsModalProps {
  invoiceId: string | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function InvoiceDetailsModal({ invoiceId, isOpen, onClose, onSuccess }: InvoiceDetailsModalProps) {
  const { tenant, role, user } = useAuth()
  const { success, error } = useToast()
  const activeTenantId = tenant?.id || 'demo-tenant-001'

  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Refund states
  const [showRefund, setShowRefund] = useState(false)
  const [refundReason, setRefundReason] = useState('dissatisfaction')
  const [refundAmount, setRefundAmount] = useState<number>(0)

  const loadInvoice = async () => {
    if (!invoiceId) return
    try {
      setLoading(true)
      const data = await InvoiceRepository.getById(invoiceId)
      if (data) {
        setInvoice(data)
        setRefundAmount(data.total_amount)
      }
    } catch (e) {
      console.error('Failed to load invoice file details', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && invoiceId) {
      loadInvoice()
    }
    setShowRefund(false)
  }, [isOpen, invoiceId])

  // Process Refund Action
  const handleRefund = async () => {
    if (!invoice) return
    
    // Gated to owners and managers
    if (role !== 'owner' && role !== 'manager') {
      error('Access Denied', 'Only salon managers and owners can refund invoices.')
      return
    }

    try {
      setSubmitting(true)
      await BillingService.refundInvoice(
        invoice.id,
        activeTenantId,
        { reason: refundReason, amount: refundAmount },
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Invoice Refunded', 'Loyalty points and product stock levels reversed.')
      onClose()
      onSuccess()
    } catch (e: any) {
      error('Refund failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 text-left">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-xs text-muted-foreground">Retrieving receipt ledger...</span>
          </div>
        ) : invoice ? (
          <div className="flex flex-col">
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center bg-muted/10">
              <div>
                <h2 className="text-lg font-bold">Invoice {invoice.invoice_number}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={invoice.status === 'refunded' ? 'destructive' : 'success'} className="capitalize text-[10px]">
                    {invoice.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">• {formatDate(invoice.created_at)}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block mb-0.5">Billed To</span>
                  <strong>{invoice.customer_name || 'Walk-in Client'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Payment Method</span>
                  <strong className="capitalize">{invoice.payment_method}</strong>
                </div>
              </div>

              {/* Cart items list */}
              <div className="border rounded-2xl p-4 space-y-2.5">
                <div className="text-xs font-bold text-muted-foreground uppercase border-b pb-2 mb-1">Itemized services & retail</div>
                {invoice.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs py-1 hover:bg-muted/10 px-1 rounded">
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{formatCurrency(item.unit_price)} x {item.quantity} ({item.type})</div>
                    </div>
                    <strong>{formatCurrency(item.total)}</strong>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="space-y-2 border-t pt-4 text-xs">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-rose-500"><span>Discount</span><span>-{formatCurrency(invoice.discount_amount)}</span></div>
                )}
                <div className="flex justify-between text-muted-foreground"><span>GST (18% inclusive)</span><span>{formatCurrency(invoice.tax_amount)}</span></div>
                <div className="flex justify-between text-sm font-bold border-t pt-2"><span>Total Paid</span><span>{formatCurrency(invoice.total_amount)}</span></div>
              </div>

              {/* Refund dialog toggle */}
              {invoice.status !== 'refunded' && (role === 'owner' || role === 'manager') && (
                <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-rose-500 text-xs font-bold uppercase">
                    <AlertTriangle className="h-4 w-4" /> Refund Operations
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Refunding will reverse customer visits metrics, subtract earned loyalty points, and return products to retail stock shelves.
                  </p>
                  
                  {showRefund ? (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Refund Reason</Label>
                        <Select value={refundReason} onValueChange={setRefundReason}>
                          <SelectTrigger className="bg-card h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dissatisfaction">Customer Dissatisfaction</SelectItem>
                            <SelectItem value="mistake">Billing Entry Mistake</SelectItem>
                            <SelectItem value="cancellation">Cancelled Session</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Refund Amount (₹)</Label>
                        <Input type="number" className="h-8 text-xs bg-card" value={refundAmount} onChange={e => setRefundAmount(Number(e.target.value))} />
                      </div>
                      <div className="col-span-2 flex justify-end gap-2 pt-2 border-t mt-1">
                        <Button variant="ghost" size="sm" onClick={() => setShowRefund(false)} disabled={submitting}>Cancel</Button>
                        <Button variant="destructive" size="sm" onClick={handleRefund} disabled={submitting}>
                          {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                          Confirm Reverse
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="destructive" size="sm" onClick={() => setShowRefund(true)}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Issue Transaction Refund
                    </Button>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="p-6 border-t bg-muted/20">
              <Button variant="outline" onClick={onClose} disabled={submitting}>
                Dismiss Receipt
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

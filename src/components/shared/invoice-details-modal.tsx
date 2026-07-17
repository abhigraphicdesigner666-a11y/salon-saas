'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Printer, Download, RotateCcw, AlertTriangle, Loader2, 
  Mail, MessageSquare, ToggleLeft, Check, Copy, Share2
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BillingService } from '@/services/business-services'
import { InvoiceRepository, CustomerRepository, SettingsRepository } from '@/lib/repositories/repositories'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'

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
  const [customer, setCustomer] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Layout format selection: 'a4' | 'pos80' | 'pos58'
  const [selectedFormat, setSelectedFormat] = useState<'a4' | 'pos80' | 'pos58'>('a4')

  // Share Dialog states
  const [shareEmailOpen, setShareEmailOpen] = useState(false)
  const [shareEmailAddr, setShareEmailAddr] = useState('')
  const [shareWhatsappOpen, setShareWhatsappOpen] = useState(false)
  const [shareWhatsappPhone, setShareWhatsappPhone] = useState('')

  // Refund states
  const [showRefund, setShowRefund] = useState(false)
  const [refundReason, setRefundReason] = useState('dissatisfaction')
  const [refundAmount, setRefundAmount] = useState<number>(0)

  const loadInvoiceAndConfigs = async () => {
    if (!invoiceId) return
    try {
      setLoading(true)
      const data = await InvoiceRepository.getById(invoiceId)
      if (data) {
        setInvoice(data)
        setRefundAmount(data.total_amount)

        // Load customer file details
        if (data.customer_id) {
          try {
            const cust = await CustomerRepository.getById(data.customer_id)
            setCustomer(cust)
            setShareEmailAddr(cust.email || '')
            setShareWhatsappPhone(cust.phone || '')
          } catch (err) {
            console.error('Failed to load customer details', err)
          }
        } else {
          setCustomer(null)
          setShareEmailAddr('')
          setShareWhatsappPhone('')
        }

        // Load dynamic settings
        try {
          const config = await SettingsRepository.getSettings(activeTenantId)
          setSettings(config)
        } catch (err) {
          console.error('Failed to load settings', err)
        }
      }
    } catch (e) {
      console.error('Failed to load invoice file details', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && invoiceId) {
      loadInvoiceAndConfigs()
    }
    setShowRefund(false)
  }, [isOpen, invoiceId])

  // Tax CGST/SGST computations (assuming 18% GST standard)
  const taxSummary = useMemo(() => {
    if (!invoice) return { cgst: 0, sgst: 0, subtotalExclTax: 0 }
    const totalTax = invoice.tax_amount || 0
    const cgst = totalTax / 2
    const sgst = totalTax / 2
    const subtotalExclTax = invoice.subtotal - totalTax
    return { cgst, sgst, subtotalExclTax }
  }, [invoice])

  // Print trigger using sandboxed window popup matching layout widths
  const handlePrintInvoice = () => {
    const printableArea = document.getElementById('printable-invoice-content')
    if (!printableArea) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      error('Popups Blocked', 'Please allow popups to print invoices.')
      return
    }

    const isPOS = selectedFormat === 'pos80' || selectedFormat === 'pos58'
    const posWidth = selectedFormat === 'pos80' ? '80mm' : '58mm'

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${invoice?.invoice_number || ''}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; background: #fff; color: #000; font-family: monospace, sans-serif; font-size: 11px; }
              .no-print { display: none !important; }
            }
            body { font-family: monospace, sans-serif; background: #f9f9f9; padding: 20px; color: #000; }
            .invoice-wrapper {
              background: #fff;
              margin: 0 auto;
              padding: ${isPOS ? '10px' : '30px'};
              width: ${isPOS ? posWidth : '210mm'};
              box-shadow: ${isPOS ? 'none' : '0 4px 6px -1px rgba(0,0,0,0.1)'};
              border: ${isPOS ? 'none' : '1px solid #eaeaea'};
              box-sizing: border-box;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .dashed-line { border-top: 1px dashed #000; margin: 8px 0; }
            .double-dashed-line { border-top: 3px double #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 4px 0; text-align: left; font-size: 11px; vertical-align: top; }
            th { border-bottom: 1px solid #000; }
            .flex-between { display: flex; justify-content: space-between; }
            .qr-svg { margin: 10px auto; display: block; }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            ${printableArea.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // PDF download simulation
  const handleDownloadPDF = () => {
    success('Invoice PDF Generated', `Invoice_${invoice.invoice_number}.pdf saved successfully.`)
  };

  // WhatsApp simulation
  const handleShareWhatsapp = () => {
    if (!shareWhatsappPhone) {
      error('Phone Required', 'Please enter a valid phone number.')
      return
    }
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setShareWhatsappOpen(false)
      success('Invoice Shared', `Invoice notification shared to ${shareWhatsappPhone} on WhatsApp.`)
    }, 1000)
  }

  // Email simulation
  const handleShareEmail = () => {
    if (!shareEmailAddr) {
      error('Email Required', 'Please enter a valid email address.')
      return
    }
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setShareEmailOpen(false)
      success('Email Dispatched', `Invoice PDF dispatch sent successfully to ${shareEmailAddr}.`)
    }, 1000)
  }

  // Process Refund Action
  const handleRefund = async () => {
    if (!invoice) return
    
    // Gated to owners and managers
    if (role !== 'owner' && role !== 'salon_owner' && role !== 'manager') {
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
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 text-left text-xs">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <span className="text-xs text-muted-foreground">Retrieving receipt ledger...</span>
            </div>
          ) : invoice ? (
            <div className="flex flex-col h-full">
              {/* TOP BAR / CONTROL ACTIONS */}
              <div className="p-4 border-b flex flex-wrap justify-between items-center bg-muted/20 gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant={invoice.status === 'refunded' ? 'destructive' : 'success'} className="capitalize text-[10px] font-bold">
                    {invoice.status}
                  </Badge>
                  <span className="font-semibold text-foreground text-sm">Invoice {invoice.invoice_number}</span>
                </div>

                {/* Format selection toggles */}
                <div className="flex items-center gap-1 border p-1 rounded-xl bg-card">
                  <Button 
                    size="sm" 
                    variant={selectedFormat === 'a4' ? 'gradient' : 'ghost'} 
                    className="h-7 text-[10px] px-2.5 font-bold" 
                    onClick={() => setSelectedFormat('a4')}
                  >
                    A4 Corporate
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedFormat === 'pos80' ? 'gradient' : 'ghost'} 
                    className="h-7 text-[10px] px-2.5 font-bold" 
                    onClick={() => setSelectedFormat('pos80')}
                  >
                    80mm Thermal
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedFormat === 'pos58' ? 'gradient' : 'ghost'} 
                    className="h-7 text-[10px] px-2.5 font-bold" 
                    onClick={() => setSelectedFormat('pos58')}
                  >
                    58mm Thermal
                  </Button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="outline" className="h-8 text-[10px]" onClick={handlePrintInvoice}>
                    <Printer className="h-3.5 w-3.5 mr-1" /> Print
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-[10px]" onClick={handleDownloadPDF}>
                    <Download className="h-3.5 w-3.5 mr-1" /> PDF
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-[10px]" onClick={() => setShareEmailOpen(true)}>
                    <Mail className="h-3.5 w-3.5 mr-1" /> Email
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-[10px]" onClick={() => setShareWhatsappOpen(true)}>
                    <MessageSquare className="h-3.5 w-3.5 mr-1" /> WhatsApp
                  </Button>
                </div>
              </div>

              {/* VIEWPORT CONTROLLER */}
              <div className="p-6 overflow-y-auto bg-muted/10 flex justify-center min-h-[400px]">
                <div 
                  id="printable-invoice-content"
                  className={`bg-card text-foreground font-mono transition-all border p-6 shadow-sm rounded-xl ${
                    selectedFormat === 'a4' ? 'w-full max-w-[700px]' : selectedFormat === 'pos80' ? 'w-[80mm] text-[10px] p-4' : 'w-[58mm] text-[9px] p-3'
                  }`}
                >
                  {/* LOGO & SALON HEADER DETAILS */}
                  <div className="text-center space-y-1">
                    {settings?.logo ? (
                      <img src={settings.logo} alt="Salon Logo" className="mx-auto max-h-12 object-contain mb-1.5" />
                    ) : (
                      <div className="text-sm font-bold tracking-widest text-primary uppercase">{settings?.name || 'GLAMSTYLE SALON'}</div>
                    )}
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">{settings?.address || '12, Link Road, Bandra West, Mumbai'}</div>
                    <div className="text-[9px] text-muted-foreground">Phone: {settings?.phone || '+91 98765 43210'} | Email: {settings?.email || 'contact@glamstyle.in'}</div>
                    {settings?.gstin && (
                      <div className="text-[9px] text-primary font-bold">GSTIN: {settings.gstin}</div>
                    )}
                    <div className="text-[8px] uppercase tracking-wider text-muted-foreground mt-0.5">Branch: Main Outlet</div>
                  </div>

                  <div className="border-t border-dashed my-3" />

                  {/* CUSTOMER & INVOICE META DETAILS GRID */}
                  <div className="grid grid-cols-2 gap-y-1.5 text-[9px]">
                    <div>
                      <span className="text-muted-foreground block uppercase text-[8px] tracking-wider">Billed To:</span>
                      <strong className="text-foreground">{invoice.customer_name || 'Walk-in Client'}</strong>
                      {customer?.phone && <div className="text-muted-foreground text-[8px]">{customer.phone}</div>}
                      {customer?.membership_tier && (
                        <div className="text-primary font-bold mt-0.5 uppercase text-[8px]">Member: {customer.membership_tier}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground block uppercase text-[8px] tracking-wider">Invoice Info:</span>
                      <div className="font-bold text-foreground">Inv: {invoice.invoice_number}</div>
                      <div className="text-muted-foreground text-[8px]">{new Date(invoice.created_at).toLocaleDateString()} at {new Date(invoice.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-muted-foreground text-[8px]">Cashier: {invoice.created_by_name || 'Counter Staff'}</div>
                    </div>
                  </div>

                  <div className="border-t border-dashed my-3" />

                  {/* ITEMIZATION TABLE */}
                  <table className="w-full text-left font-mono">
                    <thead>
                      <tr className="border-b border-dashed text-muted-foreground uppercase text-[8px]">
                        <th className="pb-1 font-bold">Description</th>
                        <th className="pb-1 text-center font-bold">Qty</th>
                        <th className="pb-1 text-right font-bold">Rate</th>
                        <th className="pb-1 text-right font-bold">GST</th>
                        <th className="pb-1 text-right font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dashed/30">
                      {invoice.items?.map((item: any, idx: number) => (
                        <tr key={idx} className="text-[9px]">
                          <td className="py-2 pr-1.5">
                            <div className="font-bold text-foreground">{item.name}</div>
                            <div className="text-[8px] text-muted-foreground mt-0.5">Staff: {item.staff_name || 'Any'}</div>
                          </td>
                          <td className="py-2 text-center text-muted-foreground">{item.quantity}</td>
                          <td className="py-2 text-right text-muted-foreground">{formatCurrency(item.unit_price)}</td>
                          <td className="py-2 text-right text-muted-foreground">18%</td>
                          <td className="py-2 text-right font-bold text-foreground">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="border-t border-dashed my-3" />

                  {/* LEDGERS & TAX SUB-TOTAL BREAKDOWNS */}
                  <div className="space-y-1.5 text-[9px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal (Excl. Tax)</span>
                      <span>{formatCurrency(taxSummary.subtotalExclTax)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>CGST (9.0%)</span>
                      <span>{formatCurrency(taxSummary.cgst)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>SGST (9.0%)</span>
                      <span>{formatCurrency(taxSummary.sgst)}</span>
                    </div>
                    {invoice.discount_amount > 0 && (
                      <div className="flex justify-between text-rose-500 font-semibold">
                        <span>SaaS promo Discount</span>
                        <span>-{formatCurrency(invoice.discount_amount)}</span>
                      </div>
                    )}

                    <div className="border-t border-dashed pt-1.5 flex justify-between text-xs font-bold text-foreground">
                      <span>Grand Total</span>
                      <span>{formatCurrency(invoice.total_amount)}</span>
                    </div>

                    <div className="flex justify-between text-muted-foreground">
                      <span>Payment mode</span>
                      <span className="capitalize">{invoice.payment_method}</span>
                    </div>
                    <div className="flex justify-between text-[8px] text-muted-foreground">
                      <span>Transaction ID</span>
                      <span className="font-mono">{invoice.transaction_id || 'TXN-' + invoice.id.substring(0,8).toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed my-3" />

                  {/* MEMBERSHIPS / LOYALTY CARD DETAILS */}
                  {customer && (
                    <div className="p-2 border border-dashed rounded-xl space-y-1 text-[8px] text-muted-foreground font-mono bg-muted/5">
                      <div className="flex justify-between text-primary font-bold">
                        <span>Loyalty Points Balance</span>
                        <span>{customer.loyalty_points || 0} pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Earned on transaction</span>
                        <span>+{Math.round(invoice.total_amount * 0.05)} pts</span>
                      </div>
                      {invoice.loyalty_points_redeemed > 0 && (
                        <div className="flex justify-between text-rose-500">
                          <span>Redeemed</span>
                          <span>-{invoice.loyalty_points_redeemed} pts</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t border-dashed my-3" />

                  {/* FOOTER & TERMS */}
                  <div className="text-center space-y-2 font-mono text-[8px]">
                    <div className="italic text-muted-foreground">{settings?.receipt_footer || 'Thank you for your visit!'}</div>
                    <div className="text-[7px] text-muted-foreground leading-normal max-w-md mx-auto">
                      Terms: Services rendered are non-refundable. Product exchanges accepted within 7 days with original invoice label intact.
                    </div>

                    {/* QR Code SVG */}
                    <div className="flex justify-center py-1">
                      <svg className="w-14 h-14" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
                        <rect x="5" y="5" width="25" height="25" strokeWidth="4" />
                        <rect x="10" y="10" width="15" height="15" fill="currentColor" />
                        <rect x="70" y="5" width="25" height="25" strokeWidth="4" />
                        <rect x="75" y="10" width="15" height="15" fill="currentColor" />
                        <rect x="5" y="70" width="25" height="25" strokeWidth="4" />
                        <rect x="10" y="75" width="15" height="15" fill="currentColor" />
                        <path d="M45 10 h10 v10 h-10 z M45 40 h15 v10 h-15 z M5 45 h10 v10 h-10 z M80 45 h10 v20 h-10 z" fill="currentColor" />
                        <path d="M45 75 h10 v20 h-10 z M75 80 h15 v10 h-15 z" fill="currentColor" />
                      </svg>
                    </div>

                    {/* Digital Signature Cursive style */}
                    <div className="flex flex-col items-center pt-1 border-t border-dashed border-muted/30">
                      <span className="font-serif italic text-xs tracking-wider text-primary">Aditya Sen</span>
                      <span className="text-[7px] text-muted-foreground uppercase tracking-widest mt-0.5">Authorised Signature</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* REFUND OPERATIONS */}
              {invoice.status !== 'refunded' && (role === 'owner' || role === 'manager') && (
                <div className="p-6 border-t bg-rose-500/5 space-y-4">
                  <div className="flex items-center gap-2 text-rose-500 text-xs font-bold uppercase">
                    <AlertTriangle className="h-4 w-4" /> Transaction Refund Center
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Refunding this transaction reverses client loyalty balance adjustments and returns retail inventory items to active catalog shelves.
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

              {/* FOOTER ACTIONS */}
              <DialogFooter className="p-6 border-t bg-muted/20">
                <Button variant="outline" onClick={onClose} disabled={submitting}>
                  Dismiss Invoice
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* SHARE VIA EMAIL POPUP MODAL */}
      <Dialog open={shareEmailOpen} onOpenChange={(open) => !open && setShareEmailOpen(false)}>
        <DialogContent className="max-w-sm text-left text-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5"><Mail className="h-5 w-5 text-primary" /> Email Invoice Document</DialogTitle>
            <DialogDescription>Simulate invoice receipt PDF delivery direct to client inbox.</DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-1">
            <Label>Destination Email Address</Label>
            <Input 
              type="email" 
              placeholder="e.g. client@gmail.com" 
              value={shareEmailAddr} 
              onChange={e => setShareEmailAddr(e.target.value)} 
              className="h-9 bg-card"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShareEmailOpen(false)} disabled={submitting}>Cancel</Button>
            <Button variant="gradient" size="sm" onClick={handleShareEmail} disabled={submitting}>
              {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : 'Send Invoice PDF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SHARE VIA WHATSAPP POPUP MODAL */}
      <Dialog open={shareWhatsappOpen} onOpenChange={(open) => !open && setShareWhatsappOpen(false)}>
        <DialogContent className="max-w-sm text-left text-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5"><MessageSquare className="h-5 w-5 text-emerald-500" /> Share via WhatsApp</DialogTitle>
            <DialogDescription>Simulate mobile message delivery containing secure printable web receipt link.</DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-1">
            <Label>Client Phone Number</Label>
            <Input 
              placeholder="e.g. +91 99999 99999" 
              value={shareWhatsappPhone} 
              onChange={e => setShareWhatsappPhone(e.target.value)} 
              className="h-9 bg-card"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShareWhatsappOpen(false)} disabled={submitting}>Cancel</Button>
            <Button variant="gradient" size="sm" onClick={handleShareWhatsapp} disabled={submitting}>
              {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : 'Dispatch WhatsApp Alert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { Search, Plus, Trash2, Tag, Percent, IndianRupee, Loader2, Sparkles, CreditCard, User, Box, Printer, CheckCircle, MessageSquare } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CustomerService, ServiceCatalogService, BillingService, AppointmentService, CustomerValueService, MarketingService } from '@/services/business-services'
import { ProductRepository } from '@/lib/repositories/repositories'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { useSettings } from '@/lib/contexts/settings-context'

interface POSCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function POSCheckoutModal({ isOpen, onClose, onSuccess }: POSCheckoutModalProps) {
  const { tenant, user } = useAuth()
  const { success, error } = useToast()
  const { settings } = useSettings()
  const activeTenantId = tenant?.id || 'demo-tenant-001'

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Catalog Pools
  const [customers, setCustomers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])

  // Cart State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('walk-in')
  const [cartItems, setCartItems] = useState<any[]>([])
  const [discountCode, setDiscountCode] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  
  // Payment methods
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'wallet' | 'gift_card' | 'split'>('cash')
  const [cashAmount, setCashAmount] = useState<number>(0)
  const [cardAmount, setCardAmount] = useState<number>(0)

  // Completed State
  const [createdInvoice, setCreatedInvoice] = useState<any>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const c = await CustomerService.list(activeTenantId)
      const s = await ServiceCatalogService.list(activeTenantId)
      const p = await ProductRepository.list(activeTenantId)
      const apt = await AppointmentService.list(activeTenantId)
      
      setCustomers(c)
      setServices(s)
      setProducts(p)
      setAppointments(apt.filter(a => (a.status as any) === 'booked' || (a.status as any) === 'checked_in' || a.status === 'scheduled' || a.status === 'confirmed'))
    } catch (e) {
      console.error('Failed to load POS catalog pools', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadData()
      setCartItems([])
      setSelectedCustomerId('walk-in')
      setDiscountPercent(0)
      setDiscountCode('')
      setPaymentMethod('cash')
      setCreatedInvoice(null)
    }
  }, [isOpen])

  // Add catalog item to cart
  const addToCart = (item: any, type: 'service' | 'product') => {
    const existingIdx = cartItems.findIndex(i => i.id === item.id && i.type === type)
    if (existingIdx !== -1) {
      const updated = [...cartItems]
      updated[existingIdx].quantity += 1
      setCartItems(updated)
    } else {
      setCartItems([...cartItems, {
        id: item.id,
        name: item.name,
        type,
        quantity: 1,
        unit_price: item.price,
        tax_percent: item.tax_percent || 18,
      }])
    }
  }

  // Import appointment items
  const importAppointment = (aptId: string) => {
    const apt = appointments.find(a => a.id === aptId)
    if (!apt) return
    
    setSelectedCustomerId(apt.customer_id)
    const items: any[] = []
    
    // Add primary service
    const srv = services.find(s => s.name === apt.service_name)
    if (srv) {
      items.push({
        id: srv.id,
        name: srv.name,
        type: 'service',
        quantity: 1,
        unit_price: srv.price,
        tax_percent: srv.tax_percent || 18,
      })
    }
    
    setCartItems(items)
    success('Appointment Imported', `Imported ${apt.customer_name}'s scheduled services to checkout cart.`)
  }

  // Cart removal
  const removeFromCart = (id: string, type: 'service' | 'product') => {
    setCartItems(cartItems.filter(i => !(i.id === id && i.type === type)))
  }

  // Totals calculations
  const calculateTotals = () => {
    const customer = customers.find(c => c.id === selectedCustomerId)
    let membershipDiscountPercent = 0
    if (customer && customer.membership_status === 'active') {
      if (customer.membership_level === 'Gold Membership') membershipDiscountPercent = 15
      if (customer.membership_level === 'VIP Platinum') membershipDiscountPercent = 25
    }

    let subtotal = 0
    let discount = 0

    cartItems.forEach(item => {
      const lineSubtotal = item.quantity * item.unit_price
      let itemDiscount = 0
      if (item.type === 'service' && membershipDiscountPercent > 0) {
        itemDiscount = lineSubtotal * (membershipDiscountPercent / 100)
      }
      subtotal += lineSubtotal
      discount += itemDiscount
    })

    const promoDiscount = (subtotal - discount) * (discountPercent / 100)
    discount += promoDiscount

    const taxRate = Number(settings.rate ?? '18') / 100
    const afterDiscount = subtotal - discount
    let gst = 0
    let total = 0
    let taxable = afterDiscount

    // settings.inclusive indicates inclusive pricing
    const isInclusive = settings.inclusive ?? true
    if (isInclusive) {
      total = afterDiscount
      gst = afterDiscount - (afterDiscount / (1 + taxRate))
      taxable = afterDiscount - gst
    } else {
      gst = afterDiscount * taxRate
      total = afterDiscount + gst
    }

    return { subtotal, discount, gst, total, membershipDiscountPercent, taxable }
  }

  const { subtotal, discount, gst, total, membershipDiscountPercent, taxable } = calculateTotals()

  // Apply Coupon Code
  const applyPromo = async () => {
    try {
      const match = await MarketingService.validateCoupon(discountCode, activeTenantId)
      setDiscountPercent(match.discount_percent)
      success('Promo Code Applied', `${match.discount_percent}% discount applied from coupon ${match.code}.`)
    } catch (e: any) {
      error('Invalid Promo', e.message)
    }
  }

  // Confirm Invoice Checkout
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      error('Empty Cart', 'Please add items to cart before checking out.')
      return
    }
    
    const customer = customers.find(c => c.id === selectedCustomerId)
    
    // Wallet Payment balance validation
    if (paymentMethod === 'wallet') {
      if (!customer) {
        error('Walk-in Client Wallet', 'Wallet payments require a registered customer profile.')
        return
      }
      const balance = customer.wallet_balance || 0
      if (balance < total) {
        error('Insufficient Balance', `Customer wallet balance (${formatCurrency(balance)}) is below transaction total.`)
        return
      }
    }

    // Split Payments validation
    if (paymentMethod === 'split') {
      const sum = cashAmount + cardAmount
      if (Math.abs(sum - total) > 1.5) {
        error('Split Match Failure', `The split sum (₹${sum}) must equal the total amount due (₹${Math.round(total)}).`)
        return
      }
    }

    try {
      setSubmitting(true)
      
      // Deduct wallet if used
      if (paymentMethod === 'wallet') {
        await CustomerValueService.adjustWallet(
          selectedCustomerId,
          activeTenantId,
          { change: -total, reason: 'POS Payment (Cart Checkout)' },
          user?.id || 'anonymous',
          user ? `${user.first_name} ${user.last_name || ''}` : 'System'
        )
      }

      const invoicePayload = {
        customer_id: selectedCustomerId === 'walk-in' ? null : selectedCustomerId,
        customer_name: selectedCustomerId === 'walk-in' ? 'Walk-in Customer' : `${customer?.first_name} ${customer?.last_name || ''}`.trim(),
        items: cartItems.map(item => ({
          ...item,
          total: item.quantity * item.unit_price
        })),
        payment_method: paymentMethod,
        discount_amount: discount,
        tax_amount: gst,
        total_amount: total,
        status: 'paid',
      }

      const inv = await BillingService.createInvoice(
        activeTenantId,
        invoicePayload,
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )

      setCreatedInvoice(inv)
      success('Checkout Completed', `Invoice ${inv.invoice_number} successfully registered.`)
      onSuccess()
    } catch (e: any) {
      error('Checkout failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-0 text-left">
        {createdInvoice ? (
          /* Receipt Print View */
          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
              <h2 className="text-xl font-bold">Transaction Receipt</h2>
              <p className="text-xs text-muted-foreground">Invoice #{createdInvoice.invoice_number} • Paid</p>
            </div>

            <div className="border rounded-2xl p-4 bg-muted/20 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billed To:</span>
                <strong>{createdInvoice.customer_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{new Date(createdInvoice.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Mode:</span>
                <span className="capitalize">{createdInvoice.payment_method}</span>
              </div>
            </div>

            {/* Cart Items list */}
            <div className="border rounded-2xl p-4 space-y-2">
              <div className="text-xs font-bold text-muted-foreground uppercase border-b pb-2 mb-2 font-sans">Items checkout</div>
              {createdInvoice.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm py-1">
                  <span>{item.name} x {item.quantity}</span>
                  <strong>{formatCurrency(item.total)}</strong>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(createdInvoice.subtotal || createdInvoice.total_amount - (createdInvoice.tax_amount || 0))}</span></div>
              {(createdInvoice.discount_amount > 0 || createdInvoice.discount > 0) && (
                <div className="flex justify-between text-rose-500"><span>Discount</span><span>-{formatCurrency(createdInvoice.discount_amount || createdInvoice.discount)}</span></div>
              )}
              <div className="flex justify-between text-muted-foreground"><span>GST ({settings.rate}% {settings.inclusive ? 'inclusive' : 'exclusive'})</span><span>{formatCurrency(createdInvoice.tax_amount || createdInvoice.gst_amount)}</span></div>
              <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total amount Paid</span><span>{formatCurrency(createdInvoice.total_amount)}</span></div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" className="border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 font-semibold" onClick={() => success('WhatsApp Sent', `Receipt link sent via WhatsApp to ${createdInvoice.customer_name}'s phone.`)}>
                <MessageSquare className="h-4 w-4 mr-2" /> WhatsApp Receipt
              </Button>
              <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Print Receipt</Button>
              <Button variant="gradient" onClick={onClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-xs text-muted-foreground">Loading checkout registries...</span>
          </div>
        ) : (
          /* Main POS Screen */
          <div className="grid grid-cols-1 md:grid-cols-5 min-h-[500px]">
            {/* Left Catalog Side (3 Columns) */}
            <div className="md:col-span-3 border-r p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">POS Checkout Terminal</h2>
                <Badge variant="secondary">Demo Register #1</Badge>
              </div>

              {/* Import Appointments list */}
              {appointments.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-muted-foreground uppercase font-sans">Today's Scheduled Bookings</div>
                  <div className="grid grid-cols-1 gap-2 max-h-[120px] overflow-y-auto pr-1">
                    {appointments.map(apt => (
                      <div key={apt.id} className="flex items-center justify-between p-2 border rounded-xl bg-violet-500/5 text-xs">
                        <div>
                          <strong>{apt.customer_name}</strong> ({apt.service_name})
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-primary font-semibold" onClick={() => importAppointment(apt.id)}>Import Cart</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Catalog list */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-muted-foreground uppercase font-sans">Services Catalog</div>
                <div className="grid grid-cols-2 gap-2.5 max-h-[180px] overflow-y-auto pr-1">
                  {services.map(srv => (
                    <div key={srv.id} className="p-2.5 border rounded-xl hover:bg-muted/30 cursor-pointer flex items-center justify-between" onClick={() => addToCart(srv, 'service')}>
                      <div>
                        <div className="text-xs font-semibold">{srv.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{srv.duration_minutes} min</div>
                      </div>
                      <strong className="text-xs">{formatCurrency(srv.price)}</strong>
                    </div>
                  ))}
                </div>

                <div className="text-xs font-bold text-muted-foreground uppercase font-sans">Retail Products</div>
                <div className="grid grid-cols-2 gap-2.5 max-h-[120px] overflow-y-auto pr-1">
                  {products.map(prod => (
                    <div key={prod.id} className="p-2.5 border rounded-xl hover:bg-muted/30 cursor-pointer flex items-center justify-between" onClick={() => addToCart(prod, 'product')}>
                      <div>
                        <div className="text-xs font-semibold">{prod.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">SKU: {prod.sku || 'N/A'} • {prod.stock_quantity || 0} in stock</div>
                      </div>
                      <strong className="text-xs">{formatCurrency(prod.price)}</strong>
                    </div>
                  ))}
                </div>

                <div className="text-xs font-bold text-muted-foreground uppercase font-sans">Memberships & Value Cards</div>
                <div className="grid grid-cols-2 gap-2.5 max-h-[100px] overflow-y-auto pr-1">
                  {[
                    { id: 'm1', name: 'Gold Membership Plan', price: 1500, type: 'service' },
                    { id: 'm2', name: 'VIP Platinum Plan', price: 3000, type: 'service' },
                    { id: 'gc1', name: '₹1000 Store Gift Card', price: 1000, type: 'product' },
                    { id: 'pkg1', name: '10 Haircuts Package', price: 3500, type: 'service' }
                  ].map(card => (
                    <div key={card.id} className="p-2.5 border rounded-xl hover:bg-muted/30 cursor-pointer flex items-center justify-between" onClick={() => addToCart(card, card.type as any)}>
                      <div>
                        <div className="text-xs font-semibold">{card.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Value package</div>
                      </div>
                      <strong className="text-xs">{formatCurrency(card.price)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Cart Side (2 Columns) */}
            <div className="md:col-span-2 p-6 bg-muted/20 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-sm font-bold">Shopping Cart</h3>

                {/* Customer Selector */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Select Customer Profile</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="bg-card"><SelectValue placeholder="Walk-in Client" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walk-in">Walk-in Client</SelectItem>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name || ''} ({c.phone})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cart list */}
                <div className="border rounded-2xl bg-card p-3 space-y-2 max-h-[200px] overflow-y-auto">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs pb-1 border-b last:border-0 last:pb-0">
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{formatCurrency(item.unit_price)} x {item.quantity}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <strong>{formatCurrency(item.unit_price * item.quantity)}</strong>
                        <button onClick={() => removeFromCart(item.id, item.type)} className="text-rose-500 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                  {cartItems.length === 0 && (
                    <p className="text-center text-muted-foreground text-xs py-6">Add services or retail items.</p>
                  )}
                </div>

                {/* Promo Codes */}
                <div className="flex gap-2">
                  <Input placeholder="Coupon code (e.g. WELCOME10)" value={discountCode} onChange={e => setDiscountCode(e.target.value)} className="h-8 text-xs bg-card" />
                  <Button size="sm" variant="outline" className="h-8 font-semibold" onClick={applyPromo}><Tag className="h-3 w-3 mr-1" /> Apply</Button>
                </div>

                {/* Payment mode select */}
                <div className="space-y-1 pt-1">
                  <Label className="text-xs text-muted-foreground">Select Payment Mode</Label>
                  <Select value={paymentMethod} onValueChange={(val: any) => { setPaymentMethod(val); if (val === 'split') { setCashAmount(Math.round(total / 2)); setCardAmount(Math.round(total / 2)); } }}>
                    <SelectTrigger className="bg-card h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash Payment</SelectItem>
                      <SelectItem value="card">Debit/Credit Card</SelectItem>
                      <SelectItem value="upi">UPI Transfer</SelectItem>
                      <SelectItem value="wallet">Wallet Store Credit</SelectItem>
                      <SelectItem value="gift_card">Gift Card Wallet</SelectItem>
                      <SelectItem value="split">Split (Cash + Card)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Split Payments portions */}
                {paymentMethod === 'split' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Cash Portion (₹)</Label>
                      <Input
                        type="number"
                        value={cashAmount}
                        onChange={e => setCashAmount(Number(e.target.value))}
                        className="h-8 text-xs bg-card"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Card/UPI Portion (₹)</Label>
                      <Input
                        type="number"
                        value={cardAmount}
                        onChange={e => setCardAmount(Number(e.target.value))}
                        className="h-8 text-xs bg-card"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Invoice Totals */}
              <div className="space-y-3 pt-4 border-t">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  {discount > 0 && (
                    <div className="flex justify-between text-rose-500"><span>Discount</span><span>-{formatCurrency(discount)}</span></div>
                  )}
                  <div className="flex justify-between text-muted-foreground"><span>GST (18% inclusive)</span><span>{formatCurrency(gst)}</span></div>
                  <div className="flex justify-between text-base font-bold pt-1 border-t"><span>Total Amount Due</span><span>{formatCurrency(total)}</span></div>
                </div>

                <Button className="w-full text-xs font-bold" variant="gradient" disabled={submitting} onClick={handleCheckout}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Confirm & Print Invoice
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

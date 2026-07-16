'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Mail, Phone, MapPin, Scissors, Heart, Award, CreditCard, Clock, MessageSquare, Plus, Check, Merge, ShieldAlert, Loader2, Save, Send, AlertTriangle, ToggleLeft, RefreshCw, Star, Landmark } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { CustomerService, AuditService, CustomerValueService } from '@/services/business-services'
import { CustomerRepository, AppointmentRepository, InvoiceRepository, AuditRepository, CustomerValueRepository } from '@/lib/repositories/repositories'
import { formatCurrency, formatDate, formatTime, getInitials } from '@/lib/utils'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { permissionHelpers } from '@/lib/auth/permissions'
import { MembershipPlanModal } from '@/components/shared/membership-plan-modal'
import { WalletAdjustmentModal } from '@/components/shared/wallet-adjustment-modal'

interface CustomerDetailsModalProps {
  customerId: string | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CustomerDetailsModal({ customerId, isOpen, onClose, onSuccess }: CustomerDetailsModalProps) {
  const { tenant, user, role } = useAuth()
  const { success, error } = useToast()
  const activeTenantId = tenant?.id || 'demo-tenant-001'

  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [appointments, setAppointments] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [comms, setComms] = useState<any[]>([])

  // CRM Sub-systems
  const [packages, setPackages] = useState<any[]>([])
  const [walletTx, setWalletTx] = useState<any[]>([])

  // Action states
  const [showMerge, setShowMerge] = useState(false)
  const [duplicateCustomerId, setDuplicateCustomerId] = useState('')
  const [allCustomers, setAllCustomers] = useState<any[]>([])

  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageChannel, setMessageChannel] = useState<'sms' | 'whatsapp' | 'email'>('whatsapp')
  const [messageContent, setMessageContent] = useState('')

  // Customer Value sub-modals
  const [showMembershipModal, setShowMembershipModal] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)

  // Edit notes state
  const [internalNotes, setInternalNotes] = useState('')

  const loadCustomerDetails = async () => {
    if (!customerId) return
    try {
      setLoading(true)
      const data = await CustomerRepository.getById(customerId)
      if (data) {
        setCustomer(data)
        setInternalNotes(data.notes || '')

        // Load appointments
        const aptsList = await AppointmentRepository.list(activeTenantId)
        setAppointments(aptsList.filter(a => a.customer_id === customerId))

        // Load invoices
        const invsList = await InvoiceRepository.list(activeTenantId)
        setInvoices(invsList.filter(i => i.customer_id === customerId))

        // Load communication timeline
        const audits = await AuditRepository.list(activeTenantId)
        setComms(audits.filter(a => a.entity_id === customerId && a.action.startsWith('send_')))

        // Load customers pool for merge dropdown
        const cPool = await CustomerRepository.list(activeTenantId)
        setAllCustomers(cPool.filter(c => c.id !== customerId))

        // Load packages
        const pkgList = await CustomerValueRepository.listCustomerPackages(activeTenantId)
        setPackages(pkgList.filter(p => p.customer_id === customerId))

        // Load wallet transactions
        const wTx = await CustomerValueRepository.listWalletTransactions(customerId, activeTenantId)
        setWalletTx(wTx)
      }
    } catch (e) {
      console.error('Failed to load CRM record details', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && customerId) {
      loadCustomerDetails()
    }
    setShowMerge(false)
    setShowMessageModal(false)
    setShowMembershipModal(false)
    setShowWalletModal(false)
  }, [isOpen, customerId])

  // Deactivate Profile
  const handleDeactivate = async () => {
    if (!customer) return
    try {
      setSubmitting(true)
      await CustomerService.deactivate(
        customer.id,
        activeTenantId,
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Deactivated', 'Customer profile marked as inactive.')
      loadCustomerDetails()
      onSuccess()
    } catch (e: any) {
      error('Deactivation failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Merge profiles
  const handleMergeProfiles = async () => {
    if (!customer || !duplicateCustomerId) return
    try {
      setSubmitting(true)
      await CustomerService.merge(
        customer.id,
        duplicateCustomerId,
        activeTenantId,
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Merged successfully', 'Account duplicates integrated.')
      setShowMerge(false)
      onClose()
      onSuccess()
    } catch (e: any) {
      error('Merge failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Send Message
  const handleSendMessage = async () => {
    if (!customer || !messageContent.trim()) return
    try {
      setSubmitting(true)
      await CustomerService.sendMessage(
        customer.id,
        activeTenantId,
        { channel: messageChannel, content: messageContent },
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Message Sent', `Outbound draft dispatched over ${messageChannel.toUpperCase()}.`)
      setMessageContent('')
      setShowMessageModal(false)
      loadCustomerDetails()
    } catch (e: any) {
      error('Send failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Save CRM General comments
  const handleSaveNotes = async () => {
    if (!customer) return
    try {
      setSubmitting(true)
      await CustomerService.update(
        customer.id,
        activeTenantId,
        { notes: internalNotes },
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Saved', 'CRM comments updated.')
      loadCustomerDetails()
    } catch (e: any) {
      error('Save failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Freeze plan
  const handleFreezeMembership = async () => {
    if (!customer) return
    try {
      setSubmitting(true)
      await CustomerValueService.freezeMembership(
        customer.id,
        activeTenantId,
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Roster Status Adjusted', 'Membership status shifted.')
      loadCustomerDetails()
    } catch (e: any) {
      error('Action failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Redeem prepaid package session
  const handleRedeemPackageSession = async (pkgId: string) => {
    try {
      setSubmitting(true)
      await CustomerValueService.redeemPackage(
        customer.id,
        activeTenantId,
        pkgId,
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Session Redeemed', 'Prepaid package remaining count updated.')
      loadCustomerDetails()
    } catch (e: any) {
      error('Redemption failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-xs text-muted-foreground">Retrieving CRM profile...</span>
          </div>
        ) : customer ? (
          <div className="flex flex-col text-left">
            {/* Header Block */}
            <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-left">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="text-lg">{getInitials(customer.first_name, customer.last_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{customer.first_name} {customer.last_name || ''}</h2>
                    {customer.total_spent > 100000 && <Badge variant="warning">VIP</Badge>}
                    <Badge variant={customer.is_active ? 'success' : 'secondary'}>
                      {customer.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{customer.phone}</span>
                    {customer.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{customer.email}</span>}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowMessageModal(true)}>
                  <MessageSquare className="h-4 w-4 mr-1.5" /> Message
                </Button>
                {role !== 'stylist' && role !== 'beautician' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setShowMerge(true)}>
                      <Merge className="h-4 w-4 mr-1.5" /> Merge Duplicate
                    </Button>
                    {customer.is_active && (
                      <Button variant="outline" size="sm" className="text-rose-500" onClick={handleDeactivate} disabled={submitting}>
                        <ToggleLeft className="h-4 w-4 mr-1.5" /> Deactivate
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Quick Stats Grid with Wallet & Membership */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-6 bg-muted/20 border-b text-left">
              <Card className="bg-card shadow-none border-none"><CardContent className="p-3 text-center"><Clock className="h-4 w-4 mx-auto text-violet-500 mb-1" /><div className="text-sm font-bold">{customer.total_visits || 0}</div><div className="text-[9px] text-muted-foreground uppercase font-semibold">Visits</div></CardContent></Card>
              <Card className="bg-card shadow-none border-none"><CardContent className="p-3 text-center"><CreditCard className="h-4 w-4 mx-auto text-emerald-500 mb-1" /><div className="text-sm font-bold">{formatCurrency(customer.total_spent || 0)}</div><div className="text-[9px] text-muted-foreground uppercase font-semibold">Spent</div></CardContent></Card>
              <Card className="bg-card shadow-none border-none"><CardContent className="p-3 text-center"><Award className="h-4 w-4 mx-auto text-amber-500 mb-1" /><div className="text-sm font-bold">{customer.loyalty_points || 0}</div><div className="text-[9px] text-muted-foreground uppercase font-semibold">Points</div></CardContent></Card>
              <Card className="bg-card shadow-none border-none cursor-pointer hover:bg-muted/10 transition-colors" onClick={() => setShowMembershipModal(true)}>
                <CardContent className="p-3 text-center">
                  <Heart className="h-4 w-4 mx-auto text-rose-500 mb-1" />
                  <div className="text-sm font-bold truncate capitalize">{customer.membership_level || 'No Plan'}</div>
                  <div className="text-[9px] text-muted-foreground uppercase font-semibold">Membership</div>
                </CardContent>
              </Card>
              <Card className="bg-card shadow-none border-none cursor-pointer hover:bg-muted/10 transition-colors" onClick={() => setShowWalletModal(true)}>
                <CardContent className="p-3 text-center">
                  <Landmark className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                  <div className="text-sm font-bold">{formatCurrency(customer.wallet_balance || 0)}</div>
                  <div className="text-[9px] text-muted-foreground uppercase font-semibold">Wallet</div>
                </CardContent>
              </Card>
            </div>

            {/* Main Tabs Panel */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mx-6 mt-4 w-[calc(100%-48px)]">
                <TabsTrigger value="overview" className="flex-1">General</TabsTrigger>
                <TabsTrigger value="visits" className="flex-1">Visits ({appointments.length})</TabsTrigger>
                <TabsTrigger value="payments" className="flex-1">Invoices ({invoices.length})</TabsTrigger>
                <TabsTrigger value="value_pack" className="flex-1">Value Pack</TabsTrigger>
                <TabsTrigger value="comms" className="flex-1">Timeline</TabsTrigger>
                <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
              </TabsList>

              {/* TABS 1: General Info */}
              <TabsContent value="overview" className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-left">
                  <div>
                    <span className="text-muted-foreground block text-xs">Gender</span>
                    <strong className="capitalize">{customer.gender || 'Not specified'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Date of Birth</span>
                    <strong>{customer.date_of_birth ? formatDate(customer.date_of_birth) : 'Not recorded'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Address</span>
                    <strong>{customer.address || 'No address set'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Referral Source</span>
                    <strong>{customer.referral_source || 'Walk-in / Direct'}</strong>
                  </div>
                </div>

                <div className="border rounded-2xl p-4 bg-muted/20 text-left">
                  <div className="text-xs font-bold text-muted-foreground uppercase mb-2">Preferences</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs">Preferred Staff</span>
                      <strong>Rekha Iyer (Stylist)</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Preferred Time</span>
                      <strong>Weekends Morning</strong>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TABS 2: Visits */}
              <TabsContent value="visits" className="p-6 max-h-[300px] overflow-y-auto space-y-2">
                {appointments.map((apt, idx) => (
                  <div key={apt.id || idx} className="flex justify-between items-center p-3 border rounded-xl hover:bg-muted/10 text-left">
                    <div>
                      <div className="text-sm font-semibold">{apt.service_name}</div>
                      <div className="text-xs text-muted-foreground flex gap-3 mt-0.5">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(apt.start_time)}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(apt.start_time)}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="capitalize text-[10px]">{apt.status}</Badge>
                  </div>
                ))}
                {appointments.length === 0 && (
                  <p className="text-muted-foreground text-center py-4 text-xs">No visit history logs found.</p>
                )}
              </TabsContent>

              {/* TABS 3: Payments */}
              <TabsContent value="payments" className="p-6 max-h-[300px] overflow-y-auto space-y-2">
                {invoices.map((inv, idx) => (
                  <div key={inv.id || idx} className="flex justify-between items-center p-3 border rounded-xl hover:bg-muted/10 text-left">
                    <div>
                      <div className="text-sm font-semibold">{inv.invoice_number}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{formatDate(inv.created_at)} • {inv.payment_method}</div>
                    </div>
                    <div className="text-right">
                      <strong className="text-sm block">{formatCurrency(inv.total_amount)}</strong>
                      <Badge className="text-[9px] scale-90" variant={inv.status === 'paid' ? 'success' : 'destructive'}>{inv.status}</Badge>
                    </div>
                  </div>
                ))}
                {invoices.length === 0 && (
                  <p className="text-muted-foreground text-center py-4 text-xs">No payment history sheets on file.</p>
                )}
              </TabsContent>

              {/* TABS 4: Customer Value Pack */}
              <TabsContent value="value_pack" className="p-6 space-y-4">
                {/* Active Membership details */}
                <div className="border rounded-2xl p-4 bg-muted/20 text-left space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5"><Heart className="h-4 w-4 text-rose-500" /> Membership Tier</span>
                    <Badge variant={customer.membership_status === 'active' ? 'success' : 'warning'} className="capitalize">{customer.membership_status || 'None'}</Badge>
                  </div>
                  {customer.membership_level ? (
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <strong>{customer.membership_level} Plan</strong>
                        <div className="text-xs text-muted-foreground mt-0.5">Enables active discounts on service categories.</div>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleFreezeMembership} disabled={submitting}>
                        {customer.membership_status === 'frozen' ? 'Unfreeze' : 'Freeze Membership'}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">No active membership plan currently assigned.</span>
                      <Button size="sm" variant="gradient" onClick={() => setShowMembershipModal(true)}>Assign Plan</Button>
                    </div>
                  )}
                </div>

                {/* Prepaid Packages */}
                <div className="border rounded-2xl p-4 bg-muted/20 text-left space-y-3">
                  <div className="text-xs font-bold text-muted-foreground uppercase border-b pb-2">Prepaid Service Packages</div>
                  <div className="space-y-2">
                    {packages.map(pkg => (
                      <div key={pkg.id} className="flex justify-between items-center p-2.5 border rounded-xl bg-card text-xs">
                        <div>
                          <strong>{pkg.name}</strong>
                          <div className="text-[10px] text-muted-foreground mt-0.5">Remaining sessions: {pkg.remaining_sessions} / {pkg.total_sessions}</div>
                        </div>
                        <Button size="sm" variant="outline" disabled={submitting || pkg.remaining_sessions <= 0} onClick={() => handleRedeemPackageSession(pkg.id)}>
                          Redeem Session
                        </Button>
                      </div>
                    ))}
                    {packages.length === 0 && (
                      <p className="text-xs text-muted-foreground">No prepaid service packages assigned.</p>
                    )}
                  </div>
                </div>

                {/* Referral program */}
                <div className="border rounded-2xl p-4 bg-muted/20 text-left space-y-2 text-xs">
                  <div className="text-xs font-bold text-muted-foreground uppercase border-b pb-2 mb-2">Referrals Tracking</div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Referral Code:</span>
                    <strong>REF-{customer.first_name.toUpperCase()}-50</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Successful Invites:</span>
                    <strong>2 referrals</strong>
                  </div>
                </div>
              </TabsContent>

              {/* TABS 5: Timeline comms */}
              <TabsContent value="comms" className="p-6 max-h-[300px] overflow-y-auto">
                <div className="space-y-2.5 text-left">
                  {comms.map((log, idx) => (
                    <div key={log.id || idx} className="p-3 border rounded-xl bg-muted/20">
                      <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                        <span className="font-semibold uppercase text-primary">{log.action.replace('send_', '')}</span>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-foreground">{log.new_values?.content}</p>
                    </div>
                  ))}
                  {comms.length === 0 && (
                    <p className="text-muted-foreground text-center py-4 text-xs">No messaging logs on file.</p>
                  )}
                </div>
              </TabsContent>

              {/* TABS 6: Notes panel */}
              <TabsContent value="notes" className="p-6 space-y-4 text-left">
                <div className="space-y-2">
                  <Label>CRM Consultation & Internal Notes</Label>
                  <Textarea
                    placeholder="Capture product usage specifications, preferences, and consultation warnings..."
                    rows={4}
                    value={internalNotes}
                    onChange={e => setInternalNotes(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="gradient" onClick={handleSaveNotes} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
                    Save Comments
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="p-6 border-t bg-muted/20">
              <Button variant="outline" onClick={onClose} disabled={submitting}>
                Dismiss File
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>

      {/* MERGE DIALOG */}
      <Dialog open={showMerge} onOpenChange={setShowMerge}>
        <DialogContent className="max-w-md text-left">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500"><Merge className="h-5 w-5" /> Merge Duplicates</DialogTitle>
            <DialogDescription>
              Select a duplicate customer file. This action transfers all appointments, invoices, and loyalty totals to the main profile, then deletes the duplicate profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <Label>Duplicate Profile</Label>
            <Select value={duplicateCustomerId} onValueChange={setDuplicateCustomerId} disabled={submitting}>
              <SelectTrigger><SelectValue placeholder="Choose duplicate profile" /></SelectTrigger>
              <SelectContent>
                {allCustomers.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.first_name} {c.last_name || ''} ({c.phone})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowMerge(false)} disabled={submitting}>Cancel</Button>
            <Button variant="destructive" onClick={handleMergeProfiles} disabled={submitting || !duplicateCustomerId}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Confirm Merge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MESSAGE DIALOG */}
      <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
        <DialogContent className="max-w-md text-left">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5" /> Send Message</DialogTitle>
            <DialogDescription>
              Draft an outbound message. The campaign notification helper simulates dispatch over selected communication channels.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label>Select Channel</Label>
              <Select value={messageChannel} onValueChange={(val: any) => setMessageChannel(val)} disabled={submitting}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Draft Content</Label>
              <Textarea
                placeholder="Type message text here..."
                rows={3}
                value={messageContent}
                onChange={e => setMessageContent(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowMessageModal(false)} disabled={submitting}>Cancel</Button>
            <Button variant="gradient" onClick={handleSendMessage} disabled={submitting || !messageContent.trim()}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Send Outbound
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CUSTOMER VALUE ENGINE DIALOGS */}
      {customer && (
        <>
          <MembershipPlanModal
            customerId={customer.id}
            currentPlan={customer.membership_level}
            isOpen={showMembershipModal}
            onClose={() => setShowMembershipModal(false)}
            onSuccess={loadCustomerDetails}
          />
          <WalletAdjustmentModal
            customerId={customer.id}
            currentBalance={customer.wallet_balance || 0}
            isOpen={showWalletModal}
            onClose={() => setShowWalletModal(false)}
            onSuccess={loadCustomerDetails}
          />
        </>
      )}
    </Dialog>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

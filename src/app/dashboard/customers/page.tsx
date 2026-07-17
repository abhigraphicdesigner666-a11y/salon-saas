'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Mail, Phone, Star, Calendar, IndianRupee, Gift, Edit2, Trash2, Download, Loader2, Users, CheckCircle, ShieldAlert, BadgePercent, ShieldCheck, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn, formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { CustomerService, AppointmentService } from '@/services/business-services'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { customerSchema } from '@/lib/validation/schemas'
import { permissionHelpers } from '@/lib/auth/permissions'
import { CustomerDetailsModal } from '@/components/shared/customer-details-modal'
import { useSearchParams } from 'next/navigation'
import type { Customer } from '@/lib/types'

type CustomerFormValues = typeof customerSchema._type

function CustomersPageContent() {
  const { tenant, user, role } = useAuth()
  const { success, error } = useToast()
  const searchParams = useSearchParams()
  const activeTenantId = tenant?.id || 'demo-tenant-001'

  // Switch tabs (directory / memberships)
  const [activeTab, setActiveTab] = useState<'directory' | 'memberships'>('directory')

  // Customer state
  const [customerList, setCustomerList] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const perPage = 10

  // Memberships state
  const [memberships, setMemberships] = useState<any[]>([])
  const [showAddMembership, setShowAddMembership] = useState(false)
  const [editingMembership, setEditingMembership] = useState<any>(null)
  const [membershipForm, setMembershipForm] = useState({
    name: '',
    price: 10000,
    credit_value: 15000,
    duration_days: 365
  })

  // Watch URL query parameter to sync tabs
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'memberships') {
      setActiveTab('memberships')
    } else {
      setActiveTab('directory')
    }
  }, [searchParams])

  // Fetch Customers CRM data
  const fetchCustomers = async () => {
    try {
      setLoading(true)
      let cData = await CustomerService.list(activeTenantId)
      
      // Stylists/Beauticians can only see assigned customers who have booked with them
      if (role === 'stylist' || role === 'beautician') {
        const apts = await AppointmentService.list(activeTenantId)
        const myAptCustomerIds = new Set(apts.filter(a => a.staff_id === user?.id).map(a => a.customer_id))
        cData = cData.filter(c => myAptCustomerIds.has(c.id))
      }

      setCustomerList(cData)
    } catch (e: any) {
      error('Failed to load CRM data', e.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch Memberships data
  const fetchMemberships = async () => {
    try {
      setLoading(true)
      const data = await CustomerService.listMemberships(activeTenantId)
      setMemberships(data)
    } catch (e: any) {
      error('Failed to load memberships', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'directory') {
      fetchCustomers()
    } else {
      fetchMemberships()
    }
  }, [activeTenantId, role, user?.id, activeTab])

  // CRM Form setup
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      gender: 'female',
      date_of_birth: '',
      address: '',
      notes: '',
      allergies: [],
    }
  })

  const onAddCustomerSubmit = async (values: CustomerFormValues) => {
    if (!permissionHelpers.canCreate(role, 'customers')) {
      error('Access Denied', 'Your account role is not authorized to create customers.')
      return
    }

    try {
      setSubmitting(true)
      await CustomerService.create(
        activeTenantId,
        values,
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Customer Added', `${values.first_name} has been successfully registered.`)
      setShowAdd(false)
      reset()
      fetchCustomers()
    } catch (e: any) {
      error('Failed to register customer', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Membership submit
  const handleSaveMembership = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!permissionHelpers.canUpdate(role, 'customers')) {
      error('Access Denied', 'Your account role is not authorized to edit membership plans.')
      return
    }

    try {
      setSubmitting(true)
      if (editingMembership) {
        // Edit mode
        await CustomerService.updateMembership(
          editingMembership.id,
          activeTenantId,
          membershipForm,
          user?.id || 'anonymous',
          user ? `${user.first_name} ${user.last_name || ''}` : 'System'
        )
        success('Plan Updated', `${membershipForm.name} membership plan has been updated.`)
      } else {
        // Create mode
        await CustomerService.createMembership(
          activeTenantId,
          membershipForm,
          user?.id || 'anonymous',
          user ? `${user.first_name} ${user.last_name || ''}` : 'System'
        )
        success('Plan Created', `${membershipForm.name} membership plan has been created.`)
      }
      setShowAddMembership(false)
      setEditingMembership(null)
      setMembershipForm({ name: '', price: 10000, credit_value: 15000, duration_days: 365 })
      fetchMemberships()
    } catch (e: any) {
      error('Failed to save membership plan', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMembership = async (id: string) => {
    if (!permissionHelpers.canUpdate(role, 'customers')) {
      error('Access Denied', 'Your account role is not authorized to delete membership plans.')
      return
    }
    if (!confirm('Are you sure you want to delete this membership plan?')) return

    try {
      setLoading(true)
      await CustomerService.deleteMembership(
        id,
        activeTenantId,
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Plan Deleted', 'Membership plan successfully removed.')
      fetchMemberships()
    } catch (e: any) {
      error('Failed to delete membership plan', e.message)
      setLoading(false)
    }
  }

  const handleOpenEditMembership = (m: any) => {
    setEditingMembership(m)
    setMembershipForm({
      name: m.name,
      price: m.price,
      credit_value: m.credit_value,
      duration_days: m.duration_days
    })
    setShowAddMembership(true)
  }

  // Filter CRM lists
  const filtered = customerList.filter(c => {
    const matchesSearch = `${c.first_name} ${c.last_name || ''} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
    if (filterStatus === 'vip') return matchesSearch && c.total_spent > 100000
    if (filterStatus === 'active') return matchesSearch && c.is_active
    return matchesSearch
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="space-y-6">
      {/* Switcher & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-left">
            {activeTab === 'directory' ? 'Customer CRM' : 'Memberships & Advance Credits'}
          </h1>
          <p className="text-muted-foreground text-xs text-left">
            {activeTab === 'directory' 
              ? 'Manage client files, preference histories, and communications' 
              : 'Configure advance packages (e.g. Deposit ₹10k and receive ₹15k service credits valid for 1 year)'}
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'directory' ? (
            permissionHelpers.canCreate(role, 'customers') && (
              <Button variant="gradient" onClick={() => setShowAdd(true)} className="text-xs h-9 font-bold">
                <Plus className="h-4 w-4 mr-1.5" /> Add Customer
              </Button>
            )
          ) : (
            permissionHelpers.canUpdate(role, 'customers') && (
              <Button variant="gradient" onClick={() => {
                setEditingMembership(null)
                setMembershipForm({ name: '', price: 10000, credit_value: 15000, duration_days: 365 })
                setShowAddMembership(true)
              }} className="text-xs h-9 font-bold">
                <Plus className="h-4 w-4 mr-1.5" /> Add Plan
              </Button>
            )
          )}
        </div>
      </div>

      {/* Selector Tabs */}
      <div className="flex border-b border-muted">
        <button
          onClick={() => setActiveTab('directory')}
          className={cn(
            "pb-2.5 px-4 text-xs font-bold transition-all border-b-2",
            activeTab === 'directory' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Client Directory
        </button>
        <button
          onClick={() => setActiveTab('memberships')}
          className={cn(
            "pb-2.5 px-4 text-xs font-bold transition-all border-b-2",
            activeTab === 'memberships' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Memberships & Advance Credits
        </button>
      </div>

      {activeTab === 'directory' ? (
        /* CRM DIRECTORY VIEW */
        <Card className="border shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search customers..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 bg-card text-xs h-9" />
              </div>
              <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setPage(1); }}>
                <SelectTrigger className="w-[150px] text-xs h-9 bg-card">
                  <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Customers</SelectItem>
                  <SelectItem value="active" className="text-xs">Active Profiles</SelectItem>
                  <SelectItem value="vip" className="text-xs">VIP Clients</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto w-full border rounded-xl bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="hidden md:table-cell text-left">Phone</TableHead>
                      <TableHead className="hidden lg:table-cell text-left">Visits</TableHead>
                      <TableHead className="text-left">Total Spent</TableHead>
                      <TableHead className="hidden lg:table-cell text-left">Last Visit</TableHead>
                      <TableHead className="text-left">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs font-medium">
                          No customer profiles matched the current filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map(c => (
                        <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelectedId(c.id)}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9"><AvatarFallback className="text-xs">{getInitials(c.first_name, c.last_name)}</AvatarFallback></Avatar>
                              <div>
                                <div className="font-medium text-left">{c.first_name} {c.last_name || ''}</div>
                                <div className="text-xs text-muted-foreground hidden sm:block text-left">{c.email}</div>
                              </div>
                              {c.total_spent > 100000 && <Badge variant="warning" className="text-[10px]">VIP</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-left">{c.phone}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-left">{c.total_visits}</TableCell>
                          <TableCell className="font-medium text-sm text-left">{formatCurrency(c.total_spent)}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground text-left">{c.last_visit_at ? formatDate(c.last_visit_at) : 'Never'}</TableCell>
                          <TableCell className="text-left"><Badge variant="secondary">{c.loyalty_points} pts</Badge></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of {filtered.length}</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-8 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* MEMBERSHIPS VIEW */
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {memberships.map((m) => (
                <Card key={m.id} className="glass-card overflow-hidden border relative flex flex-col justify-between h-[280px]">
                  <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-primary/20">
                    {m.status === 'active' ? 'ACTIVE PLAN' : 'INACTIVE'}
                  </div>

                  <CardHeader className="text-left p-5 pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-1.5">
                      <Gift className="h-4 w-4 text-primary" /> {m.name}
                    </CardTitle>
                    <CardDescription className="text-[11px]">Advance Deposit & Credits Package</CardDescription>
                  </CardHeader>

                  <CardContent className="px-5 py-2 text-left space-y-4 flex-1">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Advance Deposit required:</span>
                        <strong className="text-foreground text-sm font-bold">{formatCurrency(m.price)}</strong>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Service Credits awarded:</span>
                        <strong className="text-emerald-500 text-sm font-bold">{formatCurrency(m.credit_value)}</strong>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Validity:</span>
                        <span className="text-foreground font-medium flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" /> {m.duration_days} days (1 year)
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <div className="p-4 border-t bg-muted/20 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <BadgePercent className="h-4 w-4" /> Save {Math.round((m.credit_value - m.price) / m.price * 100)}% extra
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs font-semibold" onClick={() => handleOpenEditMembership(m)}>
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 px-2.5 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold" onClick={() => handleDeleteMembership(m.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {memberships.length === 0 && (
                <div className="col-span-3 border border-dashed rounded-2xl py-12 text-center text-muted-foreground text-xs font-medium">
                  No membership advance packages configured. Click "Add Plan" to create one.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Customer Details Drawer */}
      <CustomerDetailsModal
        customerId={selectedId}
        isOpen={!!selectedId}
        onClose={() => setSelectedId(null)}
        onSuccess={fetchCustomers}
      />

      {/* Add/Edit CRM Customer Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="text-left">
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onAddCustomerSubmit)} className="text-left space-y-4">
            <div className="grid grid-cols-2 gap-4 pb-4">
              <div className="space-y-1.5">
                <Label htmlFor="first_name" className="text-xs font-semibold">First Name *</Label>
                <Input id="first_name" placeholder="Priya" disabled={submitting} {...register('first_name')} className="h-9 text-xs" />
                {errors.first_name && <p className="text-[10px] text-rose-500">{errors.first_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name" className="text-xs font-semibold">Last Name</Label>
                <Input id="last_name" placeholder="Sharma" disabled={submitting} {...register('last_name')} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold">Phone *</Label>
                <Input id="phone" placeholder="9876543210" disabled={submitting} {...register('phone')} className="h-9 text-xs" />
                {errors.phone && <p className="text-[10px] text-rose-500">{errors.phone.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">Email *</Label>
                <Input id="email" placeholder="priya@email.com" type="email" disabled={submitting} {...register('email')} className="h-9 text-xs" />
                {errors.email && <p className="text-[10px] text-rose-500">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender" className="text-xs font-semibold">Gender</Label>
                <Select defaultValue={watch('gender')} onValueChange={(val) => setValue('gender', val as any)}>
                  <SelectTrigger id="gender" className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date_of_birth" className="text-xs font-semibold">Date of Birth</Label>
                <Input id="date_of_birth" type="date" disabled={submitting} {...register('date_of_birth')} className="h-9 text-xs" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="address" className="text-xs font-semibold">Address</Label>
                <Input id="address" placeholder="Address" disabled={submitting} {...register('address')} className="h-9 text-xs" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-semibold">Notes</Label>
                <Textarea id="notes" placeholder="Any notes about this customer..." rows={2} disabled={submitting} {...register('notes')} className="text-xs" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowAdd(false); reset() }} disabled={submitting} className="h-9 text-xs">Cancel</Button>
              <Button type="submit" variant="gradient" disabled={submitting} className="h-9 text-xs">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Membership Plan Dialog */}
      <Dialog open={showAddMembership} onOpenChange={setShowAddMembership}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle>{editingMembership ? 'Edit Membership Plan' : 'Create Membership Plan'}</DialogTitle>
            <DialogDescription className="text-xs">
              Configure advance package options. Owner can set how much advance payment gets what credit value.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveMembership} className="text-left space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="plan_name" className="text-xs font-semibold">Plan Name *</Label>
              <Input
                id="plan_name"
                value={membershipForm.name}
                onChange={e => setMembershipForm({ ...membershipForm, name: e.target.value })}
                placeholder="Gold Advance Plan"
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="plan_price" className="text-xs font-semibold">Advance Payment required (₹) *</Label>
                <Input
                  id="plan_price"
                  type="number"
                  value={membershipForm.price}
                  onChange={e => setMembershipForm({ ...membershipForm, price: Number(e.target.value) })}
                  placeholder="10000"
                  className="h-9 text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan_credit" className="text-xs font-semibold">Service Credits awarded (₹) *</Label>
                <Input
                  id="plan_credit"
                  type="number"
                  value={membershipForm.credit_value}
                  onChange={e => setMembershipForm({ ...membershipForm, credit_value: Number(e.target.value) })}
                  placeholder="15000"
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan_duration" className="text-xs font-semibold">Validity (Days) *</Label>
              <Input
                id="plan_duration"
                type="number"
                value={membershipForm.duration_days}
                onChange={e => setMembershipForm({ ...membershipForm, duration_days: Number(e.target.value) })}
                placeholder="365"
                className="h-9 text-xs"
                required
              />
            </div>

            <DialogFooter className="pt-2 gap-2 border-t mt-4">
              <Button type="button" variant="outline" onClick={() => { setShowAddMembership(false); setEditingMembership(null); }} disabled={submitting} className="h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={submitting} className="h-9 text-xs">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                {editingMembership ? 'Save Changes' : 'Create Plan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function CustomersPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CustomersPageContent />
    </React.Suspense>
  )
}

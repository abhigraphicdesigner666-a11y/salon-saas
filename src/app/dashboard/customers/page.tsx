'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Mail, Phone, Star, Calendar, IndianRupee, Gift, MoreVertical, Download, Loader2, Users, CheckCircle, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
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
import type { Customer } from '@/lib/types'

type CustomerFormValues = typeof customerSchema._type

export default function CustomersPage() {
  const { tenant, user, role } = useAuth()
  const { success, error } = useToast()
  
  const [customerList, setCustomerList] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const perPage = 10

  const activeTenantId = tenant?.id || 'demo-tenant-001'

  // Fetch Customers CRM data with Stylist gating
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

  useEffect(() => {
    fetchCustomers()
  }, [activeTenantId, role, user?.id])

  // Form setup
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
      error('Action failed', e.message || 'Could not register customer.')
    } finally {
      setSubmitting(false)
    }
  }

  // KPI calculations
  const kpis = {
    total: customerList.length,
    active: customerList.filter(c => c.is_active).length,
    vip: customerList.filter(c => c.total_spent > 100000).length,
    inactive: customerList.filter(c => !c.is_active).length,
  }

  const filtered = customerList.filter(c => {
    const matchesSearch = `${c.first_name} ${c.last_name || ''} ${c.email || ''} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'vip' && c.total_spent > 100000) || 
      (filterStatus === 'active' && c.is_active) || 
      (filterStatus === 'inactive' && !c.is_active)
    return matchesSearch && matchesFilter
  })

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(filtered.length / perPage)

  // Permissions
  const canCreateCustomer = permissionHelpers.canCreate(role, 'customers')
  const canExportCustomer = permissionHelpers.canExport(role, 'customers')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer CRM</h1>
          <p className="text-muted-foreground">Manage client files, preference histories, and communications</p>
        </div>
        <div className="flex gap-2">
          {canExportCustomer && (
            <Button variant="outline"><Download className="h-4 w-4 mr-2" /> Export</Button>
          )}
          {canCreateCustomer && (
            <Button variant="gradient" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" /> Add Customer</Button>
          )}
        </div>
      </div>

      {/* CRM Dashboard KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: kpis.total, icon: Users, color: 'text-foreground' },
          { label: 'Active Clients', value: kpis.active, icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'VIP Clients', value: kpis.vip, icon: Star, color: 'text-amber-500' },
          { label: 'Inactive Clients', value: kpis.inactive, icon: ShieldAlert, color: 'text-rose-500' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="text-left">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className={cn('text-2xl font-bold mt-1', s.color)}>{s.value}</div>
              </div>
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <s.icon className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="vip">VIP (₹1L+)</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
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
              <p className="text-sm text-muted-foreground">Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of {filtered.length}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reusable Customer Detail Profile Drawer */}
      <CustomerDetailsModal
        customerId={selectedId}
        isOpen={!!selectedId}
        onClose={() => setSelectedId(null)}
        onSuccess={fetchCustomers}
      />

      {/* Add Customer Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onAddCustomerSubmit)}>
            <div className="grid grid-cols-2 gap-4 pb-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input id="first_name" placeholder="Priya" disabled={submitting} {...register('first_name')} />
                {errors.first_name && <p className="text-xs text-rose-500">{errors.first_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" placeholder="Sharma" disabled={submitting} {...register('last_name')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="9876543210" disabled={submitting} {...register('phone')} />
                {errors.phone && <p className="text-xs text-rose-500">{errors.phone.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" placeholder="priya@email.com" type="email" disabled={submitting} {...register('email')} />
                {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select defaultValue={watch('gender')} onValueChange={(val) => setValue('gender', val as any)}>
                  <SelectTrigger id="gender"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input id="date_of_birth" type="date" disabled={submitting} {...register('date_of_birth')} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="Address" disabled={submitting} {...register('address')} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Any notes about this customer..." rows={2} disabled={submitting} {...register('notes')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowAdd(false); reset() }} disabled={submitting}>Cancel</Button>
              <Button type="submit" variant="gradient" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}



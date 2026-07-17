'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Download, Filter, IndianRupee, FileText, Eye, Loader2, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { StatCard } from '@/components/shared/stat-card'
import { cn, formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { BillingService } from '@/services/business-services'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { permissionHelpers } from '@/lib/auth/permissions'
import { POSCheckoutModal } from '@/components/shared/pos-checkout-modal'
import { InvoiceDetailsModal } from '@/components/shared/invoice-details-modal'
import type { Invoice } from '@/lib/types'

export default function BillingPage() {
  const { tenant, role } = useAuth()
  const { error } = useToast()

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedInvId, setSelectedInvId] = useState<string | null>(null)
  
  // Checkout modal
  const [showPOS, setShowPOS] = useState(false)

  const activeTenantId = tenant?.id || 'demo-tenant-001'

  // Fetch Invoices
  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const data = await BillingService.listInvoices(activeTenantId)
      setInvoices(data)
    } catch (e: any) {
      error('Failed to load invoices', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [activeTenantId])

  const filtered = invoices.filter(inv => {
    const matchSearch = `${inv.invoice_number} ${inv.customer_name}`.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || inv.status === filter || (filter === 'pending' && inv.status === 'sent')
    return matchSearch && matchFilter
  })

  // POS Gating & permissions
  const canCheckout = role !== 'accountant' // Accountants are read-only
  const canExport = permissionHelpers.canExport(role, 'billing')

  const paidInvoices = invoices.filter(i => i.status === 'paid')
  const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total_amount, 0)
  const averageTicketValue = paidInvoices.length > 0 ? Math.round(totalRevenue / paidInvoices.length) : 0

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & Invoices</h1>
          <p className="text-muted-foreground">Manage invoices, payments, and billing logs</p>
        </div>
        <div className="flex gap-2">
          {canExport && (
            <Button variant="outline"><Download className="h-4 w-4 mr-2" /> Export</Button>
          )}
          {canCheckout && (
            <Button variant="gradient" onClick={() => setShowPOS(true)}><Plus className="h-4 w-4 mr-2" /> POS Checkout</Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Collected" value={totalRevenue} isCurrency icon={IndianRupee} color="green" />
        <StatCard title="Average Ticket Value" value={averageTicketValue} isCurrency icon={TrendingUp} color="amber" />
        <StatCard title="Total Invoice Ledgers" value={invoices.length} icon={FileText} color="violet" />
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
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
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell text-left">Date</TableHead>
                    <TableHead className="text-left">Amount</TableHead>
                    <TableHead className="text-left">Status</TableHead>
                    <TableHead className="hidden lg:table-cell text-left">Payment</TableHead>
                    <TableHead className="text-left">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs font-medium">
                        No billing invoices matched the current search criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium text-sm text-left">{inv.invoice_number}</TableCell>
                        <TableCell className="text-sm text-left">{inv.customer_name}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground text-left">{formatDate(inv.created_at)}</TableCell>
                        <TableCell className="font-semibold text-sm text-left">{formatCurrency(inv.total_amount)}</TableCell>
                        <TableCell className="text-left"><Badge className={cn('text-[10px]', getStatusColor(inv.status))}>{inv.status}</Badge></TableCell>
                        <TableCell className="hidden lg:table-cell text-sm capitalize text-left">{inv.payment_method || '—'}</TableCell>
                        <TableCell className="text-left">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedInvId(inv.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* POS Checkout Dialog Drawer */}
      <POSCheckoutModal
        isOpen={showPOS}
        onClose={() => setShowPOS(false)}
        onSuccess={fetchInvoices}
      />

      {/* Invoice Detail Viewer & Refund Actions */}
      <InvoiceDetailsModal
        invoiceId={selectedInvId}
        isOpen={!!selectedInvId}
        onClose={() => setSelectedInvId(null)}
        onSuccess={fetchInvoices}
      />
    </motion.div>
  )
}

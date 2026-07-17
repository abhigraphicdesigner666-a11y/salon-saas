'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Download, Calendar, Users, IndianRupee, TrendingUp, Filter, Search, Award, ShieldAlert, Check, Star, Bookmark, Share2, Printer, Eye, ChevronRight, RefreshCw, AlertTriangle, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CustomerRepository, AppointmentRepository, InvoiceRepository, ProductRepository, StaffRepository, MarketingRepository } from '@/lib/repositories/repositories'
import { PageHeader } from '@/components/shared/page-header'

const fadeUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.05 } } }

type ReportCategory = 'financial' | 'customer' | 'staff' | 'inventory' | 'marketing'

interface FavoriteReport {
  id: string
  name: string
  category: ReportCategory
  type: string
  filters: any
}

export default function AdvancedReportsPage() {
  const { tenant, role } = useAuth()
  const { success, error } = useToast()
  const activeTenantId = tenant?.id || 'demo-tenant-001'

  // Central filter states
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [staffFilter, setStaffFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')

  // Report selection
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('financial')
  const [activeReportType, setActiveReportType] = useState('daily_sales')

  // Data lists
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<any[]>([])
  const [summaryStats, setSummaryStats] = useState<Record<string, any>>({})
  const [staffList, setStaffList] = useState<any[]>([])

  // Bookmarking favorites
  const [favorites, setFavorites] = useState<FavoriteReport[]>([
    { id: 'f1', name: 'VIP Customer Retention', category: 'customer', type: 'clv', filters: {} },
    { id: 'f2', name: 'Inventory Valuations Summary', category: 'inventory', type: 'valuation', filters: {} }
  ])
  const [bookmarkingName, setBookmarkingName] = useState('')
  const [showBookmarkModal, setShowBookmarkModal] = useState(false)

  // Drill-down dialog details
  const [drillDownItem, setDrillDownItem] = useState<any>(null)

  // Search filter
  const [searchTerm, setSearchTerm] = useState('')

  // Load staff pool for filters
  useEffect(() => {
    const fetchStaff = async () => {
      const list = await StaffRepository.list(activeTenantId)
      setStaffList(list)
    }
    fetchStaff()
  }, [])

  // Dynamic report content generator
  const generateReport = async () => {
    try {
      setLoading(true)
      const aptsList = await AppointmentRepository.list(activeTenantId)
      const invsList = await InvoiceRepository.list(activeTenantId)
      const custsList = await CustomerRepository.list(activeTenantId)
      const prodsList = await ProductRepository.list(activeTenantId)
      const campList = await MarketingRepository.listCampaigns(activeTenantId)

      let rows: any[] = []
      let stats: any = {}

      if (activeCategory === 'financial') {
        if (activeReportType === 'daily_sales' || activeReportType === 'monthly_sales') {
          rows = invsList.map(inv => ({
            id: inv.id,
            col1: inv.invoice_number,
            col2: inv.customer_name,
            col3: formatDate(inv.created_at),
            col4: inv.payment_method,
            col5: inv.status,
            amount: inv.total_amount,
            raw: inv
          }))
          stats = {
            title: 'Revenue Aggregation',
            kpi1: formatCurrency(rows.reduce((s, r) => s + r.amount, 0)),
            kpi1Label: 'Gross Sales',
            kpi2: formatCurrency(Math.round(rows.reduce((s, r) => s + r.amount, 0) * 0.18)),
            kpi2Label: 'GST Collected',
            kpi3: rows.length,
            kpi3Label: 'Total Invoices'
          }
        } else if (activeReportType === 'gst_report') {
          rows = invsList.filter(i => i.status === 'paid').map(inv => {
            const tax = Math.round(inv.total_amount * 0.18)
            return {
              id: inv.id,
              col1: inv.invoice_number,
              col2: formatDate(inv.created_at),
              col3: formatCurrency(inv.total_amount - tax),
              col4: formatCurrency(tax),
              col5: '18% Inclusive',
              amount: inv.total_amount,
              raw: inv
            }
          })
          stats = {
            title: 'GST Output Liability',
            kpi1: formatCurrency(rows.reduce((s, r) => s + r.amount, 0)),
            kpi1Label: 'Gross Receipts',
            kpi2: formatCurrency(rows.reduce((s, r) => s + parseInt(r.col4.replace(/[^\d]/g, '')), 0)),
            kpi2Label: 'Tax Due',
            kpi3: rows.length,
            kpi3Label: 'Taxable Invoices'
          }
        } else if (activeReportType === 'outstanding_payments') {
          rows = invsList.filter(i => i.status !== 'paid').map(inv => ({
            id: inv.id,
            col1: inv.invoice_number,
            col2: inv.customer_name,
            col3: formatDate(inv.created_at),
            col4: 'Payment Pending',
            col5: 'unpaid',
            amount: inv.total_amount,
            raw: inv
          }))
          stats = {
            title: 'Outstanding Accounts Receivable',
            kpi1: formatCurrency(rows.reduce((s, r) => s + r.amount, 0)),
            kpi1Label: 'Total Outstanding',
            kpi2: rows.length,
            kpi2Label: 'Overdue Receipts',
            kpi3: '15 Days',
            kpi3Label: 'Avg Delay'
          }
        }
      } else if (activeCategory === 'customer') {
        if (activeReportType === 'new_customers') {
          rows = custsList.map(c => ({
            id: c.id,
            col1: `${c.first_name} ${c.last_name || ''}`.trim(),
            col2: c.phone,
            col3: c.email || 'N/A',
            col4: c.is_active ? 'Active' : 'Inactive',
            col5: formatDate(c.created_at || new Date().toISOString()),
            amount: c.total_spent || 0,
            raw: c
          }))
          stats = {
            title: 'Customer Directory',
            kpi1: rows.length,
            kpi1Label: 'Total Clients',
            kpi2: formatCurrency(rows.reduce((s, r) => s + r.amount, 0) / (rows.length || 1)),
            kpi2Label: 'Average Spend',
            kpi3: '85%',
            kpi3Label: 'Loyalty Rate'
          }
        } else if (activeReportType === 'clv') {
          rows = custsList.sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0)).map(c => ({
            id: c.id,
            col1: `${c.first_name} ${c.last_name || ''}`.trim(),
            col2: (c as any).membership_level || 'Walk-in',
            col3: `${c.total_visits || 0} visits`,
            col4: c.loyalty_points || 0,
            col5: formatDate(c.created_at || new Date().toISOString()),
            amount: c.total_spent || 0,
            raw: c
          }))
          stats = {
            title: 'Customer Lifetime Value (LTV)',
            kpi1: formatCurrency(rows.reduce((s, r) => s + r.amount, 0)),
            kpi1Label: 'Total spent',
            kpi2: formatCurrency(rows[0]?.amount || 0),
            kpi2Label: 'VIP Peak spent',
            kpi3: rows.length,
            kpi3Label: 'Monitored Files'
          }
        }
      } else if (activeCategory === 'staff') {
        rows = staffList.map(st => {
          const apts = aptsList.filter(a => a.staff_id === st.id)
          const commission = Math.round((st.revenue_generated || 0) * 0.1)
          return {
            id: st.id,
            col1: `${st.first_name} ${st.last_name || ''}`.trim(),
            col2: st.role,
            col3: `${apts.length} appointments`,
            col4: st.rating ? `${st.rating} / 5` : 'N/A',
            col5: 'On Schedule',
            amount: commission,
            raw: st
          }
        })
        stats = {
          title: 'Employee Performance List',
          kpi1: staffList.length,
          kpi1Label: 'Stylists Active',
          kpi2: formatCurrency(rows.reduce((s, r) => s + r.amount, 0)),
          kpi2Label: 'Commission Due',
          kpi3: '82%',
          kpi3Label: 'Roster Utilization'
        }
      } else if (activeCategory === 'inventory') {
        if (activeReportType === 'valuation') {
          rows = prodsList.map(p => ({
            id: p.id,
            col1: p.name,
            col2: p.sku || 'N/A',
            col3: `${p.stock_quantity} in stock`,
            col4: formatCurrency(p.cost_price),
            col5: formatCurrency(p.selling_price),
            amount: p.stock_quantity * p.cost_price,
            raw: p
          }))
          stats = {
            title: 'Asset Valuations',
            kpi1: formatCurrency(rows.reduce((s, r) => s + r.amount, 0)),
            kpi1Label: 'Asset Cost Value',
            kpi2: rows.length,
            kpi2Label: 'Products Catalog',
            kpi3: prodsList.filter(p => p.stock_quantity <= (p.min_stock_level || 5)).length,
            kpi3Label: 'Low Stock Alert'
          }
        } else if (activeReportType === 'low_stock') {
          rows = prodsList.filter(p => p.stock_quantity <= (p.min_stock_level || 5)).map(p => ({
            id: p.id,
            col1: p.name,
            col2: p.sku || 'N/A',
            col3: `${p.stock_quantity} left`,
            col4: `Limit: ${p.min_stock_level || 5}`,
            col5: p.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock',
            amount: p.stock_quantity * p.cost_price,
            raw: p
          }))
          stats = {
            title: 'Reorder Requirements',
            kpi1: rows.length,
            kpi1Label: 'Alert Items',
            kpi2: prodsList.filter(p => p.stock_quantity === 0).length,
            kpi2Label: 'Empty Consumables',
            kpi3: 'Procurement sent',
            kpi3Label: 'Status flag'
          }
        }
      } else if (activeCategory === 'marketing') {
        rows = campList.map(camp => ({
          id: camp.id,
          col1: camp.name,
          col2: camp.channel.toUpperCase(),
          col3: `${camp.recipients_count} targets`,
          col4: `${camp.opened_count} opens`,
          col5: camp.status,
          amount: camp.revenue_generated || 0,
          raw: camp
        }))
        stats = {
          title: 'Marketing ROI Dispatches',
          kpi1: campList.length,
          kpi1Label: 'Total Campaigns',
          kpi2: formatCurrency(rows.reduce((s, r) => s + r.amount, 0)),
          kpi2Label: 'ROI Bookings Revenue',
          kpi3: '85%',
          kpi3Label: 'Avg Open Rate'
        }
      }

      setReportData(rows)
      setSummaryStats(stats)
    } catch (e) {
      console.error('Failed to run dynamic analysis reports', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    generateReport()
  }, [activeCategory, activeReportType, dateFilter, staffFilter])

  // Drill down viewer triggers
  const handleRowClick = (item: any) => {
    setDrillDownItem(item.raw)
  }

  // Export action simulation
  const handleExport = (format: string) => {
    success('Export Initiated', `Compiling reports data payload to ${format.toUpperCase()}...`)
  }

  // Save customized favorites
  const handleSaveFavorite = () => {
    if (!bookmarkingName.trim()) return
    const newFav: FavoriteReport = {
      id: 'f-' + Date.now(),
      name: bookmarkingName,
      category: activeCategory,
      type: activeReportType,
      filters: { dateFilter, staffFilter }
    }
    setFavorites([...favorites, newFav])
    success('Report Bookmarked', `Saved customized view as "${bookmarkingName}".`)
    setShowBookmarkModal(false)
    setBookmarkingName('')
  }

  // Check roles permissions gating
  const isAuthorized = () => {
    if (role === 'super_admin' || role === 'salon_owner' || role === 'manager') return true
    if (role === 'accountant' && activeCategory === 'financial') return true
    if ((role as any) === 'hr' && activeCategory === 'staff') return true
    if ((role as any) === 'marketing_manager' && activeCategory === 'marketing') return true
    return false
  }

  // Filtered rows by search term
  const filteredRows = reportData.filter(r =>
    r.col1.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.col2.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 text-left">
      <PageHeader
        title="Reports & Analytics"
        description="Run operational compliance audits, financial sales tax sheets, and customer marketing ROI summaries."
      >
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowBookmarkModal(true)}>
            <Bookmark className="h-4 w-4 mr-1.5" /> Bookmark Report
          </Button>
          <Select defaultValue="csv" onValueChange={handleExport}>
            <SelectTrigger className="h-9 w-[120px] bg-card text-xs"><SelectValue placeholder="Export File" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">Export CSV</SelectItem>
              <SelectItem value="excel">Export Excel</SelectItem>
              <SelectItem value="pdf">Export PDF</SelectItem>
              <SelectItem value="print">Print Sheet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {/* Central Filters Bar */}
      <Card className="glass-card">
        <CardContent className="p-4 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-muted-foreground">Filters:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Label className="text-muted-foreground text-[11px]">Period:</Label>
            <Select value={dateFilter} onValueChange={(val: any) => setDateFilter(val)}>
              <SelectTrigger className="h-8 w-[120px] bg-card text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">Annual Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <Label className="text-muted-foreground text-[11px]">Staff:</Label>
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger className="h-8 w-[120px] bg-card text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {staffList.map(st => (
                  <SelectItem key={st.id} value={st.id}>{st.first_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <Label className="text-muted-foreground text-[11px]">Category:</Label>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="h-8 w-[120px] bg-card text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="haircut">Hair Styling</SelectItem>
                <SelectItem value="facial">Skin Facials</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Reports Segment Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Side: Favorites & Report Selectors */}
        <div className="space-y-4 md:col-span-1">
          {/* Favorites List */}
          {favorites.length > 0 && (
            <Card className="glass-card">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-xs font-bold uppercase text-primary flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-primary" /> Bookmarked Views
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2.5 space-y-1 text-xs">
                {favorites.map(fav => (
                  <button
                    key={fav.id}
                    onClick={() => {
                      setActiveCategory(fav.category)
                      setActiveReportType(fav.type)
                    }}
                    className="w-full p-2 text-left rounded-xl hover:bg-muted/30 flex items-center justify-between group"
                  >
                    <span className="truncate">{fav.name}</span>
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Standard Reports selection list */}
          <Card className="glass-card">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Select Directory</CardTitle>
            </CardHeader>
            <CardContent className="p-3 text-xs space-y-3">
              {/* Financial reports list */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block px-2">Financials</span>
                <button onClick={() => { setActiveCategory('financial'); setActiveReportType('daily_sales') }} className={`w-full p-2 text-left rounded-xl ${activeCategory === 'financial' && activeReportType === 'daily_sales' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/30'}`}>Daily Sales</button>
                <button onClick={() => { setActiveCategory('financial'); setActiveReportType('gst_report') }} className={`w-full p-2 text-left rounded-xl ${activeCategory === 'financial' && activeReportType === 'gst_report' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/30'}`}>GST Liabilities</button>
                <button onClick={() => { setActiveCategory('financial'); setActiveReportType('outstanding_payments') }} className={`w-full p-2 text-left rounded-xl ${activeCategory === 'financial' && activeReportType === 'outstanding_payments' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/30'}`}>Outstanding Dues</button>
              </div>

              {/* Customer reports list */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block px-2">Customers CRM</span>
                <button onClick={() => { setActiveCategory('customer'); setActiveReportType('new_customers') }} className={`w-full p-2 text-left rounded-xl ${activeCategory === 'customer' && activeReportType === 'new_customers' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/30'}`}>Clients Directory</button>
                <button onClick={() => { setActiveCategory('customer'); setActiveReportType('clv') }} className={`w-full p-2 text-left rounded-xl ${activeCategory === 'customer' && activeReportType === 'clv' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/30'}`}>LTV Ranking</button>
              </div>

              {/* Inventory reports list */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block px-2">Inventory</span>
                <button onClick={() => { setActiveCategory('inventory'); setActiveReportType('valuation') }} className={`w-full p-2 text-left rounded-xl ${activeCategory === 'inventory' && activeReportType === 'valuation' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/30'}`}>Asset Valuations</button>
                <button onClick={() => { setActiveCategory('inventory'); setActiveReportType('low_stock') }} className={`w-full p-2 text-left rounded-xl ${activeCategory === 'inventory' && activeReportType === 'low_stock' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/30'}`}>Reorder Banners</button>
              </div>

              {/* Marketing reports list */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block px-2">Marketing</span>
                <button onClick={() => { setActiveCategory('marketing'); setActiveReportType('roi') }} className={`w-full p-2 text-left rounded-xl ${activeCategory === 'marketing' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/30'}`}>Campaign Performance</button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: KPI Stats and Main Table grid */}
        <div className="md:col-span-3 space-y-4">
          {!isAuthorized() ? (
            <Card className="p-8 text-center space-y-3">
              <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto" />
              <h3 className="font-bold text-lg">Access Denied</h3>
              <p className="text-sm text-muted-foreground">Your employee role is not authorized to pull detailed reports for this category.</p>
            </Card>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mb-2" />
              <span className="text-xs text-muted-foreground">Compiling tabular database records...</span>
            </div>
          ) : (
            <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="bg-card">
                  <CardContent className="p-4">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">{summaryStats.kpi1Label}</span>
                    <h4 className="text-lg font-bold mt-0.5">{summaryStats.kpi1}</h4>
                  </CardContent>
                </Card>
                <Card className="bg-card">
                  <CardContent className="p-4">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">{summaryStats.kpi2Label}</span>
                    <h4 className="text-lg font-bold mt-0.5">{summaryStats.kpi2}</h4>
                  </CardContent>
                </Card>
                <Card className="bg-card">
                  <CardContent className="p-4">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">{summaryStats.kpi3Label}</span>
                    <h4 className="text-lg font-bold mt-0.5">{summaryStats.kpi3}</h4>
                  </CardContent>
                </Card>
              </div>

              {/* Table Wrapper */}
              <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b gap-3">
                  <div>
                    <CardTitle className="text-sm font-bold capitalize">{activeReportType.replace('_', ' ')} Records</CardTitle>
                    <CardDescription className="text-xs">Click on any row to drill-down into receipt timeline logs.</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-[220px]">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search records..." className="h-8 pl-8 text-xs bg-card" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/30 border-b text-muted-foreground font-semibold uppercase">
                        <tr>
                          <th className="p-3">Reference/Name</th>
                          <th className="p-3">Info/Details</th>
                          <th className="p-3">Secondary details</th>
                          <th className="p-3">Status Flag</th>
                          <th className="p-3 text-right">Value Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredRows.map((row, idx) => (
                          <tr key={row.id || idx} className="hover:bg-muted/10 cursor-pointer transition-colors" onClick={() => handleRowClick(row)}>
                            <td className="p-3 font-semibold text-primary">{row.col1}</td>
                            <td className="p-3 text-muted-foreground">{row.col2}</td>
                            <td className="p-3 text-muted-foreground">{row.col3}</td>
                            <td className="p-3 capitalize">
                              <Badge variant={row.col5 === 'paid' || row.col5 === 'completed' || row.col5 === 'Active' ? 'success' : 'secondary'} className="text-[9px] scale-90">
                                {row.col5}
                              </Badge>
                            </td>
                            <td className="p-3 text-right font-bold">{formatCurrency(row.amount)}</td>
                          </tr>
                        ))}
                        {filteredRows.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-muted-foreground">No reports match selected filters or search terms.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* BOOKMARK FAVORITE MODAL */}
      <Dialog open={showBookmarkModal} onOpenChange={setShowBookmarkModal}>
        <DialogContent className="max-w-md text-left">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5"><Bookmark className="h-5 w-5 text-amber-500 fill-amber-500" /> Save Report Bookmark</DialogTitle>
            <DialogDescription>Save the active layout and applied filters as a bookmark favorite in your workspace sidebar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <Label>Bookmark Name</Label>
            <Input placeholder="E.g. Q3 Sales Report, Low StockConsumables..." value={bookmarkingName} onChange={e => setBookmarkingName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookmarkModal(false)}>Cancel</Button>
            <Button variant="gradient" onClick={handleSaveFavorite} disabled={!bookmarkingName.trim()}>Save Bookmark</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DRILL DOWN AUDIT LOGS DIALOG */}
      <Dialog open={!!drillDownItem} onOpenChange={(open) => !open && setDrillDownItem(null)}>
        <DialogContent className="max-w-md text-left text-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5"><BookOpen className="h-5 w-5 text-primary" /> Drill-down Audit Details</DialogTitle>
            <DialogDescription>Detailed ledger specification block.</DialogDescription>
          </DialogHeader>

          {drillDownItem && (
            <div className="space-y-4 py-3">
              <div className="border rounded-2xl p-4 bg-muted/20 space-y-2">
                {Object.keys(drillDownItem).filter(k => typeof drillDownItem[k] !== 'object').map(key => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground uppercase font-semibold text-[9px]">{key.replace('_', ' ')}:</span>
                    <strong className="truncate max-w-[200px]">{String(drillDownItem[key])}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDrillDownItem(null)}>Dismiss Viewer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IndianRupee, Calendar, Users, CreditCard, Plus, BarChart3, Bot, Settings, ArrowRight, Clock, AlertTriangle, Gift, TrendingUp, Filter, Activity, Star, ShieldAlert, CheckCircle, RefreshCw, ShoppingBag, Eye, EyeOff, Layout, ChevronRight, UserCheck, DollarSign, Wallet, Percent, Printer, Search, Lock, Unlock, MessageSquare, Clipboard, User, Flame, Loader2, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { cn, formatCurrency, formatDate, formatPercent } from '@/lib/utils'
import { CustomerRepository, AppointmentRepository, InvoiceRepository, ProductRepository, StaffRepository } from '@/lib/repositories/repositories'
import { useSettings } from '@/lib/contexts/settings-context'
import Link from 'next/link'

const fadeUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.05 } } }

export default function DashboardHome() {
  const { user, role, tenant } = useAuth()
  const { success, error } = useToast()
  const { settings } = useSettings()
  const activeTenantId = tenant?.id || 'demo-tenant-001'
  const salonName = settings.name || 'Salon Operating System'

  // Global State
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('month')
  const [chartTab, setChartTab] = useState<'revenue' | 'appointments' | 'services' | 'payments'>('revenue')

  // Repositories Data State
  const [customers, setCustomers] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])

  // Cash Drawer State (Receptionist only, persisted in localStorage)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [openingBalance, setOpeningBalance] = useState(5000)
  const [pettyCash, setPettyCash] = useState(0)
  const [drawerLogs, setDrawerLogs] = useState<any[]>([])
  const [showDrawerModal, setShowDrawerModal] = useState(false)
  const [pettyCashAmount, setPettyCashAmount] = useState('')
  const [pettyCashReason, setPettyCashReason] = useState('')

  // Floating Action menu toggle
  const [showQuickActions, setShowQuickActions] = useState(false)

  // Load datasets
  const loadData = async () => {
    try {
      setLoading(true)
      const [c, a, inv, p, s] = await Promise.all([
        CustomerRepository.list(activeTenantId),
        AppointmentRepository.list(activeTenantId),
        InvoiceRepository.list(activeTenantId),
        ProductRepository.list(activeTenantId),
        StaffRepository.list(activeTenantId)
      ])
      setCustomers(c)
      setAppointments(a)
      setInvoices(inv)
      setProducts(p)
      setStaff(s)
    } catch (e: any) {
      error('Failed to load dashboard operational datasets', e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (aptId: string, customerName: string) => {
    try {
      await AppointmentRepository.update(aptId, { status: 'in_progress' })
      success('Checked In', `${customerName} is now in service.`)
      await loadData()
    } catch (e: any) {
      error('Failed check-in', e.message)
    }
  }

  const handleComplete = async (aptId: string, customerName: string) => {
    try {
      await AppointmentRepository.update(aptId, { status: 'completed' })
      success('Service Completed', `${customerName}'s service is complete.`)
      await loadData()
    } catch (e: any) {
      error('Failed to complete appointment', e.message)
    }
  }

  // Load Cash Drawer settings on mount
  useEffect(() => {
    loadData()
    if (typeof window !== 'undefined') {
      const savedOpen = localStorage.getItem('salon_ai_drawer_open')
      const savedBalance = localStorage.getItem('salon_ai_drawer_opening')
      const savedLogs = localStorage.getItem('salon_ai_drawer_logs')
      if (savedOpen) setDrawerOpen(JSON.parse(savedOpen))
      if (savedBalance) setOpeningBalance(Number(savedBalance))
      if (savedLogs) setDrawerLogs(JSON.parse(savedLogs))
    }
  }, [activeTenantId])

  const logDrawerOperation = (type: string, amount: number, notes: string) => {
    const newLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      amount,
      notes,
      user: user?.first_name || 'Staff'
    }
    const updatedLogs = [newLog, ...drawerLogs].slice(0, 20)
    setDrawerLogs(updatedLogs)
    localStorage.setItem('salon_ai_drawer_logs', JSON.stringify(updatedLogs))
  }

  // Cash Drawer Handlers
  const handleOpenDrawer = () => {
    setDrawerOpen(true)
    localStorage.setItem('salon_ai_drawer_open', 'true')
    localStorage.setItem('salon_ai_drawer_opening', openingBalance.toString())
    logDrawerOperation('Drawer Opened', openingBalance, 'Initial opening float balance set.')
    success('Cash Drawer Opened', `Opening balance initialized to ₹${openingBalance}`)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    localStorage.setItem('salon_ai_drawer_open', 'false')
    logDrawerOperation('Drawer Closed', 0, 'Shift closed. Balance reconciled.')
    success('Cash Drawer Reconciled', 'Drawer shift closed successfully.')
  }

  const handleAddPettyCash = () => {
    const amt = Number(pettyCashAmount)
    if (isNaN(amt) || amt <= 0 || !pettyCashReason) {
      error('Invalid Entry', 'Please enter a valid amount and description.')
      return
    }
    setPettyCash(prev => prev + amt)
    logDrawerOperation('Petty Cash Out', amt, pettyCashReason)
    success('Petty Cash Disbursed', `₹${amt} logged out for: ${pettyCashReason}`)
    setPettyCashAmount('')
    setPettyCashReason('')
    setShowDrawerModal(false)
  }

  // Determine dynamic salutation greeting
  const getGreeting = () => {
    const hr = new Date().getHours()
    if (hr < 12) return 'Good Morning'
    if (hr < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  // Aggregate stats
  const paidInvoices = invoices.filter(i => i.status === 'paid')
  const totalGrossRev = paidInvoices.reduce((sum, i) => sum + i.total_amount, 0)
  const gstTax = Math.round(totalGrossRev * 0.18)
  const netRevenue = Math.round(totalGrossRev * 0.82)
  const estimatedExpenses = Math.round(totalGrossRev * 0.35 + 5000)
  const profitMargin = netRevenue - estimatedExpenses
  const outstandingBal = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.total_amount, 0)
  
  // Roster checks
  const lowStockCount = products.filter(p => p.stock_quantity <= (p.min_stock_level || 5)).length
  const activeStaffCount = staff.filter(s => s.is_active).length

  // Live Operations Queue breakdown
  const todayStr = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter(a => a.date === todayStr)
  const queueWaiting = todayAppointments.filter(a => a.status === 'confirmed')
  const queueArrived = todayAppointments.filter(a => a.status === 'scheduled') // Checked-in / arrived
  const queueInProgress = todayAppointments.filter(a => a.status === 'in_progress')
  const queueCompleted = todayAppointments.filter(a => a.status === 'completed')
  const queueNoShow = todayAppointments.filter(a => a.status === 'no_show')

  // Worker specifics
  const myAppointments = appointments.filter(a => a.staff_id === user?.id)
  const myTodayApts = myAppointments.filter(a => a.date === todayStr)
  const myCompletedApts = myTodayApts.filter(a => a.status === 'completed')
  const myRevenueToday = myCompletedApts.reduce((sum, a) => sum + 1200, 0) // Simulated ₹1200 avg per appointment
  const myCommission = Math.round(myRevenueToday * 0.30)
  const myTips = myCompletedApts.length * 150 // Mock tips

  // Dynamic alerts list
  const dynamicAlerts = []
  if (lowStockCount > 0) {
    dynamicAlerts.push({ title: 'Consumables Low Stock Warning', desc: `${lowStockCount} items catalog items are running below reorder thresholds.`, type: 'inventory', action: 'Restock' })
  }
  if (outstandingBal > 0) {
    dynamicAlerts.push({ title: 'Outstanding Accounts Receivable', desc: `${formatCurrency(outstandingBal)} outstanding across unpaid customer checkout invoices.`, type: 'billing', action: 'Collect' })
  }
  const bdaysToday = customers.filter(c => c.date_of_birth && c.date_of_birth.includes('-07-')) // Mock July birthdays
  if (bdaysToday.length > 0) {
    dynamicAlerts.push({ title: 'VIP Birthday Celebration', desc: `Send greeting coupons to ${bdaysToday[0]?.first_name} ${bdaysToday[0]?.last_name} today!`, type: 'customers', action: 'WhatsApp' })
  }
  if (totalGrossRev < 150000) {
    dynamicAlerts.push({ title: 'Revenue Deficit Alert', desc: 'Current gross volume is 42% below target threshold goals for the week.', type: 'financial', action: 'Campaign' })
  }

  // Cash Drawer Breakdowns
  const cashSales = paidInvoices.filter(i => i.payment_method === 'cash').reduce((sum, i) => sum + i.total_amount, 0)
  const cardSales = paidInvoices.filter(i => i.payment_method === 'card').reduce((sum, i) => sum + i.total_amount, 0)
  const upiSales = paidInvoices.filter(i => i.payment_method === 'upi').reduce((sum, i) => sum + i.total_amount, 0)
  const walletSales = paidInvoices.filter(i => i.payment_method === 'wallet').reduce((sum, i) => sum + i.total_amount, 0)
  const totalDrawerBalance = openingBalance + cashSales - pettyCash

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 text-left pb-16">
      
      {/* ========================================================
          OWNER DASHBOARD VIEW
          ======================================================== */}
      {role === 'salon_owner' && (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
          
          {/* Section 1: Welcome Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-violet-500/5 to-primary/5 p-6 rounded-3xl border border-border">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}, {user?.first_name || 'Owner'}!</h1>
              <p className="text-muted-foreground text-xs mt-1">Operating Workspace: <strong className="text-foreground">{salonName}</strong> | {formatDate(new Date().toISOString())}</p>
            </div>
            
            {/* Today's Revenue Goal Progress Bar */}
            <div className="w-full md:w-80 bg-card p-4 rounded-2xl border border-border shadow-sm">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Daily Sales Target</span>
                <span className="text-primary font-bold">{Math.round((totalGrossRev / 300000) * 100)}% Complete</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(Math.round((totalGrossRev / 300000) * 100), 100)}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 font-medium">
                <span>Current: {formatCurrency(totalGrossRev)}</span>
                <span>Goal: ₹3,00,000</span>
              </div>
            </div>
          </div>

          {/* Section 2: Business Overview */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Financial Command Center</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-card">
                <CardContent className="p-4">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Gross Revenue</span>
                  <h3 className="text-xl font-bold mt-1 text-primary">{formatCurrency(totalGrossRev)}</h3>
                  <div className="text-[9px] text-emerald-500 flex items-center gap-0.5 mt-1 font-semibold"><TrendingUp className="h-3 w-3" /> +14.2% vs target</div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Net Sales (Excl. Tax)</span>
                  <h3 className="text-xl font-bold mt-1">{formatCurrency(netRevenue)}</h3>
                  <div className="text-[9px] text-muted-foreground mt-1">GST Collected: {formatCurrency(gstTax)}</div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Est. EBITDA Profit</span>
                  <h3 className="text-xl font-bold mt-1 text-emerald-500">{formatCurrency(profitMargin)}</h3>
                  <div className="text-[9px] text-muted-foreground mt-1">Expenses: {formatCurrency(estimatedExpenses)}</div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Accounts Receivable</span>
                  <h3 className="text-xl font-bold mt-1 text-amber-500">{formatCurrency(outstandingBal)}</h3>
                  <div className="text-[9px] text-muted-foreground mt-1">Pending checkout settlements</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Section 3: Performance KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border shadow-sm">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Activity className="h-4 w-4 text-violet-500" /> Key Business Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    {
                      label: 'Booking Conversion',
                      value: formatPercent(appointments.length > 0 ? (appointments.filter(a => a.status === 'completed').length / appointments.length) * 100 : 0),
                      sub: `Total slots: ${appointments.length}`,
                      color: 'text-emerald-500'
                    },
                    {
                      label: 'Repeat Rate',
                      value: formatPercent(customers.length > 0 ? (customers.filter(c => (c.total_visits || 0) > 1).length / customers.length) * 100 : 0),
                      sub: `Clients database: ${customers.length}`,
                      color: 'text-emerald-500'
                    },
                    {
                      label: 'Average Ticket Value',
                      value: formatCurrency(paidInvoices.length > 0 ? totalGrossRev / paidInvoices.length : 0),
                      sub: 'Sum per paid cart invoice',
                      color: 'text-foreground'
                    },
                    {
                      label: 'Membership Revenue',
                      value: formatCurrency(paidInvoices.reduce((sum, inv) => {
                        const hasMembership = inv.items?.some((i: any) => i.name?.toLowerCase().includes('membership') || i.type === 'membership')
                        return sum + (hasMembership ? inv.total_amount : 0)
                      }, 0)),
                      sub: 'Active tier collections',
                      color: 'text-foreground'
                    },
                    {
                      label: 'Package Checkout',
                      value: `${invoices.filter(inv => inv.payment_method === 'package' || inv.payment_method === 'gift_card').length} checked`,
                      sub: 'Redeemed prepayments',
                      color: 'text-foreground'
                    },
                    {
                      label: 'Retail Product Sales',
                      value: formatCurrency(paidInvoices.reduce((sum, inv) => {
                        const productTotal = inv.items?.filter((i: any) => i.type === 'product').reduce((s: number, item: any) => s + (item.total || item.quantity * item.unit_price || 0), 0) || 0
                        return sum + productTotal
                      }, 0)),
                      sub: `${paidInvoices.reduce((sum, inv) => sum + (inv.items?.filter((i: any) => i.type === 'product').length || 0), 0)} items sold`,
                      color: 'text-primary'
                    },
                  ].map((kpi, idx) => (
                    <div key={idx} className="p-3 border rounded-2xl bg-muted/20 text-left">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">{kpi.label}</span>
                      <h4 className={cn('text-lg font-bold mt-1', kpi.color)}>{kpi.value}</h4>
                      <span className="text-[8px] text-muted-foreground block mt-0.5">{kpi.sub}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Staff Performance & Roster Summary */}
            <Card className="border shadow-sm text-left">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Users className="h-4 w-4 text-violet-500" /> Employee Utilization</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b"><span>Active Roster Shift today:</span><strong>{activeStaffCount} Stylists</strong></div>
                  <div className="flex justify-between py-1 border-b"><span>Average Staff Utilization:</span><strong className="text-emerald-500">78% capacity</strong></div>
                  <div className="flex justify-between py-1 border-b"><span>Stylist commission due today:</span><strong>{formatCurrency(totalGrossRev * 0.15)}</strong></div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Top Productive Stylists</span>
                  <div className="space-y-1.5">
                    {staff.slice(0, 2).map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between text-xs p-2 bg-muted/20 border rounded-xl">
                        <span className="font-medium">{s.first_name} {s.last_name}</span>
                        <Badge variant="success" className="text-[9px]">{s.rating || 4.8} ★</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 4: Professional Charts */}
          <Card className="border shadow-sm">
            <CardHeader className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-sm font-bold">Analytical Trends & Forecasts</CardTitle>
                <CardDescription className="text-xs">Data compiled from live invoices and scheduling history.</CardDescription>
              </div>
              <div className="flex gap-1.5 bg-muted p-1 rounded-xl shrink-0">
                {(['revenue', 'appointments', 'services', 'payments'] as const).map(tab => (
                  <Button key={tab} size="sm" variant={chartTab === tab ? 'default' : 'ghost'} className="h-7 text-[10px] font-bold capitalize rounded-lg" onClick={() => setChartTab(tab)}>
                    {tab}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-6 h-64 flex flex-col justify-end">
              {chartTab === 'revenue' && (
                <div className="space-y-4">
                  <div className="w-full h-44 relative">
                    <svg viewBox="0 0 500 200" className="w-full h-full">
                      <defs>
                        <linearGradient id="ownerChartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0,160 Q80,100 160,120 T320,60 T500,30 L500,200 L0,200 Z" fill="url(#ownerChartGrad)" />
                      <path d="M0,160 Q80,100 160,120 T320,60 T500,30" fill="none" stroke="#7c3aed" strokeWidth="3" />
                      <circle cx="160" cy="120" r="4" fill="#7c3aed" />
                      <circle cx="320" cy="60" r="4" fill="#7c3aed" />
                      <circle cx="500" cy="30" r="4" fill="#7c3aed" />
                    </svg>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-semibold px-2">
                    <span>Week 1</span>
                    <span>Week 2</span>
                    <span>Week 3</span>
                    <span>Week 4 (Current)</span>
                  </div>
                </div>
              )}

              {chartTab === 'appointments' && (
                <div className="space-y-4">
                  <div className="w-full h-44 relative">
                    <svg viewBox="0 0 500 200" className="w-full h-full">
                      <g fill="#ec4899" opacity="0.8">
                        <rect x="50" y="80" width="30" height="120" rx="4" />
                        <rect x="150" y="40" width="30" height="160" rx="4" />
                        <rect x="250" y="100" width="30" height="100" rx="4" />
                        <rect x="350" y="30" width="30" height="170" rx="4" />
                        <rect x="450" y="60" width="30" height="140" rx="4" />
                      </g>
                    </svg>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-semibold px-6">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                  </div>
                </div>
              )}

              {chartTab === 'services' && (
                <div className="flex items-center justify-around h-44">
                  <div className="w-32 h-32 relative">
                    <svg viewBox="0 0 36 36" className="w-full h-full">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#7c3aed" strokeWidth="3" strokeDasharray="60 40" strokeDashoffset="25" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ec4899" strokeWidth="3" strokeDasharray="25 75" strokeDashoffset="85" />
                    </svg>
                  </div>
                  <div className="space-y-2 text-xs text-left">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-violet-500 rounded-full" /><span>Haircare Styling (60%)</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-pink-500 rounded-full" /><span>Facials & Skincare (25%)</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-300 rounded-full" /><span>Other (15%)</span></div>
                  </div>
                </div>
              )}

              {chartTab === 'payments' && (
                <div className="flex items-center justify-around h-44">
                  <div className="w-32 h-32 relative">
                    <svg viewBox="0 0 36 36" className="w-full h-full">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="50 50" strokeDashoffset="25" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="30 70" strokeDashoffset="75" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="20 80" strokeDashoffset="5" />
                    </svg>
                  </div>
                  <div className="space-y-2 text-xs text-left">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full" /><span>UPI Payments (50%)</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full" /><span>Credit/Debit Cards (30%)</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded-full" /><span>Cash Drawer (20%)</span></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 5: Actionable Business Alerts */}
          {dynamicAlerts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Attention Required</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dynamicAlerts.map((al, idx) => (
                  <div key={idx} className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-2xl flex items-start justify-between gap-3 text-left">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="h-4.5 w-4.5 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-xs text-foreground block">{al.title}</strong>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">{al.desc}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] uppercase tracking-wider shrink-0 border-amber-500/30 text-amber-600 font-bold">
                      {al.action}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      )}

      {/* ========================================================
          RECEPTIONIST DASHBOARD VIEW
          ======================================================== */}
      {role === 'receptionist' && (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
          
          {/* Section 1: Welcome Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 p-6 rounded-3xl border border-border text-left">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Front Desk Operations Command</h1>
              <p className="text-muted-foreground text-xs mt-1">Logged In: <strong className="text-foreground">{fullName}</strong> | Active Shift: <strong className="text-foreground">Morning Shift (09:00 - 18:00)</strong></p>
            </div>
            
            <div className="flex items-center gap-2.5 bg-card p-3 rounded-2xl border border-border shadow-sm">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Activity className="h-4.5 w-4.5" />
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground block text-[9px] uppercase font-bold">Business Health Index</span>
                <strong className="text-foreground font-bold">96% Reconciled</strong>
              </div>
            </div>
          </div>

          {/* Operations Summary (Queue breakdown cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <Card className="glass-card">
              <CardContent className="p-4">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Checked In / Arrived</span>
                <h3 className="text-xl font-bold mt-1 text-primary">{queueArrived.length} clients</h3>
                <div className="text-[9px] text-muted-foreground mt-1">Pending service starting</div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Services In Progress</span>
                <h3 className="text-xl font-bold mt-1 text-amber-500">{queueInProgress.length} slots</h3>
                <div className="text-[9px] text-muted-foreground mt-1">Active chairs styling</div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Ready for Checkout</span>
                <h3 className="text-xl font-bold mt-1 text-emerald-500">{queueWaiting.length} invoices</h3>
                <div className="text-[9px] text-muted-foreground mt-1">Pending POS settlements</div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Completed Today</span>
                <h3 className="text-xl font-bold mt-1">{queueCompleted.length} checkouts</h3>
                <div className="text-[9px] text-muted-foreground mt-1">No shows logged: {queueNoShow.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Live Operations Queue Table */}
          <Card className="border shadow-sm">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Clock className="h-4.5 w-4.5 text-violet-500" /> Front Desk Live Operations Queue</CardTitle>
              <CardDescription className="text-xs">Monitor stylist chairs activity and client check-in times.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {todayAppointments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xs">No active bookings scheduled for today.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service / Category</TableHead>
                      <TableHead>Stylist</TableHead>
                      <TableHead>Time Slot</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayAppointments.map((apt: any) => (
                      <TableRow key={apt.id}>
                        <TableCell className="font-semibold text-xs text-left">{apt.customer_name}</TableCell>
                        <TableCell className="text-xs text-left">{apt.service_name}</TableCell>
                        <TableCell className="text-xs text-left">{apt.staff_name}</TableCell>
                        <TableCell className="text-xs text-left">{apt.time}</TableCell>
                        <TableCell className="text-left">
                          <Badge variant={apt.status === 'in_progress' ? 'warning' : apt.status === 'completed' ? 'success' : 'outline'} className="text-[9px] uppercase">
                            {apt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {apt.status === 'scheduled' && (
                            <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg" onClick={() => handleCheckIn(apt.id, apt.customer_name)}>Check In</Button>
                          )}
                          {apt.status === 'in_progress' && (
                            <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg text-emerald-500 border-emerald-500/20" onClick={() => handleComplete(apt.id, apt.customer_name)}>Complete</Button>
                          )}
                          {apt.status === 'confirmed' && (
                            <Button size="sm" variant="gradient" className="h-7 text-[10px] rounded-lg" onClick={() => window.dispatchEvent(new CustomEvent('open-global-pos'))}>Checkout</Button>
                          )}
                          {apt.status === 'completed' && (
                            <Button size="sm" variant="ghost" className="h-7 text-[10px] rounded-lg flex items-center gap-1"><Printer className="h-3 w-3" /> Print Receipt</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Cash Drawer Reconciliation Module */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border shadow-sm text-left">
              <CardHeader className="p-4 border-b flex justify-between items-center">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Lock className="h-4.5 w-4.5 text-violet-500" /> Cash Drawer Reconciliation</CardTitle>
                <div className="flex gap-2">
                  {!drawerOpen ? (
                    <Button size="sm" onClick={handleOpenDrawer} className="h-8 rounded-lg flex items-center gap-1 text-xs"><Unlock className="h-3.5 w-3.5" /> Open Drawer</Button>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setShowDrawerModal(true)} className="h-8 rounded-lg text-xs">Petty Cash Out</Button>
                      <Button size="sm" variant="destructive" onClick={handleCloseDrawer} className="h-8 rounded-lg flex items-center gap-1 text-xs"><Lock className="h-3.5 w-3.5" /> Close Drawer</Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-3 border rounded-2xl bg-muted/20">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Initial Opening Float</span>
                    <h4 className="text-base font-bold mt-0.5">{formatCurrency(openingBalance)}</h4>
                  </div>
                  <div className="p-3 border rounded-2xl bg-muted/20">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Cash Sales (Intake)</span>
                    <h4 className="text-base font-bold mt-0.5 text-emerald-500">+{formatCurrency(cashSales)}</h4>
                  </div>
                  <div className="p-3 border rounded-2xl bg-muted/20">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Petty Cash Out</span>
                    <h4 className="text-base font-bold mt-0.5 text-rose-500">-{formatCurrency(pettyCash)}</h4>
                  </div>
                </div>

                <div className="border rounded-2xl p-4 bg-muted/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Current Drawer Balance (Expected Cash)</span>
                    <h3 className="text-xl font-bold mt-0.5">{formatCurrency(totalDrawerBalance)}</h3>
                  </div>
                  <Badge variant={drawerOpen ? 'success' : 'secondary'} className="text-[10px] uppercase font-bold">
                    {drawerOpen ? 'Active' : 'Locked'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Drawer Audit Log */}
            <Card className="border shadow-sm text-left">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Drawer Operation Logs</CardTitle>
              </CardHeader>
              <CardContent className="p-4 h-48 overflow-y-auto space-y-2.5">
                {drawerLogs.length === 0 ? (
                  <div className="text-center text-muted-foreground text-xs py-8">No drawer operations logged in this shift.</div>
                ) : (
                  drawerLogs.map((log) => (
                    <div key={log.id} className="text-[11px] p-2 bg-muted/20 border rounded-xl space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span>{log.type}</span>
                        <span className={log.type.includes('Out') ? 'text-rose-500' : 'text-emerald-500'}>
                          {log.type.includes('Out') ? '-' : ''}₹{log.amount}
                        </span>
                      </div>
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>{log.notes}</span>
                        <span>{log.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* CRM Intelligence */}
          <div className="space-y-4 text-left">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Guest CRM Intelligence</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border">
                <CardHeader className="p-3 border-b"><CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Birthday Celebrations</CardTitle></CardHeader>
                <CardContent className="p-3 text-xs space-y-2">
                  {bdaysToday.slice(0, 2).map((c: any) => (
                    <div key={c.id} className="flex justify-between items-center p-2 bg-pink-500/5 border border-pink-500/20 rounded-xl">
                      <span>{c.first_name} {c.last_name}</span>
                      <Button size="sm" variant="ghost" className="h-6 text-[9px] px-2 text-pink-600 font-bold">WhatsApp Coupon</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border">
                <CardHeader className="p-3 border-b"><CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Expiring Memberships</CardTitle></CardHeader>
                <CardContent className="p-3 text-xs space-y-2">
                  <div className="flex justify-between items-center p-2 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <span>Anita Desai (Gold)</span>
                    <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-600">5 days left</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border">
                <CardHeader className="p-3 border-b"><CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">VIP Customer Arrivals</CardTitle></CardHeader>
                <CardContent className="p-3 text-xs space-y-2">
                  <div className="flex justify-between items-center p-2 bg-violet-500/5 border border-violet-500/20 rounded-xl">
                    <span>Priya Sharma</span>
                    <Badge variant="outline" className="text-[9px] border-violet-500/30 text-primary">Arriving 09:00</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

        </motion.div>
      )}

      {/* ========================================================
          WORKER (STYLIST / BEAUTICIAN) DASHBOARD VIEW
          ======================================================== */}
      {(role === 'stylist' || role === 'beautician' || role === 'staff') && (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
          
          {/* Section 1: Welcome Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-violet-500/5 to-pink-500/5 p-6 rounded-3xl border border-border text-left">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Stylist Station: {user?.first_name || 'Worker'}</h1>
              <p className="text-muted-foreground text-xs mt-1">Roster Shift: <strong className="text-foreground">Morning Shift (09:00 - 18:00)</strong> | Chair Status: <strong className="text-emerald-500">Ready</strong></p>
            </div>
            
            <div className="flex gap-4">
              <div className="p-3 bg-card border rounded-2xl text-xs shadow-sm">
                <span className="text-muted-foreground block text-[9px] uppercase font-bold">Today's Target</span>
                <strong className="text-foreground font-bold">₹5,000 / day</strong>
              </div>
              <div className="p-3 bg-card border rounded-2xl text-xs shadow-sm">
                <span className="text-muted-foreground block text-[9px] uppercase font-bold">Score rating</span>
                <strong className="text-emerald-500 font-bold">4.9 ★ Excellent</strong>
              </div>
            </div>
          </div>

          {/* Section 2: Worker Timeline Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border shadow-sm text-left">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Calendar className="h-4.5 w-4.5 text-violet-500" /> My Schedule Today</CardTitle>
                <CardDescription className="text-xs">Your assigned appointments for today.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {myTodayApts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-xs">You have no appointments assigned today. enjoy!</div>
                ) : (
                  <div className="relative border-l border-muted pl-4 ml-2 space-y-6">
                    {myTodayApts.map((apt: any) => (
                      <div key={apt.id} className="relative">
                        <div className="absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-violet-500" />
                        <div className="p-3.5 border bg-muted/10 rounded-2xl text-xs flex justify-between items-start gap-4 hover:bg-muted/20 transition-colors">
                          <div className="space-y-1">
                            <span className="text-primary font-bold text-xs">{apt.time}</span>
                            <h4 className="font-semibold text-sm">{apt.customer_name}</h4>
                            <p className="text-muted-foreground">{apt.service_name}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <Badge variant={apt.status === 'in_progress' ? 'warning' : apt.status === 'completed' ? 'success' : 'outline'} className="text-[9px] uppercase">
                              {apt.status}
                            </Badge>
                            {apt.status === 'scheduled' && (
                              <Button size="sm" className="h-7 text-[10px] rounded-lg" onClick={() => success('Checked In', 'Client check-in confirmed.')}>Start Service</Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Scorecard */}
            <Card className="border shadow-sm text-left">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Award className="h-4.5 w-4.5 text-violet-500" /> Station Earnings Tracker</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b"><span>Remaining appointments today:</span><strong>{myTodayApts.length - myCompletedApts.length} sessions</strong></div>
                  <div className="flex justify-between py-1 border-b"><span>Gross Revenue Generated:</span><strong className="text-emerald-500">{formatCurrency(myRevenueToday)}</strong></div>
                  <div className="flex justify-between py-1 border-b"><span>Stylist Commission Earned:</span><strong>{formatCurrency(myCommission)}</strong></div>
                  <div className="flex justify-between py-1 border-b"><span>Customer Cash Tips:</span><strong>{formatCurrency(myTips)}</strong></div>
                  <div className="flex justify-between py-1 border-b"><span>Approved Leave Balance:</span><strong>6 days remaining</strong></div>
                </div>

                {/* Client Card notes details */}
                <div className="border rounded-2xl p-4 bg-muted/10">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Active Customer Notes</span>
                  {myTodayApts[0] ? (
                    <div className="space-y-2">
                      <strong className="text-xs block">{myTodayApts[0].customer_name}</strong>
                      <p className="text-[11px] text-muted-foreground leading-normal">"Sensitive scalp. Prefers organic L'Oréal coloring gel. Water temperature lukewarm."</p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-[10px]">No active client notes.</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </motion.div>
      )}

      {/* Petty Cash Out Modal */}
      <Dialog open={showDrawerModal} onOpenChange={setShowDrawerModal}>
        <DialogContent className="max-w-md bg-card border rounded-2xl p-6 text-left shadow-2xl">
          <DialogHeader><DialogTitle className="text-sm font-bold flex items-center gap-1.5"><Lock className="h-4 w-4 text-primary" /> Log Petty Cash Disbursement</DialogTitle></DialogHeader>
          <div className="space-y-4 py-3 text-xs">
            <div className="space-y-1">
              <Label htmlFor="pettyAmt">Cash Amount (₹)</Label>
              <Input id="pettyAmt" placeholder="e.g. 500" value={pettyCashAmount} onChange={e => setPettyCashAmount(e.target.value)} className="h-9 bg-card" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pettyReason">Expense Reason</Label>
              <Input id="pettyReason" placeholder="e.g. Tea and biscuits for lobby" value={pettyCashReason} onChange={e => setPettyCashReason(e.target.value)} className="h-9 bg-card" />
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2 pt-2 border-t">
            <Button size="sm" variant="outline" onClick={() => setShowDrawerModal(false)}>Cancel</Button>
            <Button size="sm" variant="gradient" onClick={handleAddPettyCash}>Confirm Log Out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

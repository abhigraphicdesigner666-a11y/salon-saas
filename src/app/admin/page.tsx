'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart3, Building2, CreditCard, Shield, Users, Landmark, TrendingUp, 
  AlertTriangle, Play, Loader2, ArrowUpRight, ShieldAlert, CheckCircle, 
  Database, Search, Download, Trash2, ShieldCheck, Mail, MessageSquare, 
  Settings, Key, AlertCircle, Sparkles, ChevronLeft, ChevronRight, 
  Filter, HelpCircle, Activity, Server, Clock, Plus, LogOut, Check,
  X, RefreshCw, Layers, Bell, FileText, Lock, Globe, Info, Sliders, Tag, Copy
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/toast'
import { SuperAdminService } from '@/services/business-services'
import { useAuth } from '@/lib/auth/auth-context'
import { formatCurrency } from '@/lib/utils'

export default function SuperAdminDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const { success, error } = useToast()

  const [loading, setLoading] = useState(true)
  const [tenants, setTenants] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [coupons, setCoupons] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])

  // Global settings state
  const [globalSettings, setGlobalSettings] = useState<any>({
    name: 'SalonOS SaaS Platform',
    company_name: 'GlamStyle Tech Pvt Ltd',
    gstin: '27AAAAA1111A1Z1',
    support_email: 'support@salonos.io',
    support_phone: '+91 99999 88888',
    address: '12, Link Road, Bandra West, Mumbai',
    website: 'https://salonos.io',
    logo: '',
    favicon: '',
    currency: 'INR',
    timezone: 'IST',
    date_format: 'DD-MM-YYYY',
    language: 'English',
    tax_rate: '18',
    invoice_prefix: 'SLN-',
    invoice_footer: 'Thank you for choosing SalonOS!',
    receipt_footer: 'Visit again!',
    maintenance_mode: false,
    auto_backup: true,
    smtp_host: 'smtp.salonos.io',
    smtp_port: '587',
    smtp_user: 'platform-alerts@salonos.io',
    sms_gateway: 'twilio',
    sms_api_key: 'SK-TWILIO-MOCK-123456',
    whatsapp_sender: '+919999999999'
  })

  // Active query parameters tab reader state
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState<'30days' | '7days' | 'year'>('30days')
  
  // Search & Filter parameters for Tenants
  const [globalSearch, setGlobalSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [planFilter, setPlanFilter] = useState<'all' | 'Free' | 'Starter' | 'Professional' | 'Enterprise'>('all')
  
  // Sorting parameters for Tenants
  const [sortField, setSortField] = useState<'name' | 'plan' | 'mrr_revenue' | 'staff_count' | 'health_score'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Expandable widgets overview state toggles
  const [expandedWidgets, setExpandedWidgets] = useState<Record<string, boolean>>({
    revenue: true,
    subscriptions: true,
    health: true,
    security: false,
    success: false
  })

  // Dialog Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState<any>(null)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState<{ isOpen: boolean; tenantName: string; pass: string }>({ isOpen: false, tenantName: '', pass: '' })
  
  // Factory Reset validation dialog
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetConfirmInput, setResetConfirmInput] = useState('')

  // Plan creation modal
  const [showPlanModal, setShowPlanModal] = useState<any>(null) // null/ 'create' / { plan object for edit }
  const [planName, setPlanName] = useState('')
  const [planPriceMonthly, setPlanPriceMonthly] = useState(2999)
  const [planPriceYearly, setPlanPriceYearly] = useState(29990)
  const [planStaffLimit, setPlanStaffLimit] = useState(5)
  const [planBranchLimit, setPlanBranchLimit] = useState(3)
  const [planStorageLimit, setPlanStorageLimit] = useState(5)
  const [planAiCredits, setPlanAiCredits] = useState(100)
  const [planSmsCredits, setPlanSmsCredits] = useState(500)
  const [planWhatsappCredits, setPlanWhatsappCredits] = useState(100)
  const [planFeatures, setPlanFeatures] = useState<string[]>(['ai', 'marketing', 'inventory'])

  // Coupon creation modal
  const [showCouponModal, setShowCouponModal] = useState<any>(null) // null/ 'create'
  const [coupCode, setCoupCode] = useState('')
  const [coupDiscount, setCoupDiscount] = useState(10)
  const [coupType, setCoupType] = useState<'percentage' | 'flat'>('percentage')
  const [coupStart, setCoupStart] = useState('2026-07-01')
  const [coupEnd, setCoupEnd] = useState('2027-01-01')
  const [coupLimit, setCoupLimit] = useState(100)
  const [coupPlans, setCoupPlans] = useState<string[]>(['Starter', 'Professional'])

  // Expense Dialog Modal
  const [showExpenseModal, setShowExpenseModal] = useState<any>(null) // null | 'create' | expense object
  const [expMonth, setExpMonth] = useState('7')
  const [expYear, setExpYear] = useState('2026')
  const [expHosting, setExpHosting] = useState(15000)
  const [expSupabase, setExpSupabase] = useState(8000)
  const [expDatabase, setExpDatabase] = useState(5000)
  const [expStorage, setExpStorage] = useState(2000)
  const [expEmail, setExpEmail] = useState(3500)
  const [expSms, setExpSms] = useState(14000)
  const [expGateway, setExpGateway] = useState(8500)
  const [expDeveloper, setExpDeveloper] = useState(25000)
  const [expMarketing, setExpMarketing] = useState(12000)
  const [expMisc, setExpMisc] = useState(1000)
  const [expNotes, setExpNotes] = useState('')

  // Form states for Tenant creation wizard
  const [newName, setNewName] = useState('')
  const [newOwnerName, setNewOwnerName] = useState('')
  const [newOwnerEmail, setNewOwnerEmail] = useState('')
  const [newPlan, setNewPlan] = useState('Starter')
  const [newMrr, setNewMrr] = useState(4000)

  // Edit states for limits
  const [limitsStaff, setLimitsStaff] = useState(10)
  const [limitsBranches, setLimitsBranches] = useState(3)
  const [flagAI, setFlagAI] = useState(true)
  const [flagMarketing, setFlagMarketing] = useState(true)
  const [flagInventory, setFlagInventory] = useState(true)
  const [flagPortal, setFlagPortal] = useState(true)

  // Announcement state
  const [announcementSubject, setAnnouncementSubject] = useState('')
  const [announcementBody, setAnnouncementBody] = useState('')

  // Chart hover state
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; val: string; date: string } | null>(null)

  // Global settings local state bounds
  const [setGeneralName, setSetGeneralName] = useState('')
  const [setCompanyName, setSetCompanyName] = useState('')
  const [setGstin, setSetGstin] = useState('')
  const [setSupportEmail, setSetSupportEmail] = useState('')
  const [setSupportPhone, setSetSupportPhone] = useState('')
  const [setAddress, setSetAddress] = useState('')
  const [setWebsite, setSetWebsite] = useState('')
  const [setCurrency, setSetCurrency] = useState('INR')
  const [setTimezone, setSetTimezone] = useState('IST')
  const [setDateFormat, setSetDateFormat] = useState('DD-MM-YYYY')
  const [setLanguage, setSetLanguage] = useState('English')
  const [setLogo, setSetLogo] = useState('')
  const [setFavicon, setSetFavicon] = useState('')
  const [setTaxRate, setSetTaxRate] = useState('18')
  const [setInvoicePrefix, setSetInvoicePrefix] = useState('SLN-')
  const [setInvoiceFooter, setSetInvoiceFooter] = useState('')
  const [setReceiptFooter, setSetReceiptFooter] = useState('')
  const [setMaintenance, setSetMaintenance] = useState(false)
  const [setAutoBackup, setSetAutoBackup] = useState(true)
  const [setSmtpHost, setSetSmtpHost] = useState('')
  const [setSmsGateway, setSetSmsGateway] = useState('')
  const [setwhatsappSender, setSetwhatsappSender] = useState('')

  // Load SaaS records
  const loadData = async () => {
    try {
      setLoading(true)
      const tenantList = await SuperAdminService.listTenants()
      const auditTrail = await SuperAdminService.listAuditLogs()
      const plansList = await SuperAdminService.listPlans()
      const couponsList = await SuperAdminService.listCoupons()
      const settingsData = await SuperAdminService.getGlobalSettings()
      const expensesList = await SuperAdminService.listExpenses()
      
      setTenants(tenantList)
      setLogs(auditTrail)
      setPlans(plansList)
      setCoupons(couponsList)
      setExpenses(expensesList)
      
      if (settingsData) {
        setGlobalSettings(settingsData)
        setSetGeneralName(settingsData.name ?? 'SalonOS SaaS')
        setSetCompanyName(settingsData.company_name ?? 'GlamStyle Tech')
        setSetGstin(settingsData.gstin ?? '')
        setSetSupportEmail(settingsData.support_email ?? 'support@salonos.io')
        setSetSupportPhone(settingsData.support_phone ?? '+91 99999 88888')
        setSetAddress(settingsData.address ?? '12, Link Road, Bandra West, Mumbai')
        setSetWebsite(settingsData.website ?? 'https://salonos.io')
        setSetCurrency(settingsData.currency ?? 'INR')
        setSetTimezone(settingsData.timezone ?? 'IST')
        setSetDateFormat(settingsData.date_format ?? 'DD-MM-YYYY')
        setSetLanguage(settingsData.language ?? 'English')
        setSetLogo(settingsData.logo ?? '')
        setSetFavicon(settingsData.favicon ?? '')
        setSetTaxRate(settingsData.tax_rate ?? '18')
        setSetInvoicePrefix(settingsData.invoice_prefix ?? 'SLN-')
        setSetInvoiceFooter(settingsData.invoice_footer ?? '')
        setSetReceiptFooter(settingsData.receipt_footer ?? '')
        setSetMaintenance(settingsData.maintenance_mode ?? false)
        setSetAutoBackup(settingsData.auto_backup ?? true)
        setSetSmtpHost(settingsData.smtp_host ?? '')
        setSetSmsGateway(settingsData.sms_gateway ?? 'twilio')
        setSetwhatsappSender(settingsData.whatsapp_sender ?? '')
      }
    } catch (e) {
      console.error('Failed to load super admin data', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Sync tab search parameter on mount/window-change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab) {
        setActiveTab(tab)
      }
    }
  }, [router])

  // Update query tab path helper
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    window.history.pushState(null, '', `/admin?tab=${tab}`)
  }

  // Quota preset mapping based on plans
  useEffect(() => {
    if (newPlan === 'Starter') setNewMrr(4000)
    else if (newPlan === 'Professional') setNewMrr(12000)
    else if (newPlan === 'Enterprise') setNewMrr(35000)
    else setNewMrr(0)
  }, [newPlan])

  // Financial and KPI calculations derived from expenses list
  const financials = useMemo(() => {
    // 1. Revenue
    const active = tenants.filter(t => t.status === 'active')
    const totalMRR = active.reduce((sum, t) => sum + (t.mrr_revenue || 0), 0)
    const totalARR = totalMRR * 12
    const totalRevenue = tenants.length === 0 ? 0 : 485000 + totalMRR

    // 2. Expenses matching selected date/month filter
    const activeExpenses = expenses.filter(e => e.month === expMonth && e.year === expYear)
    const currentMonthExpenses = activeExpenses.reduce((sum, e) => {
      return sum + 
        (e.hosting_cost || 0) + 
        (e.supabase_cost || 0) + 
        (e.database_cost || 0) + 
        (e.storage_cost || 0) + 
        (e.email_provider_cost || 0) + 
        (e.sms_provider_cost || 0) + 
        (e.payment_gateway_fees || 0) + 
        (e.developer_cost || 0) + 
        (e.marketing_cost || 0) + 
        (e.misc_cost || 0)
    }, 0)

    const yearlyExpenses = expenses.filter(e => e.year === expYear).reduce((sum, e) => {
      return sum + 
        (e.hosting_cost || 0) + 
        (e.supabase_cost || 0) + 
        (e.database_cost || 0) + 
        (e.storage_cost || 0) + 
        (e.email_provider_cost || 0) + 
        (e.sms_provider_cost || 0) + 
        (e.payment_gateway_fees || 0) + 
        (e.developer_cost || 0) + 
        (e.marketing_cost || 0) + 
        (e.misc_cost || 0)
    }, 0)

    // 3. Profit
    const netProfit = tenants.length === 0 ? 0 : totalMRR - currentMonthExpenses
    const profitMargin = totalMRR === 0 ? 0 : Math.round((netProfit / totalMRR) * 100)

    // 4. Operating, recurring, and cashflow
    const operatingCost = activeExpenses.reduce((sum, e) => {
      return sum + (e.hosting_cost || 0) + (e.supabase_cost || 0) + (e.database_cost || 0) + (e.storage_cost || 0) + (e.payment_gateway_fees || 0)
    }, 0)

    const recurringCost = activeExpenses.reduce((sum, e) => {
      return sum + (e.hosting_cost || 0) + (e.supabase_cost || 0) + (e.developer_cost || 0) + (e.sms_provider_cost || 0)
    }, 0)

    const oneTimeCost = activeExpenses.reduce((sum, e) => sum + (e.misc_cost || 0), 0)
    const cashFlow = totalMRR - operatingCost
    const gstCollected = totalMRR * (Number(globalSettings.tax_rate) / 100)

    return {
      mrr: totalMRR,
      arr: totalARR,
      totalRev: totalRevenue,
      activeCount: tenants.length === 0 ? 0 : active.length,
      trialsCount: tenants.length === 0 ? 0 : tenants.filter(t => t.plan === 'Free' || t.plan === 'Starter').length,
      activeUsersToday: tenants.length === 0 ? 0 : active.reduce((sum, t) => sum + (t.active_users || 0), 0),
      monthExpenses: currentMonthExpenses,
      yearExpenses: yearlyExpenses,
      netProfit,
      profitMargin,
      operatingCost,
      recurringCost,
      oneTimeCost,
      cashFlow,
      gstCollected
    }
  }, [tenants, expenses, expMonth, expYear, globalSettings.tax_rate])

  // Platform Alerts warning list
  const systemAlerts = useMemo(() => [
    { id: 'a1', severity: 'critical', title: 'Backup Overdue', desc: 'No system snapshot generated in 48 hours.', icon: AlertTriangle, category: 'Backup' },
    { id: 'a2', severity: 'warning', title: 'SMTP Mail Delivery Faults', desc: 'Host smtp.glamstyle.in rejected 3 registration alerts.', icon: Mail, category: 'SMTP' },
    { id: 'a3', severity: 'info', title: 'Storage Capacity 92%', desc: 'Storage usage for Elite Groomers Club exceeds warning threshold.', icon: Database, category: 'Disk' }
  ], [])

  // Live Activity timeline
  const activityFeed = useMemo(() => [
    { id: 'f1', time: '12 mins ago', type: 'registration', text: 'New salon register request: "The Style Lounge" by anjali@style.in' },
    { id: 'f2', time: '40 mins ago', type: 'upgrade', text: 'Vercel Hair Cutting Lab upgraded to Professional tier' },
    { id: 'f3', time: '2 hours ago', type: 'payment', text: 'SaaS invoice payment received: ₹12,000 from Elite Groomers Club' },
    { id: 'f4', time: '5 hours ago', type: 'backup', text: 'Automatic offsite database snapshot compiled and saved' },
    { id: 'f5', time: '1 day ago', type: 'alert', text: 'Tenant "Unpaid Suspended Salon" status changed to suspended due to non-payment' }
  ], [])

  // Global search & table filters
  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      const matchSearch = 
        t.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        t.owner_email.toLowerCase().includes(globalSearch.toLowerCase()) ||
        (t.owner_name && t.owner_name.toLowerCase().includes(globalSearch.toLowerCase())) ||
        t.plan.toLowerCase().includes(globalSearch.toLowerCase())
      
      const matchStatus = statusFilter === 'all' || t.status === statusFilter
      const matchPlan = planFilter === 'all' || t.plan === planFilter

      return matchSearch && matchStatus && matchPlan
    }).sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]

      if (typeof valA === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA)
      } else {
        return sortOrder === 'asc' 
          ? (valA || 0) - (valB || 0) 
          : (valB || 0) - (valA || 0)
      }
    })
  }, [tenants, globalSearch, statusFilter, planFilter, sortField, sortOrder])

  // Paginated set
  const paginatedTenants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredTenants.slice(start, start + itemsPerPage)
  }, [filteredTenants, currentPage])

  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage)

  // Reset page count on filter update
  useEffect(() => {
    setCurrentPage(1)
  }, [globalSearch, statusFilter, planFilter])

  // Table sorting trigger
  const handleSort = (field: 'name' | 'plan' | 'mrr_revenue' | 'staff_count' | 'health_score') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Create workspace wizard
  const handleCreateTenant = async () => {
    if (!newName || !newOwnerName || !newOwnerEmail) {
      error('Fields Required', 'Please supply Name, Owner Name, and Owner Email.')
      return
    }
    try {
      await SuperAdminService.createTenant({
        name: newName,
        owner_name: newOwnerName,
        owner_email: newOwnerEmail,
        plan: newPlan,
        mrr_revenue: newMrr
      }, user?.id || 'admin', 'Super Admin')

      success('Workspace Created', `Created and pre-configured database limit bounds for ${newName}.`)
      setShowCreateModal(false)
      setNewName('')
      setNewOwnerName('')
      setNewOwnerEmail('')
      loadData()
    } catch (e: any) {
      error('Creation Failed', e.message)
    }
  }

  // Edit limits wizard
  const handleOpenEdit = (tenant: any) => {
    setShowEditModal(tenant)
    setLimitsStaff(tenant.limits?.staff || 10)
    setLimitsBranches(tenant.limits?.branches || 3)
    setFlagAI(tenant.flags?.ai ?? true)
    setFlagMarketing(tenant.flags?.marketing ?? true)
    setFlagInventory(tenant.flags?.inventory ?? true)
    setFlagPortal(tenant.flags?.portal ?? true)
  }

  const handleSaveLimits = async () => {
    if (!showEditModal) return
    try {
      await SuperAdminService.updateSubscription(
        showEditModal.id,
        showEditModal.plan,
        { staff: limitsStaff, branches: limitsBranches, appointments: 500, storage_gb: 5 },
        user?.id || 'admin',
        'Super Admin'
      )

      success('Limits Updated', `Configs updated successfully for ${showEditModal.name}.`)
      setShowEditModal(null)
      loadData()
    } catch (e: any) {
      error('Save Failed', e.message)
    }
  }

  // Password reset simulation
  const handleResetPassword = async (tenantId: string, name: string) => {
    try {
      const pass = await SuperAdminService.resetPassword(tenantId, user?.id || 'admin', 'Super Admin')
      setShowPasswordModal({ isOpen: true, tenantName: name, pass })
      loadData()
    } catch (e: any) {
      error('Reset Failed', e.message)
    }
  }

  // Suspend toggle action
  const handleToggleStatus = async (tenantId: string, name: string) => {
    try {
      await SuperAdminService.suspendTenant(tenantId, user?.id || 'admin', 'Super Admin')
      success('Status Changed', `Workspace status changed successfully for ${name}.`)
      loadData()
    } catch (e: any) {
      error('Operation Failed', e.message)
    }
  }

  // Impersonate owner portal redirect
  const handleImpersonation = (tenantName: string) => {
    success('Impersonation Active', `Bypassing session as ${tenantName} Owner. Launching portal...`)
    setTimeout(() => {
      router.push('/dashboard')
    }, 1200)
  }

  // Backups downloads
  const handleBackup = () => {
    try {
      const dataStr = SuperAdminService.backupDatabase()
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `SaaS_Backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      success('Backup Completed', 'Platform database JSON snapshot saved to downloads.')
    } catch (e: any) {
      error('Backup Failed', e.message)
    }
  }

  // Restores uploads
  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader()
    const file = e.target.files?.[0]
    if (!file) return
    fileReader.onload = (event) => {
      try {
        const result = event.target?.result as string
        SuperAdminService.restoreDatabase(result)
        success('Platform Restored', 'Database state replaced from backup. Refreshing workspace...')
        setTimeout(() => window.location.reload(), 1500)
      } catch (err: any) {
        error('Restore Failed', err.message)
      }
    }
    fileReader.readAsText(file)
  }

  // Send announcement
  const handleAnnouncement = () => {
    if (!announcementSubject || !announcementBody) {
      error('Subject & Body Required', 'Please compile details before dispatching.')
      return
    }
    success('Announcement Broadcasted', 'Platform notification broadcasted successfully to all tenants.')
    setShowAnnouncementModal(false)
    setAnnouncementSubject('')
    setAnnouncementBody('')
  }

  // Export CSV
  const handleExportCSV = () => {
    try {
      const header = 'Salon Name,Owner Name,Owner Email,Plan,Status,Renewal,MRR,Staff,HealthScore\n'
      const rows = filteredTenants.map(t => 
        `"${t.name}","${t.owner_name || ''}","${t.owner_email}","${t.plan}","${t.status}","${t.subscription_renewal || ''}",${t.mrr_revenue || 0},${t.staff_count || 0},${t.health_score || 100}`
      )
      const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `SaaS_Tenants_Export.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      success('Export Completed', 'Tenant directory CSV generated.')
    } catch (e: any) {
      error('Export Failed', e.message)
    }
  }

  // Plan Management Actions
  const handleOpenPlanModal = (mode: 'create' | any) => {
    if (mode === 'create') {
      setShowPlanModal('create')
      setPlanName('')
      setPlanPriceMonthly(1999)
      setPlanPriceYearly(19990)
      setPlanStaffLimit(5)
      setPlanBranchLimit(3)
      setPlanStorageLimit(5)
      setPlanAiCredits(100)
      setPlanSmsCredits(500)
      setPlanWhatsappCredits(100)
      setPlanFeatures(['ai', 'marketing', 'inventory'])
    } else {
      setShowPlanModal(mode)
      setPlanName(mode.name)
      setPlanPriceMonthly(mode.price_monthly)
      setPlanPriceYearly(mode.price_yearly)
      setPlanStaffLimit(mode.staff_limit)
      setPlanBranchLimit(mode.branch_limit || 3)
      setPlanStorageLimit(mode.storage_limit_gb)
      setPlanAiCredits(mode.ai_credits || 100)
      setPlanSmsCredits(mode.sms_credits || 500)
      setPlanWhatsappCredits(mode.whatsapp_credits || 100)
      setPlanFeatures(mode.features || ['ai', 'marketing', 'inventory'])
    }
  }

  const handleSavePlan = async () => {
    if (!planName) {
      error('Name Required', 'Please enter plan name.')
      return
    }
    const updated = [...plans]
    if (showPlanModal === 'create') {
      updated.push({
        id: 'p-' + Math.random().toString(36).substring(2, 7),
        name: planName,
        price_monthly: planPriceMonthly,
        price_yearly: planPriceYearly,
        staff_limit: planStaffLimit,
        branch_limit: planBranchLimit,
        storage_limit_gb: planStorageLimit,
        ai_credits: planAiCredits,
        sms_credits: planSmsCredits,
        whatsapp_credits: planWhatsappCredits,
        features: planFeatures,
        status: 'active'
      })
      success('Plan Created', `New plan subscription ${planName} added.`)
    } else {
      const idx = updated.findIndex(p => p.id === showPlanModal.id)
      if (idx !== -1) {
        updated[idx] = {
          ...updated[idx],
          name: planName,
          price_monthly: planPriceMonthly,
          price_yearly: planPriceYearly,
          staff_limit: planStaffLimit,
          branch_limit: planBranchLimit,
          storage_limit_gb: planStorageLimit,
          ai_credits: planAiCredits,
          sms_credits: planSmsCredits,
          whatsapp_credits: planWhatsappCredits,
          features: planFeatures
        }
        success('Plan Updated', `Plan settings configured for ${planName}.`)
      }
    }
    await SuperAdminService.savePlans(updated)
    setShowPlanModal(null)
    loadData()
  }

  const handleDeletePlan = async (id: string, name: string) => {
    const updated = plans.filter(p => p.id !== id)
    await SuperAdminService.savePlans(updated)
    success('Plan Deleted', `Subscription plan ${name} deleted successfully.`)
    loadData()
  }

  const handleArchivePlan = async (id: string, currentStatus: string) => {
    const updated = [...plans]
    const idx = updated.findIndex(p => p.id === id)
    if (idx !== -1) {
      updated[idx].status = currentStatus === 'active' ? 'archived' : 'active'
      await SuperAdminService.savePlans(updated)
      success('Plan Archived', `Plan state updated successfully.`)
      loadData()
    }
  }

  const handleDuplicatePlan = async (plan: any) => {
    const updated = [...plans]
    updated.push({
      ...plan,
      id: 'p-' + Math.random().toString(36).substring(2, 7),
      name: `Copy of ${plan.name}`,
      status: 'active'
    })
    await SuperAdminService.savePlans(updated)
    success('Plan Duplicated', `Created carbon copy of ${plan.name}.`)
    loadData()
  }

  // Coupon Management Actions
  const handleOpenCouponModal = (mode: 'create' | any) => {
    if (mode === 'create') {
      setShowCouponModal('create')
      setCoupCode('')
      setCoupDiscount(10)
      setCoupType('percentage')
      setCoupStart('2026-07-01')
      setCoupEnd('2027-01-01')
      setCoupLimit(100)
      setCoupPlans(['Starter', 'Professional'])
    } else {
      setShowCouponModal(mode)
      setCoupCode(mode.code)
      setCoupDiscount(mode.discount_percent || mode.discount_value)
      setCoupType(mode.discount_percent ? 'percentage' : 'flat')
      setCoupStart(mode.start_date || '2026-07-01')
      setCoupEnd(mode.expiry_date || '2027-01-01')
      setCoupLimit(mode.usage_limit)
      setCoupPlans(mode.applicable_plans || ['Starter', 'Professional'])
    }
  }

  const handleSaveCoupon = async () => {
    if (!coupCode) {
      error('Code Required', 'Please enter coupon code.')
      return
    }
    const updated = [...coupons]
    if (showCouponModal === 'create') {
      updated.push({
        id: 'c-' + Math.random().toString(36).substring(2, 7),
        code: coupCode.toUpperCase(),
        discount_percent: coupType === 'percentage' ? coupDiscount : 0,
        discount_flat: coupType === 'flat' ? coupDiscount : 0,
        expiry_date: coupEnd,
        start_date: coupStart,
        active: true,
        usage_limit: coupLimit,
        uses_count: 0,
        applicable_plans: coupPlans
      })
      success('Coupon Created', `Discount promo code ${coupCode} added to catalog.`)
    } else {
      const idx = updated.findIndex(c => c.id === showCouponModal.id)
      if (idx !== -1) {
        updated[idx] = {
          ...updated[idx],
          code: coupCode.toUpperCase(),
          discount_percent: coupType === 'percentage' ? coupDiscount : 0,
          discount_flat: coupType === 'flat' ? coupDiscount : 0,
          expiry_date: coupEnd,
          start_date: coupStart,
          usage_limit: coupLimit,
          applicable_plans: coupPlans
        }
        success('Coupon Updated', `Promo code configs saved for ${coupCode}.`)
      }
    }
    await SuperAdminService.saveCoupons(updated)
    setShowCouponModal(null)
    loadData()
  }

  const handleDeleteCoupon = async (id: string, code: string) => {
    const updated = coupons.filter(c => c.id !== id)
    await SuperAdminService.saveCoupons(updated)
    success('Coupon Deleted', `Promo discount code ${code} deleted.`)
    loadData()
  }

  // Expense Management Actions
  const handleOpenExpenseModal = (mode: 'create' | any) => {
    if (mode === 'create') {
      setShowExpenseModal('create')
      setExpMonth('7')
      setExpYear('2026')
      setExpHosting(15000)
      setExpSupabase(8000)
      setExpDatabase(5000)
      setExpStorage(2000)
      setExpEmail(3500)
      setExpSms(14000)
      setExpGateway(8500)
      setExpDeveloper(25000)
      setExpMarketing(12000)
      setExpMisc(1000)
      setExpNotes('')
    } else {
      setShowExpenseModal(mode)
      setExpMonth(mode.month)
      setExpYear(mode.year)
      setExpHosting(mode.hosting_cost)
      setExpSupabase(mode.supabase_cost)
      setExpDatabase(mode.database_cost)
      setExpStorage(mode.storage_cost)
      setExpEmail(mode.email_provider_cost)
      setExpSms(mode.sms_provider_cost)
      setExpGateway(mode.payment_gateway_fees)
      setExpDeveloper(mode.developer_cost)
      setExpMarketing(mode.marketing_cost)
      setExpMisc(mode.misc_cost)
      setExpNotes(mode.notes || '')
    }
  }

  const handleSaveExpense = async () => {
    const updated = [...expenses]
    const expenseData = {
      hosting_cost: expHosting,
      supabase_cost: expSupabase,
      database_cost: expDatabase,
      storage_cost: expStorage,
      email_provider_cost: expEmail,
      sms_provider_cost: expSms,
      payment_gateway_fees: expGateway,
      developer_cost: expDeveloper,
      marketing_cost: expMarketing,
      misc_cost: expMisc,
      notes: expNotes,
      month: expMonth,
      year: expYear
    }

    if (showExpenseModal === 'create') {
      updated.push({
        id: 'exp-' + Math.random().toString(36).substring(2, 7),
        ...expenseData
      })
      success('Expense Logged', `Platform infrastructure costs logged successfully.`)
    } else {
      const idx = updated.findIndex(e => e.id === showExpenseModal.id)
      if (idx !== -1) {
        updated[idx] = {
          ...updated[idx],
          ...expenseData
        }
        success('Expense Updated', `Platform expenses config saved.`)
      }
    }
    await SuperAdminService.saveExpenses(updated)
    setShowExpenseModal(null)
    loadData()
  }

  const handleDeleteExpense = async (id: string) => {
    const updated = expenses.filter(e => e.id !== id)
    await SuperAdminService.saveExpenses(updated)
    success('Expense Deleted', `Platform infrastructure cost item purged.`)
    loadData()
  }

  // Global Settings save
  const handleSaveGlobalSettings = async () => {
    try {
      const config = {
        ...globalSettings,
        name: setGeneralName,
        company_name: setCompanyName,
        gstin: setGstin,
        support_email: setSupportEmail,
        support_phone: setSupportPhone,
        address: setAddress,
        website: setWebsite,
        currency: setCurrency,
        timezone: setTimezone,
        date_format: setDateFormat,
        language: setLanguage,
        logo: setLogo,
        favicon: setFavicon,
        tax_rate: setTaxRate,
        invoice_prefix: setInvoicePrefix,
        invoice_footer: setInvoiceFooter,
        receipt_footer: setReceiptFooter,
        maintenance_mode: setMaintenance,
        auto_backup: setAutoBackup,
        smtp_host: setSmtpHost,
        sms_gateway: setSmsGateway,
        whatsapp_sender: setwhatsappSender
      }
      await SuperAdminService.saveGlobalSettings(config)
      success('Platform Settings Saved', 'Global control config saved successfully.')
      loadData()
    } catch (e: any) {
      error('Save Failed', e.message)
    }
  }

  // Factory reset logic execution
  const handleFactoryReset = async () => {
    if (resetConfirmInput !== 'RESET') {
      error('Validation Failed', 'Please type the word RESET to continue.')
      return
    }
    try {
      await SuperAdminService.factoryReset()
      success('Factory Reset Completed', 'Clearing mock databases and rebuilding seeds. Reloading platform...')
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (e: any) {
      error('Reset Failed', e.message)
    }
  }

  // Interactive line graph coordinates mapping helper
  const linePoints = useMemo(() => {
    const values = [42000, 48000, 52000, 58000, 61000, financials.mrr]
    const width = 500
    const height = 140
    const padding = 30
    
    const minVal = Math.min(...values) * 0.9
    const maxVal = Math.max(...values) * 1.1
    const valRange = maxVal - minVal
    
    return values.map((val, idx) => {
      const x = padding + (idx * (width - padding * 2)) / (values.length - 1)
      const y = height - padding - ((val - minVal) * (height - padding * 2)) / valRange
      const date = `Month -${5 - idx}`
      return { x, y, val: val.toString(), date: idx === 5 ? 'Current MRR' : date }
    })
  }, [financials.mrr])

  return (
    <div className="space-y-6 text-left relative pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" /> Enterprise SaaS Control Center
          </h2>
          <p className="text-xs text-muted-foreground">
            Administrative console for global pricing configurations, promo coupons, and offsite backups.
          </p>
        </div>

        {/* Date Filter & Fast Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={dateRange} onValueChange={(val: any) => setDateRange(val)}>
            <SelectTrigger className="h-8 w-28 bg-card text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="year">Full Year</SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm" variant="gradient" className="h-8 text-xs font-semibold" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Create Tenant
          </Button>

          <Button size="sm" variant="outline" className="h-8 text-xs text-rose-500 hover:bg-rose-500/5 hover:text-rose-600 border-rose-500/20" onClick={() => { setShowResetConfirm(true); setResetConfirmInput(''); }}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Factory Reset
          </Button>

          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleBackup}>
            <Download className="h-3.5 w-3.5 mr-1" /> Backup
          </Button>

          <Label className="h-8 px-3 border rounded-xl hover:bg-muted/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold">
            <Server className="h-3.5 w-3.5" /> Restore
            <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
          </Label>
        </div>
      </div>

      {/* Tabs Select Ribbon */}
      <div className="flex border-b border-border/80 gap-1 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: 'Command Center', icon: BarChart3 },
          { id: 'plans', label: 'Pricing Plans', icon: Layers },
          { id: 'coupons', label: 'Coupon Center', icon: Tag },
          { id: 'tenants', label: 'Tenants Directory', icon: Building2 },
          { id: 'health', label: 'Platform & Security', icon: Shield },
          { id: 'settings', label: 'Business Settings', icon: Settings },
          { id: 'success', label: 'Reports & success', icon: Landmark }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px shrink-0 ${activeTab === tab.id ? 'border-primary text-primary bg-primary/5 rounded-t-xl' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <span className="text-xs text-muted-foreground animate-pulse">Aggregating platform diagnostics...</span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Executive Overview KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: 'Monthly Recurring (MRR)', val: formatCurrency(financials.mrr), comp: tenants.length === 0 ? '₹0' : '₹58,000', change: tenants.length === 0 ? '0%' : '+8.6%', trend: tenants.length === 0 ? [] : [42, 48, 52, 58, 61, 63], up: true },
                  { title: 'Annual Recurring (ARR)', val: formatCurrency(financials.arr), comp: tenants.length === 0 ? '₹0' : '₹6,96,000', change: tenants.length === 0 ? '0%' : '+8.6%', trend: tenants.length === 0 ? [] : [504, 576, 624, 696, 732, 756], up: true },
                  { title: 'Active Tenants', val: `${financials.activeCount} Salons`, comp: tenants.length === 0 ? '0 Salons' : '4 Salons', change: tenants.length === 0 ? '0%' : '+25.0%', trend: tenants.length === 0 ? [] : [2, 3, 3, 4, 4, 4], up: true },
                  { title: 'Active Users Today', val: `${financials.activeUsersToday} Users`, comp: tenants.length === 0 ? '0 Users' : '11 Users', change: tenants.length === 0 ? '0%' : '+27.2%', trend: tenants.length === 0 ? [] : [6, 8, 9, 11, 13, 14], up: true }
                ].map((kpi, idx) => (
                  <Card key={idx} className="glass-card flex flex-col justify-between">
                    <CardContent className="p-4 space-y-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{kpi.title}</span>
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-xl font-bold tracking-tight text-foreground">{kpi.val}</h3>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${kpi.up && tenants.length > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                          {kpi.change}
                        </span>
                      </div>
                      <div className="text-[9px] text-muted-foreground">Previous: <strong>{kpi.comp}</strong></div>
                      
                      {/* Mini Sparkline Chart */}
                      <div className="h-6 w-full mt-2 opacity-80 flex items-center justify-center">
                        {kpi.trend.length === 0 ? (
                          <span className="text-[9px] text-muted-foreground/40 font-semibold">No data available</span>
                        ) : (
                          <svg className="w-full h-full" viewBox="0 0 100 20">
                            <polyline
                              fill="none"
                              stroke="#7c3aed"
                              strokeWidth="2"
                              points={kpi.trend.map((val, i) => `${(i * 100) / (kpi.trend.length - 1)}, ${20 - ((val - Math.min(...kpi.trend)) * 16) / (Math.max(...kpi.trend) - Math.min(...kpi.trend) || 1) - 2}`).join(' ')}
                            />
                          </svg>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Analytics & Distribution Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border bg-card">
                  <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold">Monthly Recurring Revenue (MRR) Growth</CardTitle>
                      <CardDescription className="text-xs">SaaS revenue trends over past 6 cycles.</CardDescription>
                    </div>
                    {tenants.length > 0 && (
                      <span className="text-xs font-bold text-primary flex items-center gap-1"><TrendingUp className="h-4 w-4" /> +14.2% Growth</span>
                    )}
                  </CardHeader>
                  <CardContent className="p-6">
                    {tenants.length === 0 ? (
                      <div className="flex flex-col items-center justify-center min-h-[140px] text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mb-2 text-muted-foreground/40" />
                        <span className="text-xs font-semibold">No data available</span>
                      </div>
                    ) : (
                      <div className="w-full h-44 relative">
                        {/* Responsive SVG interactive line */}
                        <svg viewBox="0 0 500 140" className="w-full h-full overflow-visible">
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
                              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path
                            d={`M${linePoints[0].x},110 ` + linePoints.map(p => `L${p.x},${p.y}`).join(' ') + ` L${linePoints[linePoints.length - 1].x},110 Z`}
                            fill="url(#chartGrad)"
                          />
                          <line x1="30" y1="30" x2="470" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="3" />
                          <line x1="30" y1="70" x2="470" y2="70" stroke="rgba(255,255,255,0.06)" strokeDasharray="3" />
                          <line x1="30" y1="110" x2="470" y2="110" stroke="rgba(255,255,255,0.06)" />

                          <polyline
                            fill="none"
                            stroke="#7c3aed"
                            strokeWidth="3.5"
                            points={linePoints.map(p => `${p.x},${p.y}`).join(' ')}
                          />

                          {linePoints.map((p, idx) => (
                            <circle
                              key={idx}
                              cx={p.x}
                              cy={p.y}
                              r={hoveredPoint?.val === p.val ? '7' : '4.5'}
                              fill={hoveredPoint?.val === p.val ? '#ffffff' : '#7c3aed'}
                              stroke="#7c3aed"
                              strokeWidth="2.5"
                              className="cursor-pointer transition-all duration-150"
                              onMouseOver={(e) => {
                                setHoveredPoint({ x: p.x, y: p.y - 12, val: p.val, date: p.date })
                              }}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                          ))}
                        </svg>
                        {hoveredPoint && (
                          <div 
                            className="absolute bg-card border border-border p-2 rounded-xl shadow-2xl text-[9px] pointer-events-none"
                            style={{ left: `${(hoveredPoint.x * 100) / 500 - 8}%`, top: `${(hoveredPoint.y * 100) / 140 - 25}%` }}
                          >
                            <div className="font-bold text-primary">{hoveredPoint.date}</div>
                            <div>Value: <strong className="text-foreground">{formatCurrency(Number(hoveredPoint.val))}</strong></div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border bg-card">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm font-bold">Plan Distribution</CardTitle>
                    <CardDescription className="text-xs">SaaS subscription spread.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col items-center justify-center">
                    {tenants.length === 0 ? (
                      <div className="flex flex-col items-center justify-center min-h-[140px] text-muted-foreground w-full">
                        <AlertCircle className="h-8 w-8 mb-2 text-muted-foreground/40" />
                        <span className="text-xs font-semibold">No data available</span>
                      </div>
                    ) : (
                      <>
                        <div className="h-32 w-32 relative">
                          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                            <circle cx="18" cy="18" r="15.91" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15.91" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="20 80" strokeDashoffset="100" />
                            <circle cx="18" cy="18" r="15.91" fill="none" stroke="#7c3aed" strokeWidth="3" strokeDasharray="40 60" strokeDashoffset="80" />
                            <circle cx="18" cy="18" r="15.91" fill="none" stroke="#ec4899" strokeWidth="3" strokeDasharray="20 80" strokeDashoffset="40" />
                            <circle cx="18" cy="18" r="15.91" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="20 80" strokeDashoffset="20" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-lg font-bold text-foreground">
                              {tenants.filter(t => t.status === 'active').length}
                            </span>
                            <span className="text-[8px] text-muted-foreground uppercase font-bold">Active</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[9px] mt-6 w-full border-t pt-3">
                          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Starter: 20%</div>
                          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#7c3aed]" /> Pro: 40%</div>
                          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#ec4899]" /> Enterprise: 20%</div>
                          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#3b82f6]" /> Free: 20%</div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Expandable Overview Modules Grid */}
              <div className="space-y-4">
                {/* Expandable widget: Revenue & Plans */}
                <Card className="border bg-card overflow-hidden">
                  <div 
                    onClick={() => setExpandedWidgets(prev => ({ ...prev, revenue: !prev.revenue }))}
                    className="p-4 border-b bg-muted/20 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <span className="font-bold text-xs flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-primary" /> Revenue & Subscriptions Analytics</span>
                    <Badge variant="outline" className="text-[9px] uppercase">{expandedWidgets.revenue ? 'Collapse' : 'Expand'}</Badge>
                  </div>
                  {expandedWidgets.revenue && (
                    <CardContent className="p-4 space-y-4">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        <div className="border p-3 rounded-xl bg-card">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold">Projected Monthly Revenue</span>
                          <div className="font-bold text-sm mt-1">{formatCurrency(financials.mrr * 1.15)}</div>
                        </div>
                        <div className="border p-3 rounded-xl bg-card">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold">Recurring Forecast</span>
                          <div className="font-bold text-sm mt-1">{formatCurrency(financials.arr * 1.25)}</div>
                        </div>
                        <div className="border p-3 rounded-xl bg-card">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold">Outstanding Payments</span>
                          <div className="font-bold text-sm text-rose-500 mt-1">{tenants.length === 0 ? '₹0' : '₹6,999'}</div>
                        </div>
                        <div className="border p-3 rounded-xl bg-card">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold">Failed stripe checkouts</span>
                          <div className="font-bold text-sm text-rose-500 mt-1">{tenants.length === 0 ? '0 Failures' : '1 Failure'}</div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Expandable widget: Platform Health */}
                <Card className="border bg-card overflow-hidden">
                  <div 
                    onClick={() => setExpandedWidgets(prev => ({ ...prev, health: !prev.health }))}
                    className="p-4 border-b bg-muted/20 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <span className="font-bold text-xs flex items-center gap-1.5"><Server className="h-4 w-4 text-emerald-500" /> Platform Infrastructure Health</span>
                    <Badge variant="outline" className="text-[9px] uppercase">{expandedWidgets.health ? 'Collapse' : 'Expand'}</Badge>
                  </div>
                  {expandedWidgets.health && (
                    <CardContent className="p-4 space-y-4">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        <div className="border p-3 rounded-xl bg-card">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold">Server Uptime</span>
                          <div className="font-bold text-sm text-emerald-500 mt-1">99.98%</div>
                        </div>
                        <div className="border p-3 rounded-xl bg-card">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold">API Latency</span>
                          <div className="font-bold text-sm mt-1">118 ms</div>
                        </div>
                        <div className="border p-3 rounded-xl bg-card">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold">Active CPU load</span>
                          <div className="font-bold text-sm mt-1">18%</div>
                        </div>
                        <div className="border p-3 rounded-xl bg-card">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold">Failed Worker Jobs</span>
                          <div className="font-bold text-sm text-emerald-500 mt-1">0 Failed</div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Expandable widget: Activity Feed */}
                <Card className="border bg-card overflow-hidden">
                  <div 
                    onClick={() => setExpandedWidgets(prev => ({ ...prev, security: !prev.security }))}
                    className="p-4 border-b bg-muted/20 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <span className="font-bold text-xs flex items-center gap-1.5"><Activity className="h-4 w-4 text-violet-500" /> Live Activity & System Logs</span>
                    <Badge variant="outline" className="text-[9px] uppercase">{expandedWidgets.security ? 'Collapse' : 'Expand'}</Badge>
                  </div>
                  {expandedWidgets.security && (
                    <CardContent className="p-4">
                      <div className="relative border-l border-border pl-4 space-y-3 text-[10px]">
                        {activityFeed.map(feed => (
                          <div key={feed.id} className="relative">
                            <span className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full bg-primary" />
                            <div className="flex justify-between items-center text-muted-foreground mb-0.5">
                              <span className="uppercase text-[8px] font-bold tracking-widest text-primary">{feed.type}</span>
                              <span>{feed.time}</span>
                            </div>
                            <p className="text-muted-foreground">{feed.text}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>

              {/* Quick Actions Panel */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                  <div onClick={() => setShowCreateModal(true)} className="p-4 border rounded-2xl bg-card hover:bg-muted/30 cursor-pointer transition-colors flex flex-col items-center justify-center gap-1">
                    <Building2 className="h-5 w-5 text-violet-500" />
                    <span className="text-[10px] font-bold">Create Tenant</span>
                  </div>
                  <div onClick={() => handleOpenPlanModal('create')} className="p-4 border rounded-2xl bg-card hover:bg-muted/30 cursor-pointer transition-colors flex flex-col items-center justify-center gap-1">
                    <Layers className="h-5 w-5 text-indigo-500" />
                    <span className="text-[10px] font-bold">Create Plan</span>
                  </div>
                  <div onClick={() => handleOpenCouponModal('create')} className="p-4 border rounded-2xl bg-card hover:bg-muted/30 cursor-pointer transition-colors flex flex-col items-center justify-center gap-1">
                    <Tag className="h-5 w-5 text-emerald-500" />
                    <span className="text-[10px] font-bold">Create Coupon</span>
                  </div>
                  <div onClick={() => setShowAnnouncementModal(true)} className="p-4 border rounded-2xl bg-card hover:bg-muted/30 cursor-pointer transition-colors flex flex-col items-center justify-center gap-1">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    <span className="text-[10px] font-bold">Broadcast message</span>
                  </div>
                  <div onClick={() => { setShowResetConfirm(true); setResetConfirmInput(''); }} className="p-4 border rounded-2xl bg-card hover:bg-muted/30 cursor-pointer transition-colors flex flex-col items-center justify-center gap-1">
                    <Trash2 className="h-5 w-5 text-rose-500" />
                    <span className="text-[10px] font-bold">Factory Reset</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: PRICING PLANS */}
          {activeTab === 'plans' && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold">Subscription & Pricing Manager</h3>
                  <p className="text-xs text-muted-foreground">Manage SaaS platform billing plans and structural limitations.</p>
                </div>
                <Button size="sm" variant="gradient" className="h-8 text-xs font-semibold" onClick={() => handleOpenPlanModal('create')}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Create Plan
                </Button>
              </div>

              {/* Plans Table */}
              <Card className="border bg-card overflow-hidden">
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-muted/30 border-b text-muted-foreground font-semibold uppercase text-[9px]">
                      <tr>
                        <th className="p-3">Plan Name</th>
                        <th className="p-3 text-right font-bold">Monthly Price</th>
                        <th className="p-3 text-right font-bold">Yearly Price</th>
                        <th className="p-3 text-right">Staff Limit</th>
                        <th className="p-3 text-right">Branch Limit</th>
                        <th className="p-3 text-right">Storage Limit</th>
                        <th className="p-3 text-right">AI Credits</th>
                        <th className="p-3 text-right">SMS Credits</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {plans.map(p => (
                        <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3 font-semibold text-primary">{p.name}</td>
                          <td className="p-3 text-right font-bold">{formatCurrency(p.price_monthly)}</td>
                          <td className="p-3 text-right font-bold">{formatCurrency(p.price_yearly)}</td>
                          <td className="p-3 text-right">{p.staff_limit} Staff</td>
                          <td className="p-3 text-right">{p.branch_limit || 3} Branches</td>
                          <td className="p-3 text-right">{p.storage_limit_gb} GB</td>
                          <td className="p-3 text-right">{p.ai_credits || 100} credits</td>
                          <td className="p-3 text-right">{p.sms_credits || 500} SMS</td>
                          <td className="p-3">
                            <Badge variant={p.status === 'active' ? 'success' : 'secondary'} className="text-[9px] uppercase">
                              {p.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => handleOpenPlanModal(p)}>
                                <Settings className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-indigo-500" onClick={() => handleDuplicatePlan(p)}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-amber-500" onClick={() => handleArchivePlan(p.id, p.status)}>
                                <Shield className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500" onClick={() => handleDeletePlan(p.id, p.name)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {/* TAB 3: COUPON CENTER */}
          {activeTab === 'coupons' && (
            <motion.div
              key="coupons"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold">Offers & Coupon Center</h3>
                  <p className="text-xs text-muted-foreground">Configure promo discount codes, referral metrics, and seasonal campaigns.</p>
                </div>
                <Button size="sm" variant="gradient" className="h-8 text-xs font-semibold" onClick={() => handleOpenCouponModal('create')}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Create Coupon
                </Button>
              </div>

              {/* Coupons Table */}
              <Card className="border bg-card overflow-hidden">
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-muted/30 border-b text-muted-foreground font-semibold uppercase text-[9px]">
                      <tr>
                        <th className="p-3">Coupon Code</th>
                        <th className="p-3">Discount</th>
                        <th className="p-3">Start Date</th>
                        <th className="p-3">Expiry Date</th>
                        <th className="p-3 text-right">Max Usage</th>
                        <th className="p-3 text-right">Current Uses</th>
                        <th className="p-3">Plans Applicable</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {coupons.map(c => (
                        <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3 font-mono font-bold text-primary">{c.code}</td>
                          <td className="p-3 font-semibold">
                            {c.discount_percent ? `${c.discount_percent}% Off` : formatCurrency(c.discount_flat || 0)}
                          </td>
                          <td className="p-3 text-muted-foreground">{c.start_date || '2026-07-01'}</td>
                          <td className="p-3 text-muted-foreground">{c.expiry_date}</td>
                          <td className="p-3 text-right">{c.usage_limit} uses</td>
                          <td className="p-3 text-right font-bold">{c.uses_count}</td>
                          <td className="p-3 truncate max-w-xs">{c.applicable_plans?.join(', ') || 'All'}</td>
                          <td className="p-3">
                            <Badge variant={c.active ? 'success' : 'secondary'} className="text-[9px] uppercase">
                              {c.active ? 'Active' : 'Expired'}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => handleOpenCouponModal(c)}>
                                Edit
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-[10px] text-rose-500" onClick={() => handleDeleteCoupon(c.id, c.code)}>
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {/* TAB 4: TENANTS DIRECTORY */}
          {activeTab === 'tenants' && (
            <motion.div
              key="tenants"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-muted/20 border p-4 rounded-2xl">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search owner name, salon name, plan, email..." 
                    className="h-9 pl-9 bg-card text-xs" 
                    value={globalSearch} 
                    onChange={e => setGlobalSearch(e.target.value)} 
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                    <SelectTrigger className="h-9 w-32 bg-card text-xs">
                      <Filter className="h-3.5 w-3.5 mr-1" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={planFilter} onValueChange={(val: any) => setPlanFilter(val)}>
                    <SelectTrigger className="h-9 w-32 bg-card text-xs">
                      <Filter className="h-3.5 w-3.5 mr-1" />
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="Free">Free</SelectItem>
                      <SelectItem value="Starter">Starter</SelectItem>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button size="sm" variant="outline" className="h-9 text-xs" onClick={handleExportCSV}>
                    <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
                  </Button>
                </div>
              </div>

              {/* Tenants Directory Table */}
              <Card className="border bg-card overflow-hidden">
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-muted/30 border-b text-muted-foreground font-semibold uppercase text-[9px] tracking-wider">
                      <tr>
                        <th className="p-3 cursor-pointer" onClick={() => handleSort('name')}>Salon {sortField === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                        <th className="p-3">Owner</th>
                        <th className="p-3 cursor-pointer" onClick={() => handleSort('plan')}>Plan {sortField === 'plan' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 cursor-pointer text-right" onClick={() => handleSort('mrr_revenue')}>MRR {sortField === 'mrr_revenue' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                        <th className="p-3 cursor-pointer text-right" onClick={() => handleSort('staff_count')}>Staff {sortField === 'staff_count' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                        <th className="p-3 text-right">Customers</th>
                        <th className="p-3 text-right">DB / Storage</th>
                        <th className="p-3 cursor-pointer text-right" onClick={() => handleSort('health_score')}>Health {sortField === 'health_score' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedTenants.map(tenant => (
                        <tr key={tenant.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3 font-semibold text-primary">{tenant.name}</td>
                          <td className="p-3">
                            <div className="font-medium text-foreground">{tenant.owner_name}</div>
                            <div className="text-[10px] text-muted-foreground">{tenant.owner_email}</div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-[9px] uppercase">{tenant.plan}</Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant={tenant.status === 'active' ? 'success' : 'destructive'} className="text-[9px] uppercase">
                              {tenant.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right font-bold">{formatCurrency(tenant.mrr_revenue || 0)}</td>
                          <td className="p-3 text-right">{tenant.staff_count || 0}</td>
                          <td className="p-3 text-right">{tenant.customer_count || 0}</td>
                          <td className="p-3 text-right text-muted-foreground">
                            {tenant.database_size_mb} MB / {tenant.storage_used_gb} GB
                          </td>
                          <td className="p-3 text-right">
                            <span className={`font-bold ${tenant.health_score >= 90 ? 'text-emerald-500' : tenant.health_score >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                              {tenant.health_score}%
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => handleImpersonation(tenant.name)}>
                                <Play className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => handleOpenEdit(tenant)}>
                                <Settings className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-amber-500" onClick={() => handleResetPassword(tenant.id, tenant.name)}>
                                <Key className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className={tenant.status === 'active' ? 'h-7 w-7 text-rose-500' : 'h-7 w-7 text-emerald-500'} onClick={() => handleToggleStatus(tenant.id, tenant.name)}>
                                <Shield className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredTenants.length === 0 && (
                        <tr>
                          <td colSpan={10} className="p-12 text-center text-muted-foreground">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                            No tenant record matches the search filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table pagination */}
                {filteredTenants.length > itemsPerPage && (
                  <div className="flex justify-between items-center p-4 border-t border-border">
                    <span className="text-[10px] text-muted-foreground">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTenants.length)} of {filteredTenants.length} tenants
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-[10px] font-bold text-foreground">Page {currentPage} of {totalPages}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* TAB 5: PLATFORM & SECURITY */}
          {activeTab === 'health' && (
            <motion.div
              key="health"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Platform health parameters grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {/* Uptime and API meters */}
                <Card className="border bg-card">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Server className="h-4 w-4 text-emerald-500" /> Host Uptime & Latency</CardTitle>
                    <CardDescription className="text-xs">Cluster health nodes stats.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Server Uptime:</span>
                      <strong className="text-emerald-500">99.98%</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>API Response Latency:</span>
                      <strong>118 ms</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Database Health:</span>
                      <Badge variant="success" className="text-[8px] uppercase">Excellent</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Last Offsite Backup:</span>
                      <span className="text-muted-foreground font-semibold">12 hours ago</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>System Health Score:</span>
                      <strong className="text-emerald-500 text-sm">98/100</strong>
                    </div>
                  </CardContent>
                </Card>

                {/* Queue status */}
                <Card className="border bg-card">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Clock className="h-4 w-4 text-violet-500" /> System Job Queues</CardTitle>
                    <CardDescription className="text-xs">Roster background queue registers.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Email Outbox Queue:</span>
                      <strong>0 jobs</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>SMS Gateway Queue:</span>
                      <strong>0 jobs</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Webhook Dispatches Queue:</span>
                      <strong>0 jobs</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Failed Worker Jobs:</span>
                      <span className="text-emerald-500 font-bold">0 Failed</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Metrics Center */}
                <Card className="border bg-card">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Shield className="h-4 w-4 text-amber-500" /> Security Analytics</CardTitle>
                    <CardDescription className="text-xs">Firewall and blocked requests logs.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Blocked IP addresses:</span>
                      <strong>14 IPs</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Suspicious activities:</span>
                      <span className="text-emerald-500 font-bold">None</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>API Rate Abuse warnings:</span>
                      <span className="text-emerald-500 font-bold">0 Alerts</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Security Grade Score:</span>
                      <strong className="text-emerald-500 text-sm">A+ (99%)</strong>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Audit Trail List */}
              <Card>
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-bold">SaaS Audit Logs Feed</CardTitle>
                  <CardDescription className="text-xs">Compliance logs tracking active operations.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-muted/30 border-b text-muted-foreground font-semibold uppercase text-[9px]">
                        <tr>
                          <th className="p-3">Timestamp</th>
                          <th className="p-3">User/Operator</th>
                          <th className="p-3">Action</th>
                          <th className="p-3">Target Details</th>
                          <th className="p-3">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {logs.map((log, idx) => (
                          <tr key={log.id || idx}>
                            <td className="p-3 text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                            <td className="p-3 font-semibold text-primary">{log.user_name}</td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-[9px] uppercase border-violet-500/20 text-violet-500">
                                {log.action.replace(/_/g, ' ')}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground truncate max-w-xs">
                              {JSON.stringify(log.new_values || {})}
                            </td>
                            <td className="p-3 text-muted-foreground">{log.ip_address}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* TAB 6: GLOBAL BUSINESS SETTINGS */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 max-w-3xl"
            >
              <div className="space-y-1">
                <h3 className="text-base font-bold">Global SaaS Platform Configurations</h3>
                <p className="text-xs text-muted-foreground">Maintain platform-wide configurations, currencies, defaults, and templates.</p>
              </div>

              <Card className="border bg-card">
                <CardContent className="p-6 space-y-6 text-xs">
                  {/* General Branding */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-primary border-b pb-1.5 flex items-center gap-1.5"><Globe className="h-4 w-4" /> Platform & General Branding</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Platform Public Name</Label>
                        <Input value={setGeneralName} onChange={e => setSetGeneralName(e.target.value)} className="h-8 bg-muted/20" />
                      </div>
                      <div className="space-y-1">
                        <Label>Company Corporate Name</Label>
                        <Input value={setCompanyName} onChange={e => setSetCompanyName(e.target.value)} className="h-8 bg-muted/20" />
                      </div>
                      <div className="space-y-1">
                        <Label>GST Registration Number (GSTIN)</Label>
                        <Input value={setGstin} onChange={e => setSetGstin(e.target.value)} className="h-8 bg-muted/20" />
                      </div>
                      <div className="space-y-1">
                        <Label>SaaS Support Phone</Label>
                        <Input value={setSupportPhone} onChange={e => setSetSupportPhone(e.target.value)} className="h-8 bg-muted/20" />
                      </div>
                      <div className="space-y-1">
                        <Label>SaaS Support Email</Label>
                        <Input type="email" value={setSupportEmail} onChange={e => setSetSupportEmail(e.target.value)} className="h-8 bg-muted/20" />
                      </div>
                      <div className="space-y-1">
                        <Label>Website Link</Label>
                        <Input value={setWebsite} onChange={e => setSetWebsite(e.target.value)} className="h-8 bg-muted/20" />
                      </div>
                    </div>
                  </div>

                  {/* Taxes, Currencies & Formats */}
                  <div className="space-y-4 pt-3 border-t">
                    <h4 className="font-bold text-primary border-b pb-1.5 flex items-center gap-1.5"><Landmark className="h-4 w-4" /> Taxes, Currencies & Formats</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label>Default Currency</Label>
                        <Select value={setCurrency} onValueChange={setSetCurrency}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                            <SelectItem value="USD">US Dollar ($)</SelectItem>
                            <SelectItem value="EUR">Euro (€)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Timezone</Label>
                        <Select value={setTimezone} onValueChange={setSetTimezone}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IST">India Standard Time (IST)</SelectItem>
                            <SelectItem value="EST">Eastern Standard Time (EST)</SelectItem>
                            <SelectItem value="GMT">Greenwich Mean Time (GMT)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Date Format</Label>
                        <Select value={setDateFormat} onValueChange={setSetDateFormat}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                            <SelectItem value="MM-DD-YYYY">MM-DD-YYYY</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Default Language</Label>
                        <Select value={setLanguage} onValueChange={setSetLanguage}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                            <SelectItem value="Spanish">Spanish</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Default GST Tax Rate (%)</Label>
                        <Input type="number" value={setTaxRate} onChange={e => setSetTaxRate(e.target.value)} className="h-8 bg-muted/20" />
                      </div>
                      <div className="space-y-1">
                        <Label>Invoice Number Prefix</Label>
                        <Input value={setInvoicePrefix} onChange={e => setSetInvoicePrefix(e.target.value)} className="h-8 bg-muted/20" />
                      </div>
                    </div>
                  </div>

                  {/* Messaging API settings */}
                  <div className="space-y-4 pt-3 border-t">
                    <h4 className="font-bold text-primary border-b pb-1.5 flex items-center gap-1.5"><Sliders className="h-4 w-4" /> SMTP Settings & Communication Gateways</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>SMTP Mail Server Host</Label>
                        <Input value={setSmtpHost} onChange={e => setSetSmtpHost(e.target.value)} className="h-8 bg-muted/20" />
                      </div>
                      <div className="space-y-1">
                        <Label>SMS Provider API Key</Label>
                        <Input value={setSmsGateway} onChange={e => setSetSmsGateway(e.target.value)} className="h-8 bg-muted/20" />
                      </div>
                      <div className="space-y-1">
                        <Label>WhatsApp Dispatch Sender</Label>
                        <Input value={setwhatsappSender} onChange={e => setSetwhatsappSender(e.target.value)} className="h-8 bg-muted/20" />
                      </div>
                      <div className="space-y-1">
                        <Label>WhatsApp Integration Status</Label>
                        <Input disabled value="Inactive (Placeholder API Config)" className="h-8 bg-muted/10 text-muted-foreground font-semibold" />
                      </div>
                    </div>
                  </div>

                  {/* Policy & Auto backup templates */}
                  <div className="space-y-4 pt-3 border-t">
                    <h4 className="font-bold text-primary border-b pb-1.5 flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Policies, Auto Backup & Maintenance</h4>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label>Platform Invoice Footer terms</Label>
                        <textarea 
                          className="w-full min-h-[50px] bg-muted/10 border rounded-xl p-2 outline-none focus:ring-1 focus:ring-primary text-xs" 
                          value={setInvoiceFooter}
                          onChange={e => setSetInvoiceFooter(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Thermal Receipt Footer note</Label>
                        <textarea 
                          className="w-full min-h-[50px] bg-muted/10 border rounded-xl p-2 outline-none focus:ring-1 focus:ring-primary text-xs" 
                          value={setReceiptFooter}
                          onChange={e => setSetReceiptFooter(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="flex items-center gap-2">
                          <Checkbox id="set-backup" checked={setAutoBackup} onCheckedChange={(checked: any) => setSetAutoBackup(!!checked)} />
                          <Label htmlFor="set-backup" className="cursor-pointer font-bold">Enable Daily Platform Auto backups</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox id="set-maint" checked={setMaintenance} onCheckedChange={(checked: any) => setSetMaintenance(!!checked)} />
                          <Label htmlFor="set-maint" className="cursor-pointer font-bold text-rose-500">Enable Maintenance Mode</Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <Button variant="gradient" size="sm" onClick={handleSaveGlobalSettings}>
                      Save Global SaaS Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* TAB 7: REPORTS & SUCCESS */}
          {activeTab === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Financial Dashboard summary card */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 text-xs">
                <Card className="border bg-card">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold">MRR / Revenue</span>
                    <h3 className="text-xl font-bold">{formatCurrency(financials.mrr)}</h3>
                    <span className="text-[8px] text-muted-foreground">ARR: {formatCurrency(financials.arr)}</span>
                  </CardContent>
                </Card>
                <Card className="border bg-card">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold">Operating Expenses</span>
                    <h3 className="text-xl font-bold text-rose-500">{formatCurrency(financials.monthExpenses)}</h3>
                    <span className="text-[8px] text-muted-foreground">Yearly: {formatCurrency(financials.yearExpenses)}</span>
                  </CardContent>
                </Card>
                <Card className="border bg-card">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold">Net Platform Profit</span>
                    <h3 className={`text-xl font-bold ${financials.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {formatCurrency(financials.netProfit)}
                    </h3>
                    <span className="text-[8px] text-muted-foreground">Margin: {financials.profitMargin}%</span>
                  </CardContent>
                </Card>
                <Card className="border bg-card">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold">Operating / Recurring Cost</span>
                    <h3 className="text-xl font-bold text-rose-500">{formatCurrency(financials.operatingCost)}</h3>
                    <span className="text-[8px] text-muted-foreground">Recurring: {formatCurrency(financials.recurringCost)}</span>
                  </CardContent>
                </Card>
                <Card className="border bg-card">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold">GST Collected Summary</span>
                    <h3 className="text-xl font-bold text-primary">{formatCurrency(financials.gstCollected)}</h3>
                    <span className="text-[8px] text-muted-foreground">Rate: {globalSettings.tax_rate}%</span>
                  </CardContent>
                </Card>
              </div>

              {/* Infrastructure Expense Manager */}
              <Card>
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Server className="h-4 w-4 text-rose-500" /> Infrastructure Expense Manager</CardTitle>
                    <CardDescription className="text-xs">Platform hosting, developer cost, and third party APIs expenses registries.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={expMonth} onValueChange={setExpMonth}>
                      <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>Month {i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={expYear} onValueChange={setExpYear}>
                      <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2026">2026</SelectItem>
                        <SelectItem value="2027">2027</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold" onClick={() => handleOpenExpenseModal('create')}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Log Expense
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-muted/30 border-b text-muted-foreground font-semibold uppercase text-[9px]">
                        <tr>
                          <th className="p-3">Month/Year</th>
                          <th className="p-3">Hosting (Vercel)</th>
                          <th className="p-3">Supabase</th>
                          <th className="p-3">Developer Cost</th>
                          <th className="p-3">SMS Gateways</th>
                          <th className="p-3">Payment Fees</th>
                          <th className="p-3">Misc</th>
                          <th className="p-3">Notes</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {expenses.filter(e => e.month === expMonth && e.year === expYear).map((e, idx) => (
                          <tr key={e.id || idx} className="hover:bg-muted/10 transition-colors">
                            <td className="p-3 font-semibold text-primary">M{e.month} - {e.year}</td>
                            <td className="p-3">{formatCurrency(e.hosting_cost)}</td>
                            <td className="p-3">{formatCurrency(e.supabase_cost)}</td>
                            <td className="p-3">{formatCurrency(e.developer_cost)}</td>
                            <td className="p-3">{formatCurrency(e.sms_provider_cost)}</td>
                            <td className="p-3">{formatCurrency(e.payment_gateway_fees)}</td>
                            <td className="p-3">{formatCurrency(e.misc_cost)}</td>
                            <td className="p-3 text-muted-foreground truncate max-w-xs">{e.notes || '—'}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => handleOpenExpenseModal(e)}>Edit</Button>
                                <Button size="sm" variant="outline" className="h-7 text-[10px] text-rose-500" onClick={() => handleDeleteExpense(e.id)}>Delete</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {expenses.filter(e => e.month === expMonth && e.year === expYear).length === 0 && (
                          <tr>
                            <td colSpan={9} className="p-8 text-center text-muted-foreground font-semibold">
                              No expense records registered for Month {expMonth}/{expYear}.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Reports Download Panel */}
              <Card>
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-bold">Download Platform Reports Logs</CardTitle>
                  <CardDescription className="text-xs">Generate and save P&L, Subscription, and Tenant analytical reports.</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="border p-4 rounded-2xl hover:bg-muted/10 transition-colors flex flex-col justify-between items-center h-28">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Revenue & Expense P&L reports</span>
                      <Button size="sm" variant="gradient" className="h-7 w-full font-semibold" onClick={handleExportCSV}>Download CSV</Button>
                    </div>
                    <div className="border p-4 rounded-2xl hover:bg-muted/10 transition-colors flex flex-col justify-between items-center h-28">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Subscription Plan Performance</span>
                      <Button size="sm" variant="gradient" className="h-7 w-full font-semibold" onClick={handleExportCSV}>Download Excel</Button>
                    </div>
                    <div className="border p-4 rounded-2xl hover:bg-muted/10 transition-colors flex flex-col justify-between items-center h-28">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Tenant Spread & Churn Report</span>
                      <Button size="sm" variant="gradient" className="h-7 w-full font-semibold" onClick={handleExportCSV}>Download PDF</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ========================================================
          MODALS & DIALOGS
          ======================================================== */}

      {/* CREATE TENANT MODAL */}
      <Dialog open={showCreateModal} onOpenChange={(open) => !open && setShowCreateModal(false)}>
        <DialogContent className="max-w-md text-left text-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5"><Building2 className="h-5 w-5 text-primary" /> Create New Tenant Workspace</DialogTitle>
            <DialogDescription>Setup and pre-seed databases and subscription limits for a new salon tenant.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div className="space-y-1">
              <Label>Salon Name</Label>
              <Input placeholder="e.g. Blossom Hair Boutique" value={newName} onChange={e => setNewName(e.target.value)} className="h-8 bg-card" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Owner Name</Label>
                <Input placeholder="e.g. Ramesh Dev" value={newOwnerName} onChange={e => setNewOwnerName(e.target.value)} className="h-8 bg-card" />
              </div>
              <div className="space-y-1">
                <Label>Owner Email</Label>
                <Input type="email" placeholder="e.g. owner@blossom.in" value={newOwnerEmail} onChange={e => setNewOwnerEmail(e.target.value)} className="h-8 bg-card" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Subscription Plan</Label>
                <Select value={newPlan} onValueChange={setNewPlan}>
                  <SelectTrigger className="h-8 bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Free">Free Trial</SelectItem>
                    <SelectItem value="Starter">Starter</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Monthly MRR (INR)</Label>
                <Input type="number" value={newMrr} onChange={e => setNewMrr(Number(e.target.value))} className="h-8 bg-card" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="gradient" size="sm" onClick={handleCreateTenant}>Configure Tenant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT LIMITS MODAL */}
      <Dialog open={!!showEditModal} onOpenChange={(open) => !open && setShowEditModal(null)}>
        <DialogContent className="max-w-md text-left text-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5"><Settings className="h-5 w-5 text-primary" /> Configure Subscription Limits</DialogTitle>
            <DialogDescription>Adjust limits quotas and allowed modules for {showEditModal?.name}.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Max Staff Limit</Label>
                <Input type="number" value={limitsStaff} onChange={e => setLimitsStaff(Number(e.target.value))} className="h-8 bg-card" />
              </div>
              <div className="space-y-1">
                <Label>Max Branch Limit</Label>
                <Input type="number" value={limitsBranches} onChange={e => setLimitsBranches(Number(e.target.value))} className="h-8 bg-card" />
              </div>
            </div>

            <div className="space-y-2 border-t pt-3">
              <Label className="text-muted-foreground uppercase font-bold text-[9px] block mb-1">Toggle Features Allowed</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="e-ai" checked={flagAI} onCheckedChange={(c: any) => setFlagAI(!!c)} />
                  <Label htmlFor="e-ai" className="cursor-pointer">AI Copilot Assistant</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="e-mkt" checked={flagMarketing} onCheckedChange={(c: any) => setFlagMarketing(!!c)} />
                  <Label htmlFor="e-mkt" className="cursor-pointer">Marketing Broadcasts</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="e-inv" checked={flagInventory} onCheckedChange={(c: any) => setFlagInventory(!!c)} />
                  <Label htmlFor="e-inv" className="cursor-pointer">Inventory Catalog</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="e-ptl" checked={flagPortal} onCheckedChange={(c: any) => setFlagPortal(!!c)} />
                  <Label htmlFor="e-ptl" className="cursor-pointer">Customer Web Portal</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowEditModal(null)}>Cancel</Button>
            <Button variant="gradient" size="sm" onClick={handleSaveLimits}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ANNOUNCEMENT MODAL */}
      <Dialog open={showAnnouncementModal} onOpenChange={(open) => !open && setShowAnnouncementModal(false)}>
        <DialogContent className="max-w-md text-left text-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5"><MessageSquare className="h-5 w-5 text-primary" /> Send Platform Announcement</DialogTitle>
            <DialogDescription>Broadcast system announcement alerts to all registered salon owners.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div className="space-y-1">
              <Label>Announcement Subject</Label>
              <Input placeholder="e.g. Schedule Maintenance Notice" value={announcementSubject} onChange={e => setAnnouncementSubject(e.target.value)} className="h-8 bg-card" />
            </div>
            <div className="space-y-1">
              <Label>Message Body</Label>
              <textarea 
                className="w-full min-h-[100px] bg-card border rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-primary text-xs"
                placeholder="Type platform announcement details here..."
                value={announcementBody}
                onChange={e => setAnnouncementBody(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAnnouncementModal(false)}>Cancel</Button>
            <Button variant="gradient" size="sm" onClick={handleAnnouncement}>Broadcast Announcement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PASSWORD RESET MODAL */}
      <Dialog open={showPasswordModal.isOpen} onOpenChange={(open) => !open && setShowPasswordModal(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent className="max-w-sm text-center text-xs">
          <DialogHeader>
            <DialogTitle className="text-center font-bold">Temporary Password Generated</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-muted-foreground text-xs">
              Temporary password credential for <strong>{showPasswordModal.tenantName}</strong> owner account:
            </p>
            <div className="p-3 bg-muted border rounded-xl font-mono text-base font-bold text-primary select-all">
              {showPasswordModal.pass}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Provide this key to the owner. They will be prompted to reset it upon login.
            </p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button variant="outline" size="sm" className="w-full" onClick={() => setShowPasswordModal(prev => ({ ...prev, isOpen: false }))}>
              Close Credential view
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FACTORY RESET CONFIRMATION MODAL */}
      <Dialog open={showResetConfirm} onOpenChange={(open) => !open && setShowResetConfirm(false)}>
        <DialogContent className="max-w-md text-left text-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 text-rose-500"><AlertTriangle className="h-5 w-5" /> Critical Action: Factory Reset</DialogTitle>
            <DialogDescription className="text-rose-500/80">
              This action is destructive and can NOT be undone. It wipes all database records (salons, users, logs, expenses) and restores initial default setups.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-3">
            <p className="text-muted-foreground">
              To proceed, please type the word <strong className="text-foreground">RESET</strong> in the confirmation box below:
            </p>
            <Input 
              placeholder="Type RESET here..." 
              value={resetConfirmInput} 
              onChange={e => setResetConfirmInput(e.target.value)} 
              className="h-9 bg-card border-rose-500/30 focus:border-rose-500"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowResetConfirm(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleFactoryReset}>
              Execute Factory Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PRICING PLAN MODAL (CREATE / EDIT) */}
      <Dialog open={!!showPlanModal} onOpenChange={(open) => !open && setShowPlanModal(null)}>
        <DialogContent className="max-w-md text-left text-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5"><Layers className="h-5 w-5 text-primary" /> {showPlanModal === 'create' ? 'Create Subscription Plan' : 'Edit Plan Details'}</DialogTitle>
            <DialogDescription>Modify pricing structure and feature quotas constraints.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div className="space-y-1">
              <Label>Plan Name</Label>
              <Input placeholder="e.g. Starter Plan" value={planName} onChange={e => setPlanName(e.target.value)} className="h-8 bg-card" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Monthly Price</Label>
                <Input type="number" value={planPriceMonthly} onChange={e => setPlanPriceMonthly(Number(e.target.value))} className="h-8 bg-card" />
              </div>
              <div className="space-y-1">
                <Label>Yearly Price</Label>
                <Input type="number" value={planPriceYearly} onChange={e => setPlanPriceYearly(Number(e.target.value))} className="h-8 bg-card" />
              </div>
              <div className="space-y-1">
                <Label>Staff Limit</Label>
                <Input type="number" value={planStaffLimit} onChange={e => setPlanStaffLimit(Number(e.target.value))} className="h-8 bg-card" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Branch Limit</Label>
                <Input type="number" value={planBranchLimit} onChange={e => setPlanBranchLimit(Number(e.target.value))} className="h-8 bg-card" />
              </div>
              <div className="space-y-1">
                <Label>Storage (GB)</Label>
                <Input type="number" value={planStorageLimit} onChange={e => setPlanStorageLimit(Number(e.target.value))} className="h-8 bg-card" />
              </div>
              <div className="space-y-1">
                <Label>AI Credits</Label>
                <Input type="number" value={planAiCredits} onChange={e => setPlanAiCredits(Number(e.target.value))} className="h-8 bg-card" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>SMS Credits Limit</Label>
                <Input type="number" value={planSmsCredits} onChange={e => setPlanSmsCredits(Number(e.target.value))} className="h-8 bg-card" />
              </div>
              <div className="space-y-1">
                <Label>WhatsApp Credits Limit</Label>
                <Input type="number" value={planWhatsappCredits} onChange={e => setPlanWhatsappCredits(Number(e.target.value))} className="h-8 bg-card" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowPlanModal(null)}>Cancel</Button>
            <Button variant="gradient" size="sm" onClick={handleSavePlan}>Save Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* COUPON CREATION MODAL */}
      <Dialog open={!!showCouponModal} onOpenChange={(open) => !open && setShowCouponModal(null)}>
        <DialogContent className="max-w-md text-left text-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5"><Tag className="h-5 w-5 text-primary" /> {showCouponModal === 'create' ? 'Create Coupon' : 'Edit Coupon Details'}</DialogTitle>
            <DialogDescription>Add or edit a promotional discount promo code.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Coupon Code</Label>
                <Input placeholder="e.g. SUMMER30" value={coupCode} onChange={e => setCoupCode(e.target.value)} className="h-8 bg-card font-mono" />
              </div>
              <div className="space-y-1">
                <Label>Discount Value</Label>
                <Input type="number" value={coupDiscount} onChange={e => setCoupDiscount(Number(e.target.value))} className="h-8 bg-card" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Discount Type</Label>
                <Select value={coupType} onValueChange={(val: any) => setCoupType(val)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Flat Value (INR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Maximum Usage Limit</Label>
                <Input type="number" value={coupLimit} onChange={e => setCoupLimit(Number(e.target.value))} className="h-8 bg-card" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Start Date</Label>
                <Input type="date" value={coupStart} onChange={e => setCoupStart(e.target.value)} className="h-8 bg-card" />
              </div>
              <div className="space-y-1">
                <Label>Expiry End Date</Label>
                <Input type="date" value={coupEnd} onChange={e => setCoupEnd(e.target.value)} className="h-8 bg-card" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCouponModal(null)}>Cancel</Button>
            <Button variant="gradient" size="sm" onClick={handleSaveCoupon}>Configure Coupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EXPENSE LOGGING DIALOG MODAL */}
      <Dialog open={!!showExpenseModal} onOpenChange={(open) => !open && setShowExpenseModal(null)}>
        <DialogContent className="max-w-md text-left text-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5"><Server className="h-5 w-5 text-primary" /> {showExpenseModal === 'create' ? 'Log Platform Expense' : 'Edit Infrastructure Cost'}</DialogTitle>
            <DialogDescription>Maintain exact hardware, database, API gateway, and developer cost details.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Expense Month</Label>
                <Select value={expMonth} onValueChange={setExpMonth}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>Month {i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Expense Year</Label>
                <Select value={expYear} onValueChange={setExpYear}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Vercel Hosting</Label>
                <Input type="number" value={expHosting} onChange={e => setExpHosting(Number(e.target.value))} className="h-8 bg-card" />
              </div>
              <div className="space-y-1">
                <Label>Supabase</Label>
                <Input type="number" value={expSupabase} onChange={e => setExpSupabase(Number(e.target.value))} className="h-8 bg-card" />
              </div>
              <div className="space-y-1">
                <Label>Database</Label>
                <Input type="number" value={expDatabase} onChange={e => setExpDatabase(Number(e.target.value))} className="h-8 bg-card" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Storage Cost</Label>
                <Input type="number" value={expStorage} onChange={e => setExpStorage(Number(e.target.value))} className="h-8 bg-card" />
              </div>
              <div className="space-y-1">
                <Label>Email APIs</Label>
                <Input type="number" value={expEmail} onChange={e => setExpEmail(Number(e.target.value))} className="h-8 bg-card" />
              </div>
              <div className="space-y-1">
                <Label>SMS Gateways</Label>
                <Input type="number" value={expSms} onChange={e => setExpSms(Number(e.target.value))} className="h-8 bg-card" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Stripe Fees</Label>
                <Input type="number" value={expGateway} onChange={e => setExpGateway(Number(e.target.value))} className="h-8 bg-card" />
              </div>
              <div className="space-y-1">
                <Label>Developers</Label>
                <Input type="number" value={expDeveloper} onChange={e => setExpDeveloper(Number(e.target.value))} className="h-8 bg-card" />
              </div>
              <div className="space-y-1">
                <Label>Marketing Cost</Label>
                <Input type="number" value={expMarketing} onChange={e => setExpMarketing(Number(e.target.value))} className="h-8 bg-card" />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Miscellaneous Overhead</Label>
              <Input type="number" value={expMisc} onChange={e => setExpMisc(Number(e.target.value))} className="h-8 bg-card" />
            </div>

            <div className="space-y-1">
              <Label>Description Notes</Label>
              <textarea 
                className="w-full min-h-[50px] bg-card border rounded-xl p-2 outline-none focus:ring-1 focus:ring-primary text-xs" 
                value={expNotes} 
                onChange={e => setExpNotes(e.target.value)}
                placeholder="Log notes about hardware or licensing overheads..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowExpenseModal(null)}>Cancel</Button>
            <Button variant="gradient" size="sm" onClick={handleSaveExpense}>Log Cost</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

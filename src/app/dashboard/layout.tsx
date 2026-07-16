'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, ChevronLeft, ChevronRight as ChevRight, LogOut, Settings, User, Menu, ShieldAlert, CreditCard, Sparkles, UserCheck, Calendar, Receipt, ShoppingBag, Star, FileText, Printer, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Logo } from '@/components/shared/logo'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { DASHBOARD_NAV_GROUPS } from '@/lib/constants'
import { cn, getInitials, formatCurrency } from '@/lib/utils'
import { useAuth } from '@/lib/auth/auth-context'
import { CustomerRepository, AppointmentRepository, InvoiceRepository, ProductRepository, StaffRepository } from '@/lib/repositories/repositories'
import { POSCheckoutModal } from '@/components/shared/pos-checkout-modal'
import { AppointmentWizard } from '@/components/shared/appointment-wizard'

import { SettingsProvider, useSettings } from '@/lib/contexts/settings-context'

const permissionKeys: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/dashboard/appointments': 'appointments',
  '/dashboard/customers': 'customers',
  '/dashboard/services': 'services',
  '/dashboard/staff': 'staff_management',
  '/dashboard/billing': 'billing',
  '/dashboard/inventory': 'inventory',
  '/dashboard/marketing': 'marketing',
  '/dashboard/reports': 'reports',
  '/dashboard/ai-assistant': 'dashboard',
  '/dashboard/settings': 'settings',
}

const getPermNeeded = (href: string) => {
  const baseHref = href.split('?')[0]
  return permissionKeys[baseHref] || 'dashboard'
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, role, tenant, permissions, loading, logout } = useAuth()
  const { settings } = useSettings()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Direct modal trigger states
  const [showPOS, setShowPOS] = useState(false)
  const [showNewApt, setShowNewApt] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)

  // Universal Search states
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any>({
    customers: [],
    appointments: [],
    invoices: [],
    staff: [],
    products: []
  })

  // Keyboard shortcut Command+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Listen for global modal open events
  useEffect(() => {
    const handleOpenPOS = () => setShowPOS(true)
    const handleOpenApt = () => setShowNewApt(true)
    window.addEventListener('open-global-pos', handleOpenPOS)
    window.addEventListener('open-global-booking', handleOpenApt)
    return () => {
      window.removeEventListener('open-global-pos', handleOpenPOS)
      window.removeEventListener('open-global-booking', handleOpenApt)
    }
  }, [])

  // Trigger search on query change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ customers: [], appointments: [], invoices: [], staff: [], products: [] })
      return
    }
    
    const fetchSearch = async () => {
      try {
        const tenantId = tenant?.id || 'demo-tenant-001'
        const [allCustomers, allAppointments, allInvoices, allStaff, allProducts] = await Promise.all([
          CustomerRepository.list(tenantId),
          AppointmentRepository.list(tenantId),
          InvoiceRepository.list(tenantId),
          StaffRepository.list(tenantId),
          ProductRepository.list(tenantId)
        ])
        
        const q = searchQuery.toLowerCase().trim()
        
        const customers = allCustomers.filter(c => 
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q))
        ).slice(0, 3)

        const appointments = allAppointments.filter(a => 
          a.customer_name.toLowerCase().includes(q) || 
          a.staff_name.toLowerCase().includes(q) ||
          a.service_name.toLowerCase().includes(q)
        ).slice(0, 3)

        const invoices = allInvoices.filter(i => 
          i.invoice_number.toLowerCase().includes(q) || 
          i.customer_name.toLowerCase().includes(q)
        ).slice(0, 3)

        const staff = allStaff.filter(s => 
          `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
          s.role.toLowerCase().includes(q)
        ).slice(0, 3)

        const products = allProducts.filter(p => 
          p.name.toLowerCase().includes(q) || 
          (p.sku && p.sku.toLowerCase().includes(q))
        ).slice(0, 3)

        setSearchResults({ customers, appointments, invoices, staff, products })
      } catch (e) {
        console.error('Search query error:', e)
      }
    }

    const timer = setTimeout(fetchSearch, 150)
    return () => clearTimeout(timer)
  }, [searchQuery, tenant])

  // Redirect if user has no permission for current route
  useEffect(() => {
    if (loading) return
    const routeKey = Object.keys(permissionKeys).find(k => pathname === k || pathname.startsWith(k + '/'))
    if (routeKey) {
      const permissionNeeded = permissionKeys[routeKey]
      if (permissions && !permissions[permissionNeeded]) {
        // Find first permitted page
        let foundHref = '/dashboard'
        for (const g of DASHBOARD_NAV_GROUPS) {
          const permitted = g.items.find(item => permissions[getPermNeeded(item.href)])
          if (permitted) {
            foundHref = permitted.href
            break
          }
        }
        router.push(foundHref)
      }
    }
  }, [pathname, permissions, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoaderSpinner />
      </div>
    )
  }

  const currentRouteKey = Object.keys(permissionKeys).find(k => pathname === k || pathname.startsWith(k + '/'))
  const isAuthorized = currentRouteKey ? permissions[permissionKeys[currentRouteKey]] : true

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card">
      <div className={cn('flex items-center px-4 h-16 shrink-0', collapsed ? 'justify-center' : 'gap-3')}>
        {logo ? (
          <img src={logo} alt="Logo" className={cn("rounded-lg object-cover h-8", collapsed ? "w-8" : "w-auto")} />
        ) : (
          <Logo size="sm" showText={!collapsed} />
        )}
      </div>
      <Separator />
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-4">
          {DASHBOARD_NAV_GROUPS.map((group) => {
            const permittedItems = group.items.filter(item => {
              const permKey = getPermNeeded(item.href)
              return permissions && permissions[permKey]
            })

            if (permittedItems.length === 0) return null

            return (
              <div key={group.group} className="space-y-1">
                {!collapsed && (
                  <h3 className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-1.5 text-left">
                    {group.group}
                  </h3>
                )}
                {permittedItems.map(item => {
                  const isActive = pathname === item.href.split('?')[0] || (item.href !== '/dashboard' && pathname.startsWith(item.href.split('?')[0]))
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                      <div className={cn('sidebar-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer hover:bg-muted/50 text-muted-foreground hover:text-foreground', isActive && 'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary font-semibold', collapsed && 'justify-center px-2')}>
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>
      </ScrollArea>
      <Separator />
      <div className={cn('p-3', collapsed && 'flex justify-center')}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-item w-full justify-center flex items-center px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl"
        >
          {collapsed ? <ChevRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span className="ml-2 text-sm font-medium">Collapse</span></>}
        </button>
      </div>
    </div>
  )

  const initials = user ? getInitials(user.first_name, user.last_name) : 'US'
  const fullName = user ? `${user.first_name} ${user.last_name}` : 'Salon User'
  const salonName = settings.name || 'Salon Operating System'
  const logo = settings.logo

  // Memoize Sidebar components to prevent re-renders on layout content changes
  const sidebarComponent = useMemo(() => (
    <SidebarContent />
  ), [collapsed, pathname, logo, permissions])

  // Memoize Header component to prevent top-bar reconstruction
  const headerComponent = useMemo(() => (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-3 flex-1">
          <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Universal Search Trigger */}
          <div 
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 bg-muted hover:bg-muted/70 cursor-pointer rounded-xl px-3 py-1.5 w-64 transition-colors"
          >
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground select-none text-left flex-1">Search... (⌘K)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* One-Click POS Action */}
          {permissions?.billing && (
            <Button onClick={() => setShowPOS(true)} size="sm" variant="gradient" className="h-9 px-4 rounded-xl flex items-center gap-1.5 font-semibold text-xs shadow-sm">
              <CreditCard className="h-3.5 w-3.5" />
              Open POS
            </Button>
          )}

          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">3</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <span className="text-sm font-medium">New Online Booking</span>
                <span className="text-xs text-muted-foreground">Priya Sharma booked Haircut for 9:00 AM</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <span className="text-sm font-medium">Low Stock Alert</span>
                <span className="text-xs text-muted-foreground">OPI Nail Polish Set below minimum</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <span className="text-sm font-medium">Payment Received</span>
                <span className="text-xs text-muted-foreground">₹7,080 from Priya Sharma</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-8 mx-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 hover:bg-accent rounded-xl px-2 py-1.5 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium">{fullName}</div>
                  <div className="text-[10px] text-muted-foreground">{salonName}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
              <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-rose-500 focus:text-rose-500 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  ), [initials, fullName, salonName, permissions, logout])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <motion.aside
        className="fixed left-0 top-0 bottom-0 z-40 bg-card border-r border-border hidden lg:block"
        animate={{ width: collapsed ? 72 : 280 }}
        transition={{ duration: 0.2 }}
      >
        {sidebarComponent}
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[280px] bg-card border-r border-border lg:hidden"
            >
              {sidebarComponent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={cn('transition-all duration-200', collapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]')}>
        {headerComponent}

        {/* Universal Search Dialog Modal */}
        <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden bg-card border border-border rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search customers, appointments, invoices, products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-0 border-none outline-none focus:ring-0 p-0 text-base flex-1 shadow-none focus-visible:ring-0"
                autoFocus
              />
              <kbd className="hidden sm:inline-flex select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            </div>
            
            <ScrollArea className="max-h-[60vh] p-4">
              {!searchQuery ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary opacity-60" />
                  Type to search across everything in your Salon Operating System
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Customers Results */}
                  {searchResults.customers.length > 0 && (
                    <div className="space-y-1.5 text-left">
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 flex items-center gap-1"><UserCheck className="h-3 w-3" /> Customers</h4>
                      {searchResults.customers.map((c: any) => (
                        <div key={c.id} onClick={() => { setSearchOpen(false); router.push(`/dashboard/customers?search=${c.first_name}`) }} className="flex justify-between items-center p-2.5 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors">
                          <div>
                            <div className="font-semibold text-sm">{c.first_name} {c.last_name}</div>
                            <div className="text-xs text-muted-foreground">{c.phone} | {c.email}</div>
                          </div>
                          <Badge variant="outline" className="text-[9px]">Points: {c.loyalty_points}</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Appointments Results */}
                  {searchResults.appointments.length > 0 && (
                    <div className="space-y-1.5 text-left">
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 flex items-center gap-1"><Calendar className="h-3 w-3" /> Appointments</h4>
                      {searchResults.appointments.map((a: any) => (
                        <div key={a.id} onClick={() => { setSearchOpen(false); router.push('/dashboard/appointments') }} className="flex justify-between items-center p-2.5 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors">
                          <div>
                            <div className="font-semibold text-sm">{a.customer_name} ({a.service_name})</div>
                            <div className="text-xs text-muted-foreground">Stylist: {a.staff_name} | {a.time}</div>
                          </div>
                          <Badge variant="outline" className="text-[9px] uppercase">{a.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Invoices Results */}
                  {searchResults.invoices.length > 0 && (
                    <div className="space-y-1.5 text-left">
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 flex items-center gap-1"><Receipt className="h-3 w-3" /> Invoices</h4>
                      {searchResults.invoices.map((i: any) => (
                        <div key={i.id} onClick={() => { setSearchOpen(false); router.push('/dashboard/billing') }} className="flex justify-between items-center p-2.5 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors">
                          <div>
                            <div className="font-semibold text-sm">{i.invoice_number} - {i.customer_name}</div>
                            <div className="text-xs text-muted-foreground">Settlement: {i.payment_method} | Status: {i.status}</div>
                          </div>
                          <span className="font-bold text-sm">{formatCurrency(i.total_amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Products Results */}
                  {searchResults.products.length > 0 && (
                    <div className="space-y-1.5 text-left">
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 flex items-center gap-1"><ShoppingBag className="h-3 w-3" /> Inventory Products</h4>
                      {searchResults.products.map((p: any) => (
                        <div key={p.id} onClick={() => { setSearchOpen(false); router.push('/dashboard/inventory') }} className="flex justify-between items-center p-2.5 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors">
                          <div>
                            <div className="font-semibold text-sm">{p.name}</div>
                            <div className="text-xs text-muted-foreground">SKU: {p.sku} | Price: {formatCurrency(p.price)}</div>
                          </div>
                          <Badge variant={p.stock_quantity <= p.min_stock_level ? 'destructive' : 'outline'} className="text-[9px]">Stock: {p.stock_quantity}</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Zero Results fallback */}
                  {searchResults.customers.length === 0 && searchResults.appointments.length === 0 && searchResults.invoices.length === 0 && searchResults.staff.length === 0 && searchResults.products.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No matching records found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {isAuthorized ? (
            children
          ) : (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">Access Prohibited</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Your account role does not have authorization to view this dashboard section.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Globally Mounted Modals */}
      <POSCheckoutModal isOpen={showPOS} onClose={() => setShowPOS(false)} onSuccess={() => { router.refresh(); }} />
      <AppointmentWizard isOpen={showNewApt} onClose={() => setShowNewApt(false)} onSuccess={() => { router.refresh(); }} />

      {/* ========================================================
          FLOATING QUICK ACTIONS DIAL (ALL ROLES)
          ======================================================== */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {showQuickActions && (
            <motion.div 
              initial={{ opacity: 0, y: 15, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 15, scale: 0.95 }} 
              className="bg-card border border-border p-4 rounded-3xl shadow-2xl w-56 space-y-2 text-left mb-2"
            >
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block px-1 mb-1.5 font-sans">Quick Actions</span>
              
              {/* Owner actions */}
              {role === 'salon_owner' && (
                <>
                  <div onClick={() => { setShowNewApt(true); setShowQuickActions(false); }} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-xl cursor-pointer text-xs font-semibold"><Calendar className="h-4 w-4 text-violet-500" /> New Booking</div>
                  <div onClick={() => { setShowPOS(true); setShowQuickActions(false); }} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-xl cursor-pointer text-xs font-semibold"><CreditCard className="h-4 w-4 text-emerald-500" /> POS Checkout</div>
                  <Link href="/dashboard/inventory" onClick={() => setShowQuickActions(false)}><div className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-xl cursor-pointer text-xs font-semibold"><ShoppingBag className="h-4 w-4 text-amber-500" /> View Inventory</div></Link>
                  <Link href="/dashboard/reports" onClick={() => setShowQuickActions(false)}><div className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-xl cursor-pointer text-xs font-semibold"><FileText className="h-4 w-4 text-blue-500" /> View Reports</div></Link>
                </>
              )}

              {/* Receptionist actions */}
              {role === 'receptionist' && (
                <>
                  <div onClick={() => { setShowNewApt(true); setShowQuickActions(false); }} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-xl cursor-pointer text-xs font-semibold"><Plus className="h-4 w-4 text-violet-500" /> Walk In Booking</div>
                  <div onClick={() => { setShowNewApt(true); setShowQuickActions(false); }} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-xl cursor-pointer text-xs font-semibold"><Calendar className="h-4 w-4 text-violet-500" /> New Booking</div>
                  <div onClick={() => { setShowPOS(true); setShowQuickActions(false); }} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-xl cursor-pointer text-xs font-semibold"><CreditCard className="h-4 w-4 text-emerald-500" /> POS Checkout</div>
                  <Link href="/dashboard/customers?tab=memberships" onClick={() => setShowQuickActions(false)}><div className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-xl cursor-pointer text-xs font-semibold"><Star className="h-4 w-4 text-pink-500" /> Membership</div></Link>
                  <Link href="/dashboard/billing" onClick={() => setShowQuickActions(false)}><div className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-xl cursor-pointer text-xs font-semibold"><Printer className="h-4 w-4 text-gray-500" /> Print Receipt</div></Link>
                </>
              )}

              {/* Worker actions */}
              {(role === 'stylist' || role === 'beautician' || role === 'staff') && (
                <>
                  <div onClick={() => { alert('Clock In Attendance logged.'); setShowQuickActions(false); }} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-xl cursor-pointer text-xs font-semibold"><UserCheck className="h-4 w-4 text-violet-500" /> Check In Attendance</div>
                  <Link href="/dashboard/appointments" onClick={() => setShowQuickActions(false)}><div className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-xl cursor-pointer text-xs font-semibold"><Calendar className="h-4 w-4 text-emerald-500" /> My Schedule</div></Link>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button size="icon" className="h-12 w-12 rounded-full shadow-2xl hover:scale-105 transition-transform" onClick={() => setShowQuickActions(!showQuickActions)}>
          <Plus className={`h-6 w-6 transition-transform duration-200 ${showQuickActions ? 'rotate-45' : ''}`} />
        </Button>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SettingsProvider>
  )
}

function LoaderSpinner() {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
      />
      <span className="text-xs font-semibold text-muted-foreground animate-pulse">Loading Platform Workspace...</span>
    </div>
  )
}


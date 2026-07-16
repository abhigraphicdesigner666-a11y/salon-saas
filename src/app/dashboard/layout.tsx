'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, ChevronLeft, ChevronRight as ChevRight, LogOut, Settings, User, Menu, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Logo } from '@/components/shared/logo'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { DASHBOARD_NAV } from '@/lib/constants'
import { cn, getInitials } from '@/lib/utils'
import { useAuth } from '@/lib/auth/auth-context'

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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, tenant, permissions, loading, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Redirect if user has no permission for current route
  useEffect(() => {
    if (loading) return
    const routeKey = Object.keys(permissionKeys).find(k => pathname === k || pathname.startsWith(k + '/'))
    if (routeKey) {
      const permissionNeeded = permissionKeys[routeKey]
      if (permissions && !permissions[permissionNeeded]) {
        // Find first permitted page
        const firstPermitted = DASHBOARD_NAV.find(item => {
          const perm = permissionKeys[item.href]
          return permissions[perm]
        })
        if (firstPermitted) {
          router.push(firstPermitted.href)
        } else {
          logout()
        }
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

  // Check if user is authorized for current path
  const currentRouteKey = Object.keys(permissionKeys).find(k => pathname === k || pathname.startsWith(k + '/'))
  const isAuthorized = currentRouteKey ? permissions[permissionKeys[currentRouteKey]] : true

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={cn('flex items-center px-4 h-16 shrink-0', collapsed ? 'justify-center' : 'gap-3')}>
        <Logo size="sm" showText={!collapsed} />
      </div>
      <Separator />
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {DASHBOARD_NAV.map((item) => {
            const permKey = permissionKeys[item.href]
            const isPermitted = permissions && permissions[permKey]

            if (!isPermitted) return null

            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                <div className={cn('sidebar-item', isActive && 'sidebar-item-active', collapsed && 'justify-center px-2')}>
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.label === 'AI Assistant' && (
                    <Badge variant="info" className="ml-auto text-[10px] px-1.5">AI</Badge>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
      <Separator />
      <div className={cn('p-3', collapsed && 'flex justify-center')}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-item w-full justify-center"
        >
          {collapsed ? <ChevRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span className="ml-2">Collapse</span></>}
        </button>
      </div>
    </div>
  )

  const initials = user ? getInitials(user.first_name, user.last_name) : 'US'
  const fullName = user ? `${user.first_name} ${user.last_name}` : 'Salon User'
  const salonName = tenant ? tenant.name : 'SalonAI space'

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <motion.aside
        className="fixed left-0 top-0 bottom-0 z-40 bg-card border-r border-border hidden lg:block"
        animate={{ width: collapsed ? 72 : 280 }}
        transition={{ duration: 0.2 }}
      >
        <SidebarContent />
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
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={cn('transition-all duration-200', collapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]')}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden sm:flex items-center gap-2 bg-muted rounded-xl px-3 py-1.5 w-64">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input placeholder="Search... (⌘K)" className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground" />
              </div>
            </div>

            <div className="flex items-center gap-2">
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
    </div>
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


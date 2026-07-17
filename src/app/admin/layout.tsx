'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, Building2, CreditCard, Shield, Settings, Menu, ShieldAlert, LogOut, Layers, Tag, Landmark } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/shared/logo'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { useAuth } from '@/lib/auth/auth-context'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const getActiveTab = () => {
        const params = new URLSearchParams(window.location.search)
        return params.get('tab') || 'overview'
      }
      setActiveTab(getActiveTab())
      
      const handleLocationChange = () => {
        setActiveTab(getActiveTab())
      }
      window.addEventListener('popstate', handleLocationChange)
      return () => window.removeEventListener('popstate', handleLocationChange)
    }
  }, [])

  const navItems = [
    { label: 'Command Center', href: '/admin?tab=overview', icon: BarChart3 },
    { label: 'Pricing Plans', href: '/admin?tab=plans', icon: Layers },
    { label: 'Coupon Center', href: '/admin?tab=coupons', icon: Tag },
    { label: 'Tenants Directory', href: '/admin?tab=tenants', icon: Building2 },
    { label: 'Platform & Security', href: '/admin?tab=health', icon: Shield },
    { label: 'Business Settings', href: '/admin?tab=settings', icon: Settings },
    { label: 'Reports & Success', href: '/admin?tab=success', icon: Landmark },
  ]

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar Panel */}
      <aside className={`border-r bg-card flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        <div className="h-16 flex items-center px-4 shrink-0 justify-between">
          {!collapsed && <span className="font-bold text-sm text-primary flex items-center gap-1.5"><ShieldAlert className="h-4 w-4" /> SuperAdmin</span>}
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCollapsed(!collapsed)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <Separator />

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(item => {
            const itemTab = new URLSearchParams(item.href.split('?')[1] || '').get('tab') || 'overview'
            const isActive = activeTab === itemTab
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-xs font-semibold ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'} ${collapsed && 'justify-center'}`}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </div>
              </Link>
            )
          })}
        </nav>

        <Separator />
        <div className="p-4 flex flex-col gap-2">
          <div className={`flex items-center gap-2 ${collapsed && 'justify-center'}`}>
            <ThemeToggle />
            {!collapsed && <span className="text-[10px] text-muted-foreground uppercase font-bold">Theme</span>}
          </div>
          <Button variant="ghost" size="sm" className={`h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 justify-start text-xs ${collapsed && 'justify-center'}`} onClick={handleLogout}>
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Panel Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b bg-card/50 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
          <Logo size="sm" showText={true} />
          <div className="text-xs text-muted-foreground">Logged in as: <strong>{user?.email || 'admin@salonai.app'}</strong></div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Layers, Star, User, Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/theme-toggle'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { label: 'Book Now', href: '/portal/book', icon: Calendar },
    { label: 'My Bookings', href: '/portal/appointments', icon: Layers },
    { label: 'Loyalty', href: '/portal/loyalty', icon: Star },
    { label: 'Profile', href: '/portal/profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-16 md:pb-0">
      {/* Portal Header */}
      <header className="h-14 border-b bg-card/50 backdrop-blur-md sticky top-0 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm">GlamStyle Client Portal</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-6">
        {children}
      </main>

      {/* Mobile-first bottom responsive navbar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 border-t bg-card/90 backdrop-blur-lg flex items-center justify-around z-50 md:sticky md:bottom-auto md:top-14 md:border-b md:border-t-0 md:bg-card md:h-12 md:mb-4">
        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center justify-center gap-1 px-3 py-1 cursor-pointer transition-colors ${isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`}>
                <item.icon className="h-5 w-5" />
                <span className="text-[10px]">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

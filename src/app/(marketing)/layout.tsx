'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/shared/logo'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { MARKETING_NAV } from '@/lib/constants'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-sm' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center">
              <Logo size="md" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {MARKETING_NAV.map((item) => (
                <Link key={item.href} href={item.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <ThemeToggle />
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild variant="gradient" size="sm">
                <Link href="/signup">Start Free Trial</Link>
              </Button>
            </div>

            {/* Mobile */}
            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-background/95 backdrop-blur-xl border-b"
            >
              <div className="px-4 py-4 space-y-2">
                {MARKETING_NAV.map((item) => (
                  <Link key={item.href} href={item.href} className="block px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent" onClick={() => setMobileOpen(false)}>
                    {item.label}
                  </Link>
                ))}
                <div className="pt-2 flex flex-col gap-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
                  </Button>
                  <Button asChild variant="gradient" className="w-full">
                    <Link href="/signup" onClick={() => setMobileOpen(false)}>Start Free Trial</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-300 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            <div className="col-span-2 md:col-span-1">
              <Logo size="md" />
              <p className="mt-4 text-sm text-gray-400 leading-relaxed">
                AI-powered salon management that helps you grow your business, delight your clients, and simplify operations.
              </p>
              <div className="mt-6 flex gap-4">
                {['Twitter', 'LinkedIn', 'Instagram', 'YouTube'].map((s) => (
                  <a key={s} href="#" className="text-xs text-gray-500 hover:text-white transition-colors">{s}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm">
                {['Features', 'Pricing', 'Integrations', 'API', 'Mobile App', 'Security'].map((item) => (
                  <li key={item}><a href="#" className="text-gray-400 hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm">
                {['About', 'Blog', 'Careers', 'Contact', 'Partners', 'Press'].map((item) => (
                  <li key={item}><a href="#" className="text-gray-400 hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2.5 text-sm">
                {['Help Center', 'Documentation', 'Guides', 'Webinars', 'Community', 'Status'].map((item) => (
                  <li key={item}><a href="#" className="text-gray-400 hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">© 2026 SalonAI. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span>Payments by</span>
              <span className="font-semibold text-gray-400">Stripe</span>
              <span className="text-gray-700">|</span>
              <span className="font-semibold text-gray-400">Razorpay</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

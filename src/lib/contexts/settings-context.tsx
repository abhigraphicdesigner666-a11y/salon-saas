'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { SettingsService } from '@/services/settings-service'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'

interface BusinessHours {
  day: string
  open: string
  close: string
  closed: boolean
}

interface Settings {
  name: string
  logo: string
  phone: string
  email: string
  address: string
  gstin: string
  rate: string
  inclusive: boolean
  currency: string
  receipt_header: string
  receipt_footer: string
  theme: string
  business_hours: BusinessHours[]
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => Promise<void>
  resetSystem: (section: string) => Promise<void>
  loading: boolean
}

const defaultHours = [
  { day: 'Monday', open: '09:00', close: '20:00', closed: false },
  { day: 'Tuesday', open: '09:00', close: '20:00', closed: false },
  { day: 'Wednesday', open: '09:00', close: '20:00', closed: false },
  { day: 'Thursday', open: '09:00', close: '20:00', closed: false },
  { day: 'Friday', open: '09:00', close: '21:00', closed: false },
  { day: 'Saturday', open: '08:00', close: '21:00', closed: false },
  { day: 'Sunday', open: '08:00', close: '20:00', closed: false },
]

const initialSettings: Settings = {
  name: 'GlamStyle Salon & Spa',
  logo: '',
  phone: '+91 98765 43210',
  email: 'contact@glamstyle.in',
  address: '12, Link Road, Bandra West, Mumbai, MH - 400050',
  gstin: '27AAAAA1111A1Z1',
  rate: '18',
  inclusive: true,
  currency: 'INR',
  receipt_header: 'GLAMSTYLE SALON & SPA',
  receipt_footer: 'Thank you for your visit! Returns/refunds within 7 days.',
  theme: 'dark',
  business_hours: defaultHours,
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { tenant } = useAuth()
  const { success, error } = useToast()
  const tenantId = tenant?.id || 'demo-tenant-001'

  const [settings, setSettings] = useState<Settings>(initialSettings)
  const [loading, setLoading] = useState(true)

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await SettingsService.getSettings(tenantId)
      if (data) {
        setSettings({
          name: data.name ?? initialSettings.name,
          logo: data.logo ?? initialSettings.logo,
          phone: data.phone ?? initialSettings.phone,
          email: data.email ?? initialSettings.email,
          address: data.address ?? initialSettings.address,
          gstin: data.gstin ?? initialSettings.gstin,
          rate: data.rate ?? initialSettings.rate,
          inclusive: data.inclusive ?? initialSettings.inclusive,
          currency: data.currency ?? initialSettings.currency,
          receipt_header: data.receipt_header ?? initialSettings.receipt_header,
          receipt_footer: data.receipt_footer ?? initialSettings.receipt_footer,
          theme: data.theme ?? initialSettings.theme,
          business_hours: data.business_hours ?? initialSettings.business_hours,
        })
        applyTheme(data.theme ?? initialSettings.theme)
      }
    } catch (e: any) {
      console.error('Failed to load settings from repository:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [tenantId])

  const applyTheme = (theme: string) => {
    if (typeof window === 'undefined') return
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.add('light')
    }
  }

  const updateSettings = async (updates: Partial<Settings>) => {
    try {
      const newSettings = { ...settings, ...updates }
      setSettings(newSettings)
      applyTheme(newSettings.theme)
      await SettingsService.saveSettings(tenantId, newSettings)
      
      // Dispatch browser custom event for pages outside context
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('salon-settings-changed'))
      }
      success('Settings Synchronized', 'Configurations applied immediately across all panels.')
    } catch (e: any) {
      error('Synchronization Failed', e.message)
      throw e
    }
  }

  const resetSystem = async (section: string) => {
    try {
      await SettingsService.resetTable(tenantId, section)
      success('System Reset Complete', `${section.toUpperCase()} table has been cleared/reseeded.`)
      
      if (section === 'demo') {
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      } else {
        // Trigger settings refresh and dispatch event
        await loadSettings()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('salon-settings-changed'))
        }
      }
    } catch (e: any) {
      error('Reset Failed', e.message)
      throw e
    }
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSystem, loading }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

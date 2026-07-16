'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/app-store'
import { ROLE_PERMISSIONS } from '@/lib/constants'
import type { User, Tenant, UserRole } from '@/lib/types'

interface AuthContextType {
  user: User | null
  tenant: Tenant | null
  role: UserRole | null
  permissions: Record<string, boolean>
  loading: boolean
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUserState] = useState<User | null>(null)
  const [tenant, setTenantState] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  
  const setStoreUser = useAppStore((state) => state.setUser)
  const setStoreTenant = useAppStore((state) => state.setTenant)

  const refreshSession = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session || !session.user) {
        setUserState(null)
        setTenantState(null)
        setStoreUser(null)
        setStoreTenant(null)
        setLoading(false)
        return
      }

      const authUser = session.user
      const role = (authUser.app_metadata?.role || 'staff') as UserRole
      const tenantId = authUser.app_metadata?.tenant_id || 'demo-tenant-001'

      // Fetch or simulate Profile
      let activeProfile: User = {
        id: authUser.id,
        tenant_id: tenantId,
        role: role,
        first_name: authUser.user_metadata?.first_name || authUser.email?.split('@')[0] || 'User',
        last_name: authUser.user_metadata?.last_name || '',
        email: authUser.email || '',
        phone: authUser.phone || '',
        is_active: true,
        permissions: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (!isDemoMode) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (profile) {
          activeProfile = profile as any
        }
      }

      // Fetch or simulate Tenant
      let activeTenant: Tenant = {
        id: tenantId,
        name: 'Demo Salon',
        slug: 'demo-salon',
        email: 'info@demosalon.com',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        plan: 'starter',
        status: 'active',
        settings: {
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          date_format: 'DD/MM/YYYY',
          default_tax_percent: 18,
          booking_advance_days: 30,
          cancellation_hours: 4,
          auto_confirm_bookings: false,
          send_reminders: true,
          business_hours: []
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (isDemoMode) {
        // Fallback to use-mock-data tenant
        activeTenant = {
          id: 'demo-tenant-001',
          name: 'GlamStyle Salon & Spa',
          slug: 'glamstyle',
          email: 'hello@glamstyle.in',
          phone: '+91 22 2634 5678',
          address: '42, Turner Road, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          plan: 'professional',
          status: 'active',
          settings: {
            currency: 'INR',
            timezone: 'Asia/Kolkata',
            date_format: 'DD/MM/YYYY',
            default_tax_percent: 18,
            booking_advance_days: 30,
            cancellation_hours: 4,
            auto_confirm_bookings: false,
            send_reminders: true,
            business_hours: [
              { day: 0, is_open: false, open_time: '00:00', close_time: '00:00' },
              { day: 1, is_open: true, open_time: '09:00', close_time: '20:00' },
              { day: 2, is_open: true, open_time: '09:00', close_time: '20:00' },
              { day: 3, is_open: true, open_time: '09:00', close_time: '20:00' },
              { day: 4, is_open: true, open_time: '09:00', close_time: '20:00' },
              { day: 5, is_open: true, open_time: '09:00', close_time: '20:00' },
              { day: 6, is_open: true, open_time: '10:00', close_time: '18:00' },
            ]
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      } else {
        const { data: dbTenant } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', tenantId)
          .single()

        if (dbTenant) {
          activeTenant = dbTenant as any
        }
      }

      setUserState(activeProfile)
      setTenantState(activeTenant)
      setStoreUser(activeProfile)
      setStoreTenant(activeTenant)
    } catch (e) {
      console.error('Error refreshing auth session:', e)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    if (isDemoMode) {
      document.cookie = 'salon_ai_session_cookie=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    }
    setUserState(null)
    setTenantState(null)
    setStoreUser(null)
    setStoreTenant(null)
    router.push('/login')
  }

  useEffect(() => {
    refreshSession()
    
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          refreshSession()
        } else if (event === 'SIGNED_OUT') {
          setUserState(null)
          setTenantState(null)
          setStoreUser(null)
          setStoreTenant(null)
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Resolve permissions based on user role from constants
  const activeRole = user?.role || null
  const activePermissions = activeRole
    ? Object.keys(ROLE_PERMISSIONS).reduce((acc, key) => {
        const perms = ROLE_PERMISSIONS[key as keyof typeof ROLE_PERMISSIONS]
        acc[key] = perms[activeRole as keyof typeof perms] || false
        return acc;
      }, {} as Record<string, boolean>)
    : {}

  const authValue = useMemo(() => ({
    user,
    tenant,
    role: activeRole,
    permissions: activePermissions,
    loading,
    logout,
    refreshSession,
  }), [user, tenant, activeRole, activePermissions, loading])

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

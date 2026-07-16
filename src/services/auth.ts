import { supabase, isDemoMode } from '@/lib/supabase/client'
import { generateId } from '@/lib/utils'

export const authService = {
  signIn: async ({ email, password, rememberMe = true }: any) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { data: null, error }

    if (isDemoMode && data?.session) {
      const cookieValue = encodeURIComponent(JSON.stringify(data.session))
      const maxAge = rememberMe ? 604800 : '' // 7 days or session
      document.cookie = `salon_ai_session_cookie=${cookieValue}; path=/; max-age=${maxAge}; SameSite=Lax`
    }

    return { data, error: null }
  },

  signUp: async ({ salonName, businessCategory, currency, country, timezone, ownerName, email, password }: any) => {
    if (isDemoMode) {
      // Simulate database signup and insert
      const tenantId = 'tenant-' + generateId()
      const userId = 'user-' + generateId()
      
      const newTenant = {
        id: tenantId,
        name: salonName,
        slug: salonName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        email,
        plan: 'free_trial',
        status: 'trial',
        settings: {
          currency,
          timezone,
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
        }
      }

      const newProfile = {
        id: userId,
        tenant_id: tenantId,
        role: 'salon_owner',
        first_name: ownerName.split(' ')[0],
        last_name: ownerName.split(' ')[1] || '',
        email,
        is_active: true,
      }

      // Stateful sign up simulation
      const mockSession = {
        access_token: 'mock-jwt-token-xyz',
        user: {
          id: userId,
          email,
          app_metadata: { tenant_id: tenantId, role: 'salon_owner' },
          user_metadata: { first_name: newProfile.first_name, last_name: newProfile.last_name },
        },
      }

      localStorage.setItem('salon_ai_session', JSON.stringify(mockSession))
      const cookieValue = encodeURIComponent(JSON.stringify(mockSession))
      document.cookie = `salon_ai_session_cookie=${cookieValue}; path=/; max-age=604800; SameSite=Lax`

      return { data: { user: mockSession.user, session: mockSession }, error: null }
    }

    // Live mode signup
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: ownerName.split(' ')[0],
          last_name: ownerName.split(' ')[1] || '',
        }
      }
    })

    if (signUpError || !authData.user) {
      return { data: null, error: signUpError || new Error('Auth signup failed') }
    }

    // Insert tenant, profile, settings via client/edge (or standard tables)
    try {
      const tenantId = generateId()
      
      // Create Tenant record
      await supabase.from('tenants').insert({
        id: tenantId,
        name: salonName,
        slug: salonName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        email,
        plan: 'free_trial',
        status: 'trial',
        settings: {
          currency,
          timezone,
          date_format: 'DD/MM/YYYY',
          default_tax_percent: 18,
          booking_advance_days: 30,
          cancellation_hours: 4,
          auto_confirm_bookings: false,
          send_reminders: true,
        }
      })

      // Create owner Profile record
      await supabase.from('profiles').insert({
        id: authData.user.id,
        tenant_id: tenantId,
        role: 'salon_owner',
        first_name: ownerName.split(' ')[0],
        last_name: ownerName.split(' ')[1] || '',
        email,
        is_active: true,
      })

      return { data: authData, error: null }
    } catch (dbError: any) {
      return { data: null, error: dbError }
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (isDemoMode) {
      document.cookie = 'salon_ai_session_cookie=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    }
    return { error }
  },

  resetPasswordForEmail: async (email: string) => {
    if (isDemoMode) return { data: {}, error: null }
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
  },

  updatePassword: async (password: string) => {
    if (isDemoMode) return { data: {}, error: null }
    return await supabase.auth.updateUser({ password })
  }
}

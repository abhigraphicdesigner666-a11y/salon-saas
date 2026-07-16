import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// In-memory stateful store for mock mode
const mockStore = {
  session: null as any,
  users: [] as any[],
  tenants: [] as any[],
  profiles: [] as any[],
}

// Stateful Mock Supabase Client for offline preview mode
const createMockClient = () => {
  return {
    auth: {
      getSession: async () => {
        if (typeof window !== 'undefined') {
          const session = localStorage.getItem('salon_ai_session')
          if (session) {
            mockStore.session = JSON.parse(session)
            return { data: { session: mockStore.session }, error: null }
          }
        }
        return { data: { session: null }, error: null }
      },
      getUser: async () => {
        if (typeof window !== 'undefined') {
          const session = localStorage.getItem('salon_ai_session')
          if (session) {
            const parsed = JSON.parse(session)
            return { data: { user: parsed.user }, error: null }
          }
        }
        return { data: { user: null }, error: null }
      },
      signInWithPassword: async ({ email, password }: any) => {
        // Mock sign in - verify from seed or local storage
        let userEmail = email.toLowerCase().trim()
        
        // Match seed profiles
        let role = 'stylist'
        let tenantId = 'demo-tenant-001'
        let name = 'Riya Sharma'
        
        if (userEmail === 'owner@glamstyle.in' || userEmail === 'owner@salonai.app') {
          role = 'salon_owner'
          name = 'Priya Sharma'
          tenantId = 'demo-tenant-001'
        } else if (userEmail === 'admin@salonai.app') {
          role = 'super_admin'
          name = 'Admin User'
          tenantId = 'system'
        } else if (userEmail === 'customer@gmail.com') {
          role = 'staff' // Customer maps to portal user role
          name = 'Customer User'
          tenantId = 'demo-tenant-001'
        }

        const mockSession = {
          access_token: 'mock-jwt-token-xyz',
          user: {
            id: 'mock-user-id-' + userEmail.split('@')[0],
            email: userEmail,
            app_metadata: { tenant_id: tenantId, role },
            user_metadata: { first_name: name.split(' ')[0], last_name: name.split(' ')[1] || '' },
          },
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('salon_ai_session', JSON.stringify(mockSession))
        }
        return { data: { session: mockSession, user: mockSession.user }, error: null }
      },
      signUp: async ({ email, password, options }: any) => {
        const userEmail = email.toLowerCase().trim()
        const meta = options?.data || {}
        
        const mockUser = {
          id: 'mock-user-id-' + userEmail.split('@')[0],
          email: userEmail,
          app_metadata: { tenant_id: meta.tenant_id || 'demo-tenant-001', role: meta.role || 'salon_owner' },
          user_metadata: { first_name: meta.first_name, last_name: meta.last_name },
        }
        
        return { data: { user: mockUser, session: null }, error: null }
      },
      signOut: async () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('salon_ai_session')
        }
        return { error: null }
      },
      onAuthStateChange: (callback: any) => {
        // Return dummy unsubscribe
        return { data: { subscription: { unsubscribe: () => {} } } }
      }
    },
    from: (table: string) => {
      // Return simple mock query interface
      return {
        select: () => ({
          eq: () => ({
            single: async () => {
              if (table === 'profiles') {
                const session = typeof window !== 'undefined' ? localStorage.getItem('salon_ai_session') : null
                if (session) {
                  const parsed = JSON.parse(session)
                  return {
                    data: {
                      id: parsed.user.id,
                      tenant_id: parsed.user.app_metadata.tenant_id,
                      role: parsed.user.app_metadata.role,
                      first_name: parsed.user.user_metadata.first_name,
                      last_name: parsed.user.user_metadata.last_name,
                      email: parsed.user.email,
                      is_active: true,
                    },
                    error: null
                  }
                }
              }
              return { data: null, error: null }
            },
            maybeSingle: async () => ({ data: null, error: null }),
          }),
          order: () => ({
            limit: async () => ({ data: [], error: null })
          })
        }),
        insert: () => ({
          select: () => ({
            single: async () => ({ data: { id: 'mock-inserted-id' }, error: null })
          })
        })
      }
    }
  } as any
}

export const isDemoMode = !supabaseUrl || !supabaseAnonKey

export const supabase = isDemoMode
  ? createMockClient()
  : createClient(supabaseUrl!, supabaseAnonKey!)

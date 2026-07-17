import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Stateful Mock Client for Server Side rendering in demo mode
    return {
      auth: {
        getSession: async () => {
          const cookieStore = await cookies()
          const sessionCookie = cookieStore.get('salon_ai_session_cookie')
          if (sessionCookie?.value) {
            try {
              const session = JSON.parse(sessionCookie.value)
              return { data: { session }, error: null }
            } catch (e) {
              return { data: { session: null }, error: null }
            }
          }
          return { data: { session: null }, error: null }
        },
        getUser: async () => {
          const cookieStore = await cookies()
          const sessionCookie = cookieStore.get('salon_ai_session_cookie')
          if (sessionCookie?.value) {
            try {
              const session = JSON.parse(sessionCookie.value)
              return { data: { user: session.user }, error: null }
            } catch (e) {
              return { data: { user: null }, error: null }
            }
          }
          return { data: { user: null }, error: null }
        }
      },
      from: (table: string) => {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null, error: null }),
              maybeSingle: async () => ({ data: null, error: null }),
            })
          })
        }
      }
    } as any
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: any[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

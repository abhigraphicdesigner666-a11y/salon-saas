import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Demo mode: Check cookie session
    const sessionCookie = request.cookies.get('salon_ai_session_cookie')
    const { pathname } = request.nextUrl

    if (!sessionCookie) {
      if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/portal')) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }
    } else {
      try {
        const session = JSON.parse(sessionCookie.value)
        const role = session.user.app_metadata.role

        // Route protection by role
        if (pathname.startsWith('/admin') && role !== 'super_admin') {
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard'
          return NextResponse.redirect(url)
        }
        if (pathname.startsWith('/dashboard') && (role === 'super_admin' || role === 'customer')) {
          const url = request.nextUrl.clone()
          url.pathname = role === 'super_admin' ? '/admin' : '/portal'
          return NextResponse.redirect(url)
        }
        if (pathname.startsWith('/portal') && role === 'super_admin') {
          const url = request.nextUrl.clone()
          url.pathname = '/admin'
          return NextResponse.redirect(url)
        }
      } catch (e) {
        // Clear corrupt cookie and redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('salon_ai_session_cookie')
        return response
      }
    }
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // IMPORTANT: Do NOT remove this. This is necessary for Auth Flow to work.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/portal')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  } else {
    const role = user.app_metadata.role

    // Route gating
    if (pathname.startsWith('/admin') && role !== 'super_admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    if (pathname.startsWith('/dashboard') && (role === 'super_admin' || role === 'customer')) {
      const url = request.nextUrl.clone()
      url.pathname = role === 'super_admin' ? '/admin' : '/portal'
      return NextResponse.redirect(url)
    }
    if (pathname.startsWith('/portal') && role === 'super_admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

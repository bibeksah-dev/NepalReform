import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Create a Supabase client that works in middleware by wiring cookies
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Skip middleware if not configured (build time)
    return res
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: 'nepalreforms.auth',
    },
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options)
        })
      },
    },
  })

  // Refresh session for all routes - this updates the cookie if needed
  const { data: { user }, error } = await supabase.auth.getUser()

  // For admin routes, require authentication and admin role
  if (req.nextUrl.pathname.startsWith('/api/admin')) {
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Minimal role check via RLS-safe query
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return res
}

export const config = {
  // Run on all routes except static files and images
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

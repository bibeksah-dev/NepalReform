import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Cache this route for 5 minutes at the edge/CDN and allow serving stale for a day while revalidating.
// This reduces build/SSR pressure caused by live DB calls.
const DEFAULT_CACHE_HEADER = 'public, s-maxage=300, stale-while-revalidate=86400'
const DEFAULT_LIMIT = 50

export async function GET(request: Request) {
  try {
    // Use service client for public data to bypass RLS complexities
    const supabase = await createServiceClient()

    // Basic pagination support: /api/testimonials?limit=20&offset=0
    const { searchParams } = new URL(request.url)
    const limitParam = Number(searchParams.get('limit'))
    const offsetParam = Number(searchParams.get('offset'))
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : DEFAULT_LIMIT
    const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0

    const { data, error } = await supabase
      .from('testimonials')
      .select('id,name,profession,testimonial,image_url,linkedin_url,display_order,created_at', { count: 'exact' })
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[testimonials API] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500, headers: { 'Cache-Control': DEFAULT_CACHE_HEADER } })
    }

    return NextResponse.json(data ?? [], { headers: { 'Cache-Control': DEFAULT_CACHE_HEADER } })
  } catch (err) {
    console.error('[testimonials API] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin/moderator
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile?.role || (profile.role !== 'admin' && profile.role !== 'moderator')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  
  const { data, error } = await supabase
    .from('testimonials')
    .insert([body])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

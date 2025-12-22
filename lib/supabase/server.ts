import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Create a mock client for build time when using placeholder values
 */
function createMockClient() {
  // Create a chainable mock query builder
  const createQueryBuilder = () => {
    const queryBuilder = {
      select: () => queryBuilder,
      insert: () => queryBuilder,
      update: () => queryBuilder,
      delete: () => queryBuilder,
      upsert: () => queryBuilder,
      eq: () => queryBuilder,
      neq: () => queryBuilder,
      gt: () => queryBuilder,
      gte: () => queryBuilder,
      lt: () => queryBuilder,
      lte: () => queryBuilder,
      like: () => queryBuilder,
      ilike: () => queryBuilder,
      is: () => queryBuilder,
      in: () => queryBuilder,
      contains: () => queryBuilder,
      containedBy: () => queryBuilder,
      rangeGt: () => queryBuilder,
      rangeGte: () => queryBuilder,
      rangeLt: () => queryBuilder,
      rangeLte: () => queryBuilder,
      rangeAdjacent: () => queryBuilder,
      overlaps: () => queryBuilder,
      textSearch: () => queryBuilder,
      match: () => queryBuilder,
      not: () => queryBuilder,
      or: () => queryBuilder,
      filter: () => queryBuilder,
      order: () => queryBuilder,
      limit: () => queryBuilder,
      range: () => queryBuilder,
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: Function) => resolve({ data: [], error: null, count: 0 }),
      catch: () => queryBuilder
    }
    return queryBuilder
  }

  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signIn: async () => ({ data: null, error: new Error("Build time mock") }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: (table: string) => createQueryBuilder()
  } as any
}

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Check if we're in build mode with placeholders
  if (
    !supabaseUrl || 
    !supabaseAnonKey ||
    supabaseUrl === "https://placeholder.supabase.co" ||
    supabaseAnonKey?.includes("placeholder")
  ) {
    // During build, return a mock client
    return createMockClient()
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: 'nepalreforms.auth',
    },
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

export async function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Check if we're in build mode with placeholders
  if (
    !supabaseUrl || 
    !serviceRoleKey ||
    supabaseUrl === "https://placeholder.supabase.co" ||
    serviceRoleKey?.includes("placeholder")
  ) {
    // During build, return a mock client
    return createMockClient()
  }

  return createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {
        // No-op for service role client
      },
    },
  })
}

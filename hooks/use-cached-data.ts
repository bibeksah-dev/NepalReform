/**
 * Custom React Query hooks for Nepal Reforms Platform
 * Implements comprehensive caching strategy
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { manifestoData } from '@/lib/manifesto-data'
import { CacheManager } from '@/lib/cache/cache-manager'
import { createClient as createBrowserSupabase } from '@/lib/supabase/client'
import type { ManifestoItem } from '@/lib/manifesto-data'

// Reuse the single browser Supabase client to avoid multiple GoTrueClient instances
const supabase = createBrowserSupabase()

/**
 * Hook for fetching manifesto data
 * Simplified: manifesto data is static, so React Query cache is sufficient
 */
export function useManifestoData() {
  return useQuery({
    queryKey: ['manifesto', 'all'],
    queryFn: (): ManifestoItem[] => {
      // Static data - no server call or complex caching needed
      return manifestoData
    },
    staleTime: Infinity, // Static data never goes stale
    gcTime: Infinity, // Keep forever
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })
}

/**
 * Hook for fetching votes
 * Note: Legacy hook - votes are now handled via agenda_votes/suggestion_votes tables
 * Use the useVoting hook from use-voting.ts instead for the new vote system
 */
export function useVotes(manifestoId?: string) {
  return useQuery({
    queryKey: manifestoId ? ['votes', manifestoId] : ['votes', 'all'],
    queryFn: () => [],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    enabled: false, // Disabled - use useVoting hook instead
  })
}

/**
 * Hook for submitting votes
 * Note: Legacy hook - use useVoting from use-voting.ts for the new vote system
 * @deprecated Use useVoting hook instead
 */
export function useVoteMutation() {
  return useMutation({
    mutationFn: async (_params: { manifestoId: string; userId?: string; voteType: 'up' | 'down' }) => {
      throw new Error('Legacy useVoteMutation is deprecated. Use useVoting hook instead.')
    },
  })
}

/**
 * Hook for fetching suggestions
 * Simplified: React Query handles caching, no need for localStorage layer
 */
export function useSuggestions(manifestoId?: string) {
  return useQuery({
    queryKey: manifestoId ? ['suggestions', manifestoId] : ['suggestions', 'all'],
    queryFn: async () => {
      let query = supabase
        .from('suggestions')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false })

      if (manifestoId) {
        query = query.eq('manifesto_id', manifestoId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching suggestions:', error)
        return []
      }

      return data || []
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for submitting suggestions
 */
export function useSuggestionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (suggestion: {
      manifesto_id: string
      title: string
      description: string
      user_id?: string
    }) => {
      // Handle offline - save for later sync
      if (!navigator.onLine) {
        CacheManager.saveOfflineAction({
          type: 'suggestion',
          data: suggestion,
          timestamp: Date.now(),
        })
        return { offline: true, ...suggestion }
      }

      const { data, error } = await supabase
        .from('suggestions')
        .insert(suggestion)
        .select('*, profiles(*)')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      // Optimistically update React Query cache
      queryClient.setQueryData(['suggestions', variables.manifesto_id], (old: any[]) => {
        return [data, ...(old || [])]
      })
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
    },
  })
}

/**
 * Hook for fetching user profile
 * Simplified: React Query handles caching
 */
export function useUserProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook for syncing offline actions
 */
export function useOfflineSync() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const offlineActions = CacheManager.getOfflineActions()
      if (offlineActions.length === 0) return []

      console.log(`🔄 Syncing ${offlineActions.length} offline actions`)
      
      const results = []
      for (const action of offlineActions) {
        try {
          if (action.type === 'vote') {
            // No server table; mark as synced successfully without network
            results.push({ success: true, data: action.data })
          } else if (action.type === 'suggestion') {
            const { data } = await supabase
              .from('suggestions')
              .insert(action.data)
              .select()
            results.push({ success: true, data })
          }
        } catch (error) {
          console.error(`Failed to sync ${action.type}:`, error)
          results.push({ success: false, error })
        }
      }
      
      return results
    },
    onSuccess: () => {
      // Clear offline actions
      CacheManager.clearOfflineActions()
      
      // Invalidate all queries to refresh with server data
      queryClient.invalidateQueries({ queryKey: ['votes'] })
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      
      console.log('✅ Offline sync completed')
    },
  })
}

/**
 * Hook to get cache info
 */
export function useCacheInfo() {
  return useQuery({
    queryKey: ['cache', 'info'],
    queryFn: () => CacheManager.getCacheInfo(),
    staleTime: 5000, // Refresh every 5 seconds
  })
}

/**
 * Hook to clear all cache
 */
export function useClearCache() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      await CacheManager.clearAll()
      queryClient.clear()
      return true
    },
    onSuccess: () => {
      console.log('🗑️ All cache cleared')
      window.location.reload()
    },
  })
}

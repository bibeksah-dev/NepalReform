"use client"

import { useState, useEffect, useCallback, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { useHydration } from "@/hooks/use-hydration"
import { useTranslation } from "react-i18next"

interface VoteData {
  likes: number
  dislikes: number
  userVote: "like" | "dislike" | null
}

// Canonical type for postgres_changes payload
export type PostgresChangePayload<Row> = {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Row | null;
  old: Row | null;
  errors?: any;
};

// Row type for agenda_votes table
export type AgendaVoteRow = {
  id: string;
  agenda_id: string;
  user_id: string;
  vote_type: "like" | "dislike";
  // Add more fields if your table has them
};

export function useAgendaVotes(agendaId: string) {
  const { t }= useTranslation("translation")
  const isHydrated = useHydration()
  
  // Initialize with neutral state to prevent hydration mismatch
  const [voteData, setVoteData] = useState<VoteData>({
    likes: 0,
    dislikes: 0,
    userVote: null,
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Store vote data in localStorage whenever it changes (only after hydration)
  const persistVoteData = useCallback((data: VoteData) => {
    if (!isHydrated) return
    
    try {
      if (data.userVote) {
        localStorage.setItem(`vote_${agendaId}`, data.userVote)
      } else {
        localStorage.removeItem(`vote_${agendaId}`)
      }
      
      localStorage.setItem(`vote_counts_${agendaId}`, JSON.stringify({
        likes: data.likes,
        dislikes: data.dislikes,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.warn("Failed to persist vote data to localStorage:", error)
    }
  }, [agendaId, isHydrated])

  // Load initial data from localStorage (only after hydration)
  const loadFromLocalStorage = useCallback(() => {
    if (!isHydrated) return null
    
    try {
      const storedVote = localStorage.getItem(`vote_${agendaId}`)
      const storedCounts = localStorage.getItem(`vote_counts_${agendaId}`)
      
      if (storedCounts) {
        const counts = JSON.parse(storedCounts)
        return {
          likes: counts.likes || 0,
          dislikes: counts.dislikes || 0,
          userVote: (storedVote as "like" | "dislike") || null,
        }
      }
    } catch (error) {
      console.warn("Failed to load vote data from localStorage:", error)
    }
    
    return null
  }, [agendaId, isHydrated])

  // Fetch votes from database
  const fetchVotes = useCallback(async () => {
    if (!agendaId) return
    
    try {
      console.log("[v0] Fetching votes for agenda ID:", agendaId)
      const response = await fetch(`/api/agendas/${agendaId}/vote`)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] API response error:", response.status, errorData)
        throw new Error(errorData.error || "Failed to fetch votes")
      }

      const data = await response.json()
      console.log("[v0] Received vote data:", data)

      const newVoteData = {
        likes: data.likes,
        dislikes: data.dislikes,
        userVote: data.userVote,
      }

      setVoteData(newVoteData)
      persistVoteData(newVoteData)
      setError(null)
      setIsInitialLoad(false)
    } catch (err) {
      console.error("Error fetching votes:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch votes")
      setIsInitialLoad(false)
    }
  }, [agendaId, persistVoteData])

  // Load from localStorage first, then fetch from database
  useEffect(() => {
    if (!isHydrated || !agendaId) return

    // Load from localStorage immediately for quick UI update
    const localData = loadFromLocalStorage()
    if (localData) {
      setVoteData(localData)
    }

    // Then fetch fresh data from the database
    fetchVotes()
  }, [agendaId, isHydrated, loadFromLocalStorage, fetchVotes])

  // Set up real-time subscription
  useEffect(() => {
    if (!isHydrated || !agendaId) return

    const supabase = createClient()

    // Set up real-time subscription
    const setupRealtimeSubscription = () => {
      const channel = supabase
        .channel(`agenda_votes_${agendaId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "agenda_votes",
            filter: `agenda_id=eq.${agendaId}`,
          },
          async (payload: PostgresChangePayload<AgendaVoteRow>) => {
            console.log("[v0] Real-time vote update received:", payload)
            // Refetch vote counts when any vote changes
            await fetchVotes()
          },
        )
        .subscribe()

      return channel
    }

    const channel = setupRealtimeSubscription()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [agendaId, fetchVotes, isHydrated])

  // Handle voting with optimistic updates
  const handleVote = async (voteType: "like" | "dislike") => {
    if (!isHydrated) {
      setError(t('agendaVote.voteErrorLoad'))
      return
    }

    setIsLoading(true)
    setError(null)

    // Optimistic update
    const currentVote = voteData.userVote
    let optimisticData = { ...voteData }

    if (currentVote === voteType) {
      // Removing vote
      optimisticData.userVote = null
      if (voteType === "like") {
        optimisticData.likes = Math.max(0, optimisticData.likes - 1)
      } else {
        optimisticData.dislikes = Math.max(0, optimisticData.dislikes - 1)
      }
    } else {
      // Adding or changing vote
      if (currentVote === "like") {
        optimisticData.likes = Math.max(0, optimisticData.likes - 1)
      } else if (currentVote === "dislike") {
        optimisticData.dislikes = Math.max(0, optimisticData.dislikes - 1)
      }

      optimisticData.userVote = voteType
      if (voteType === "like") {
        optimisticData.likes += 1
      } else {
        optimisticData.dislikes += 1
      }
    }

    // Apply optimistic update
    setVoteData(optimisticData)
    persistVoteData(optimisticData)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError(t('agendaVote.voteErrorSignIn'))
        // Revert optimistic update
        await fetchVotes()
        setIsLoading(false)
        return
      }

      console.log("[v0] Submitting vote:", voteType, "for agenda:", agendaId)

      const response = await fetch(`/api/agendas/${agendaId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vote_type: voteType }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Vote submission error:", response.status, errorData)
        throw new Error(errorData.error || "Failed to submit vote")
      }

      const data = await response.json()
      console.log("[v0] Vote submission successful:", data)

      const newVoteData = {
        likes: data.likes,
        dislikes: data.dislikes,
        userVote: data.userVote,
      }

      setVoteData(newVoteData)
      persistVoteData(newVoteData)
    } catch (err) {
      console.error("Error voting:", err)
      setError(err instanceof Error ? err.message : t('agendaVote.voteErrorSubmit'))
      // Revert to actual data on error
      await fetchVotes()
    } finally {
      setIsLoading(false)
    }
  }

  return {
    voteData,
    handleVote,
    isLoading: isLoading || (isInitialLoad && isHydrated),
    error,
  }
}

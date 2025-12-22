"use client"

import { useEffect, useState, useMemo, useCallback, memo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageSquare, Loader2, AlertCircle } from "lucide-react"
import { VoteButtons } from "@/components/vote-buttons"
import { Button } from "@/components/ui/button"

// Try to import react-window components with fallback
let FixedSizeList: any = null
if (typeof window !== "undefined") {
  try {
    const ReactWindow = require("react-window")
    FixedSizeList = ReactWindow.FixedSizeList || ReactWindow.default?.FixedSizeList
  } catch (e) {
    console.warn("react-window not available, falling back to regular list rendering")
  }
}

interface Suggestion {
  id: string
  content: string
  author_name: string
  created_at: string
  user_id: string
}

interface SuggestionWithScore extends Suggestion {
  netScore: number
  totalEngagement: number
  likes: number
  dislikes: number
}

interface SuggestionListProps {
  agendaId: string
  refreshTrigger?: number
}

interface SuggestionItemData {
  suggestions: SuggestionWithScore[]
  userVotes: { [id: string]: "like" | "dislike" | null }
  handleVote: (id: string, type: "like" | "dislike") => void
  sortBy: "popularity" | "newest" | "oldest"
}

const SuggestionItem = memo(({ index, style, data }: any) => {
  const { suggestions, userVotes, handleVote, sortBy } = data as SuggestionItemData
  const suggestion = suggestions[index]
  const likes = suggestion.likes
  const dislikes = suggestion.dislikes
  const netScore = suggestion.netScore
  const isTopSuggestion = sortBy === "popularity" && index < 3 && netScore > 0

  return (
    <div style={style} className="px-2 py-2">
      <Card
        className={`transition-all duration-200 hover:shadow-md ${
          isTopSuggestion ? "ring-2 ring-primary/20 bg-primary/5" : ""
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {isTopSuggestion && (
                  <Badge variant="default" className="text-xs">
                    {index === 0 ? "🏆 Most Popular" : index === 1 ? "🥈 #2" : "🥉 #3"}
                  </Badge>
                )}
                <span className="font-medium text-sm text-foreground">{suggestion.author_name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(suggestion.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span className={netScore > 0 ? "text-green-600" : netScore < 0 ? "text-red-600" : ""}>
                {netScore > 0 ? "+" : ""}
                {netScore}
              </span>
              <span className="text-xs">net</span>
              {suggestion.totalEngagement > 0 && (
                <span className="text-xs text-muted-foreground ml-1">({suggestion.totalEngagement} votes)</span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-foreground leading-relaxed mb-4">{suggestion.content}</p>

          <VoteButtons
            itemId={suggestion.id}
            userVote={userVotes[suggestion.id]}
            likesCount={likes}
            dislikesCount={dislikes}
            onVote={handleVote}
            size="sm"
          />
        </CardContent>
      </Card>
    </div>
  )
})

SuggestionItem.displayName = "SuggestionItem"

export const SuggestionList = memo(({ agendaId, refreshTrigger }: SuggestionListProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [userVotes, setUserVotes] = useState<{ [id: string]: "like" | "dislike" | null }>({})
  const [voteCounts, setVoteCounts] = useState<{ [id: string]: { likes: number; dislikes: number } }>({})
  const [sortBy, setSortBy] = useState<"popularity" | "newest" | "oldest">("popularity")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchSuggestions()
    checkUser()
  }, [agendaId, refreshTrigger])

  const checkUser = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      console.log("[v0] User authenticated:", !!data.user)
    } catch (err) {
      console.error("[v0] Error checking user:", err)
    }
  }, [supabase])

  const fetchSuggestions = useCallback(async () => {
    try {
      setError(null)
      console.log("[v0] Fetching suggestions for agenda:", agendaId)

      // Add cache-busting parameter to ensure fresh data
      const cacheBuster = Date.now()
      const response = await fetch(`/api/suggestions?agenda_id=${encodeURIComponent(agendaId)}&_t=${cacheBuster}`)
      if (!response.ok) throw new Error("Failed to fetch suggestions")

      const data = await response.json()
      setSuggestions(data.suggestions || [])

      if (data.suggestions?.length > 0) {
        await fetchAllVoteData(data.suggestions.map((s: Suggestion) => s.id))
      }
    } catch (err) {
      console.error("[v0] Error fetching suggestions:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch suggestions")
    } finally {
      setLoading(false)
    }
  }, [agendaId])

  const fetchAllVoteData = useCallback(async (suggestionIds: string[]) => {
    try {
      const response = await fetch("/api/votes/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: suggestionIds, table: "suggestion_votes" }),
      })
      if (!response.ok) throw new Error("Failed to fetch vote data")

      const { voteCounts: counts, userVotes: votes } = await response.json()
      setVoteCounts(counts)
      setUserVotes(votes || {})
    } catch (err) {
      console.error("[v0] Error fetching vote data:", err)
    }
  }, [])

  const handleVote = useCallback(
    async (id: string, type: "like" | "dislike") => {
      if (!user) {
        window.location.href = "/auth/login"
        return
      }

      try {
        const currentVote = userVotes[id]
        const currentCounts = voteCounts[id] || { likes: 0, dislikes: 0 }

        let newVote: "like" | "dislike" | null = type
        let { likes, dislikes } = currentCounts

        if (currentVote === type) {
          newVote = null
          if (type === "like") likes--
          else dislikes--
        } else {
          if (currentVote === "like") likes--
          else if (currentVote === "dislike") dislikes--
          if (type === "like") likes++
          else dislikes++
        }

        setUserVotes((prev) => ({ ...prev, [id]: newVote }))
        setVoteCounts((prev) => ({ ...prev, [id]: { likes: Math.max(0, likes), dislikes: Math.max(0, dislikes) } }))

        const response = await fetch(`/api/suggestions/${id}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vote_type: type }),
        })

        if (!response.ok) {
          setUserVotes((prev) => ({ ...prev, [id]: currentVote }))
          setVoteCounts((prev) => ({ ...prev, [id]: currentCounts }))
          throw new Error("Failed to submit vote")
        }

        const data = await response.json()
        setUserVotes((prev) => ({ ...prev, [id]: data.userVote }))
        setVoteCounts((prev) => ({ ...prev, [id]: { likes: data.likes, dislikes: data.dislikes } }))
      } catch (err) {
        console.error("[v0] Error voting:", err)
        setError(err instanceof Error ? err.message : "Failed to submit vote")
        setTimeout(() => setError(null), 5000)
      }
    },
    [user, userVotes, voteCounts],
  )

  const sortedSuggestions = useMemo((): SuggestionWithScore[] => {
    return suggestions
      .map((s) => {
        const likes = voteCounts[s.id]?.likes || 0
        const dislikes = voteCounts[s.id]?.dislikes || 0
        return { ...s, likes, dislikes, netScore: likes - dislikes, totalEngagement: likes + dislikes }
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "popularity":
            if (a.netScore !== b.netScore) return b.netScore - a.netScore
            return b.totalEngagement - a.totalEngagement
          case "newest":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          case "oldest":
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          default:
            return 0
        }
      })
  }, [suggestions, voteCounts, sortBy])

  const listData: SuggestionItemData = useMemo(
    () => ({ suggestions: sortedSuggestions, userVotes, handleVote, sortBy }),
    [sortedSuggestions, userVotes, handleVote, sortBy],
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-destructive/50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <button
            onClick={() => {
              setError(null)
              fetchSuggestions()
            }}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </AlertDescription>
      </Alert>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No suggestions yet. Be the first to share your thoughts!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Community Suggestions</h3>
        <Badge variant="secondary" className="ml-auto">
          {suggestions.length} {suggestions.length === 1 ? "suggestion" : "suggestions"}
        </Badge>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
        <div className="flex gap-1">
          <Button
            variant={sortBy === "popularity" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("popularity")}
          >
            🔥 Popular
          </Button>
          <Button
            variant={sortBy === "newest" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("newest")}
          >
            🕐 Newest
          </Button>
          <Button
            variant={sortBy === "oldest" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("oldest")}
          >
            📅 Oldest
          </Button>
        </div>
      </div>

      {sortedSuggestions.length > 10 && FixedSizeList ? (
        <div className="h-[600px]">
          <FixedSizeList height={600} itemCount={sortedSuggestions.length} itemSize={200} itemData={listData}>
            {SuggestionItem}
          </FixedSizeList>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedSuggestions.map((s, i) => (
            <SuggestionItem
              key={s.id}
              index={i}
              style={{}}
              data={{ suggestions: sortedSuggestions, userVotes, handleVote, sortBy }}
            />
          ))}
        </div>
      )}
    </div>
  )
})

SuggestionList.displayName = "SuggestionList"

"use client"

import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import i18n, { formatNumber } from "@/lib/i18n"

interface VoteButtonsProps {
  itemId: string
  userVote?: "like" | "dislike" | null
  likesCount?: number
  dislikesCount?: number
  onVote: (itemId: string, voteType: "like" | "dislike") => void
  size?: "sm" | "default"
  className?: string
  isLoading?: boolean
}

export function VoteButtons({
  itemId,
  userVote,
  likesCount = 0,
  dislikesCount = 0,
  onVote,
  size = "sm",
  className,
  isLoading = false,
}: VoteButtonsProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [optimisticVote, setOptimisticVote] = useState<"like" | "dislike" | null>(userVote || null)

  // Sync optimistic vote with actual vote when it changes
  useEffect(() => {
    setOptimisticVote(userVote || null)
  }, [userVote])

  const handleVoteClick = async (voteType: "like" | "dislike") => {
    if (isVoting || isLoading) return
    
    setIsVoting(true)
    
    // Optimistic update
    if (optimisticVote === voteType) {
      setOptimisticVote(null) // Remove vote if clicking same button
    } else {
      setOptimisticVote(voteType) // Change vote
    }
    
    try {
      await onVote(itemId, voteType)
    } finally {
      setIsVoting(false)
    }
  }

  // Calculate optimistic counts
  const getOptimisticCounts = () => {
    let optimisticLikes = likesCount
    let optimisticDislikes = dislikesCount

    // Adjust counts based on optimistic vote vs actual vote
    if (optimisticVote !== userVote) {
      // Remove old vote
      if (userVote === "like") optimisticLikes--
      if (userVote === "dislike") optimisticDislikes--
      
      // Add new vote
      if (optimisticVote === "like") optimisticLikes++
      if (optimisticVote === "dislike") optimisticDislikes++
    }

    return { optimisticLikes, optimisticDislikes }
  }

  const { optimisticLikes, optimisticDislikes } = getOptimisticCounts()

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Like Button */}
      <Button
        variant={optimisticVote === "like" ? "default" : "outline"}
        size={size}
        onClick={() => handleVoteClick("like")}
        disabled={isVoting || isLoading}
        className={cn(
          "flex items-center gap-2 transition-all duration-200",
          optimisticVote === "like" && [
            "bg-green-600 hover:bg-green-700 text-white border-green-600",
            "shadow-md shadow-green-600/20",
            "ring-2 ring-green-600/20 ring-offset-1",
          ],
          optimisticVote !== "like" && [
            "hover:bg-green-50 hover:border-green-300 hover:text-green-700",
            "dark:hover:bg-green-950 dark:hover:border-green-700 dark:hover:text-green-400",
          ],
          (isVoting || isLoading) && "opacity-50 cursor-not-allowed"
        )}
      >
        <ThumbsUp 
          className={cn(
            "h-4 w-4", 
            size === "sm" && "h-3 w-3",
            optimisticVote === "like" && "fill-current"
          )} 
        />
        <span className={cn(
          "font-medium",
          size === "sm" ? "text-xs" : "text-sm"
        )}>
          {formatNumber(optimisticLikes, i18n.language)}
        </span>
      </Button>

      {/* Dislike Button */}
      <Button
        variant={optimisticVote === "dislike" ? "destructive" : "outline"}
        size={size}
        onClick={() => handleVoteClick("dislike")}
        disabled={isVoting || isLoading}
        className={cn(
          "flex items-center gap-2 transition-all duration-200",
          optimisticVote === "dislike" && [
            "bg-red-600 hover:bg-red-700 text-white border-red-600",
            "shadow-md shadow-red-600/20",
            "ring-2 ring-red-600/20 ring-offset-1",
          ],
          optimisticVote !== "dislike" && [
            "hover:bg-red-50 hover:border-red-300 hover:text-red-700",
            "dark:hover:bg-red-950 dark:hover:border-red-700 dark:hover:text-red-400",
          ],
          (isVoting || isLoading) && "opacity-50 cursor-not-allowed"
        )}
      >
        <ThumbsDown 
          className={cn(
            "h-4 w-4", 
            size === "sm" && "h-3 w-3",
            optimisticVote === "dislike" && "fill-current"
          )} 
        />
        <span className={cn(
          "font-medium",
          size === "sm" ? "text-xs" : "text-sm"
        )}>
         {formatNumber(optimisticDislikes, i18n.language)}
        </span>
      </Button>

      
    </div>
  )
}

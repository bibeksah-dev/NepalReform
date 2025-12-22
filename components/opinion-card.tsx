"use client"

import { useState, useMemo, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, ExternalLink, Clock, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Opinion {
  id: string
  title: string
  description: string
  problem_statement: string
  category: string
  key_points: string[]
  created_at: string
  updated_at: string
}

interface OpinionCardProps {
  opinion: Opinion
  voteCounts?: { likes: number; dislikes: number }
  userVote?: "like" | "dislike" | null
  onVote?: (itemId: string, voteType: "like" | "dislike") => void
  user?: any
}

// Category colors memoized outside component to avoid recreation
const CATEGORY_COLORS: Record<string, string> = {
  Governance: "bg-orange-100 text-orange-800 border-orange-200",
  Democracy: "bg-blue-100 text-blue-800 border-blue-200",
  Justice: "bg-purple-100 text-purple-800 border-purple-200",
  Federalism: "bg-green-100 text-green-800 border-green-200",
  Administration: "bg-slate-100 text-slate-800 border-slate-200",
  Economy: "bg-amber-100 text-amber-800 border-amber-200",
  Education: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Healthcare: "bg-red-100 text-red-800 border-red-200",
  Infrastructure: "bg-cyan-100 text-cyan-800 border-cyan-200",
}

const getCategoryColor = (category: string) =>
  CATEGORY_COLORS[category] || "bg-gray-100 text-gray-800 border-gray-200"

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

function OpinionCardComponent({
  opinion,
  voteCounts = { likes: 0, dislikes: 0 },
  userVote = null,
  onVote,
  user
}: OpinionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleVoteClick = (voteType: "like" | "dislike") => {
    if (!user) {
      window.location.href = "/auth/login"
      return
    }
    onVote?.(opinion.id, voteType)
  }

  // Memoize category color
  const categoryColor = useMemo(() => getCategoryColor(opinion.category), [opinion.category])
  const formattedDate = useMemo(() => formatDate(opinion.created_at), [opinion.created_at])

  return (
    <Card className="w-full transition-all duration-300 hover:shadow-lg border-l-4 border-l-primary">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className={cn("text-xs font-medium", categoryColor)}>
                {opinion.category}
              </Badge>
              <Badge variant="outline" className="text-xs font-medium bg-blue-100 text-blue-800 border-blue-200">
                <Clock className="w-3 h-3 mr-1" />
                {formattedDate}
              </Badge>
            </div>
            <CardTitle className="text-lg font-bold text-foreground leading-tight mb-2">{opinion.title}</CardTitle>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{opinion.description}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="shrink-0 h-8 w-8 p-0">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Key Points Preview */}
        {opinion.key_points && opinion.key_points.length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Key Points</h4>
            <ul className="space-y-1">
              {opinion.key_points.slice(0, 2).map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                  <span className="line-clamp-2">{point}</span>
                </li>
              ))}
              {opinion.key_points.length > 2 && !isExpanded && (
                <li className="text-sm text-muted-foreground italic">
                  +{opinion.key_points.length - 2} more points...
                </li>
              )}
            </ul>
          </div>
        )}
      </CardHeader>

      {/* Expanded Content */}
      {isExpanded && (
        <CardContent className="pt-0 space-y-6">
          {/* Problem Statement */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Problem Statement</h4>
            <p className="text-foreground leading-relaxed bg-muted/50 p-4 rounded-lg border-l-2 border-l-destructive">
              {opinion.problem_statement}
            </p>
          </div>

          {/* All Key Points */}
          {opinion.key_points && opinion.key_points.length > 2 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">All Key Points</h4>
              <ul className="space-y-2">
                {opinion.key_points.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}

      {/* Action Buttons - Always Visible */}
      <CardContent className="pt-0">
        <div className="flex gap-2 pt-4 border-t">
          <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
            <Link href={`/opinion/${opinion.id}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Details
            </Link>
          </Button>

          <Button
            variant={userVote === "like" ? "default" : "outline"}
            size="sm"
            onClick={() => handleVoteClick("like")}
            className={cn(
              "flex items-center gap-1 transition-colors",
              userVote === "like" && "bg-green-600 hover:bg-green-700 text-white",
            )}
          >
            <ThumbsUp className="h-4 w-4" />
            <span className="text-xs">{voteCounts.likes}</span>
          </Button>

          <Button
            variant={userVote === "dislike" ? "destructive" : "outline"}
            size="sm"
            onClick={() => handleVoteClick("dislike")}
            className="flex items-center gap-1 transition-colors"
          >
            <ThumbsDown className="h-4 w-4" />
            <span className="text-xs">{voteCounts.dislikes}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Memoize to prevent unnecessary re-renders when parent updates
export const OpinionCard = memo(OpinionCardComponent)

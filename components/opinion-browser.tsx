"use client"

import { useState, useEffect, useMemo } from "react"
import { OpinionCard } from "./opinion-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Search, Plus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useVoting } from "@/hooks/use-voting"

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

interface OpinionBrowserProps {
  initialOpinions?: Opinion[]
}

const CATEGORIES = [
  "Governance",
  "Democracy",
  "Justice",
  "Federalism",
  "Administration",
  "Economy",
  "Education",
  "Healthcare",
  "Infrastructure",
]

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "title", label: "Title A-Z" },
  { value: "category", label: "Category" },
]

export function OpinionBrowser({ initialOpinions = [] }: OpinionBrowserProps) {
  const [opinions, setOpinions] = useState<Opinion[]>(initialOpinions)
  const [filteredOpinions, setFilteredOpinions] = useState<Opinion[]>(initialOpinions)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState("newest")
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })

  // Batch fetch votes for all visible opinions (eliminates N+1 queries)
  const opinionIds = useMemo(() => filteredOpinions.map(o => o.id), [filteredOpinions])
  const { voteCounts, userVotes, handleVote, user } = useVoting("agenda_votes", opinionIds)

  useEffect(() => {
    fetchOpinions()
  }, [selectedCategory, pagination.page])

  useEffect(() => {
    filterAndSortOpinions()
  }, [opinions, searchQuery, sortBy])

  const fetchOpinions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: "20",
      })

      if (selectedCategory) params.append("category", selectedCategory)

      const response = await fetch(`/api/agendas?${params}`)
      if (!response.ok) throw new Error("Failed to fetch opinions")

      const { data, pagination: paginationData } = await response.json()
      setOpinions(data || [])
      setPagination(paginationData)
    } catch (error) {
      console.error("Error fetching opinions:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortOpinions = () => {
    let filtered = [...opinions]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (opinion) =>
          opinion.title.toLowerCase().includes(query) ||
          opinion.description.toLowerCase().includes(query) ||
          opinion.problem_statement.toLowerCase().includes(query) ||
          opinion.category.toLowerCase().includes(query),
      )
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((opinion) => opinion.category === selectedCategory)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "title":
          return a.title.localeCompare(b.title)
        case "category":
          return a.category.localeCompare(b.category)
        default:
          return 0
      }
    })

    setFilteredOpinions(filtered)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory(null)
    setSortBy("newest")
    setPagination({ page: 1, totalPages: 1 })
  }

  const hasActiveFilters = searchQuery.trim() || selectedCategory

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="space-y-4">
        {/* Search and Create Button */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search opinions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button asChild>
            <Link href="/create-opinion">
              <Plus className="h-4 w-4 mr-2" />
              Create Opinion
            </Link>
          </Button>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filters:</span>
          </div>

          {/* Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={selectedCategory ? "default" : "outline"} size="sm">
                {selectedCategory || "All Categories"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Categories</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedCategory(null)}>All Categories</DropdownMenuItem>
              {CATEGORIES.map((category) => (
                <DropdownMenuItem key={category} onClick={() => setSelectedCategory(category)}>
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchQuery.trim() && (
              <Badge variant="secondary" className="text-xs">
                Search: "{searchQuery}"
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="secondary" className="text-xs">
                Category: {selectedCategory}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredOpinions.length} {filteredOpinions.length === 1 ? "opinion" : "opinions"} found
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Page:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          <span className="text-sm font-medium">{pagination.page}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Opinions Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredOpinions.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOpinions.map((opinion) => (
            <OpinionCard
              key={opinion.id}
              opinion={opinion}
              voteCounts={voteCounts[opinion.id] || { likes: 0, dislikes: 0 }}
              userVote={userVotes[opinion.id] || null}
              onVote={handleVote}
              user={user}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters ? "No opinions match the selected filters." : "No opinions found."}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          ) : (
            <Button asChild>
              <Link href="/create-opinion">
                <Plus className="h-4 w-4 mr-2" />
                Create the First Opinion
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { ManifestoCard } from "./manifesto-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Filter, Search, X, RotateCcw, SlidersHorizontal, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { useHydration } from "@/hooks/use-hydration"
import { useVotes } from "@/hooks/use-cached-data"
import { CacheManager } from "@/lib/cache/cache-manager"
import { Skeleton } from "@/components/ui/skeleton"
import { useManifestoData, ManifestoSummaryItem } from "@/hooks/use-manifesto-data"
import { useTranslation } from 'react-i18next'

// Define Vote interface locally
interface Vote {
  manifesto_id: string;
  vote_type: "like" | "dislike";
  // Add any other properties as needed
}

interface FilterState {
  searchQuery: string
  selectedCategories: string[]
  selectedPriorities: string[]
  timelineRange: [number, number]
  showAdvancedFilters: boolean
}

export function ManifestoList() {
  const { t } = useTranslation('common')
  const isHydrated = useHydration()
  const [randomSeed, setRandomSeed] = useState<number | null>(null)
  // Add error state
  const [error, setError] = useState<Error | null>(null)

  // Use the new i18n-aware hook for summary data
  const { manifestoData, loading: isLoading, getAllCategories } = useManifestoData()
  
  const { data: votesDataRaw = [] } = useVotes()
  
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    selectedCategories: [],
    selectedPriorities: [],
    timelineRange: [6, 60], // months
    showAdvancedFilters: false
  })

  // Error boundary effect
  useEffect(() => {
    if (error) {
      console.error("Error in ManifestoList:", error)
    }
  }, [error])

  // Initialize random seed for shuffle functionality
  useEffect(() => {
    if (manifestoData.length > 0 && randomSeed === null) {
      setRandomSeed(Math.random())
    }
  }, [manifestoData.length, randomSeed])

  // Helper function to convert timeline to months
  const getTimelineInMonths = (timeline: string): number => {
    const timelineMap: Record<string, number> = {
      "180 days": 6,
      "6 months": 6,
      "1 year": 12,
      "18 months": 18,
      "2 years": 24,
      "3 years": 36,
      "5 years": 60,
    }
    return timelineMap[timeline] || 12
  }

  // Memoized computations
  const allCategories = useMemo(() => {
    try {
      return getAllCategories()
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to get categories"))
      return []
    }
  }, [getAllCategories])

  const allPriorities = useMemo(() => ["High", "Medium", "Low"], [])

  const filteredData = useMemo(() => {
    try {
      if (!manifestoData.length) return []

      return manifestoData
        .filter((item: ManifestoSummaryItem) => {
          // Search filter
          if (filters.searchQuery) {
            const searchLower = filters.searchQuery.toLowerCase()
            const matchesTitle = item.title.toLowerCase().includes(searchLower)
            const matchesDescription = item.description.toLowerCase().includes(searchLower)
            const matchesCategory = item.category.toLowerCase().includes(searchLower)
            if (!matchesTitle && !matchesDescription && !matchesCategory) {
              return false
            }
          }

          // Category filter
          if (filters.selectedCategories.length > 0 && !filters.selectedCategories.includes(item.category)) {
            return false
          }

          // Priority filter
          if (filters.selectedPriorities.length > 0 && !filters.selectedPriorities.includes(item.priority)) {
            return false
          }

          // Timeline filter
          const itemTimelineInMonths = getTimelineInMonths(item.timeline)
          if (itemTimelineInMonths < filters.timelineRange[0] || itemTimelineInMonths > filters.timelineRange[1]) {
            return false
          }

          return true
        })
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to filter data"))
      return []
    }
  }, [manifestoData, filters])

  // Get vote counts
  const voteCountsMap = useMemo(() => {
    const votesData = Array.isArray(votesDataRaw) ? votesDataRaw : []
    const map = new Map<string, { likes: number; dislikes: number }>()
    
    votesData.forEach((vote: Vote) => {
      const current = map.get(vote.manifesto_id) || { likes: 0, dislikes: 0 }
      if (vote.vote_type === "like") {
        current.likes += 1
      } else if (vote.vote_type === "dislike") {
        current.dislikes += 1
      }
      map.set(vote.manifesto_id, current)
    })
    
    return map
  }, [votesDataRaw])

  // Sorted data with vote counts
  const sortedData = useMemo(() => {
    if (!filteredData.length) return []
    
    try {
      return [...filteredData].sort((a: ManifestoSummaryItem, b: ManifestoSummaryItem) => {
        const aVotes = voteCountsMap.get(a.id) || { likes: 0, dislikes: 0 }
        const bVotes = voteCountsMap.get(b.id) || { likes: 0, dislikes: 0 }
        
        const aScore = aVotes.likes - aVotes.dislikes
        const bScore = bVotes.likes - bVotes.dislikes
        
        return bScore - aScore
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to sort data"))
      return filteredData
    }
  }, [filteredData, voteCountsMap])

  // Shuffle functionality
  const shuffledData = useMemo(() => {
    if (randomSeed === null || !sortedData.length) return sortedData
    
    try {
      const shuffled = [...sortedData]
      let m = shuffled.length
      
      // Seeded Fisher-Yates shuffle
      while (m) {
        const i = Math.floor((randomSeed * 1000000) % m--)
        const temp = shuffled[m]
        shuffled[m] = shuffled[i]
        shuffled[i] = temp
      }
      
      return shuffled
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to shuffle data"))
      return sortedData
    }
  }, [sortedData, randomSeed])

  // Handler functions - memoized to prevent unnecessary re-renders
  const clearFilters = useCallback(() => {
    setFilters({
      searchQuery: "",
      selectedCategories: [],
      selectedPriorities: [],
      timelineRange: [6, 60],
      showAdvancedFilters: false
    })
  }, [])

  const shuffleData = useCallback(() => {
    setRandomSeed(Math.random())

    // Clear cache to force re-render
    try {
      CacheManager.clearAll()
    } catch (err) {
      console.warn("Failed to clear cache:", err)
    }
  }, [])

  const getTimelineLabel = useCallback((months: number): string => {
    if (months < 12) return t('manifestoList.timelineMonths', { months })
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    if (remainingMonths === 0) {
      return years === 1
        ? t('manifestoList.timelineYears', { years })
        : t('manifestoList.timelineYearsPlural', { years })
    }
    return t('manifestoList.timelineYearsMonths', { years, months: remainingMonths })
  }, [t])

  // Memoized filter update handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }))
  }, [])

  const handleClearSearch = useCallback(() => {
    setFilters(prev => ({ ...prev, searchQuery: "" }))
  }, [])

  const toggleAdvancedFilters = useCallback(() => {
    setFilters(prev => ({ ...prev, showAdvancedFilters: !prev.showAdvancedFilters }))
  }, [])

  const handleCategoryChange = useCallback((category: string, checked: boolean) => {
    if (checked) {
      setFilters(prev => ({
        ...prev,
        selectedCategories: [...prev.selectedCategories, category]
      }))
    } else {
      setFilters(prev => ({
        ...prev,
        selectedCategories: prev.selectedCategories.filter(c => c !== category)
      }))
    }
  }, [])

  const handlePriorityChange = useCallback((priority: string, checked: boolean) => {
    if (checked) {
      setFilters(prev => ({
        ...prev,
        selectedPriorities: [...prev.selectedPriorities, priority]
      }))
    } else {
      setFilters(prev => ({
        ...prev,
        selectedPriorities: prev.selectedPriorities.filter(p => p !== priority)
      }))
    }
  }, [])

  const handleTimelineChange = useCallback((value: number[]) => {
    setFilters(prev => ({ ...prev, timelineRange: value as [number, number] }))
  }, [])

  const hasActiveFilters = filters.searchQuery || 
    filters.selectedCategories.length > 0 || 
    filters.selectedPriorities.length > 0 || 
    filters.timelineRange[0] !== 6 || 
    filters.timelineRange[1] !== 60

  // Loading state
  if (!isHydrated || isLoading) {
    return (
      <div className="space-y-6">
        {/* Filter skeleton */}
        <div className="flex flex-wrap gap-4 items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        {/* Vertical stack skeleton */}
        <div className="space-y-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-4 p-6 border rounded-lg">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <X className="h-12 w-12 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">{t('manifestoList.errorTitle')}</h3>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
        <Button onClick={() => setError(null)} variant="outline">
          {t('manifestoList.tryAgain')}
        </Button>
      </div>
    )
  }

  // Empty state
  if (!manifestoData.length) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">
          <Search className="h-12 w-12 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">{t('manifestoList.noReformsTitle')}</h3>
          <p className="text-sm mt-1">{t('manifestoList.noReformsDescription')}</p>
        </div>
      </div>
    )
  }

  const displayData = shuffledData

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('manifestoList.searchPlaceholder')}
              value={filters.searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-10"
            />
            {filters.searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Advanced Filters Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAdvancedFilters}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t('manifestoList.filters')}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-4 text-xs px-1">
                {[
                  filters.selectedCategories.length,
                  filters.selectedPriorities.length,
                  filters.searchQuery ? 1 : 0,
                  (filters.timelineRange[0] !== 6 || filters.timelineRange[1] !== 60) ? 1 : 0
                ].filter(Boolean).reduce((a, b) => a + b, 0)}
              </Badge>
            )}
          </Button>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={shuffleData} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              {t('manifestoList.shuffle')}
            </Button>
            
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                {t('manifestoList.clear')}
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Filters Collapsible */}
        <Collapsible open={filters.showAdvancedFilters}>
          <CollapsibleContent>
            <div className="grid gap-6 p-4 border rounded-lg bg-muted/30">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('manifestoList.categories')}</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {allCategories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={filters.selectedCategories.includes(category)}
                          onCheckedChange={(checked) => handleCategoryChange(category, !!checked)}
                        />
                        <label htmlFor={category} className="text-sm">
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('manifestoList.priority')}</label>
                  <div className="space-y-2">
                    {allPriorities.map((priority) => (
                      <div key={priority} className="flex items-center space-x-2">
                        <Checkbox
                          id={priority}
                          checked={filters.selectedPriorities.includes(priority)}
                          onCheckedChange={(checked) => handlePriorityChange(priority, !!checked)}
                        />
                        <label htmlFor={priority} className="text-sm">
                          {priority}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t('manifestoList.timeline')} {getTimelineLabel(filters.timelineRange[0])} - {getTimelineLabel(filters.timelineRange[1])}
                  </label>
                  <Slider
                    value={filters.timelineRange}
                    onValueChange={handleTimelineChange}
                    min={6}
                    max={60}
                    step={6}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{t('manifestoList.timelineMonths', { months: 6 })}</span>
                    <span>{t('manifestoList.timelineYearsPlural', { years: 5 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>
          {t('manifestoList.showing', { count: displayData.length, total: manifestoData.length })}
          {hasActiveFilters && ` ${t('manifestoList.filtered')}`}
        </span>
        <span>
          {t('manifestoList.sortedBy')}
        </span>
      </div>

      {/* Results List */}
      {displayData.length > 0 ? (
        <div className="space-y-6">
          {displayData.map((item: ManifestoSummaryItem) => (
            <ManifestoCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <Search className="h-12 w-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">{t('manifestoList.noMatchesTitle')}</h3>
            <p className="text-sm mt-1">{t('manifestoList.noMatchesDescription')}</p>
          </div>
          <Button onClick={clearFilters} variant="outline">
            {t('manifestoList.clearAllFilters')}
          </Button>
        </div>
      )}
    </div>
  )
}

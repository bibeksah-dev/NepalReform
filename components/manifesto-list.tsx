"use client"

import { useState, useMemo, useEffect } from "react"
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
import { useManifestoData, ManifestoItem } from "@/hooks/use-manifesto-data"
import { useTranslation } from "react-i18next"
import { formatNumber } from "@/lib/i18n"

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
  const { t:trans } = useTranslation('translation')
  const { t: common, i18n } = useTranslation('common')
  const isHydrated = useHydration()
  const [randomSeed, setRandomSeed] = useState<number | null>(null)
  // Add error state
  const [error, setError] = useState<Error | null>(null)

  // Use the new i18n-aware hook
  const { manifestoData, loading: isLoading, getAllCategories } = useManifestoData()
  
  const { data: votesDataRaw = [] } = useVotes()
  const votesData: Vote[] = Array.isArray(votesDataRaw) ? votesDataRaw : [];

  // Load filter preferences from cache on mount
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window !== 'undefined') {
      const savedFilters = CacheManager.getLocal<FilterState>(CacheManager.KEYS.FILTER_PREFERENCES)
      if (savedFilters) {
        return savedFilters
      }
    }
    
    const timelineValues = manifestoData && manifestoData.length > 0
      ? (() => {
          const timelines = manifestoData.map((item) => {
            if (!item.timeline) return 1;
            const match = item.timeline.match(/(\d+)/)
            return match ? Number.parseInt(match[1]) : 1
          })
          return [Math.min(...timelines), Math.max(...timelines)]
        })()
      : [0, 5]
    
    return {
      searchQuery: "",
      selectedCategories: [],
      selectedPriorities: [],
      timelineRange: timelineValues as [number, number],
      showAdvancedFilters: false,
    }
  })

  // Save filter preferences to cache when they change
  useEffect(() => {
    if (isHydrated && filters) {
      CacheManager.setLocal(CacheManager.KEYS.FILTER_PREFERENCES, filters, CacheManager.TTL.USER_DATA)
    }
  }, [filters, isHydrated])

  // Only set random seed after hydration to prevent mismatch
  useEffect(() => {
    if (isHydrated) {
      setRandomSeed(Math.random())
    }
  }, [isHydrated])

  const timelineValues = useMemo(() => {
    if (!Array.isArray(manifestoData) || manifestoData.length === 0) return [0, 5]
    const timelines = manifestoData.map((item) => {
      if (!item.timeline) return 1;
      const match = item.timeline.match(/(\d+)/)
      return match ? Number.parseInt(match[1]) : 1
    })
    return [Math.min(...timelines), Math.max(...timelines)]
  }, [manifestoData])

  const categories = useMemo(() => {
    if (!Array.isArray(manifestoData) || manifestoData.length === 0) return []
    return getAllCategories()
  }, [manifestoData])

  const priorities = [common("labels.priority.high"), common("labels.priority.medium"), common("labels.priority.low")]

  const shuffleArray = <T,>(array: T[], seed: number): T[] => {
    const shuffled = [...array]
    let currentIndex = shuffled.length
    let randomIndex: number

    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }

    while (currentIndex !== 0) {
      randomIndex = Math.floor(seededRandom(seed + currentIndex) * currentIndex)
      currentIndex--
      ;[shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]]
    }

    return shuffled
  }

  const filteredItems = useMemo(() => {
    if (!Array.isArray(manifestoData) || manifestoData.length === 0) return []
    const filtered = manifestoData.filter((item: ManifestoItem) => {
      // Defensive property access
      if (!item || typeof item !== 'object') return false;
      // Search query filter
      const searchMatch =
        (!filters.searchQuery || filters.searchQuery === "") ||
        (item.title && item.title.toLowerCase().includes(filters.searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(filters.searchQuery.toLowerCase())) ||
        (item.problem?.short && item.problem.short.toLowerCase().includes(filters.searchQuery.toLowerCase())) ||
        (item.problem?.long && item.problem.long.toLowerCase().includes(filters.searchQuery.toLowerCase()))
      // Category filter
      const categoryMatch =
        !Array.isArray(filters.selectedCategories) || filters.selectedCategories.length === 0 || (item.category && filters.selectedCategories.includes(item.category))
      // Priority filter
      const priorityMatch =
        !Array.isArray(filters.selectedPriorities) || filters.selectedPriorities.length === 0 || (item.priority && filters.selectedPriorities.includes(item.priority))
      // Timeline filter
      const timelineMatch = (() => {
        if (!item.timeline) return true;
        const match = item.timeline.match(/(\d+)/)
        const timelineYears = match ? Number.parseInt(match[1]) : 1
        return timelineYears >= filters.timelineRange[0] && timelineYears <= filters.timelineRange[1]
      })()
      return searchMatch && categoryMatch && priorityMatch && timelineMatch
    })

    // Defensive vote counting
    const itemsWithVotes = filtered.map((item: ManifestoItem) => ({
      ...item,
      voteCount: Array.isArray(votesData)
        ? votesData.filter((vote: Vote) => vote.manifesto_id === item.id).length
        : 0,
    }))

    if (isHydrated && randomSeed !== null) {
      return shuffleArray(itemsWithVotes, randomSeed)
    }
    return itemsWithVotes
  }, [filters, randomSeed, isHydrated, manifestoData, votesData])

  const updateSearchQuery = (query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }))
  }

  const toggleCategory = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter((c) => c !== category)
        : [...prev.selectedCategories, category],
    }))
  }

  const togglePriority = (priority: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedPriorities: prev.selectedPriorities.includes(priority)
        ? prev.selectedPriorities.filter((p) => p !== priority)
        : [...prev.selectedPriorities, priority],
    }))
  }

  const updateTimelineRange = (range: [number, number]) => {
    setFilters((prev) => ({ ...prev, timelineRange: range }))
  }

  const clearAllFilters = () => {
    setFilters({
      searchQuery: "",
      selectedCategories: [],
      selectedPriorities: [],
      timelineRange: [timelineValues[0], timelineValues[1]],
      showAdvancedFilters: false,
    })
  }

  const toggleAdvancedFilters = () => {
    setFilters((prev) => ({ ...prev, showAdvancedFilters: !prev.showAdvancedFilters }))
  }

  const hasActiveFilters =
    filters.searchQuery !== "" ||
    filters.selectedCategories.length > 0 ||
    filters.selectedPriorities.length > 0 ||
    filters.timelineRange[0] !== timelineValues[0] ||
    filters.timelineRange[1] !== timelineValues[1]

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-4 bg-card/50 p-6 rounded-lg border">
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-lg border p-6">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
          <X className="h-6 w-6 text-destructive" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{trans('error.title')}</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {error.message || trans('error.message')}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()} 
          className="mt-4"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {trans('error.retry')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 bg-card/50 p-6 rounded-lg border">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={trans('manifestoList.searchPlaceholder')}
            value={filters.searchQuery}
            onChange={(e) => updateSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {filters.searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateSearchQuery("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">{trans('manifestoList.quickFilters')}</span>
          </div>

          {/* Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={filters.selectedCategories.length > 0 ? "default" : "outline"}
                size="sm"
                className="relative"
              >
                {trans('manifestoList.categories')}
                {filters.selectedCategories.length > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                    {filters.selectedCategories.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>{trans('manifestoList.categories')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {categories.map((category) => (
                <DropdownMenuItem key={category} className="flex items-center space-x-2">
                  <Checkbox
                    checked={filters.selectedCategories.includes(category)}
                    onCheckedChange={() => toggleCategory(category)}
                  />
                  <span>{category}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={filters.selectedPriorities.length > 0 ? "default" : "outline"}
                size="sm"
                className="relative"
              >
                {common('labels.priority.label')}
                {filters.selectedPriorities.length > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                    {filters.selectedPriorities.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuLabel>{trans('manifestoList.priorityLevels')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {priorities.map((priority) => (
                <DropdownMenuItem key={priority} className="flex items-center space-x-2">
                  <Checkbox
                    checked={filters.selectedPriorities.includes(priority)}
                    onCheckedChange={() => togglePriority(priority)}
                  />
                  <span className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        priority === "High" ? "bg-red-500" : priority === "Medium" ? "bg-yellow-500" : "bg-green-500"
                      }`}
                    />
                    {priority} {common('labels.priority.label')}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Advanced Filters Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAdvancedFilters}
            className="flex items-center gap-2 bg-transparent"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {trans('manifestoList.advanced')}
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              {trans('manifestoList.clearAll')}
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        <Collapsible open={filters.showAdvancedFilters}>
          <CollapsibleContent className="space-y-4 pt-4 border-t">
            {/* Timeline Range Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{trans('manifestoList.implementationTimeline')}</label>
                <span className="text-sm text-muted-foreground">    
                    {formatNumber(filters.timelineRange[0], i18n.language)} - {formatNumber(filters.timelineRange[1], i18n.language)} {trans('manifestoList.years')}
                </span>
              </div>
              <Slider
                value={filters.timelineRange}
                onValueChange={(value) => updateTimelineRange(value as [number, number])}
                max={timelineValues[1]}
                min={timelineValues[0]}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                   {formatNumber(timelineValues[0], i18n.language || "en")} {trans("manifestoList.year")} {timelineValues[0] !== 1 ? "s" : ""}

                </span>
                <span>  {formatNumber(timelineValues[1], i18n.language)} {trans("manifestoList.years")}

</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
            <span className="text-sm text-muted-foreground">{trans('manifestoList.activeFilters')}</span>

            {filters.searchQuery && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                Search: "{filters.searchQuery}"
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => updateSearchQuery("")} />
              </Badge>
            )}

            {filters.selectedCategories.map((category) => (
              <Badge key={category} variant="secondary" className="text-xs flex items-center gap-1">
                {category}
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => toggleCategory(category)} />
              </Badge>
            ))}

            {filters.selectedPriorities.map((priority) => (
              <Badge key={priority} variant="secondary" className="text-xs flex items-center gap-1">
                {priority} {common('labels.priority.label')}
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => togglePriority(priority)} />
              </Badge>
            ))}

            {(filters.timelineRange[0] !== timelineValues[0] || filters.timelineRange[1] !== timelineValues[1]) && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    {trans('manifestoList.timeLine')} 
                    {formatNumber(filters.timelineRange[0], i18n.language)}-
                    {formatNumber(filters.timelineRange[1], i18n.language)} 
                    {trans('manifestoList.years')}                <X
                  className="h-3 w-3 cursor-pointer hover:text-foreground"
                  onClick={() => updateTimelineRange([timelineValues[0], timelineValues[1]])}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {trans('manifestoList.reformsDisplay', {
              filtered: formatNumber(Array.isArray(filteredItems) ? filteredItems.length : 0, i18n.language),
              total:formatNumber( Array.isArray(manifestoData) ? manifestoData.length : 0, i18n.language)
            })}
          {hasActiveFilters && trans('manifestoList.filtered')}
              {Array.isArray(votesData) && votesData.length > 0 &&
                ` • ${trans('manifestoList.totalVotes', {
                      votesCount: formatNumber(votesData.length, i18n.language)
                  })}`
              }     
                 </p>
        {Array.isArray(filteredItems) && filteredItems.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              {common('labels.priority.high')}: {filteredItems.filter((item: ManifestoItem & { voteCount: number }) => item.priority === "High").length}
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              {common('labels.priority.medium')}: {filteredItems.filter((item: ManifestoItem & { voteCount: number }) => item.priority === "Medium").length}
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              {common('labels.priority.low')}: {filteredItems.filter((item: ManifestoItem & { voteCount: number }) => item.priority === "Low").length}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-6">
        {Array.isArray(filteredItems) && filteredItems.map((item: ManifestoItem & { voteCount: number }) => (
          <ManifestoCard key={item.id} item={item} />
        ))}
      </div>

      {/* No Results State */}
      {filteredItems.length === 0 && manifestoData.length > 0 && (
        <div className="text-center py-12 space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{trans('manifestoList.noResults.title')}</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {hasActiveFilters
                ? trans('manifestoList.noResults.filtered')
                : trans('manifestoList.noResults.all')}
            </p>
          </div>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearAllFilters} className="mt-4 bg-transparent">
              <RotateCcw className="h-4 w-4 mr-2" />
              {trans('manifestoList.noResults.clearFilters')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

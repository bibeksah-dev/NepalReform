"use client"

import { useEffect, useState } from "react"
import { useParams, notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PhaseCollapsible } from "@/components/phase-collapsible"
import { 
  ArrowLeft, Clock, Target, CheckCircle, AlertTriangle, TrendingUp, 
  Users, Calendar, Scale, Globe, ChevronRight 
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { AgendaVoteSection } from "@/components/agenda-vote-section"
import { SuggestionSection } from "@/components/suggestion-section"
import { ShareDialog } from "@/components/share-dialog"
import { useAgendaSummary, useAgendaDetail, CombinedManifestoItem } from "@/hooks/use-agenda-detail"
import { useManifestoData } from "@/hooks/use-manifesto-data"
import { useTranslation } from "react-i18next"
import { Skeleton } from "@/components/ui/skeleton"

export default function AgendaPage() {
  const params = useParams()
  const agendaId = params?.id as string
  const { t } = useTranslation(['common'])
  const [mounted, setMounted] = useState(false)

  // Load all manifesto data to get total count
  const { manifestoData } = useManifestoData()
  const totalReforms = manifestoData.length || 31 // Use dynamic count with fallback

  // Load summary data first (likely cached)
  const { summaryData, loading: summaryLoading } = useAgendaSummary(agendaId)

  // Load detailed data and combine with summary
  const { combinedData, loading: detailLoading, error } = useAgendaDetail(agendaId, summaryData || undefined)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <AgendaPageSkeleton />
  }

  if (error || (!summaryLoading && !detailLoading && !combinedData)) {
    notFound()
  }

  if (summaryLoading || detailLoading || !combinedData) {
    return <AgendaPageSkeleton />
  }

  return <AgendaPageContent item={combinedData} totalReforms={totalReforms} />
}

function AgendaPageContent({ item, totalReforms }: { item: CombinedManifestoItem; totalReforms: number }) {
  const { t } = useTranslation(['common'])
  
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/#agendas-section">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
              {t('navigation.backToAllReforms', { defaultValue: 'Back to All Reforms' })}
            </Button>
          </Link>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Badge variant="outline" className={cn("text-sm font-medium", getCategoryColor(item.category))}>
              {item.category}
            </Badge>
            <Badge variant="outline" className={cn("text-sm font-medium", getPriorityColor(item.priority))}>
              {getPriorityLabel(item.priority, t)} {t('labels.priority.label', { defaultValue: 'Priority' })}
            </Badge>
            <Badge variant="outline" className="text-sm font-medium bg-blue-100 text-blue-800 border-blue-200">
              <Clock className="w-3 h-3 mr-1" />
              {item.timeline}
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 leading-tight">
            {t('labels.reformNumber', { defaultValue: 'Reform #{{number}}', number: item.id })}: {item.title}
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl">{item.description}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Problem Statement - LONG VERSION */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  {t('sections.problemDetailed', { defaultValue: 'The Problem - Detailed Analysis' })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">{t('tabs.overview', { defaultValue: 'Overview' })}</TabsTrigger>
                    <TabsTrigger value="detailed">{t('tabs.detailedAnalysis', { defaultValue: 'Detailed Analysis' })}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="mt-4">
                    {item.problem.short ? (
                      <div className="p-4 bg-destructive/5 rounded-lg border-l-4 border-l-destructive">
                        <p className="text-foreground leading-relaxed">{item.problem.short}</p>
                      </div>
                    ) : (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground italic">
                          {t('messages.summaryNotAvailable', { defaultValue: 'Summary not available in this view.' })}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="detailed" className="mt-4">
                    <div className="p-4 bg-destructive/5 rounded-lg border-l-4 border-l-destructive">
                      <p className="text-foreground leading-relaxed whitespace-pre-line">{item.problem.long}</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Solutions - LONG VERSION WITH PHASES */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  {t('sections.solutionsPhased', { defaultValue: 'Proposed Solutions - Phased Approach' })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="summary">{t('tabs.summary', { defaultValue: 'Summary' })}</TabsTrigger>
                    <TabsTrigger value="phases">{t('tabs.detailedPhases', { defaultValue: 'Detailed Phases' })}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="summary" className="mt-4">
                    {item.solution.short && item.solution.short.length > 0 ? (
                      <ul className="space-y-3">
                        {item.solution.short.map((solution, index) => (
                          <li key={index} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border-l-4 border-l-primary">
                            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                              {index + 1}
                            </span>
                            <span className="text-foreground leading-relaxed">{solution}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground italic">
                          {t('messages.summaryNotAvailable', { defaultValue: 'Summary not available in this view.' })}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="phases" className="mt-4">
                    {item.solution.long.phases && item.solution.long.phases.length > 0 ? (
                      <div className="space-y-4">
                        {item.solution.long.phases.map((phase, phaseIndex) => (
                          <PhaseCollapsible key={phaseIndex} phase={phase} index={phaseIndex} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        {t('messages.noPhasedDetails', { defaultValue: 'No phased implementation details available.' })}
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Real World Evidence - LONG VERSION */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Globe className="h-5 w-5 text-green-600" />
                  {t('sections.realWorldEvidence', { defaultValue: 'Real World Evidence' })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="summary">{t('tabs.keyExamples', { defaultValue: 'Key Examples' })}</TabsTrigger>
                    <TabsTrigger value="detailed">{t('tabs.detailedEvidence', { defaultValue: 'Detailed Evidence' })}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="summary" className="mt-4">
                    {item.realWorldEvidence.short && item.realWorldEvidence.short.length > 0 ? (
                      <div className="space-y-3">
                        {item.realWorldEvidence.short.map((evidence, index) => (
                          <div key={index} className="p-3 bg-green-50 rounded-lg border-l-4 border-l-green-500">
                            <p className="text-foreground leading-relaxed">{evidence}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground italic">
                          {t('messages.summaryNotAvailable', { defaultValue: 'Summary not available in this view.' })}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="detailed" className="mt-4">
                    <div className="space-y-4">
                      {item.realWorldEvidence.long.map((evidence, index) => (
                        <Card key={index} className="border-green-200 bg-green-50/50">
                          <CardHeader className="pb-3">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Globe className="w-4 h-4 text-green-600" />
                              {evidence.country}
                            </h4>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">
                                {t('labels.implementation', { defaultValue: 'Implementation' })}:
                              </p>
                              <p className="text-sm text-foreground leading-relaxed">{evidence.details}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">
                                {t('labels.impact', { defaultValue: 'Impact' })}:
                              </p>
                              <p className="text-sm text-foreground leading-relaxed font-medium text-green-700">
                                {evidence.impact}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Implementation Timeline - LONG VERSION */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  {t('sections.implementationTimeline', { defaultValue: 'Implementation Timeline' })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">{t('tabs.quickTimeline', { defaultValue: 'Quick Timeline' })}</TabsTrigger>
                    <TabsTrigger value="detailed">{t('tabs.detailedRoadmap', { defaultValue: 'Detailed Roadmap' })}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="mt-4">
                    {item.implementation.short && item.implementation.short.length > 0 ? (
                      <div className="space-y-3">
                        {item.implementation.short.map((step, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <p className="text-foreground leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground italic">
                          {t('messages.summaryNotAvailable', { defaultValue: 'Summary not available in this view.' })}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="detailed" className="mt-4">
                    <div className="space-y-4">
                      {item.implementation.long.map((phase, index) => (
                        <Card key={index} className="border-blue-200 bg-blue-50/30">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="bg-blue-600 text-white border-blue-600">
                                {phase.timeline}
                              </Badge>
                              <h4 className="font-semibold">{phase.description}</h4>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {phase.details.map((detail, detailIndex) => (
                                <li key={detailIndex} className="flex items-start gap-2">
                                  <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-foreground leading-relaxed">{detail}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Performance Targets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Target className="h-5 w-5 text-purple-600" />
                  {t('sections.performanceTargets', { defaultValue: 'Performance Targets' })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {item.performanceTargets.map((target, index) => (
                    <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-start gap-3">
                        <Target className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                        <p className="text-sm text-foreground leading-relaxed">{target}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Legal Foundation */}
            {item.legalFoundation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Scale className="h-5 w-5 text-indigo-600" />
                    {t('sections.legalFoundation', { defaultValue: 'Legal Foundation' })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed bg-indigo-50 p-4 rounded-lg border-l-4 border-l-indigo-500">
                    {item.legalFoundation}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Community Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="h-5 w-5 text-primary" />
                  {t('sections.communitySuggestions', { defaultValue: 'Community Suggestions' })}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {t('messages.suggestionsCTA', { 
                  defaultValue: 'Share your ideas and feedback on this reform proposal. Engage with the community by voting on suggestions from other citizens.' 
                })}
              </CardContent>
              <CardContent>
                <div className="max-h-96 overflow-y-auto pr-2">
                  <SuggestionSection agendaId={item.id} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t('sections.publicSupport', { defaultValue: 'Public Support' })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AgendaVoteSection agendaId={item.id} size="default" className="mb-3" />
                <p className="text-xs text-muted-foreground">
                  {t('messages.voteHelpText', { 
                    defaultValue: 'Vote to help prioritize this reform based on public support and engagement.' 
                  })}
                </p>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('sections.quickInfo', { defaultValue: 'Quick Information' })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('labels.category', { defaultValue: 'Category' })}
                  </label>
                  <p className="text-foreground font-medium">{item.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('labels.priorityLevel', { defaultValue: 'Priority Level' })}
                  </label>
                  <p className="text-foreground font-medium">{getPriorityLabel(item.priority, t)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('labels.implementationTimeline', { defaultValue: 'Implementation Timeline' })}
                  </label>
                  <p className="text-foreground font-medium">{item.timeline}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('labels.reformNumberOf', { defaultValue: 'Reform Number' })}
                  </label>
                  <p className="text-foreground font-medium">#{item.id}</p>
                </div>
                {item.updatedOn && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('labels.lastUpdated', { defaultValue: 'Last Updated' })}
                    </label>
                    <p className="text-foreground font-medium">{item.updatedOn}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('sections.navigateReforms', { defaultValue: 'Navigate Reforms' })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Number.parseInt(item.id) > 1 && (
                  <Link href={`/agenda/${Number.parseInt(item.id) - 1}`}>
                    <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      {t('navigation.previousReform', { defaultValue: 'Previous Reform' })}
                    </Button>
                  </Link>
                )}
                {Number.parseInt(item.id) < totalReforms && (
                  <Link href={`/agenda/${Number.parseInt(item.id) + 1}`}>
                    <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                      {t('navigation.nextReform', { defaultValue: 'Next Reform' })}
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                    </Button>
                  </Link>
                )}
                <Link href="/#agendas-section">
                  <Button variant="secondary" size="sm" className="w-full">
                    {t('navigation.viewAllReforms', { defaultValue: 'View All Reforms' })}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Share & Engage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t('sections.shareEngage', { defaultValue: 'Share & Engage' })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('messages.shareHelpText', { 
                    defaultValue: 'Help spread awareness about this reform proposal and contribute to Nepal\'s democratic transformation.' 
                  })}
                </p>
                <ShareDialog 
                  title={`${t('labels.reformNumber', { number: item.id, defaultValue: 'Reform #{{number}}' })}: ${item.title}`} 
                  description={item.description} 
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="bg-muted/50 border-t py-12 mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center items-center gap-3">
              <img src="/nepal-flag-logo.png" alt="NepalReforms Logo" className="w-8 h-8 object-contain" loading="lazy" />
              <span className="text-lg font-semibold text-foreground">NepalReforms</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('footer.tagline', { defaultValue: 'Empowering Nepal\'s youth to shape democratic reforms' })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('footer.copyright', { defaultValue: '© 2024 Nexalaris Tech Company. All rights reserved.' })}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function AgendaPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Skeleton className="h-10 w-48" />
        </div>
        
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-full max-w-4xl" />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-64" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function getCategoryColor(category: string) {
  const colors = {
    "Anti-Corruption": "bg-red-100 text-red-800 border-red-200",
    "Electoral Reform": "bg-blue-100 text-blue-800 border-blue-200",
    Federalism: "bg-green-100 text-green-800 border-green-200",
    Transparency: "bg-purple-100 text-purple-800 border-purple-200",
    Governance: "bg-orange-100 text-orange-800 border-orange-200",
    "Constitutional Reform": "bg-indigo-100 text-indigo-800 border-indigo-200",
    "Digital Governance": "bg-teal-100 text-teal-800 border-teal-200",
    "Procurement Reform": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Competition Policy": "bg-pink-100 text-pink-800 border-pink-200",
    Transportation: "bg-cyan-100 text-cyan-800 border-cyan-200",
    Education: "bg-lime-100 text-lime-800 border-lime-200",
    "Economic Development": "bg-amber-100 text-amber-800 border-amber-200",
    "Education Reform": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Security Reform": "bg-slate-100 text-slate-800 border-slate-200",
    "Investment Policy": "bg-violet-100 text-violet-800 border-violet-200",
    "Civil Service Reform": "bg-rose-100 text-rose-800 border-rose-200",
    "Judicial Reform": "bg-sky-100 text-sky-800 border-sky-200",
    "Financial Transparency": "bg-stone-100 text-stone-800 border-stone-200",
    "Public Administration": "bg-neutral-100 text-neutral-800 border-neutral-200",
    Healthcare: "bg-red-100 text-red-800 border-red-200",
    "Social Protection": "bg-blue-100 text-blue-800 border-blue-200",
    "Financial Management": "bg-green-100 text-green-800 border-green-200",
  }
  return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
}

function getPriorityColor(priority: string) {
  const colors = {
    High: "bg-red-100 text-red-800 border-red-200",
    Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Low: "bg-green-100 text-green-800 border-green-200",
  }
  return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
}

function getPriorityLabel(priority: string, t: any) {
  const priorityKey = priority.toLowerCase() as 'high' | 'medium' | 'low';
  return t(`labels.priority.${priorityKey}`, { defaultValue: priority });
}

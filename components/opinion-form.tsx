"use client"
import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, X, Send } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslation } from 'react-i18next'

export function OpinionForm() {
    const { t } = useTranslation('translation')

    const CATEGORIES =t("opinionCreation.categories", { returnObjects: true }) as string[]

    const PRIORITY_LEVELS = t("opinionCreation.priorityLevels", { returnObjects: true }) as string[]

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    problem_statement: "",
    category: "",
    priority_level:  PRIORITY_LEVELS[1],
    implementation_timeline: "",
  })

  const [keyPoints, setKeyPoints] = useState<string[]>([""])
  const [proposedSolutions, setProposedSolutions] = useState<string[]>([""])
  const [expectedOutcomes, setExpectedOutcomes] = useState<string[]>([""])
  const [stakeholders, setStakeholders] = useState<string[]>([""])
  const [tags, setTags] = useState<string[]>([])
  const [references, setReferences] = useState<string[]>([""])
  const [newTag, setNewTag] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (array: string[], setArray: (arr: string[]) => void, index: number, value: string) => {
    const newArray = [...array]
    newArray[index] = value
    setArray(newArray)
  }

  const addArrayItem = (array: string[], setArray: (arr: string[]) => void) => {
    setArray([...array, ""])
  }

  const removeArrayItem = (array: string[], setArray: (arr: string[]) => void, index: number) => {
    if (array.length > 1) {
      setArray(array.filter((_, i) => i !== index))
    }
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      // Filter out empty values from arrays
      const cleanedData = {
        ...formData,
        key_points: keyPoints.filter((point) => point.trim()),
        proposed_solutions: proposedSolutions.filter((solution) => solution.trim()),
        expected_outcomes: expectedOutcomes.filter((outcome) => outcome.trim()),
        stakeholders: stakeholders.filter((stakeholder) => stakeholder.trim()),
        references: references.filter((ref) => ref.trim()),
        tags,
        status: "Draft", // New opinions start as drafts
        user_id: user.id,
      }

      const { error } = await supabase.from("agendas").insert(cleanedData)

      if (error) throw error

      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "opinion",
            data: cleanedData,
          }),
        })
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError)
        // Don't fail the request if email fails
      }

      toast.success(t('opinionCreation.successMessage'))
      router.push("/")
    } catch (error) {
      console.error("Error submitting opinion:", error)
      toast.error(t('opinionCreation.errorMessage'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const ArrayInput = ({
    label,
    array,
    setArray,
    placeholder,
  }: {
    label: string
    array: string[]
    setArray: (arr: string[]) => void
    placeholder: string
  }) => (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      {array.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Textarea
            value={item}
            onChange={(e) => handleArrayChange(array, setArray, index, e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="flex-1"
          />
          {array.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeArrayItem(array, setArray, index)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => addArrayItem(array, setArray)}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        {t("opinionCreation.add")} {label.slice(0, -1)}
      </Button>
    </div>
  )

  return (
        <div className="min-h-screen bg-background">

    <h1 className="text-3xl font-bold text-foreground mb-2">{t('opinionCreation.createOpinionTitle')}</h1> {/* Update to use the translation key */}
            <p className="text-muted-foreground">
              {t('opinionCreation.createOpinionDescription')}
            </p>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          {t('opinionCreation.shareYourAgenda')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                {t('opinionCreation.agendaTitle')} *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder={t('opinionCreation.agendaTitlePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                {t('opinionCreation.category')} *
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('opinionCreation.categoryPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(CATEGORIES) &&
                      CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium">
                {t('opinionCreation.priorityLevelPlaceholder')}
              </Label>
              <Select
                value={formData.priority_level}
                onValueChange={(value) => handleInputChange("priority_level", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('opinionCreation.priorityLevelPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(PRIORITY_LEVELS) &&
                    PRIORITY_LEVELS.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Problem Statement */}
          <div className="space-y-2">
            <Label htmlFor="problem" className="text-sm font-medium">
              {t('opinionCreation.problemStatement')}
            </Label>
            <Textarea
              id="problem"
              value={formData.problem_statement}
              onChange={(e) => handleInputChange("problem_statement", e.target.value)}
              placeholder={t('opinionCreation.problemStatementPlaceholder')}
              rows={4}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              {t('opinionCreation.detailedDescription')}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder={t('opinionCreation.detailedDescriptionPlaceholder')}
              rows={6}
              required
            />
          </div>

          {/* Key Points */}
          <ArrayInput
            label={t('opinionCreation.keyPoints')}
            array={keyPoints}
            setArray={setKeyPoints}
            placeholder={t('opinionCreation.keyPointsPlaceholder')}
          />

          {/* Proposed Solutions */}
          <ArrayInput
            label={t('opinionCreation.proposedSolutions')}
            array={proposedSolutions}
            setArray={setProposedSolutions}
            placeholder={t('opinionCreation.proposedSolutionsPlaceholder')}
          />

          {/* Expected Outcomes */}
          <ArrayInput
            label={t('opinionCreation.expectedOutcomes')}
            array={expectedOutcomes}
            setArray={setExpectedOutcomes}
            placeholder={t('opinionCreation.expectedOutcomesPlaceholder')}
          />

          {/* Implementation Timeline */}
          <div className="space-y-2">
            <Label htmlFor="timeline" className="text-sm font-medium">
              {t('opinionCreation.implementationTimeline')}
            </Label>
            <Textarea
              id="timeline"
              value={formData.implementation_timeline}
              onChange={(e) => handleInputChange("implementation_timeline", e.target.value)}
              placeholder={t('opinionCreation.implementationTimelinePlaceholder')}
              rows={3}
            />
          </div>

          {/* Stakeholders */}
          <ArrayInput
            label={t('opinionCreation.keyStakeholders')}
            array={stakeholders}
            setArray={setStakeholders}
            placeholder={t('opinionCreation.keyStakeholdersPlaceholder')}
          />

          {/* Tags */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('opinionCreation.tags')}</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder={t('opinionCreation.tagsPlaceholder')}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* References */}
          <ArrayInput
            label={t('opinionCreation.references')}
            array={references}
            setArray={setReferences}
            placeholder={t('opinionCreation.referencesPlaceholder')}
          />

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <Button type="button" variant="outline" onClick={() => router.push("/")} className="flex-1">
              {t('opinionCreation.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.title ||
                !formData.category ||
                !formData.problem_statement ||
                !formData.description
              }
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('opinionCreation.submitting')}...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t('opinionCreation.submitOpinion')}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
        </div>
  )
}

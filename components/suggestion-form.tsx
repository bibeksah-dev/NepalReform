"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

interface SuggestionFormProps {
  agendaId: string
  onSuggestionAdded?: () => void
}

export function SuggestionForm({ agendaId, onSuggestionAdded }: SuggestionFormProps) {
  const [content, setContent] = useState("")
  const [authorName, setAuthorName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { t } = useTranslation('translation')

  const supabase = createClient()

  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) console.error("Error getting session:", error)
        setUser(session?.user ?? null)
      } catch (err) {
        console.error("Error getting session:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()

    // Listen for login/logout/session refresh
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event: "SIGNED_IN" | "SIGNED_OUT" | "USER_UPDATED" | "USER_DELETED" | "PASSWORD_RECOVERY" | "TOKEN_REFRESHED" | "MFA_CHALLENGE_VERIFIED" | "MFA_VERIFIED" | "MFA_ENROLL", session: { user?: { id: string; email: string } } | null) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      window.location.href = "/auth/login"
      return
    }

    if (!content.trim() || !authorName.trim()) {
      setError("Please fill in all fields")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agenda_id: agendaId,
          content: content.trim(),
          author_name: authorName.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit suggestion")
      }

      const result = await response.json()
      
      // Show success message
      setSuccessMessage(result.message || "Thank you for your suggestion!")
      
      // Reset form
      setContent("")
      setAuthorName("")
      
      // Clear success message after 7 seconds
      setTimeout(() => setSuccessMessage(null), 7000)
      
      onSuggestionAdded?.()
    } catch (err) {
      console.error("Error submitting suggestion:", err)
      setError(err instanceof Error ? err.message : "Failed to submit suggestion")
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            <p className="text-muted-foreground">{t('suggestionForm.loading')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">{t('suggestionForm.signInPrompt')}</p>
            <Button asChild>
              <a href="/auth/login">Sign In</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
           {t('suggestionForm.shareYourSuggestion')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs underline hover:no-underline mt-1"
            >
              {t('suggestionForm.dismiss')}
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-xs underline hover:no-underline mt-1 text-green-700"
            >
              {t('suggestionForm.dismiss')}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="author-name" className="text-sm font-medium">
              {t('suggestionForm.yourName')}
            </Label>
            <Input
              id="author-name"
              placeholder={t('suggestionForm.yourNamePlaceholder')}
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required
              className="bg-background"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="suggestion-content" className="text-sm font-medium">
              {t('suggestionForm.yourSuggestion')}
            </Label>
            <Textarea
              id="suggestion-content"
              placeholder={t('suggestionForm.yourSuggestionPlaceholder')}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={4}
              className="bg-background resize-none"
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !content.trim() || !authorName.trim()}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('suggestionForm.submitting')}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {t('suggestionForm.submitButton')}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

type AuthChangeEvent =
  | "SIGNED_IN"
  | "SIGNED_OUT"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "PASSWORD_RECOVERY"
  | "TOKEN_REFRESHED"
  | "MFA_CHALLENGE_VERIFIED"
  | "MFA_VERIFIED"
  | "MFA_ENROLL";
interface Session {
  user: {
    id: string;
    email: string;
    // add more user fields if your app needs
  }
  // add other session properties if required
}

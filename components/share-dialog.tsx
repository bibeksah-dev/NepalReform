"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Share2, Copy, Facebook, Twitter, Linkedin, MessageCircle, Instagram, Mail } from "lucide-react"
import { useTranslation } from "react-i18next"

interface ShareDialogProps {
  title: string
  description: string
  url?: string
  children?: React.ReactNode
}

export function ShareDialog({ title, description, url, children }: ShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "")
  const shareText = `Check out this reform proposal: ${title}`
  const { t } = useTranslation('common')

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Link copied!",
        description: "The link has been copied to your clipboard.",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      })
    }
  }

  const shareOnPlatform = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedText = encodeURIComponent(shareText)
    const encodedTitle = encodeURIComponent(title)

    let shareLink = ""

    switch (platform) {
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
        break
      case "linkedin":
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        break
      case "whatsapp":
        shareLink = `https://wa.me/?text=${encodedText}%20${encodedUrl}`
        break
      case "email":
        shareLink = `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`
        break
      default:
        return
    }

    if (platform === "email") {
      window.location.href = shareLink
    } else {
      window.open(shareLink, "_blank", "width=600,height=400")
    }

    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="w-full" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            {t('actions.shareThisReform')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('actions.shareThisReform')}
          </DialogTitle>
          <DialogDescription>
            {t('descriptions.shareHelp')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Copy Link Section */}
          <div className="space-y-2">
            <Label htmlFor="share-url">{t('sections.shareLink')}</Label>
            <div className="flex gap-2">
              <Input id="share-url" value={shareUrl} readOnly className="flex-1" />
              <Button type="button" size="sm" onClick={copyToClipboard} className="px-3">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Social Media Buttons */}
          <div className="space-y-3">
            <Label>Share on Social Media</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnPlatform("facebook")}
                className="justify-start gap-2"
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                Facebook
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnPlatform("twitter")}
                className="justify-start gap-2"
              >
                <Twitter className="h-4 w-4 text-blue-400" />
                Twitter
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnPlatform("linkedin")}
                className="justify-start gap-2"
              >
                <Linkedin className="h-4 w-4 text-blue-700" />
                LinkedIn
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnPlatform("whatsapp")}
                className="justify-start gap-2"
              >
                <MessageCircle className="h-4 w-4 text-green-600" />
                WhatsApp
              </Button>
            </div>

            {/* Email and Instagram in separate row */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnPlatform("email")}
                className="justify-start gap-2"
              >
                <Mail className="h-4 w-4 text-gray-600" />
                Email
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  copyToClipboard()
                  toast({
                    title: "Link copied for Instagram!",
                    description: "Paste this link in your Instagram bio or story.",
                  })
                  setIsOpen(false)
                }}
                className="justify-start gap-2"
              >
                <Instagram className="h-4 w-4 text-pink-600" />
                Instagram
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

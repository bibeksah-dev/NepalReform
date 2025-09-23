"use client"
// import '@/i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useTranslation } from 'next-i18next'

export default function Page() {
  const { t } = useTranslation('translation')
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <img src="/nepal-flag-logo.png" alt="NepalReforms Logo" className="w-12 h-12 object-contain" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">{t('signupSuccess.welcome')}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('signupSuccess.checkEmail')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('signupSuccess.successMessage')}
            </p>
            <Link href="/auth/login" className="inline-block text-primary hover:underline font-medium">
              {t('signupSuccess.backToLogin')}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

 "use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { validateEmail } from "@/lib/utils/auth-validation"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Eye, EyeOff, AlertCircle, CheckCircle, Mail } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

export default function LoginPage() {
  const { t } = useTranslation("translation") // 👈 using your translation.json
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})
  const [emailTouched, setEmailTouched] = useState(false)

  const { signIn, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/"

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(redirectTo)
    }
  }, [user, router, redirectTo])

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = t("login.emailRequired")
    } else if (!validateEmail(email)) {
      newErrors.email = t("login.invalidEmail")
    }

    if (!password) {
      newErrors.password = t("login.passwordRequired")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleEmailBlur = () => {
    setEmailTouched(true)
    if (email && !validateEmail(email)) {
      setErrors((prev) => ({ ...prev, email: t("login.invalidEmail") }))
    } else {
      setErrors((prev) => ({ ...prev, email: undefined }))
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)

    if (emailTouched) {
      if (!value) {
        setErrors((prev) => ({ ...prev, email: t("login.emailRequired") }))
      } else if (!validateEmail(value)) {
        setErrors((prev) => ({ ...prev, email: t("login.invalidEmail") }))
      } else {
        setErrors((prev) => ({ ...prev, email: undefined }))
      }
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const { user, error } = await signIn(email, password)

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrors({ general: t("login.invalidCredentials") })
        } else if (error.message.includes("Email not confirmed")) {
          setErrors({ general: t("login.emailNotConfirmed") })
        } else if (error.message.includes("Too many requests")) {
          setErrors({ general: t("login.tooManyRequests") })
        } else {
          setErrors({ general: error.message })
        }
        return
      }

      if (user) {
        toast.success(t("login.welcomeBack"), {
          description: t("login.signedInSuccess"),
        })
        router.push(redirectTo)
      }
    } catch (err) {
      console.error("Login error:", err)
      setErrors({ general: t("login.unexpectedError") })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <img src="/nepal-flag-logo.png" alt="NepalReforms Logo" className="w-12 h-12 object-contain" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">{t("login.welcomeBack")}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t("login.signInDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t("login.emailAddress")}
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    className={`h-12 pr-10 ${
                      errors.email ? "border-red-500" : emailTouched && validateEmail(email) ? "border-green-500" : ""
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {emailTouched &&
                      (validateEmail(email) ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : email ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      ))}
                  </div>
                </div>
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t("login.password")}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`h-12 pr-10 ${errors.password ? "border-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>

              {errors.general && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
                {isLoading ? t("login.signingIn") : t("login.signIn")}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="text-center">
                <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                  {t("login.forgotPassword", "Forgot your password?")}
                </Link>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {t("login.noAccount")}{" "}
                  <Link href="/auth/sign-up" className="text-primary hover:underline font-medium">
                    {t("login.signUp")}
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t("login.poweredBy")}{" "}
            <Link href="https://nexalaris.com/" target="_blank" className="text-primary hover:underline font-medium">
              Nexalaris Tech Pvt. Ltd
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PasswordStrengthIndicator } from "@/components/password-strength-indicator"
import { useAuth } from "@/contexts/auth-context"
import { validateEmail, validatePassword } from "@/lib/utils/auth-validation"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Eye, EyeOff, AlertCircle, CheckCircle, Mail, User } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

export default function SignUpPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeatPassword, setShowRepeatPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    repeatPassword?: string
    fullName?: string
    general?: string
  }>({})
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    repeatPassword: false,
    fullName: false,
  })

  const { signUp, user } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleFieldTouch = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const validateForm = () => {
    const newErrors: typeof errors = {}

    // Full name validation
    if (!fullName.trim()) {
      newErrors.fullName = t("signup.errors.fullNameRequired")
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = t("signup.errors.fullNameMin")
    }

    // Email validation
    if (!email) {
      newErrors.email = t("signup.errors.emailRequired")
    } else if (!validateEmail(email)) {
      newErrors.email = t("signup.errors.emailInvalid")
    }

    // Password validation
    const passwordValidation = validatePassword(password)
    if (!password) {
      newErrors.password = t("signup.errors.passwordRequired")
    } else if (!passwordValidation.isValid) {
      newErrors.password = t("signup.errors.passwordInvalid")
    }

    // Repeat password validation
    if (!repeatPassword) {
      newErrors.repeatPassword = t("signup.errors.repeatPasswordRequired")
    } else if (password !== repeatPassword) {
      newErrors.repeatPassword = t("signup.errors.repeatPasswordMismatch")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFieldValidation = (field: string, value: string) => {
    const newErrors = { ...errors }

    switch (field) {
      case 'fullName':
        if (touched.fullName) {
          if (!value.trim()) {
            newErrors.fullName = t("signup.errors.fullNameRequired")
          } else if (value.trim().length < 2) {
            newErrors.fullName = t("signup.errors.fullNameMin")
          } else {
            delete newErrors.fullName
          }
        }
        break
      case 'email':
        if (touched.email) {
          if (!value) {
            newErrors.email = t("signup.errors.emailRequired")
          } else if (!validateEmail(value)) {
            newErrors.email = t("signup.errors.emailInvalid")
          } else {
            delete newErrors.email
          }
        }
        break
      case 'password':
        if (touched.password) {
          const passwordValidation = validatePassword(value)
          if (!value) {
            newErrors.password = t("signup.errors.passwordRequired")
          } else if (!passwordValidation.isValid) {
            newErrors.password = t("signup.errors.passwordInvalid")
          } else {
            delete newErrors.password
          }
        }
        // Also revalidate repeat password if it was touched
        if (touched.repeatPassword) {
          if (repeatPassword && value !== repeatPassword) {
            newErrors.repeatPassword = t("signup.errors.passwordMismatch")
          } else if (repeatPassword && value === repeatPassword) {
            delete newErrors.repeatPassword
          }
        }
        break
      case 'repeatPassword':
        if (touched.repeatPassword) {
          if (!value) {
            newErrors.repeatPassword = t("signup.errors.repeatPasswordRequired")
          } else if (password !== value) {
            newErrors.repeatPassword = t("signup.errors.passwordMismatch")
          } else {
            delete newErrors.repeatPassword
          }
        }
        break
    }

    setErrors(newErrors)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const { user, error } = await signUp(email, password, fullName.trim())

      if (error) {
        // Handle specific error types
        if (error.message.includes('User already registered')) {
          setErrors({ email: t("signup.errors.emailExists") })
        } else if (error.message.includes('Password should be')) {
          setErrors({ password: error.message })
        } else if (error.message.includes('Unable to validate email address')) {
          setErrors({ email: t("signup.errors.emailInvalid") })
        } else if (error.message.includes('Signup is disabled')) {
          setErrors({ general: t("signup.errors.signupDisabled") })
        } else {
          setErrors({ general: error.message })
        }
        return
      }

      if (user) {
        toast.success(t("signup.success.accountCreated"), {
          description: t("signup.success.checkEmail"),
        })
        router.push('/auth/sign-up-success')
      }
    } catch (err) {
      console.error('Sign up error:', err)
      setErrors({ general: t("signup.errors.unexpectedError") })
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
            <CardTitle className="text-2xl font-bold text-foreground">{t("signup.joinNepalReforms")}</CardTitle>
            <CardDescription className="text-muted-foreground">
               {t("signup.createAccountDescription").split("\n").map((line, i) => (
    <p key={i}>{line}</p>
  ))}
   </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  {t("signup.fullName")}
                </Label>
                <div className="relative">
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={t("signup.fullNamePlaceholder")}
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      handleFieldValidation('fullName', e.target.value)
                    }}
                    onBlur={() => handleFieldTouch('fullName')}
                    className={`h-12 pr-10 ${errors.fullName ? 'border-red-500' : touched.fullName && fullName.trim().length >= 2 ? 'border-green-500' : ''}`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {touched.fullName && (
                      fullName.trim().length >= 2 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : fullName ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )
                    )}
                  </div>
                </div>
                {errors.fullName && (
                  <p className="text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t("signup.emailAddress")}
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      handleFieldValidation('email', e.target.value)
                    }}
                    onBlur={() => handleFieldTouch('email')}
                    className={`h-12 pr-10 ${errors.email ? 'border-red-500' : touched.email && validateEmail(email) ? 'border-green-500' : ''}`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {touched.email && (
                      validateEmail(email) ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : email ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      )
                    )}
                  </div>
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t("signup.password")}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      handleFieldValidation('password', e.target.value)
                    }}
                    onBlur={() => handleFieldTouch('password')}
                    className={`h-12 pr-10 ${errors.password ? 'border-red-500' : ''}`}
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
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
                {password && <PasswordStrengthIndicator password={password} />}
              </div>

              <div className="space-y-2">
                <Label htmlFor="repeat-password" className="text-sm font-medium">
                  {t("signup.confirmPassword")}
                </Label>
                <div className="relative">
                  <Input
                    id="repeat-password"
                    type={showRepeatPassword ? "text" : "password"}
                    required
                    value={repeatPassword}
                    onChange={(e) => {
                      setRepeatPassword(e.target.value)
                      handleFieldValidation('repeatPassword', e.target.value)
                    }}
                    onBlur={() => handleFieldTouch('repeatPassword')}
                    className={`h-12 pr-10 ${errors.repeatPassword ? 'border-red-500' : touched.repeatPassword && password === repeatPassword && repeatPassword ? 'border-green-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showRepeatPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                {errors.repeatPassword && (
                  <p className="text-sm text-red-600">{errors.repeatPassword}</p>
                )}
                {touched.repeatPassword && password === repeatPassword && repeatPassword && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>{t("signup.passwordsMatch")}</span>
                  </div>
                )}
              </div>

              {errors.general && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
                {isLoading ? t("signup.creatingAccount") : t("signup.createAccount")}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t("signup.alreadyHaveAccount")}{" "}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  {t("signup.signIn")}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t("signup.poweredBy")}{" "}
            <Link href="https://nexalaris.com/" target="_blank" className="text-primary hover:underline font-medium">
              Nexalaris Tech Pvt. Ltd.
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}


// "use client"

// import type React from "react"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Alert, AlertDescription } from "@/components/ui/alert"
// import { PasswordStrengthIndicator } from "@/components/password-strength-indicator"
// import { useAuth } from "@/contexts/auth-context"
// import { validateEmail, validatePassword } from "@/lib/utils/auth-validation"
// import Link from "next/link"
// import { useRouter } from "next/navigation"
// import { useState, useEffect } from "react"
// import { Eye, EyeOff, AlertCircle, CheckCircle, Mail, User } from "lucide-react"
// import { toast } from "sonner"
// import { useTranslation } from "react-i18next"

// export default function SignUpPage() {
//   const { t } = useTranslation("translation") // ✅ use signup namespace keys
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [repeatPassword, setRepeatPassword] = useState("")
//   const [fullName, setFullName] = useState("")
//   const [showPassword, setShowPassword] = useState(false)
//   const [showRepeatPassword, setShowRepeatPassword] = useState(false)
//   const [isLoading, setIsLoading] = useState(false)
//   const [errors, setErrors] = useState<{
//     email?: string
//     password?: string
//     repeatPassword?: string
//     fullName?: string
//     general?: string
//   }>({})
//   const [touched, setTouched] = useState({
//     email: false,
//     password: false,
//     repeatPassword: false,
//     fullName: false,
//   })

//   const { signUp, user } = useAuth()
//   const router = useRouter()

//   useEffect(() => {
//     if (user) {
//       router.push('/dashboard')
//     }
//   }, [user, router])

//   const handleFieldTouch = (field: keyof typeof touched) => {
//     setTouched(prev => ({ ...prev, [field]: true }))
//   }

//   const validateForm = () => {
//     const newErrors: typeof errors = {}
//     if (!fullName.trim()) {
//       newErrors.fullName = t("signup.fullName") + " " + t("signup.required")
//     } else if (fullName.trim().length < 2) {
//       newErrors.fullName = t("signup.fullName") + " " + t("signup.minChars")
//     }
//     if (!email) {
//       newErrors.email = t("login.emailRequired")
//     } else if (!validateEmail(email)) {
//       newErrors.email = t("login.invalidEmail")
//     }
//     const passwordValidation = validatePassword(password)
//     if (!password) {
//       newErrors.password = t("login.passwordRequired")
//     } else if (!passwordValidation.isValid) {
//       newErrors.password = t("signup.invalidPassword")
//     }
//     if (!repeatPassword) {
//       newErrors.repeatPassword = t("signup.confirmPasswordRequired")
//     } else if (password !== repeatPassword) {
//       newErrors.repeatPassword = t("signup.passwordsDoNotMatch")
//     }
//     setErrors(newErrors)
//     return Object.keys(newErrors).length === 0
//   }

//   const handleSignUp = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!validateForm()) return
//     setIsLoading(true)
//     setErrors({})
//     try {
//       const { user, error } = await signUp(email, password, fullName.trim())
//       if (error) {
//         setErrors({ general: error.message })
//         return
//       }
//       if (user) {
//         toast.success(t("signup.success"), {
//           description: t("signup.checkEmail"),
//         })
//         router.push('/auth/sign-up-success')
//       }
//     } catch (err) {
//       console.error('Sign up error:', err)
//       setErrors({ general: t("login.unexpectedError") })
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-6">
//       <div className="w-full max-w-md">
//         <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
//           <CardHeader className="text-center space-y-4">
//             <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
//               <img src="/nepal-flag-logo.png" alt="NepalReforms Logo" className="w-12 h-12 object-contain" />
//             </div>
//             <CardTitle className="text-2xl font-bold text-foreground">
//               {t("signup.joinNepalReforms")}
//             </CardTitle>
//             <CardDescription className="text-muted-foreground">
//               {t("signup.createAccountDescription")}
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <form onSubmit={handleSignUp} className="space-y-6">
//               <div className="space-y-2">
//                 <Label htmlFor="fullName" className="text-sm font-medium">
//                   {t("signup.fullName")}
//                 </Label>
//                 <Input
//                   id="fullName"
//                   type="text"
//                   placeholder={t("signup.fullNamePlaceholder") || ""}
//                   required
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   onBlur={() => handleFieldTouch('fullName')}
//                   className="h-12"
//                 />
//                 {errors.fullName && <p className="text-sm text-red-600">{errors.fullName}</p>}
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="email" className="text-sm font-medium">
//                   {t("signup.emailAddress")}
//                 </Label>
//                 <Input
//                   id="email"
//                   type="email"
//                   placeholder="your.email@example.com"
//                   required
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   onBlur={() => handleFieldTouch('email')}
//                   className="h-12"
//                 />
//                 {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="password" className="text-sm font-medium">
//                   {t("signup.password")}
//                 </Label>
//                 <Input
//                   id="password"
//                   type={showPassword ? "text" : "password"}
//                   required
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   onBlur={() => handleFieldTouch('password')}
//                   className="h-12"
//                 />
//                 {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
//                 {password && <PasswordStrengthIndicator password={password} />}
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="repeat-password" className="text-sm font-medium">
//                   {t("signup.confirmPassword")}
//                 </Label>
//                 <Input
//                   id="repeat-password"
//                   type={showRepeatPassword ? "text" : "password"}
//                   required
//                   value={repeatPassword}
//                   onChange={(e) => setRepeatPassword(e.target.value)}
//                   onBlur={() => handleFieldTouch('repeatPassword')}
//                   className="h-12"
//                 />
//                 {errors.repeatPassword && <p className="text-sm text-red-600">{errors.repeatPassword}</p>}
//               </div>

//               {errors.general && (
//                 <Alert variant="destructive">
//                   <AlertCircle className="h-4 w-4" />
//                   <AlertDescription>{errors.general}</AlertDescription>
//                 </Alert>
//               )}

//               <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
//                 {isLoading ? t("signup.creatingAccount") : t("signup.createAccount")}
//               </Button>
//             </form>

//             <div className="mt-6 text-center">
//               <p className="text-sm text-muted-foreground">
//                 {t("signup.alreadyHaveAccount")}{" "}
//                 <Link href="/auth/login" className="text-primary hover:underline font-medium">
//                   {t("signup.signIn")}
//                 </Link>
//               </p>
//             </div>
//           </CardContent>
//         </Card>

//         <div className="mt-6 text-center">
//           <p className="text-sm text-muted-foreground">
//             {t("signup.poweredBy")}{" "}
//             <Link href="https://nexalaris.com/" target="_blank" className="text-primary hover:underline font-medium">
//               Nexalaris Tech Pvt. Ltd.
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   )
// }

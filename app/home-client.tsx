"use client"

import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import Link from "next/link"
import { useTranslation } from "react-i18next"
import dynamic from "next/dynamic"

// Lazy load heavy components
const ManifestoList = dynamic(
  () => import("@/components/manifesto-list").then(mod => ({ default: mod.ManifestoList })),
  { ssr: true, loading: () => <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div> }
)

const TestimonialCarousel = dynamic(
  () => import("@/components/testimonial-carousel").then(mod => ({ default: mod.TestimonialCarousel })),
  { ssr: true }
)

export default function HomeClient() {
  const { t } = useTranslation('common')

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <HeroSection />

        <section id="agendas-section" className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                <span suppressHydrationWarning>{t('home.manifestoTitle')}</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                <span suppressHydrationWarning>{t('home.manifestoDescription')}</span>
              </p>
            </div>
            <div className="max-w-3xl mx-auto mt-12 bg-white/70 backdrop-blur-sm rounded-2xl shadow-md p-8 space-y-6 mb-16">
              <h2 className="text-2xl font-bold text-foreground"><span suppressHydrationWarning>{t('home.howToEngage')}</span></h2>
              <ul className="list-disc list-inside space-y-3 text-lg text-muted-foreground">
                <li><span suppressHydrationWarning>{t('home.engageSteps.read')}</span></li>
                <li>
                  <span suppressHydrationWarning>{t('home.engageSteps.explore')}</span>
                  <span className="italic" suppressHydrationWarning> {t('home.engageSteps.topRight')}</span>.
                </li>
                <li><span suppressHydrationWarning>{t('home.engageSteps.vote')}</span></li>
                <li><span suppressHydrationWarning>{t('home.engageSteps.signIn')}</span></li>
                <li>
                  <span suppressHydrationWarning>{t('home.engageSteps.email')}</span>{" "}
                  <a
                    href="mailto:suggestions@nepalreforms.com"
                    className="text-primary font-medium hover:underline"
                  >
                    suggestions@nepalreforms.com
                  </a>
                </li>
                <li><span suppressHydrationWarning>{t('home.engageSteps.share')}</span></li>
              </ul>
            </div>

            <ManifestoList />
          </div>
        </section>

        {/* Testimonials Section */}
        <TestimonialCarousel />

        {/* Footer or Additional Content */}
        <footer className="bg-muted/50 border-t py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center items-center gap-3">
                <img src="/nepal-flag-logo.png" alt="NepalReforms Logo" className="w-8 h-8 object-contain" loading="lazy" />
                <span className="text-lg font-semibold text-foreground">NepalReforms</span>
              </div>
              <p className="text-sm text-muted-foreground"><span suppressHydrationWarning>{t('footer.tagline')}</span></p>
              {/* Powered by */}
              <div className="pt-8 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  <span suppressHydrationWarning>{t('footer.poweredBy')}</span>{" "}
                  <Link
                    href="https://nexalaris.com/"
                    target="_blank"
                    className="text-primary hover:underline font-medium"
                  >
                    Nexalaris Tech Pvt. Ltd.
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

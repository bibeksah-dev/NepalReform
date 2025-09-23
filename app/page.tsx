"use client"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ManifestoList } from "@/components/manifesto-list"
import { TestimonialCarousel } from "@/components/testimonial-carousel"
import Link from "next/link"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"

export default function HomePage() {
  const { t:tHero } = useTranslation('translation')
  const { t:tCommon } = useTranslation('common')
  // Move steps and stepsArray inside the render so they update with language
  const steps = tHero('homepage.howToEngage.steps', { returnObjects: true });
  const stepsArray = Array.isArray(steps) ? steps : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <HeroSection />

        <section id="agendas-section" className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{tHero('homepage.hero.title')}</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                {tHero('homepage.hero.description')}
              </p>
            </div>
            <div className="max-w-3xl mx-auto mt-12 bg-white/70 backdrop-blur-sm rounded-2xl shadow-md p-8 space-y-6 mb-16">
              <h2 className="text-2xl font-bold text-foreground">{tHero("homepage.howToEngage.title")}</h2>
              <ul className="list-disc list-inside space-y-3 text-lg text-muted-foreground">
               {stepsArray.map((step, index) => (
    <li key={index}>{step}</li>
  ))}
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
              <img src="/nepal-flag-logo.png" alt="NepalReforms Logo" className="w-8 h-8 object-contain" />
              <span className="text-lg font-semibold text-foreground">NepalReforms</span>
            </div>
            <p className="text-sm text-muted-foreground">{tCommon('footer.empowering')}</p>
            {/* Powered by */}
            <div className="pt-8 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Proudly developed by{" "}
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

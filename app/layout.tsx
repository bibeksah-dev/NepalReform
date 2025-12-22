import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Providers } from "./providers"
import { OfflineSync } from "@/components/offline-sync"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import { Toaster } from "sonner"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://nepalreforms.com'),
  title: {
    default: "Nepal Reforms - Comprehensive Reform Proposals for Democratic Transformation",
    template: "%s | Nepal Reforms",
  },
  description: "Explore evidence-based reform proposals for Nepal's democratic transformation. Vote, discuss, and contribute to shaping Nepal's future through transparency, anti-corruption, and governance reforms.",
  keywords: [
    "Nepal reforms",
    "democratic transformation",
    "anti-corruption Nepal",
    "governance Nepal",
    "transparency Nepal",
    "CIAA reform",
    "electoral reform Nepal",
    "federalism Nepal",
    "digital governance",
    "Nepal manifesto",
    "Nepal youth movement",
  ],
  authors: [
    {
      name: "Nepal Reforms Platform",
      url: "https://nepalreforms.com",
    },
  ],
  creator: "Nexalaris Tech Company",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nepalreforms.com",
    title: "Nepal Reforms - Reform Proposals",
    description: "Comprehensive reform proposals for Nepal's democratic transformation",
    siteName: "Nepal Reforms Platform",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nepal Reforms Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nepal Reforms Platform",
    description: "Comprehensive reform proposals for Nepal's democratic transformation",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/nrlogo7.png", sizes: "16x16", type: "image/png" },
      { url: "/nrlogo7.png", sizes: "32x32", type: "image/png" },
      { url: "/nrlogo7.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/nrlogo7.png",
    apple: "/nrlogo7.png",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
  alternates: {
    canonical: "https://nepalreforms.com",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* Preload translation files for faster i18n initialization */}
        <link rel="preload" href="/locales/en/common.json" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/locales/np/common.json" as="fetch" crossOrigin="anonymous" />
        <link rel="icon" href="/nrlogo7.png" type="image/png" />
        <link rel="apple-touch-icon" href="/nrlogo7.png" />
        <link rel="shortcut icon" href="/nrlogo7.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Nepal Reforms" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Nepal Reforms" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-TileImage" content="/nrlogo7.png" />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <ServiceWorkerRegistration />
          <OfflineSync />
          <Suspense fallback={null}>{children}</Suspense>
          <Toaster position="bottom-right" richColors />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}

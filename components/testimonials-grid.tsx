'use client'

import { useEffect, useState } from 'react'
import { Testimonial } from '@/lib/types/testimonial'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { isSafeUrl } from '@/lib/utils'

export function TestimonialsGrid() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      const response = await fetch('/api/testimonials')
      if (response.ok) {
        const data = await response.json()
        setTestimonials(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch testimonials:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-300 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4" />
                  <div className="h-3 bg-gray-300 rounded w-1/2" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 bg-gray-300 rounded" />
                <div className="h-3 bg-gray-300 rounded" />
                <div className="h-3 bg-gray-300 rounded w-5/6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (testimonials.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">No testimonials available yet.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {testimonials.map((testimonial) => (
        <TestimonialCard key={testimonial.id} testimonial={testimonial} />
      ))}
    </div>
  )
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const [imageError, setImageError] = useState(false)
  
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4 mb-4">
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                {testimonial.image_url && !imageError ? (
                  <Image
                    src={testimonial.image_url}
                    alt={testimonial.name}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                    onError={() => setImageError(true)}
                    loading="lazy"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-2xl font-bold">
                      {testimonial.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {testimonial.linkedin_url && isSafeUrl(testimonial.linkedin_url) && (
                <a
                  href={testimonial.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute -bottom-1 -right-1 bg-[#0077B5] rounded-full p-1 hover:bg-[#006399] transition-colors"
                  aria-label={`${testimonial.name}'s LinkedIn profile`}
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M10.59 13.41a1 1 0 0 1 1.41 0l4.59 4.59a3 3 0 0 0 4.24-4.24l-3.54-3.54a1 1 0 1 1 1.42-1.42l3.54 3.54a5 5 0 0 1-7.07 7.07l-4.59-4.59a1 1 0 0 1 0-1.41zM13.41 10.59a1 1 0 0 1-1.41 0L7.41 6a3 3 0 1 0-4.24 4.24l3.54 3.54a1 1 0 0 1-1.42 1.42L1.29 11.7a5 5 0 0 1 7.07-7.07l4.59 4.59a1 1 0 0 1 0 1.41z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{testimonial.name}</h3>
            <p className="text-sm text-gray-600">{testimonial.profession}</p>
          </div>
        </div>
        <blockquote className="text-gray-700 leading-relaxed italic">
          "{testimonial.testimonial}"
        </blockquote>
      </CardContent>
    </Card>
  )
}

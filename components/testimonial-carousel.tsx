'use client'

import { useEffect, useState, useRef } from 'react'
import { Testimonial } from '@/lib/types/testimonial'
import { Pause, Play } from 'lucide-react'
import Image from 'next/image'
import { isSafeUrl } from '@/lib/utils'

export function TestimonialCarousel() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      const response = await fetch('/api/testimonials')
      if (response.ok) {
        const data = await response.json()
        // Duplicate testimonials for seamless loop
        if (data && data.length > 0) {
          setTestimonials([...data, ...data])
        }
      }
    } catch (error) {
      console.error('Failed to fetch testimonials:', error)
    }
  }

  useEffect(() => {
    if (!scrollRef.current || isPaused || isHovered || testimonials.length === 0) return

    const scroll = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop += 1
        
        // Reset scroll when reaching halfway (seamless loop)
        const maxScroll = scrollRef.current.scrollHeight / 2
        if (scrollRef.current.scrollTop >= maxScroll) {
          scrollRef.current.scrollTop = 0
        }
      }
      animationRef.current = requestAnimationFrame(scroll)
    }

    animationRef.current = requestAnimationFrame(scroll)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPaused, isHovered, testimonials])

  if (testimonials.length === 0) return null

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground">What People Say</h2>
              <p className="text-muted-foreground mt-2">Voices from the community supporting reform</p>
            </div>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              aria-label={isPaused ? 'Play' : 'Pause'}
            >
              {isPaused ? (
                <Play className="w-5 h-5" />
              ) : (
                <Pause className="w-5 h-5" />
              )}
            </button>
          </div>

          <div
            ref={scrollRef}
            className="h-[500px] overflow-hidden relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="space-y-4">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={`${testimonial.id}-${index}`} testimonial={testimonial} />
              ))}
            </div>
            
            {/* Gradient overlay for smooth fade */}
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-gray-50 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  )
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const [imageError, setImageError] = useState(false)
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex items-start space-x-4">
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
          <div className="mb-2">
            <h3 className="font-semibold text-lg">{testimonial.name}</h3>
            <p className="text-sm text-gray-600">{testimonial.profession}</p>
          </div>
          <p className="text-gray-700 leading-relaxed">"{testimonial.testimonial}"</p>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  })
  
  const mediaQueryRef = useRef<MediaQueryList | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia(query)
    mediaQueryRef.current = media

    const updateMatches = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    media.addEventListener('change', updateMatches)
    
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    return () => {
      if (mediaQueryRef.current) {
        mediaQueryRef.current.removeEventListener('change', updateMatches)
      }
    }
  }, [query, matches])

  return matches
}

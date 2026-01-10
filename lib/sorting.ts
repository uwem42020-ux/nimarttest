// lib/sorting.ts - COMPLETE UPDATED VERSION
import { FastProvider } from '@/lib/types'

export type SortOption = 'distance' | 'rating' | 'newest' | 'bookings' | 'response'

export interface SortConfig {
  key: SortOption
  label: string
  icon: string
}

export const SORT_OPTIONS: SortConfig[] = [
  { key: 'distance', label: 'Distance', icon: '📍' },
  { key: 'rating', label: 'Rating', icon: '⭐' },
  { key: 'newest', label: 'Newest', icon: '🆕' },
  { key: 'bookings', label: 'Most Bookings', icon: '📅' },
  { key: 'response', label: 'Fast Response', icon: '⚡' },
]

export function sortProviders(
  providers: FastProvider[],
  sortBy: SortOption,
  userState: string | null,
  userLGA: string | null
): FastProvider[] {
  const sorted = [...providers]
  
  switch (sortBy) {
    case 'distance':
      if (!userState || !userLGA) {
        // If no user location, sort by state alphabetically
        return sorted.sort((a, b) => {
          const stateA = a.states?.[0]?.name || ''
          const stateB = b.states?.[0]?.name || ''
          return stateA.localeCompare(stateB)
        })
      }
      // For distance sorting, we'll sort by: same LGA > same state > different states
      return sorted.sort((a, b) => {
        const aState = a.states?.[0]?.name
        const bState = b.states?.[0]?.name
        const aLGA = a.lgas?.[0]?.name
        const bLGA = b.lgas?.[0]?.name
        
        // Check if same LGA
        const aSameLGA = aState === userState && aLGA === userLGA
        const bSameLGA = bState === userState && bLGA === userLGA
        if (aSameLGA && !bSameLGA) return -1
        if (!aSameLGA && bSameLGA) return 1
        
        // Check if same state
        const aSameState = aState === userState
        const bSameState = bState === userState
        if (aSameState && !bSameState) return -1
        if (!aSameState && bSameState) return 1
        
        // Both different states, sort alphabetically
        return (aState || '').localeCompare(bState || '')
      })
      
    case 'rating':
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      
    case 'newest':
      return sorted.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      
    case 'bookings':
      return sorted.sort((a, b) => (b.total_bookings || 0) - (a.total_bookings || 0))
      
    case 'response':
      // Sort by response time (convert to minutes)
      return sorted.sort((a, b) => {
        const getMinutes = (time: string | null) => {
          if (!time) return 999
          const match = time.match(/(\d+)/)
          return match ? parseInt(match[0]) : 999
        }
        return getMinutes(a.response_time) - getMinutes(b.response_time)
      })
      
    default:
      return sorted
  }
}
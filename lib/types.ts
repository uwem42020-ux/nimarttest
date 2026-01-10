// lib/types.ts
export interface FastProvider {
    id: string
    business_name: string
    service_type: string
    rating: number | null
    total_reviews: number | null
    profile_picture_url: string | null
    state_id: string | null
    lga_id: string | null
    states: { name: string }[] | null
    lgas: { name: string }[] | null
    years_experience: number | null
    is_verified: boolean | null
    created_at: string
    bio: string | null
    phone: string | null
    total_bookings: number | null
    response_time: string | null
    city: string | null
    response_rate?: number | null
    is_online?: boolean | null
  }
  
  export interface ServiceCategory {
    id: string
    name: string
    icon: string | null
    description: string | null
    sort_order: number
    color?: string
    darkColor?: string
  }
  
  export interface UserLocation {
    state: string | null
    lga: string | null
    coordinates: { latitude: number; longitude: number } | null
    detected: boolean
  }
  
  export interface State {
    id: string
    name: string
  }
  
  export interface LGA {
    id: string
    name: string
    state_id: string
  }
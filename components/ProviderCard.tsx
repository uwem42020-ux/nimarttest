// app/components/ProviderCard.tsx - UPDATED FOR BETTER MOBILE DETAILED VIEW
'use client'

import Link from 'next/link'
import { FastProvider } from '@/lib/types'
import { 
  Star, MapPin, Shield, Briefcase, Car, Zap, Droplets,
  Palette, Scissors, ChefHat, Sparkles, PhoneCall,
  Heart, ArrowRight, MessageSquare, CheckCircle
} from 'lucide-react'

interface ProviderCardProps {
  provider: FastProvider
  gridView: 'basic' | 'detailed'
  isDarkMode: boolean
  userState?: string | null
  userLGA?: string | null
}

export default function ProviderCard({ 
  provider, 
  gridView, 
  isDarkMode,
  userState = null,
  userLGA = null 
}: ProviderCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRatingStars = (rating: number | null) => {
    const safeRating = rating || 0
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${star <= Math.floor(safeRating) 
              ? 'text-yellow-500 fill-yellow-500' 
              : 'text-gray-300 dark:text-gray-600'
            }`}
            fill="currentColor"
          />
        ))}
        <span className="ml-1 text-sm font-medium">{safeRating.toFixed(1)}</span>
      </div>
    )
  }

  const getServiceIcon = (serviceType: string) => {
    const type = serviceType.toLowerCase()
    if (type.includes('mechanic') || type.includes('car')) return <Car className="h-4 w-4" />
    if (type.includes('electric')) return <Zap className="h-4 w-4" />
    if (type.includes('plumb')) return <Droplets className="h-4 w-4" />
    if (type.includes('carpent') || type.includes('wood')) return <Briefcase className="h-4 w-4" />
    if (type.includes('paint')) return <Palette className="h-4 w-4" />
    if (type.includes('tailor') || type.includes('sew')) return <Scissors className="h-4 w-4" />
    if (type.includes('clean')) return <Sparkles className="h-4 w-4" />
    if (type.includes('chef') || type.includes('cook')) return <ChefHat className="h-4 w-4" />
    return <Briefcase className="h-4 w-4" />
  }

  const getLocationDisplay = (provider: FastProvider) => {
    const city = provider.city
    const state = provider.states?.[0]?.name
    const lga = provider.lgas?.[0]?.name
    
    if (city && state) {
      return `${city}, ${state}`
    } else if (lga && state) {
      return `${lga}, ${state}`
    } else if (state) {
      return state
    } else {
      return 'Location not set'
    }
  }

  // Calculate distance/proximity
  const getProximityInfo = () => {
    if (!userState) return null
    
    const providerState = provider.states?.[0]?.name
    const providerLGA = provider.lgas?.[0]?.name
    
    if (!providerState) return null
    
    if (providerState === userState && providerLGA === userLGA) {
      return { 
        text: 'Same LGA', 
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      }
    } else if (providerState === userState) {
      return { 
        text: 'Same State', 
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      }
    } else {
      return { 
        text: 'Different State', 
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
      }
    }
  }

  // Get actual reviews count
  const reviewsCount = provider.total_reviews || 0
  const ratingValue = provider.rating || 0
  const proximityInfo = getProximityInfo()

  // BASIC GRID VIEW - For mobile and desktop (stays the same)
  if (gridView === 'basic') {
    return (
      <Link href={`/providers/${provider.id}`}>
        <div className={`h-full flex flex-col rounded-lg overflow-hidden ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        } border`}>
          
          {/* IMAGE SECTION - Square image at top */}
          <div className="relative h-48">
            {provider.profile_picture_url ? (
              <div className="w-full h-full">
                <img
                  src={provider.profile_picture_url}
                  alt={provider.business_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const parent = e.currentTarget.parentElement
                    if (parent) {
                      const fallback = document.createElement('div')
                      fallback.className = 'w-full h-full bg-gradient-to-br from-primary to-green-500 flex items-center justify-center text-white text-3xl font-bold'
                      fallback.textContent = getInitials(provider.business_name)
                      parent.appendChild(fallback)
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-green-500 flex items-center justify-center text-white text-4xl font-bold">
                {getInitials(provider.business_name)}
              </div>
            )}
            
            {/* Online Status Badge */}
            {provider.is_online && (
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-500 text-white">
                  <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5"></span>
                  Online
                </span>
              </div>
            )}
            
            {/* Verification Badge */}
            {provider.is_verified && (
              <div className="absolute top-2 left-2">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-500 text-white">
                  <Shield className="h-3 w-3 mr-1.5" />
                  Verified
                </span>
              </div>
            )}
          </div>

          {/* CONTENT SECTION - Below image */}
          <div className="flex-1 p-4 flex flex-col">
            {/* Business Name */}
            <h3 className={`font-bold text-lg mb-2 truncate ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {provider.business_name}
            </h3>
            
            {/* Service Type */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
              }`}>
                {getServiceIcon(provider.service_type)}
                <span className="ml-1.5 truncate max-w-[120px]">{provider.service_type}</span>
              </span>
            </div>

            {/* Rating and Reviews */}
            <div className="mb-3">
              {getRatingStars(ratingValue)}
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                ({reviewsCount} review{reviewsCount !== 1 ? 's' : ''})
              </span>
            </div>

            {/* Location and Proximity */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center text-sm">
                <MapPin className={`h-3.5 w-3.5 mr-1.5 flex-shrink-0 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <span className={`truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {getLocationDisplay(provider)}
                </span>
              </div>
              
              {proximityInfo && (
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${proximityInfo.color}`}>
                    {proximityInfo.text}
                  </span>
                </div>
              )}
            </div>

            {/* Experience and Bookings */}
            <div className="flex items-center justify-between text-sm mb-4">
              {provider.years_experience ? (
                <div className={`flex items-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                  <span>{provider.years_experience} yrs</span>
                </div>
              ) : null}
              
              {provider.total_bookings ? (
                <div className={`flex items-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  <span>{provider.total_bookings} bookings</span>
                </div>
              ) : null}
            </div>

            {/* Action Button */}
            <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700">
              <button className="w-full px-4 py-2.5 bg-primary text-white rounded font-medium text-sm flex items-center justify-center">
                View Profile
                <ArrowRight className="h-3.5 w-3.5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // EXPANDED VIEW (detailed) - UPDATED FOR MOBILE
  return (
    <Link href={`/providers/${provider.id}`}>
      <div className={`rounded-lg overflow-hidden ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      } border`}>
        
        {/* MOBILE VIEW - Stack vertically */}
        <div className="md:hidden">
          {/* Image - Full width on mobile */}
          <div className="relative h-56">
            {provider.profile_picture_url ? (
              <div className="w-full h-full">
                <img
                  src={provider.profile_picture_url}
                  alt={provider.business_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const parent = e.currentTarget.parentElement
                    if (parent) {
                      const fallback = document.createElement('div')
                      fallback.className = 'w-full h-full bg-gradient-to-br from-primary to-green-500 flex items-center justify-center text-white text-4xl font-bold'
                      fallback.textContent = getInitials(provider.business_name)
                      parent.appendChild(fallback)
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-green-500 flex items-center justify-center text-white text-5xl font-bold">
                {getInitials(provider.business_name)}
              </div>
            )}
            
            {/* Badges on image */}
            <div className="absolute top-3 left-3 right-3 flex justify-between">
              {provider.is_verified && (
                <span className="inline-flex items-center px-3 py-1.5 rounded text-sm font-medium bg-blue-500 text-white">
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                  Verified
                </span>
              )}
              
              {provider.is_online && (
                <span className="inline-flex items-center px-3 py-1.5 rounded text-sm font-medium bg-green-500 text-white">
                  <span className="w-2 h-2 bg-white rounded-full mr-1.5"></span>
                  Online
                </span>
              )}
            </div>
          </div>

          {/* Content - Below image on mobile */}
          <div className="p-4">
            {/* Header */}
            <div className="mb-4">
              <h3 className={`font-bold text-xl mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {provider.business_name}
              </h3>
              
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`inline-flex items-center px-3 py-1.5 rounded text-sm font-medium ${
                  isDarkMode ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'
                }`}>
                  {getServiceIcon(provider.service_type)}
                  <span className="ml-2 font-medium">{provider.service_type}</span>
                </span>
                
                {/* Proximity Badge */}
                {proximityInfo && (
                  <span className={`inline-flex items-center px-3 py-1.5 rounded text-sm font-medium ${proximityInfo.color}`}>
                    {proximityInfo.text}
                  </span>
                )}
              </div>
            </div>

            {/* Bio */}
            {provider.bio && (
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {provider.bio}
              </p>
            )}

            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className={`text-center p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-lg font-bold text-primary">{ratingValue.toFixed(1)}</div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rating</div>
              </div>
              <div className={`text-center p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-lg font-bold text-primary">{provider.years_experience || 0}</div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Yrs Exp</div>
              </div>
              <div className={`text-center p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-lg font-bold text-primary">{provider.total_bookings || 0}</div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Bookings</div>
              </div>
            </div>

            {/* Location and Contact */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center text-sm">
                <MapPin className={`h-4 w-4 mr-2 flex-shrink-0 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {getLocationDisplay(provider)}
                </span>
              </div>
              
              {/* Contact Buttons */}
              <div className="flex gap-2">
                {provider.phone && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      window.open(`tel:${provider.phone}`)
                    }}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded font-medium text-sm flex items-center justify-center"
                  >
                    <PhoneCall className="h-3.5 w-3.5 mr-2" />
                    Call
                  </button>
                )}
                
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.location.href = `/messages?provider=${provider.id}`
                  }}
                  className="flex-1 px-3 py-2 border border-primary text-primary rounded font-medium text-sm flex items-center justify-center"
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-2" />
                  Message
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-2.5 bg-primary text-white rounded font-medium text-sm text-center flex items-center justify-center">
                View Full Profile
                <ArrowRight className="h-3.5 w-3.5 ml-2" />
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  // Handle favorite
                }}
                className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded"
                title="Save to favorites"
              >
                <Heart className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* DESKTOP VIEW - Horizontal layout (hidden on mobile) */}
        <div className="hidden md:block p-6">
          <div className="flex gap-6">
            {/* Left Column */}
            <div className="flex-shrink-0">
              <div className="flex flex-col items-center">
                {/* Profile Image - Square */}
                <div className="relative w-40 h-40 overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600 mb-4">
                  {provider.profile_picture_url ? (
                    <img
                      src={provider.profile_picture_url}
                      alt={provider.business_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const parent = e.currentTarget.parentElement
                        if (parent) {
                          const fallback = document.createElement('div')
                          fallback.className = 'w-full h-full bg-gradient-to-br from-primary to-green-500 flex items-center justify-center text-white text-4xl font-bold'
                          fallback.textContent = getInitials(provider.business_name)
                          parent.appendChild(fallback)
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-green-500 flex items-center justify-center text-white text-5xl font-bold">
                      {getInitials(provider.business_name)}
                    </div>
                  )}
                  
                  {/* Online Status */}
                  {provider.is_online && (
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full border border-white dark:border-gray-700"></div>
                    </div>
                  )}
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 w-full mb-4">
                  <div className={`text-center p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="text-lg font-bold text-primary">{ratingValue.toFixed(1)}</div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rating</div>
                  </div>
                  <div className={`text-center p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="text-lg font-bold text-primary">{provider.years_experience || 0}</div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Yrs Exp</div>
                  </div>
                </div>
                
                {/* Quick Contact */}
                {provider.phone && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      window.open(`tel:${provider.phone}`)
                    }}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded font-medium text-sm flex items-center justify-center mb-2"
                  >
                    <PhoneCall className="h-3 w-3 mr-2" />
                    Call Now
                  </button>
                )}
                
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.location.href = `/messages?provider=${provider.id}`
                  }}
                  className="w-full px-3 py-2 border border-primary text-primary rounded font-medium text-sm flex items-center justify-center"
                >
                  <MessageSquare className="h-3 w-3 mr-2" />
                  Message
                </button>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex-1">
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className={`font-bold text-xl mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {provider.business_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded text-sm font-medium ${
                        isDarkMode ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'
                      }`}>
                        {getServiceIcon(provider.service_type)}
                        <span className="ml-2 font-medium">{provider.service_type}</span>
                      </span>
                      
                      {/* Proximity Badge */}
                      {proximityInfo && (
                        <span className={`inline-flex items-center px-3 py-1.5 rounded text-sm font-medium ${proximityInfo.color}`}>
                          {proximityInfo.text}
                        </span>
                      )}
                      
                      {provider.is_verified && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <Shield className="h-3 w-3 mr-2" />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {provider.bio && (
                  <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {provider.bio}
                  </p>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center mb-1">
                    <Star className="h-4 w-4 text-yellow-500 mr-2" />
                    <div className="font-semibold">{ratingValue.toFixed(1)}</div>
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {reviewsCount} reviews
                  </div>
                </div>
                
                <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center mb-1">
                    <Briefcase className="h-4 w-4 text-primary mr-2" />
                    <div className="font-semibold">{provider.total_bookings || 0}</div>
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Bookings</div>
                </div>
                
                <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center mb-1">
                    <MapPin className="h-4 w-4 text-primary mr-2" />
                    <div className="font-semibold truncate">{getLocationDisplay(provider)}</div>
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Location</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-2.5 bg-primary text-white rounded font-medium text-sm text-center flex items-center justify-center">
                  View Full Profile
                  <ArrowRight className="h-3.5 w-3.5 ml-2" />
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    // Handle favorite
                  }}
                  className="p-2.5 border border-gray-300 dark:border-gray-600 rounded"
                  title="Save to favorites"
                >
                  <Heart className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
// app/providers/[id]/page.tsx - UPDATED WITH PROTECTED CONTACTS
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Star, MapPin, Phone, Mail, Calendar, 
  Shield, CheckCircle, MessageSquare,
  ArrowLeft, Clock, Award, Users, TrendingUp,
  Eye, EyeOff, Lock
} from 'lucide-react'
import ReviewsList from '@/components/ReviewsList'
import { generateProviderSEO } from '@/lib/seo'

export default function ProviderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const providerId = params.id as string
  const [provider, setProvider] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPhone, setShowPhone] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [actionRequiringLogin, setActionRequiringLogin] = useState<'call' | 'message' | 'booking' | null>(null)

  useEffect(() => {
    if (providerId) {
      loadProvider()
      checkAuth()
    }
  }, [providerId])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session?.user)
    } catch (error) {
      setIsAuthenticated(false)
    }
  }

  const loadProvider = async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select(`
          *,
          states (name),
          reviews (
            id,
            rating,
            comment,
            customer_name,
            created_at
          )
        `)
        .eq('id', providerId)
        .single()

      if (error) throw error
      setProvider(data)
    } catch (error) {
      console.error('Error loading provider:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleContactAction = (action: 'call' | 'message' | 'booking') => {
    if (!isAuthenticated) {
      setActionRequiringLogin(action)
      setLoginModalOpen(true)
      return
    }

    // User is authenticated, proceed with action
    switch (action) {
      case 'call':
        if (provider?.phone) {
          window.open(`tel:${provider.phone}`)
        }
        break
      case 'message':
        router.push(`/messages?provider=${providerId}`)
        break
      case 'booking':
        router.push(`/bookings/new?provider=${providerId}`)
        break
    }
  }

  const handleLoginSuccess = () => {
    setLoginModalOpen(false)
    checkAuth()
    
    // Retry the action that required login
    if (actionRequiringLogin) {
      setTimeout(() => {
        handleContactAction(actionRequiringLogin)
      }, 500)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Provider Not Found</h1>
          <Link href="/marketplace" className="text-primary hover:underline">
            Browse all providers
          </Link>
        </div>
      </div>
    )
  }

  const location = provider.states?.[0]?.name || 'Nigeria'
  const seoData = generateProviderSEO(provider, location)

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(seoData.structuredData)
        }}
      />

      {/* Login Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Sign In Required
              </h3>
              <p className="text-gray-600">
                {actionRequiringLogin === 'call' && 'You need to sign in to view the phone number'}
                {actionRequiringLogin === 'message' && 'You need to sign in to send a message'}
                {actionRequiringLogin === 'booking' && 'You need to sign in to book a service'}
              </p>
            </div>
            
            <div className="space-y-3">
              <Link
                href={`/login?redirect=/providers/${providerId}`}
                onClick={() => setLoginModalOpen(false)}
                className="block w-full bg-gradient-to-r from-primary to-green-600 text-white py-3 rounded-lg hover:from-green-600 hover:to-primary font-medium text-center"
              >
                Sign In
              </Link>
              <Link
                href={`/register?redirect=/providers/${providerId}`}
                onClick={() => setLoginModalOpen(false)}
                className="block w-full border-2 border-primary text-primary py-3 rounded-lg hover:bg-green-50 font-medium text-center"
              >
                Create Account
              </Link>
              <button
                onClick={() => setLoginModalOpen(false)}
                className="block w-full py-3 text-gray-600 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-primary mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2">
              {/* Provider Header */}
              <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Profile Image */}
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-white shadow-lg">
                      {provider.profile_picture_url ? (
                        <img
                          src={provider.profile_picture_url}
                          alt={provider.business_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center text-white text-4xl font-bold">
                          {provider.business_name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Provider Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                          {provider.business_name}
                        </h1>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                            {provider.service_type}
                          </span>
                          {provider.is_verified && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              <Shield className="h-4 w-4 mr-1" />
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <span className="ml-2 text-xl font-bold text-gray-900">
                          {provider.rating?.toFixed(1) || 'New'}
                        </span>
                        <span className="ml-1 text-gray-600">
                          ({provider.total_reviews || 0} reviews)
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div>
                        <div className="text-2xl font-bold text-primary">{provider.years_experience || 0}</div>
                        <div className="text-sm text-gray-600">Years Experience</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">{provider.total_reviews || 0}</div>
                        <div className="text-sm text-gray-600">Total Reviews</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {provider.rating ? `${(provider.rating * 20).toFixed(0)}%` : 'New'}
                        </div>
                        <div className="text-sm text-gray-600">Satisfaction</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-xl shadow-sm border mb-6">
                <div className="border-b">
                  <div className="flex">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`px-6 py-4 font-medium ${
                        activeTab === 'overview'
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('reviews')}
                      className={`px-6 py-4 font-medium ${
                        activeTab === 'reviews'
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Reviews ({provider.total_reviews || 0})
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {activeTab === 'overview' ? (
                    <div>
                      {provider.bio && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                          <p className="text-gray-600 leading-relaxed">{provider.bio}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-5 w-5 mr-3 text-primary" />
                          <div>
                            <div className="font-medium">Experience</div>
                            <div className="text-sm">{provider.years_experience || 0} years</div>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Award className="h-5 w-5 mr-3 text-primary" />
                          <div>
                            <div className="font-medium">Service Type</div>
                            <div className="text-sm">{provider.service_type}</div>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-5 w-5 mr-3 text-primary" />
                          <div>
                            <div className="font-medium">Location</div>
                            <div className="text-sm">{location}</div>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <CheckCircle className="h-5 w-5 mr-3 text-primary" />
                          <div>
                            <div className="font-medium">Status</div>
                            <div className="text-sm">{provider.is_verified ? 'Verified' : 'Pending Verification'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <ReviewsList providerId={providerId} />
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Actions */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact & Booking</h3>
                
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => handleContactAction('call')}
                    className="flex items-center justify-center w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!provider.phone}
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Call Now
                  </button>
                  
                  <button
                    onClick={() => handleContactAction('message')}
                    className="flex items-center justify-center w-full px-4 py-3 border-2 border-primary text-primary rounded-lg hover:bg-green-50 font-medium transition-colors"
                  >
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Send Message
                  </button>

                  <button
                    onClick={() => handleContactAction('booking')}
                    className="flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-primary to-green-600 text-white rounded-lg hover:from-green-600 hover:to-primary font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Book Service
                  </button>
                </div>

                {/* Protected Contact Information */}
                <div className="pt-6 border-t">
                  <h4 className="font-medium text-gray-900 mb-4">Contact Information</h4>
                  
                  {/* Phone Number - Protected */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-gray-600 mb-2">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        <span className="font-medium">Phone:</span>
                      </div>
                      {isAuthenticated ? (
                        <div className="flex items-center">
                          {showPhone ? (
                            <>
                              <a href={`tel:${provider.phone}`} className="text-primary hover:underline">
                                {provider.phone || 'Not available'}
                              </a>
                              <button
                                onClick={() => setShowPhone(false)}
                                className="ml-2 text-gray-500 hover:text-gray-700"
                                title="Hide phone number"
                              >
                                <EyeOff className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setShowPhone(true)}
                              className="text-primary hover:text-green-700 flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Phone
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setActionRequiringLogin('call')
                            setLoginModalOpen(true)
                          }}
                          className="text-primary hover:text-green-700 flex items-center"
                        >
                          <Lock className="h-4 w-4 mr-1" />
                          Sign in to view
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Email - Protected */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-gray-600 mb-2">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="font-medium">Email:</span>
                      </div>
                      {isAuthenticated ? (
                        <div className="flex items-center">
                          {showEmail ? (
                            <>
                              <a href={`mailto:${provider.email}`} className="text-primary hover:underline break-all">
                                {provider.email || 'Not available'}
                              </a>
                              <button
                                onClick={() => setShowEmail(false)}
                                className="ml-2 text-gray-500 hover:text-gray-700"
                                title="Hide email"
                              >
                                <EyeOff className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setShowEmail(true)}
                              className="text-primary hover:text-green-700 flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Email
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setActionRequiringLogin('message')
                            setLoginModalOpen(true)
                          }}
                          className="text-primary hover:text-green-700 flex items-center"
                        >
                          <Lock className="h-4 w-4 mr-1" />
                          Sign in to view
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Login Reminder for Unauthenticated Users */}
                  {!isAuthenticated && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Sign in to view contact details and contact this provider
                      </p>
                      <Link
                        href={`/login?redirect=/providers/${providerId}`}
                        className="text-sm text-primary hover:text-green-700 font-medium mt-1 block"
                      >
                        Sign in now →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
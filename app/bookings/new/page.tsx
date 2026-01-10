// app/bookings/new/page.tsx - FINAL FIXED VERSION
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Calendar, Clock, User, MapPin,
  MessageSquare, Phone, Check, AlertCircle,
  Loader2, Briefcase, Star, Home, CheckCircle
} from 'lucide-react'

export default function NewBookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [provider, setProvider] = useState<any>(null)
  const [service, setService] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [providerError, setProviderError] = useState<string>('')
  const [isLoadingProvider, setIsLoadingProvider] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    serviceDate: '',
    serviceTime: '',
    description: '',
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push('/login?redirect=/bookings/new' + window.location.search)
          return
        }
        
        setUser(session.user)
        
        // Pre-fill form with user data
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, phone')
          .eq('user_id', session.user.id)
          .single()
        
        setFormData(prev => ({
          ...prev,
          name: profile?.display_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
          email: session.user.email || '',
          phone: profile?.phone || session.user.user_metadata?.phone || ''
        }))
        
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      const providerId = searchParams.get('provider')
      const serviceId = searchParams.get('service')
      
      console.log('Loading provider:', providerId)
      
      if (providerId) {
        loadProvider(providerId)
      } else {
        setProviderError('No provider selected. Please select a provider first.')
        setIsLoadingProvider(false)
      }
      
      if (serviceId) {
        loadService(serviceId)
      }
    }
  }, [user, searchParams])

  async function loadProvider(providerId: string) {
    setIsLoadingProvider(true)
    setProviderError('')
    
    try {
      console.log('Loading provider with ID:', providerId)
      
      const { data, error } = await supabase
        .from('providers')
        .select(`
          *,
          states (name),
          lgas (name)
        `)
        .eq('id', providerId)
        .single()
      
      if (error) {
        console.error('Provider load error:', error)
        throw new Error(`Failed to load provider: ${error.message}`)
      }
      
      if (data) {
        console.log('Provider loaded successfully:', data.business_name)
        setProvider(data)
      } else {
        throw new Error('Provider not found')
      }
    } catch (error: any) {
      console.error('Error loading provider:', error)
      setProviderError(error.message || 'Failed to load provider')
    } finally {
      setIsLoadingProvider(false)
    }
  }

  async function loadService(serviceId: string) {
    try {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single()
      
      if (data) {
        setService(data)
      }
    } catch (error) {
      console.error('Error loading service:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!provider?.id) {
      alert('Please select a provider first.')
      return
    }
    
    setLoading(true)

    try {
      if (!user) {
        alert('Please login to book a service')
        return
      }

      // Validate required fields
      if (!formData.name || !formData.phone || !formData.address || !formData.serviceDate || !formData.serviceTime) {
        alert('Please fill in all required fields')
        setLoading(false)
        return
      }

      // 1. CREATE BOOKING
      const bookingData = {
        provider_id: provider.id,
        customer_id: user.id,
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_email: formData.email || user.email,
        service_name: service?.name || 'Custom Service',
        service_id: service?.id,
        service_price: service?.price || 0,
        scheduled_date: formData.serviceDate,
        scheduled_time: formData.serviceTime,
        address: formData.address,
        description: formData.description,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Creating booking with data:', bookingData)

      const { data: bookingResult, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single()

      if (bookingError) {
        console.error('Booking creation error:', bookingError)
        throw bookingError
      }

      console.log('Booking created successfully:', bookingResult?.id)

      // 2. CREATE NOTIFICATIONS
      // Customer notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: '✅ Booking Request Sent',
        message: `Your booking request has been sent to ${provider.business_name}. They will respond within 24 hours.`,
        type: 'success',
        is_read: false,
        link: `/bookings`,
        created_at: new Date().toISOString()
      })

      // Provider notification if they have user_id
      if (provider.user_id) {
        await supabase.from('notifications').insert({
          user_id: provider.user_id,
          title: '📅 New Booking Request',
          message: `${formData.name} has requested a booking for ${formData.serviceDate} at ${formData.serviceTime}`,
          type: 'info',
          is_read: false,
          link: `/provider/bookings`,
          created_at: new Date().toISOString()
        })
      }

      setSuccess(true)

      // Redirect after 5 seconds
      setTimeout(() => {
        router.push(`/bookings`)
      }, 5000)

    } catch (error: any) {
      console.error('Booking error:', error)
      alert(`Failed to submit booking: ${error?.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Booking Request Sent!
          </h2>
          
          <p className="text-gray-600 mb-6">
            Your booking request has been sent to {provider?.business_name}. 
            They will contact you within 24 hours.
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center text-gray-700">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{formData.serviceDate} at {formData.serviceTime}</span>
            </div>
            <div className="flex items-center justify-center text-gray-700">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="text-sm">{formData.address.substring(0, 50)}...</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/bookings`)}
              className="w-full py-3 bg-primary text-white rounded-lg hover:bg-green-700 font-medium"
            >
              View My Bookings
            </button>
            {provider?.id && (
              <button
                onClick={() => router.push(`/messages?provider=${provider.id}`)}
                className="w-full py-3 border border-primary text-primary rounded-lg hover:bg-green-50 font-medium"
              >
                Message Provider
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-600 hover:text-primary"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
            <h1 className="text-xl font-bold text-gray-900">Book Service</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {providerError ? (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <h3 className="font-semibold text-red-900">Provider Issue</h3>
                <p className="text-red-700 text-sm">{providerError}</p>
                <div className="mt-4">
                  <button
                    onClick={() => router.push('/marketplace')}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    Browse Providers
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : isLoadingProvider ? (
          <div className="mb-8 flex justify-center items-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
            <p>Loading provider information...</p>
          </div>
        ) : provider ? (
          <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                {provider.profile_picture_url ? (
                  <img
                    src={provider.profile_picture_url}
                    alt={provider.business_name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="text-2xl font-bold text-primary">
                    {provider.business_name?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {provider.business_name}
                </h2>
                <p className="text-gray-600">{provider.service_type}</p>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  {provider.city || provider.lgas?.name || 'Local'}, {provider.states?.name || 'State'}
                </div>
                <div className="flex items-center mt-1">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium">{provider.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-sm text-gray-500 ml-1">({provider.total_reviews || 0} reviews)</span>
                </div>
              </div>
              <button
                onClick={() => router.push(`/messages?provider=${provider.id}`)}
                className="flex items-center px-4 py-2 border border-primary text-primary rounded-lg hover:bg-green-50"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Message
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
                <div className="text-sm text-gray-500">
                  All fields marked with * are required
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <User className="h-5 w-5 mr-2 text-primary" />
                    Your Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        placeholder="08012345678"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="you@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="Enter your complete address"
                      required
                    />
                  </div>
                </div>

                {/* Service Details */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-primary" />
                    Service Details
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Date *
                      </label>
                      <input
                        type="date"
                        name="serviceDate"
                        value={formData.serviceDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        required
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Time *
                      </label>
                      <select
                        name="serviceTime"
                        value={formData.serviceTime}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        required
                      >
                        <option value="">Select time</option>
                        <option value="08:00">8:00 AM</option>
                        <option value="09:00">9:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="13:00">1:00 PM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="15:00">3:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                        <option value="17:00">5:00 PM</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="Describe the service you need in detail..."
                      required
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Be specific about what you need.
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !provider?.id}
                  className="w-full py-3 bg-primary text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Submit Booking Request
                    </span>
                  )}
                </button>
                
                {!provider?.id && (
                  <p className="text-sm text-red-600 text-center">
                    Please select a provider first
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Service Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Summary</h3>
              
              {service ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{service.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-t">
                    <span className="text-gray-700">Price</span>
                    <span className="text-xl font-bold text-primary">₦{service.price.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{service.duration}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Briefcase className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Custom Service</p>
                  <p className="text-sm text-gray-500">Price will be determined by provider</p>
                </div>
              )}
            </div>

            {/* What Happens */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                What Happens Next?
              </h3>
              
              <ul className="space-y-3 text-sm text-blue-800">
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5">
                    <span className="text-xs font-bold">1</span>
                  </div>
                  <span>Booking is created</span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5">
                    <span className="text-xs font-bold">2</span>
                  </div>
                  <span>Provider receives notification</span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5">
                    <span className="text-xs font-bold">3</span>
                  </div>
                  <span>You receive confirmation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
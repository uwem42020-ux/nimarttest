// app/provider/dashboard/page.tsx - FIXED VERSION
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Shield, MapPin, Star, UserCheck, Calendar, 
  MessageSquare, DollarSign, TrendingUp,
  Users, Clock, CheckCircle, Package,
  Bell, BarChart, CreditCard,
  ArrowLeft, LogOut, Home,
  Loader2, Briefcase, Award, ThumbsUp, Eye
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function ProviderDashboard() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [providerData, setProviderData] = useState<any>(null)
  const [profileImage, setProfileImage] = useState<string>('')
  const [reviews, setReviews] = useState<any[]>([])
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalReviews: 0,
    pendingBookings: 0,
    completedBookings: 0
  })
  const router = useRouter()

  useEffect(() => {
    console.log('🚀 Dashboard mounted')
    
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking authentication...')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          router.push('/login')
          return
        }
        
        if (!session) {
          console.log('❌ No session found, redirecting to login')
          router.push('/login')
          return
        }
        
        console.log('✅ Session found:', session.user.email)
        console.log('📋 User metadata:', session.user.user_metadata)
        
        // Check if user is a provider
        const userType = session.user.user_metadata?.user_type
        if (userType !== 'provider') {
          alert('Only providers can access this page')
          router.push('/')
          return
        }
        
        setUser(session.user)
        
        // Load provider data
        await loadProviderData(session.user)
        
      } catch (error) {
        console.error('Auth error:', error)
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [router])

  async function loadProviderData(user: any) {
    try {
      console.log('📦 Loading provider data for:', user.email)
      
      // Try to get provider by user_id
      let { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      // If not found, try by email
      if (error || !data) {
        console.log('Provider not found by user_id, trying email...')
        const { data: emailData, error: emailError } = await supabase
          .from('providers')
          .select('*')
          .eq('email', user.email)
          .single()
        
        if (emailError || !emailData) {
          console.error('Provider not found for user:', emailError)
          alert('Provider profile not found. Please complete your provider profile.')
          router.push('/provider/register')
          return
        }
        
        data = emailData
      }
      
      if (data) {
        console.log('✅ Provider data loaded:', data.business_name)
        setProviderData(data)
        
        // Set profile image
        if (data.profile_picture_url) {
          setProfileImage(data.profile_picture_url)
        } else {
          // Generate avatar from business name
          const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.business_name || user.email)}&background=008751&color=fff&size=256`
          setProfileImage(avatarUrl)
        }
        
        // Load reviews
        await loadReviews(data.id)
        
        // Load bookings
        await loadBookings(data.id)
        
        // Calculate stats
        calculateStats(data)
      }
      
    } catch (error) {
      console.error('Error loading provider profile:', error)
      // Create default avatar on error
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=008751&color=fff&size=256`
      setProfileImage(avatarUrl)
    } finally {
      setLoading(false)
    }
  }

  async function loadReviews(providerId: string) {
    try {
      console.log('⭐ Loading reviews for provider:', providerId)
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (!error && data) {
        console.log(`✅ Loaded ${data.length} reviews`)
        setReviews(data)
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  async function loadBookings(providerId: string) {
    try {
      console.log('📋 Loading bookings for provider:', providerId)
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (!error && data) {
        console.log(`✅ Loaded ${data.length} recent bookings`)
        setRecentBookings(data)
        
        // Calculate booking stats
        const pendingBookings = data.filter(b => b.status === 'pending').length
        const completedBookings = data.filter(b => b.status === 'completed').length
        
        setStats(prev => ({
          ...prev,
          pendingBookings,
          completedBookings
        }))
      }
    } catch (error) {
      console.error('Error loading bookings:', error)
    }
  }

  function calculateStats(provider: any) {
    const totalBookings = provider.total_bookings || 0
    const totalRevenue = provider.total_earnings || 0
    const averageRating = provider.rating || 0
    const totalReviews = provider.total_reviews || 0
    
    setStats({
      totalBookings,
      totalRevenue,
      averageRating,
      totalReviews,
      pendingBookings: 0,
      completedBookings: 0
    })
    
    console.log('📊 Stats calculated:', {
      totalBookings,
      totalRevenue,
      averageRating,
      totalReviews
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Show loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-green-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white bg-white/20 flex items-center justify-center">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={providerData?.business_name || user?.email}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold">
                    {providerData?.business_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">Welcome back, {providerData?.business_name || user?.email?.split('@')[0]}!</h1>
                <p className="opacity-90">{user?.email}</p>
                <div className="flex items-center mt-2">
                  <span className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-sm">
                    <Shield className="h-3 w-3 mr-1" />
                    {providerData?.is_verified ? 'Verified Provider' : 'Unverified Provider'}
                  </span>
                  <span className="ml-2 inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-sm">
                    <Star className="h-3 w-3 mr-1" />
                    {stats.averageRating.toFixed(1)} Rating
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 md:mt-0 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Bookings</p>
                <p className="text-2xl font-bold">{stats.totalBookings}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-green-600">{stats.completedBookings} completed</span>
              <span className="text-yellow-600">{stats.pendingBookings} pending</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4 inline mr-1 text-green-500" />
              <span>Total earnings</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Rating</p>
                <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <ThumbsUp className="h-4 w-4 inline mr-1 text-blue-500" />
              <span>{stats.totalReviews} reviews</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link 
                  href="/provider/bookings"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Calendar className="h-8 w-8 text-primary mb-2" />
                  <span className="text-sm">Bookings</span>
                </Link>
                <Link 
                  href="/messages"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <MessageSquare className="h-8 w-8 text-primary mb-2" />
                  <span className="text-sm">Messages</span>
                </Link>
                <Link 
                  href="/provider/reviews"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Star className="h-8 w-8 text-primary mb-2" />
                  <span className="text-sm">Reviews</span>
                </Link>
                <Link 
                  href="/notifications"
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Bell className="h-8 w-8 text-primary mb-2" />
                  <span className="text-sm">Notifications</span>
                </Link>
              </div>
            </div>

            {/* Recent Reviews */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Recent Reviews</h3>
                <Link 
                  href="/provider/reviews"
                  className="text-primary hover:text-green-700 text-sm font-medium"
                >
                  View All →
                </Link>
              </div>
              
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{review.customer_name}</h4>
                          <div className="flex items-center mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < Math.floor(review.rating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                              />
                            ))}
                            <span className="ml-2 text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No reviews yet</p>
                  <p className="text-sm text-gray-500 mt-2">Your reviews will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Provider Info */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your Profile</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Business Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Business Name:</strong> {providerData?.business_name || 'Not set'}</p>
                    <p><strong>Service Type:</strong> {providerData?.service_type || 'Not set'}</p>
                    <p><strong>Phone:</strong> {providerData?.phone || 'Not set'}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Address:</strong> {providerData?.address || 'Not set'}</p>
                    <p><strong>Experience:</strong> {providerData?.years_experience || 0} years</p>
                    <p><strong>Status:</strong> {providerData?.is_verified ? 'Verified ✅' : 'Pending Verification'}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Link
                  href="/provider/profile"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Edit Profile
                </Link>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Recent Bookings</h3>
                <Link 
                  href="/provider/bookings"
                  className="text-primary hover:text-green-700 text-sm font-medium"
                >
                  View All →
                </Link>
              </div>
              
              {recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{booking.customer_name}</h4>
                          <p className="text-sm text-gray-500">{booking.service_name}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${booking.status === 'completed' ? 'bg-green-100 text-green-800' : booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{new Date(booking.scheduled_date).toLocaleDateString()} at {booking.scheduled_time}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        ₦{booking.service_price?.toLocaleString() || '0'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No bookings yet</p>
                  <p className="text-sm text-gray-500 mt-2">Your bookings will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-green-700 font-medium mr-4"
          >
            Go to Homepage
          </button>
          <Link
            href="/marketplace"
            className="px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-green-50 font-medium"
          >
            Browse Marketplace
          </Link>
        </div>
      </div>
    </div>
  )
}
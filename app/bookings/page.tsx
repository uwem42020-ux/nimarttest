// app/bookings/page.tsx - CUSTOMER BOOKINGS PAGE
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Calendar, Clock, MapPin, DollarSign, 
  User, Phone, Mail, CheckCircle, 
  XCircle, AlertCircle, ArrowLeft,
  Loader2, MessageSquare, Star,
  Filter, Search, ChevronDown
} from 'lucide-react'

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login?redirect=/bookings')
        return
      }
      
      setUser(session.user)
      
      // Check if user is a customer
      const userType = session.user.user_metadata?.user_type
      if (userType !== 'customer') {
        alert('Only customers can view bookings')
        router.push('/')
        return
      }
      
      await loadBookings(session.user.id)
      
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    }
  }

  const loadBookings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          provider:providers!bookings_provider_id_fkey (
            business_name,
            service_type,
            profile_picture_url,
            phone,
            email
          )
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading bookings:', error)
        return
      }

      setBookings(data || [])
    } catch (error) {
      console.error('Error loading bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true
    if (filter === 'pending') return booking.status === 'pending'
    if (filter === 'confirmed') return booking.status === 'confirmed'
    if (filter === 'completed') return booking.status === 'completed'
    if (filter === 'cancelled') return booking.status === 'cancelled'
    return true
  }).filter(booking => 
    booking.provider?.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.service_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4" />
      case 'confirmed': return <CheckCircle className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)

      if (error) throw error

      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
      ))

      alert('Booking cancelled successfully')
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Failed to cancel booking')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
                <p className="text-gray-600 text-sm">
                  {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/bookings/new')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 font-medium"
            >
              + New Booking
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium capitalize ${
                  filter === status
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-64"
            />
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || filter !== 'all' ? 'No matching bookings' : 'No bookings yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filter !== 'all' 
                ? 'Try a different search or filter'
                : 'Book a service to get started'}
            </p>
            {(!searchQuery && filter === 'all') && (
              <button
                onClick={() => router.push('/marketplace')}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Browse Services
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Side - Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{booking.service_name}</h3>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            <span className="ml-1 capitalize">{booking.status}</span>
                          </span>
                          <span className="ml-3 text-sm text-gray-500">
                            #{booking.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          ₦{booking.service_price?.toLocaleString() || '0'}
                        </div>
                        <div className="text-sm text-gray-500">Total</div>
                      </div>
                    </div>

                    {/* Provider Info */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        {booking.provider?.profile_picture_url ? (
                          <img
                            src={booking.provider.profile_picture_url}
                            alt={booking.provider.business_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {booking.provider?.business_name?.charAt(0) || 'P'}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{booking.provider?.business_name || 'Provider'}</h4>
                        <p className="text-sm text-gray-500">{booking.provider?.service_type || 'Service'}</p>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <div>
                          <div className="font-medium">{new Date(booking.scheduled_date).toLocaleDateString()}</div>
                          <div className="text-sm">{booking.scheduled_time}</div>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{booking.address}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        <span>{booking.customer_name}</span>
                      </div>
                    </div>

                    {/* Description */}
                    {booking.description && (
                      <div className="mt-4">
                        <p className="text-gray-600 text-sm">{booking.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Side - Actions */}
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => router.push(`/messages?provider=${booking.provider_id}`)}
                      className="flex items-center justify-center px-4 py-2 border border-primary text-primary rounded-lg hover:bg-green-50 font-medium"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </button>
                    
                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="flex items-center justify-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel
                      </button>
                    )}
                    
                    {booking.status === 'completed' && (
                      <button
                        onClick={() => router.push(`/providers/${booking.provider_id}?tab=reviews`)}
                        className="flex items-center justify-center px-4 py-2 border border-yellow-300 text-yellow-600 rounded-lg hover:bg-yellow-50 font-medium"
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Write Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
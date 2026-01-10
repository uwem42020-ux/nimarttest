// app/provider/bookings/page.tsx - FIXED VERSION
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Calendar, Clock, MapPin, DollarSign, 
  User, Phone, Mail, CheckCircle, 
  XCircle, AlertCircle, ArrowLeft,
  Loader2, MessageSquare, Star,
  Filter, Search,
  Check, X
} from 'lucide-react'

export default function ProviderBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [providerId, setProviderId] = useState<string>('')
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login?redirect=/provider/bookings')
        return
      }
      
      setUser(session.user)
      
      // Check if user is a provider
      const userType = session.user.user_metadata?.user_type
      if (userType !== 'provider') {
        alert('Only providers can access this page')
        router.push('/')
        return
      }
      
      // Get provider ID
      const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', session.user.id)
        .single()
      
      if (provider) {
        setProviderId(provider.id)
        await loadBookings(provider.id)
      } else {
        // Try by email as fallback
        const { data: providerByEmail } = await supabase
          .from('providers')
          .select('id')
          .eq('email', session.user.email)
          .single()
        
        if (providerByEmail) {
          setProviderId(providerByEmail.id)
          await loadBookings(providerByEmail.id)
        } else {
          alert('Provider profile not found. Please complete your provider profile.')
          router.push('/provider/register')
        }
      }
      
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    }
  }

  const loadBookings = async (providerId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('provider_id', providerId)
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

  const handleBookingAction = async (bookingId: string, action: 'confirm' | 'complete' | 'cancel') => {
    setActionLoading(bookingId)
    
    try {
      let newStatus = ''
      let title = ''
      let message = ''
      
      switch (action) {
        case 'confirm':
          newStatus = 'confirmed'
          title = '📅 Booking Confirmed'
          message = 'Booking has been confirmed'
          break
        case 'complete':
          newStatus = 'completed'
          title = '✅ Booking Completed'
          message = 'Booking has been marked as completed'
          break
        case 'cancel':
          if (!confirm('Are you sure you want to cancel this booking?')) {
            setActionLoading(null)
            return
          }
          newStatus = 'cancelled'
          title = '❌ Booking Cancelled'
          message = 'Booking has been cancelled'
          break
      }

      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (error) throw error

      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      ))

      // Create notification for customer
      const booking = bookings.find(b => b.id === bookingId)
      if (booking?.customer_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: booking.customer_id,
            title: title,
            message: `${message} by ${user?.user_metadata?.business_name || 'the provider'}`,
            type: action === 'cancel' ? 'warning' : 'success',
            is_read: false,
            link: `/bookings`,
            created_at: new Date().toISOString()
          })
      }

      alert(`Booking ${newStatus} successfully!`)
      
    } catch (error) {
      console.error('Error updating booking:', error)
      alert('Failed to update booking')
    } finally {
      setActionLoading(null)
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
    booking.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.customer_phone?.toLowerCase().includes(searchQuery.toLowerCase())
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

  const getActionButtons = (booking: any) => {
    switch (booking.status) {
      case 'pending':
        return (
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => handleBookingAction(booking.id, 'confirm')}
              disabled={actionLoading === booking.id}
              className="flex items-center justify-center px-3 py-2 bg-primary text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50"
            >
              {actionLoading === booking.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Confirm Booking
            </button>
            <button
              onClick={() => handleBookingAction(booking.id, 'cancel')}
              disabled={actionLoading === booking.id}
              className="flex items-center justify-center px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium text-sm disabled:opacity-50"
            >
              <X className="h-4 w-4 mr-1" />
              Decline Booking
            </button>
          </div>
        )
      case 'confirmed':
        return (
          <button
            onClick={() => handleBookingAction(booking.id, 'complete')}
            disabled={actionLoading === booking.id}
            className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50"
          >
            {actionLoading === booking.id ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1" />
            )}
            Mark as Complete
          </button>
        )
      case 'completed':
        return (
          <div className="text-center">
            <span className="text-sm text-green-600 font-medium">Completed ✓</span>
            <p className="text-xs text-gray-500 mt-1">Service delivered</p>
          </div>
        )
      case 'cancelled':
        return (
          <div className="text-center">
            <span className="text-sm text-red-600 font-medium">Cancelled</span>
            <p className="text-xs text-gray-500 mt-1">Booking was declined</p>
          </div>
        )
      default:
        return null
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
                <h1 className="text-2xl font-bold text-gray-900">Booking Requests</h1>
                <p className="text-gray-600 text-sm">
                  {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
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
                className={`px-4 py-2 rounded-lg font-medium capitalize ${filter === status ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border'}`}
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
                : 'Your booking requests will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left Side - Booking Info */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{booking.service_name}</h3>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            <span className="ml-1 capitalize">{booking.status}</span>
                          </span>
                          <span className="ml-3 text-sm text-gray-500">
                            #{booking.id.slice(-8)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-0 text-right">
                        <div className="text-xl font-bold text-primary">
                          ₦{booking.service_price?.toLocaleString() || '0'}
                        </div>
                        <div className="text-sm text-gray-500">Total</div>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Customer Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="flex items-center text-gray-600">
                          <User className="h-4 w-4 mr-2" />
                          <span>{booking.customer_name}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{booking.customer_phone}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Mail className="h-4 w-4 mr-2" />
                          <span className="truncate">{booking.customer_email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <div>
                          <div className="font-medium">{new Date(booking.scheduled_date).toLocaleDateString()}</div>
                          <div className="text-sm">{booking.scheduled_time}</div>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="truncate">{booking.address}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Booked: {new Date(booking.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Description */}
                    {booking.description && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 text-sm">{booking.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Side - Actions */}
                  <div className="lg:w-64 space-y-4">
                    {getActionButtons(booking)}
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(`tel:${booking.customer_phone}`)}
                        className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </button>
                      <button
                        onClick={() => router.push(`/messages?customer=${booking.customer_id}`)}
                        className="flex-1 flex items-center justify-center px-3 py-2 border border-primary text-primary rounded-lg hover:bg-green-50 font-medium text-sm"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message
                      </button>
                    </div>
                    
                    {booking.status === 'completed' && (
                      <div className="text-center">
                        <button
                          onClick={() => router.push(`/provider/reviews?customer=${booking.customer_id}`)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Request Review
                        </button>
                      </div>
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
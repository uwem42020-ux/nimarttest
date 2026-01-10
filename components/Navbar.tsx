// components/Navbar.tsx - ENHANCED WITH DARK MODE & BETTER UI
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { 
  Home, Search, Briefcase, User, 
  LayoutDashboard, MessageSquare, Bell, Calendar,
  Star, Settings, LogOut, ChevronDown,
  X, RefreshCw, Menu
} from 'lucide-react'

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  link: string | null
  created_at: string
}

// Notification polling interval (2 seconds for real-time updates)
const NOTIFICATION_POLL_INTERVAL = 2000
const MESSAGE_POLL_INTERVAL = 3000

export default function EnhancedNavbar() {
  const [user, setUser] = useState<any>(null)
  const [userType, setUserType] = useState<'customer' | 'provider' | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [providerData, setProviderData] = useState<any>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false)
  const [lastNotificationCheck, setLastNotificationCheck] = useState<Date>(new Date())
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  // Check for dark mode preference
  useEffect(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDarkMode(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Auth listener
  useEffect(() => {
    let mounted = true
    let notificationSubscription: any = null
    let messageSubscription: any = null
    
    const checkAuth = async () => {
      if (!mounted) return
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted) {
          setUser(session?.user || null)
          setUserType(session?.user?.user_metadata?.user_type || null)
          
          if (session?.user?.user_metadata?.user_type === 'provider') {
            await loadProviderData(session.user)
          }
          
          if (session?.user) {
            await loadNotifications(session.user.id)
            await loadUnreadMessages(session.user.id)
            setupRealTimeSubscriptions(session.user.id)
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
        if (mounted) {
          setUser(null)
          setUserType(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setUser(session?.user || null)
          setUserType(session?.user?.user_metadata?.user_type || null)
          
          if (session?.user?.user_metadata?.user_type === 'provider') {
            await loadProviderData(session.user)
          }
          
          if (session?.user) {
            await loadNotifications(session.user.id)
            await loadUnreadMessages(session.user.id)
            setupRealTimeSubscriptions(session.user.id)
          } else {
            // Cleanup on logout
            setNotifications([])
            setUnreadCount(0)
            setUnreadMessages(0)
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
      if (notificationSubscription) {
        supabase.removeChannel(notificationSubscription)
      }
      if (messageSubscription) {
        supabase.removeChannel(messageSubscription)
      }
    }
  }, [])

  // Poll for new notifications
  useEffect(() => {
    let notificationPollInterval: NodeJS.Timeout
    let messagePollInterval: NodeJS.Timeout
    
    if (user) {
      notificationPollInterval = setInterval(() => {
        pollNewNotifications()
      }, NOTIFICATION_POLL_INTERVAL)
      
      messagePollInterval = setInterval(() => {
        pollUnreadMessages()
      }, MESSAGE_POLL_INTERVAL)
    }
    
    return () => {
      if (notificationPollInterval) clearInterval(notificationPollInterval)
      if (messagePollInterval) clearInterval(messagePollInterval)
    }
  }, [user, lastNotificationCheck])

  const setupRealTimeSubscriptions = (userId: string) => {
    // Notifications subscription
    const notificationChannel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotification = payload.new as Notification
          console.log('📢 New notification received:', newNotification)
          
          setNotifications(prev => [newNotification, ...prev])
          if (!newNotification.is_read) {
            setUnreadCount(prev => prev + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification
          
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          )
          
          // Update unread count
          const currentUnread = notifications.filter(n => !n.is_read).length
          setUnreadCount(currentUnread)
        }
      )
      .subscribe()

    // Messages subscription for unread count
    const messageChannel = supabase
      .channel(`messages-unread-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        async (payload) => {
          const newMessage = payload.new as any
          if (!newMessage.is_read) {
            await loadUnreadMessages(userId)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        async (payload) => {
          const updatedMessage = payload.new as any
          await loadUnreadMessages(userId)
        }
      )
      .subscribe()

    // Bookings subscription for providers
    if (userType === 'provider') {
      const bookingChannel = supabase
        .channel(`bookings-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'bookings'
          },
          async (payload) => {
            const newBooking = payload.new as any
            // Check if this booking is for the current provider
            const provider = await getProviderByUserId(userId)
            if (provider && newBooking.provider_id === provider.id) {
              // Create notification for provider
              await createBookingNotification(userId, newBooking)
            }
          }
        )
        .subscribe()
    }
  }

  const pollNewNotifications = async () => {
    if (!user) return
    
    try {
      const { data: newNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .gt('created_at', lastNotificationCheck.toISOString())
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      if (newNotifications && newNotifications.length > 0) {
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id))
          const uniqueNewNotifications = newNotifications.filter(n => !existingIds.has(n.id))
          
          if (uniqueNewNotifications.length === 0) return prev
          
          // Update last check time
          setLastNotificationCheck(new Date())
          
          // Count new unread notifications
          const newUnread = uniqueNewNotifications.filter(n => !n.is_read).length
          if (newUnread > 0) {
            setUnreadCount(prev => prev + newUnread)
          }
          
          return [...uniqueNewNotifications, ...prev]
        })
      }
    } catch (error) {
      console.error('Error polling notifications:', error)
    }
  }

  const pollUnreadMessages = async () => {
    if (!user) return
    
    try {
      await loadUnreadMessages(user.id)
    } catch (error) {
      console.error('Error polling unread messages:', error)
    }
  }

  const loadProviderData = async (user: any) => {
    try {
      const { data } = await supabase
        .from('providers')
        .select('*')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .single()
      
      if (data) {
        setProviderData(data)
        if (data.profile_picture_url) {
          setProfileImage(data.profile_picture_url)
        }
      }
    } catch (error) {
      console.error('Error loading provider data:', error)
    }
  }

  const getProviderByUserId = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', userId)
        .single()
      
      return data
    } catch (error) {
      console.error('Error getting provider:', error)
      return null
    }
  }

  const loadNotifications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error loading notifications:', error)
        return
      }

      if (data) {
        setNotifications(data)
        const unread = data.filter(n => !n.is_read).length
        setUnreadCount(unread)
        setLastNotificationCheck(new Date())
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const loadUnreadMessages = async (userId: string) => {
    try {
      let unreadCount = 0
      
      if (userType === 'customer') {
        const { data: messages, error } = await supabase
          .from('messages')
          .select('id')
          .eq('receiver_id', userId)
          .eq('is_read', false)

        if (error) throw error
        unreadCount = messages?.length || 0
      } else if (userType === 'provider') {
        // Get provider ID
        const provider = await getProviderByUserId(userId)
        if (provider) {
          const { data: messages, error } = await supabase
            .from('messages')
            .select('id')
            .eq('receiver_id', userId)
            .eq('provider_id', provider.id)
            .eq('is_read', false)

          if (error) throw error
          unreadCount = messages?.length || 0
        }
      }
      
      setUnreadMessages(unreadCount)
    } catch (error) {
      console.error('Error loading unread messages:', error)
    }
  }

  const createBookingNotification = async (userId: string, booking: any) => {
    try {
      // Get customer name
      const { data: customer } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', booking.customer_id)
        .maybeSingle()

      const customerName = customer?.display_name || 'Customer'
      
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: '📅 New Booking',
          message: `${customerName} booked your service`,
          type: 'booking',
          is_read: false,
          link: '/provider/bookings',
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error creating booking notification:', error)
    }
  }

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      // Update UI immediately
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))

      // Update in database
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        // Revert UI change on error
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: false } : n)
        )
        setUnreadCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllNotificationsAsRead = async () => {
    try {
      if (!user) return

      // Update UI immediately
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)

      // Update in database
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        // Revert on error - reload from server
        await loadNotifications(user.id)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleLogout = async () => {
    if (loggingOut) return
    
    setLoggingOut(true)
    try {
      setUserMenuOpen(false)
      setMobileMenuOpen(false)
      
      // Clear local state immediately for better UX
      setUser(null)
      setUserType(null)
      setNotifications([])
      setUnreadCount(0)
      setUnreadMessages(0)
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear all cookies
      document.cookie.split(";").forEach(cookie => {
        const [name] = cookie.trim().split('=')
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}`
      })
      
      // Clear storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Redirect to login
      window.location.href = '/login?logout=true'
      
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/login?logout=true'
    } finally {
      setLoggingOut(false)
    }
  }

  // Close menus when clicking outside - FIXED VERSION
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationMenuOpen(false)
      }
    }

    // Use capture phase to ensure we catch the click
    document.addEventListener('mousedown', handleClickOutside, true)
    return () => document.removeEventListener('mousedown', handleClickOutside, true)
  }, [])

  // Also close on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false)
        setNotificationMenuOpen(false)
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscapeKey)
    return () => document.removeEventListener('keydown', handleEscapeKey)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
    setNotificationMenuOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return '?'
    if (user.user_metadata?.business_name) {
      return user.user_metadata.business_name.charAt(0).toUpperCase()
    }
    if (user.user_metadata?.name) {
      return user.user_metadata.name.charAt(0).toUpperCase()
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return '?'
  }

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return '📅'
      case 'message':
        return '💬'
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      default:
        return 'ℹ️'
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id)
    }
    
    // Navigate if link exists
    if (notification.link) {
      router.push(notification.link)
      setNotificationMenuOpen(false)
    }
  }

  const handleRefreshNotifications = async () => {
    if (!user) return
    
    try {
      await loadNotifications(user.id)
      await loadUnreadMessages(user.id)
    } catch (error) {
      console.error('Error refreshing notifications:', error)
    }
  }

  // Calculate total badge count (notifications + unread messages)
  const totalBadgeCount = unreadCount + unreadMessages

  // Check if on iOS
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
  }

  return (
    <>
      {/* Fixed Navigation Container - Always visible with iOS safe area */}
      <div className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b shadow-sm transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-gray-900/90 border-gray-700/50' 
          : 'bg-white/90 border-gray-200/50'
      } ${isIOS() ? 'pt-safe' : ''}`} style={{ paddingTop: isIOS() ? 'env(safe-area-inset-top)' : '0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Side: Logo */}
            <div className="flex items-center">
              <Link 
                href="/" 
                className="flex items-center group transition-transform duration-200 hover:scale-105"
              >
                <div className="relative h-8 w-28">
                  <Image
                    src={isDarkMode ? "/logo-dark.png" : "/logo.png"}
                    alt="Nimart Logo"
                    fill
                    className="object-contain"
                    priority
                    sizes="112px"
                  />
                </div>
              </Link>
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              {loading ? (
                <div className={`h-10 w-24 rounded-lg animate-pulse ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
              ) : user ? (
                <>
                  {/* Messages Icon with Badge */}
                  <div className="relative">
                    <Link
                      href="/messages"
                      className={`p-2 rounded-lg transition-all duration-200 relative inline-flex items-center justify-center ${
                        isDarkMode 
                          ? 'text-gray-300 hover:text-primary hover:bg-gray-800' 
                          : 'text-gray-600 hover:text-primary hover:bg-gray-100'
                      }`}
                      title="Messages"
                    >
                      <MessageSquare className="h-5 w-5" />
                      {unreadMessages > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 animate-pulse ${
                          isDarkMode ? 'border-gray-900' : 'border-white'
                        }">
                          {unreadMessages > 9 ? '9+' : unreadMessages}
                        </span>
                      )}
                    </Link>
                  </div>

                  {/* Notifications Icon with Dropdown */}
                  <div className="relative" ref={notificationRef}>
                    <button
                      onClick={() => {
                        setNotificationMenuOpen(!notificationMenuOpen)
                        setUserMenuOpen(false)
                      }}
                      className={`p-2 rounded-lg transition-all duration-200 relative inline-flex items-center justify-center ${
                        isDarkMode 
                          ? 'text-gray-300 hover:text-primary hover:bg-gray-800' 
                          : 'text-gray-600 hover:text-primary hover:bg-gray-100'
                      }`}
                      title="Notifications"
                    >
                      <Bell className="h-5 w-5" />
                      {totalBadgeCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 animate-pulse ${
                          isDarkMode ? 'border-gray-900' : 'border-white'
                        }">
                          {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
                        </span>
                      )}
                    </button>

                    {/* Notifications Dropdown Menu */}
                    {notificationMenuOpen && (
                      <div className={`absolute right-0 mt-2 w-96 rounded-xl shadow-xl border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-[80vh] z-50 ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-100'
                      }`}>
                        <div className={`p-4 border-b ${
                          isDarkMode 
                            ? 'border-gray-700 bg-gray-800' 
                            : 'border-gray-100 bg-gradient-to-r from-gray-50 to-white'
                        }`}>
                          <div className="flex justify-between items-center">
                            <h3 className={`font-semibold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              Notifications
                            </h3>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={handleRefreshNotifications}
                                className={`p-1 rounded-lg transition-colors ${
                                  isDarkMode 
                                    ? 'hover:bg-gray-700' 
                                    : 'hover:bg-gray-100'
                                }`}
                                title="Refresh notifications"
                              >
                                <RefreshCw className={`h-4 w-4 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                              </button>
                              {unreadCount > 0 && (
                                <button
                                  onClick={markAllNotificationsAsRead}
                                  className="text-sm text-primary hover:text-green-700 font-medium"
                                >
                                  Mark all as read
                                </button>
                              )}
                            </div>
                          </div>
                          <div className={`flex items-center mt-2 text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <span className="mr-3">📅 Bookings</span>
                            <span className="mr-3">💬 Messages</span>
                            <span>Total: {totalBadgeCount}</span>
                          </div>
                        </div>
                        
                        <div className="overflow-y-auto max-h-96">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                              <Bell className={`h-12 w-12 mx-auto mb-4 ${
                                isDarkMode ? 'text-gray-600' : 'text-gray-400'
                              }`} />
                              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                                No notifications
                              </p>
                              <p className={`text-sm mt-2 ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                                Your notifications will appear here
                              </p>
                            </div>
                          ) : (
                            <div className={`divide-y ${
                              isDarkMode ? 'divide-gray-700' : 'divide-gray-100'
                            }`}>
                              {notifications.slice(0, 20).map((notification) => (
                                <div
                                  key={notification.id}
                                  className={`p-4 transition-colors cursor-pointer ${
                                    !notification.is_read 
                                      ? isDarkMode 
                                        ? 'bg-blue-900/20' 
                                        : 'bg-blue-50/50'
                                      : isDarkMode 
                                        ? 'hover:bg-gray-700/50' 
                                        : 'hover:bg-gray-50'
                                  }`}
                                  onClick={() => handleNotificationClick(notification)}
                                >
                                  <div className="flex items-start space-x-3">
                                    <div className="mt-1 text-lg">
                                      {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-start">
                                        <h4 className={`font-medium ${
                                          !notification.is_read 
                                            ? 'text-primary' 
                                            : isDarkMode 
                                              ? 'text-white' 
                                              : 'text-gray-900'
                                        }`}>
                                          {notification.title}
                                        </h4>
                                        {!notification.is_read && (
                                          <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                                        )}
                                      </div>
                                      <p className={`text-sm mt-1 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                      }`}>
                                        {notification.message}
                                      </p>
                                      <div className="flex items-center justify-between mt-2">
                                        <span className={`text-xs ${
                                          isDarkMode ? 'text-gray-500' : 'text-gray-500'
                                        }`}>
                                          {formatNotificationTime(notification.created_at)}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded ${
                                          notification.type === 'booking' 
                                            ? isDarkMode 
                                              ? 'bg-blue-900/30 text-blue-300' 
                                              : 'bg-blue-100 text-blue-800'
                                            : notification.type === 'message'
                                            ? isDarkMode 
                                              ? 'bg-green-900/30 text-green-300' 
                                              : 'bg-green-100 text-green-800'
                                            : isDarkMode 
                                              ? 'bg-gray-700 text-gray-300' 
                                              : 'bg-gray-100 text-gray-600'
                                        }`}>
                                          {notification.type}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className={`border-t p-3 ${
                          isDarkMode 
                            ? 'border-gray-700 bg-gray-800' 
                            : 'border-gray-100 bg-gray-50'
                        }`}>
                          <Link
                            href="/notifications"
                            className="block text-center text-sm text-primary hover:text-green-700 font-medium"
                            onClick={() => setNotificationMenuOpen(false)}
                          >
                            View all notifications →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Avatar with Dropdown */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => {
                        setUserMenuOpen(!userMenuOpen)
                        setNotificationMenuOpen(false)
                      }}
                      className={`flex items-center space-x-2 p-1 rounded-lg transition-all duration-200 group ${
                        isDarkMode 
                          ? 'hover:bg-gray-800' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition-colors ${
                        isDarkMode 
                          ? 'border-gray-600 group-hover:border-primary' 
                          : 'border-gray-200 group-hover:border-primary'
                      }`}>
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.parentElement!.innerHTML = `
                                <div class="w-full h-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center text-white font-semibold text-sm">
                                  ${getUserInitials()}
                                </div>
                              `
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center text-white font-semibold text-sm">
                            {getUserInitials()}
                          </div>
                        )}
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                        userMenuOpen ? 'rotate-180' : ''
                      } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </button>

                    {/* User Dropdown Menu */}
                    {userMenuOpen && (
                      <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-xl border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50 ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-100'
                      }`}>
                        <div className={`p-4 border-b ${
                          isDarkMode 
                            ? 'border-gray-700 bg-gray-800' 
                            : 'border-gray-100 bg-gradient-to-r from-gray-50 to-white'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
                              {profileImage ? (
                                <img
                                  src={profileImage}
                                  alt="Profile"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                    e.currentTarget.parentElement!.innerHTML = `
                                      <div class="w-full h-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center text-white font-semibold">
                                        ${getUserInitials()}
                                      </div>
                                    `
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center text-white font-semibold">
                                  {getUserInitials()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {user.user_metadata?.business_name || 
                                 user.user_metadata?.name || 
                                 user.email?.split('@')[0]}
                              </p>
                              <p className={`text-xs truncate ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {user.email}
                              </p>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                userType === 'provider' 
                                  ? isDarkMode 
                                    ? 'bg-green-900/30 text-green-300' 
                                    : 'bg-green-100 text-green-800'
                                  : isDarkMode 
                                    ? 'bg-blue-900/30 text-blue-300' 
                                    : 'bg-blue-100 text-blue-800'
                              }`}>
                                {userType === 'provider' ? 'Provider' : 'Customer'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="py-2">
                          {userType === 'provider' ? (
                            <>
                              <Link
                                href="/provider/dashboard"
                                className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                                  isDarkMode 
                                    ? 'text-gray-300 hover:bg-gray-700' 
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <LayoutDashboard className={`h-4 w-4 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                                <span>Dashboard</span>
                              </Link>
                              <Link
                                href="/provider/bookings"
                                className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                                  isDarkMode 
                                    ? 'text-gray-300 hover:bg-gray-700' 
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <Calendar className={`h-4 w-4 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                                <span>Bookings</span>
                              </Link>
                              <Link
                                href="/provider/settings"
                                className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                                  isDarkMode 
                                    ? 'text-gray-300 hover:bg-gray-700' 
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <Settings className={`h-4 w-4 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                                <span>Settings</span>
                              </Link>
                            </>
                          ) : (
                            <>
                              <Link
                                href="/bookings"
                                className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                                  isDarkMode 
                                    ? 'text-gray-300 hover:bg-gray-700' 
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <Calendar className={`h-4 w-4 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                                <span>My Bookings</span>
                              </Link>
                              <Link
                                href="/profile"
                                className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                                  isDarkMode 
                                    ? 'text-gray-300 hover:bg-gray-700' 
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <User className={`h-4 w-4 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                                <span>Profile</span>
                              </Link>
                            </>
                          )}
                          
                          <Link
                            href="/messages"
                            className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors relative ${
                              isDarkMode 
                                ? 'text-gray-300 hover:bg-gray-700' 
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <MessageSquare className={`h-4 w-4 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <span>Messages</span>
                            {unreadMessages > 0 && (
                              <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {unreadMessages > 9 ? '9+' : unreadMessages}
                              </span>
                            )}
                          </Link>
                          
                          <Link
                            href="/notifications"
                            className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors relative ${
                              isDarkMode 
                                ? 'text-gray-300 hover:bg-gray-700' 
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Bell className={`h-4 w-4 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <span>Notifications</span>
                            {unreadCount > 0 && (
                              <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                            )}
                          </Link>
                          
                          {/* For Providers link for non-providers */}
                          {userType !== 'provider' && !loading && (
                            <div className={`mt-2 pt-3 border-t ${
                              isDarkMode ? 'border-gray-700' : 'border-gray-100'
                            }`}>
                              <Link
                                href="/provider/register"
                                className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                                  isDarkMode 
                                    ? 'text-primary hover:bg-green-900/20' 
                                    : 'text-primary hover:bg-green-50'
                                }`}
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <Briefcase className="h-4 w-4" />
                                <span>Become a Provider</span>
                              </Link>
                            </div>
                          )}
                        </div>
                        
                        {/* Logout */}
                        <div className={`py-2 border-t ${
                          isDarkMode ? 'border-gray-700' : 'border-gray-100'
                        }`}>
                          <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className={`w-full flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                              isDarkMode 
                                ? 'text-red-400 hover:bg-red-900/20' 
                                : 'text-red-600 hover:bg-red-50'
                            } disabled:opacity-50`}
                          >
                            {loggingOut ? (
                              <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <LogOut className="h-4 w-4" />
                            )}
                            <span>{loggingOut ? 'Logging out...' : 'Sign Out'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className={`px-4 py-2 border rounded-lg font-medium transition-all duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:border-primary hover:text-primary hover:bg-primary/10' 
                        : 'border-gray-300 text-gray-700 hover:border-primary hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-gradient-to-r from-primary to-green-600 text-white rounded-lg hover:from-green-600 hover:to-primary font-medium shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center space-x-4">
              {/* Messages Icon (Mobile) */}
              {user && (
                <div className="relative">
                  <Link
                    href="/messages"
                    className={`p-2 rounded-lg transition-all duration-200 relative inline-flex items-center justify-center ${
                      isDarkMode 
                        ? 'text-gray-300 hover:text-primary hover:bg-gray-800' 
                        : 'text-gray-600 hover:text-primary hover:bg-gray-100'
                    }`}
                    title="Messages"
                  >
                    <MessageSquare className="h-5 w-5" />
                    {unreadMessages > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 ${
                        isDarkMode ? 'border-gray-900' : 'border-white'
                      }">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>
                </div>
              )}

              {/* Notifications Icon (Mobile) */}
              {user && (
                <div className="relative">
                  <Link
                    href="/notifications"
                    className={`p-2 rounded-lg transition-all duration-200 relative inline-flex items-center justify-center ${
                      isDarkMode 
                        ? 'text-gray-300 hover:text-primary hover:bg-gray-800' 
                        : 'text-gray-600 hover:text-primary hover:bg-gray-100'
                    }`}
                    title="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {totalBadgeCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 ${
                        isDarkMode ? 'border-gray-900' : 'border-white'
                      }">
                        {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
                      </span>
                    )}
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-primary hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-primary hover:bg-gray-100'
                }`}
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${
          mobileMenuOpen 
            ? 'opacity-100 pointer-events-auto' 
            : 'opacity-0 pointer-events-none'
        }`}
        style={{ marginTop: isIOS() ? 'calc(64px + env(safe-area-inset-top))' : '64px' }}
      >
        <div 
          className={`absolute inset-0 transition-opacity duration-300 ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0'
          } ${isDarkMode ? 'bg-black/70' : 'bg-black/50'}`}
          onClick={() => setMobileMenuOpen(false)}
        />
        
        <div 
          className={`absolute top-0 right-0 bottom-0 w-80 shadow-xl transition-all duration-300 ${
            mobileMenuOpen 
              ? 'translate-x-0 opacity-100' 
              : 'translate-x-full opacity-0'
          } ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
        >
          {/* User Info Header */}
          <div className={`p-4 border-b ${
            isDarkMode 
              ? 'border-gray-700 bg-gray-800' 
              : 'border-gray-200 bg-gradient-to-r from-gray-50 to-white'
          }`}>
            <div className="flex items-center">
              <div className="relative w-14 h-14 rounded-full overflow-hidden mr-3 border-2 border-primary">
                {user && profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="w-full h-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center text-white font-semibold text-lg">
                          ${getUserInitials()}
                        </div>
                      `
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center text-white font-semibold text-lg">
                    {user ? getUserInitials() : '?'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {user ? (user.user_metadata?.business_name || 
                           user.user_metadata?.name || 
                           user.email?.split('@')[0]) : 'Welcome'}
                </p>
                {user && (
                  <>
                    <p className={`text-xs truncate ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {user.email}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      userType === 'provider' 
                        ? isDarkMode 
                          ? 'bg-green-900/30 text-green-300' 
                          : 'bg-green-100 text-green-800'
                        : isDarkMode 
                          ? 'bg-blue-900/30 text-blue-300' 
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {userType === 'provider' ? 'Provider' : 'Customer'}
                    </span>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setMobileMenuOpen(false)}
                className={`ml-3 p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="overflow-y-auto h-[calc(100%-80px)]">
            <div className="p-4 space-y-1">
              {user ? (
                <>
                  {userType === 'provider' ? (
                    <>
                      <Link
                        href="/provider/dashboard"
                        className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                          pathname === '/provider/dashboard'
                            ? 'bg-primary text-white font-medium'
                            : isDarkMode 
                              ? 'text-gray-300 hover:text-primary hover:bg-gray-700' 
                              : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-5 w-5 mr-3" />
                        <span>Dashboard</span>
                      </Link>
                      <Link
                        href="/provider/bookings"
                        className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                          pathname === '/provider/bookings'
                            ? 'bg-primary text-white font-medium'
                            : isDarkMode 
                              ? 'text-gray-300 hover:text-primary hover:bg-gray-700' 
                              : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Calendar className="h-5 w-5 mr-3" />
                        <span>Bookings</span>
                      </Link>
                      <Link
                        href="/provider/settings"
                        className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                          pathname === '/provider/settings'
                            ? 'bg-primary text-white font-medium'
                            : isDarkMode 
                              ? 'text-gray-300 hover:text-primary hover:bg-gray-700' 
                              : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="h-5 w-5 mr-3" />
                        <span>Settings</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/bookings"
                        className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                          pathname === '/bookings'
                            ? 'bg-primary text-white font-medium'
                            : isDarkMode 
                              ? 'text-gray-300 hover:text-primary hover:bg-gray-700' 
                              : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Calendar className="h-5 w-5 mr-3" />
                        <span>My Bookings</span>
                      </Link>
                      <Link
                        href="/profile"
                        className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                          pathname === '/profile'
                            ? 'bg-primary text-white font-medium'
                            : isDarkMode 
                              ? 'text-gray-300 hover:text-primary hover:bg-gray-700' 
                              : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-5 w-5 mr-3" />
                        <span>Profile</span>
                      </Link>
                    </>
                  )}
                  
                  <Link
                    href="/messages"
                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 relative ${
                      pathname === '/messages'
                        ? 'bg-primary text-white font-medium'
                        : isDarkMode 
                          ? 'text-gray-300 hover:text-primary hover:bg-gray-700' 
                          : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageSquare className="h-5 w-5 mr-3" />
                    <span>Messages</span>
                    {unreadMessages > 0 && (
                      <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>
                  
                  <Link
                    href="/notifications"
                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 relative ${
                      pathname === '/notifications'
                        ? 'bg-primary text-white font-medium'
                        : isDarkMode 
                          ? 'text-gray-300 hover:text-primary hover:bg-gray-700' 
                          : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Bell className="h-5 w-5 mr-3" />
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* For Providers link for non-providers */}
                  {userType !== 'provider' && !loading && (
                    <>
                      <div className={`my-2 border-t ${
                        isDarkMode ? 'border-gray-700' : 'border-gray-200'
                      }`}></div>
                      <Link
                        href="/provider/register"
                        className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                          isDarkMode 
                            ? 'text-primary hover:text-green-700 hover:bg-green-900/20' 
                            : 'text-primary hover:text-green-700 hover:bg-green-50'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Briefcase className="h-5 w-5 mr-3 text-primary" />
                        <span>Become a Provider</span>
                      </Link>
                    </>
                  )}

                  <div className={`my-2 border-t ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}></div>

                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors disabled:opacity-50 ${
                      isDarkMode 
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' 
                        : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                    }`}
                  >
                    {loggingOut ? (
                      <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <LogOut className="h-5 w-5 mr-3" />
                    )}
                    <span>{loggingOut ? 'Logging out...' : 'Sign Out'}</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'text-primary hover:text-green-700 hover:bg-green-900/20' 
                        : 'text-primary hover:text-green-700 hover:bg-green-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5 mr-3 text-primary" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center px-4 py-3 bg-gradient-to-r from-primary to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-primary transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="mr-3">+</span>
                    <span>Create Account</span>
                  </Link>
                  <Link
                    href="/provider/register"
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'text-primary hover:text-green-700 hover:bg-green-900/20' 
                        : 'text-primary hover:text-green-700 hover:bg-green-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Briefcase className="h-5 w-5 mr-3 text-primary" />
                    <span>Become a Provider</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className={`h-16 ${isIOS() ? 'pt-safe' : ''}`} style={{ paddingTop: isIOS() ? 'env(safe-area-inset-top)' : '0' }}></div>
    </>
  )
}
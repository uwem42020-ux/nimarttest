// app/notifications/page.tsx - FIXED VERSION
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Bell, Check, Trash2, AlertCircle, 
  CheckCircle, Info, ArrowLeft,
  Filter, Clock, Mail, MessageSquare
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

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuthAndLoadNotifications()
  }, [])

  async function checkAuthAndLoadNotifications() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login')
        return
      }
      
      setUser(session.user)
      await loadNotifications(session.user.id)
      
    } catch (error) {
      console.error('Error loading notifications:', error)
      router.push('/login')
    }
  }

  async function loadNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading notifications:', error)
        return
      }

      setNotifications(data || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  async function markAllAsRead() {
    try {
      if (!user) return

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      alert('All notifications marked as read!')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      alert('Failed to mark all as read')
    }
  }

  async function deleteNotification(notificationId: string) {
    if (!confirm('Are you sure you want to delete this notification?')) return

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
      alert('Failed to delete notification')
    }
  }

  async function handleNotificationClick(notification: Notification) {
    // Mark as read if unread
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    
    // Navigate if link exists
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'message': return <MessageSquare className="h-5 w-5 text-blue-500" />
      case 'mail': return <Mail className="h-5 w-5 text-purple-500" />
      default: return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600 text-sm">
                  {notifications.filter(n => !n.is_read).length} unread notifications
                </p>
              </div>
            </div>
            {notifications.filter(n => !n.is_read).length > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 font-medium"
              >
                <Check className="h-4 w-4 inline mr-2" />
                Mark all as read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium ${filter === 'all' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium ${filter === 'unread' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Unread ({notifications.filter(n => !n.is_read).length})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No notifications
            </h3>
            <p className="text-gray-600">
              {filter === 'unread' 
                ? 'You have no unread notifications'
                : 'You have no notifications yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-xl shadow-sm p-4 border cursor-pointer transition-all hover:shadow-md ${notification.is_read ? 'border-gray-200' : 'border-primary border-l-4'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${notification.is_read ? 'text-gray-900' : 'text-primary'}`}>
                        {notification.title}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(notification.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!notification.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(notification.id)
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notification.id)
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {notification.link && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => router.push(notification.link!)}
                      className="text-primary hover:text-green-700 font-medium text-sm"
                    >
                      View details →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
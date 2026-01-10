// lib/notifications.ts
import { supabase } from './supabase'

export interface NotificationData {
  user_id: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  is_read?: boolean
  link?: string
}

export async function createNotification(data: NotificationData) {
  try {
    const notification = {
      ...data,
      type: data.type || 'info',
      is_read: data.is_read || false,
      created_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('notifications')
      .insert(notification)

    if (error) {
      console.error('Error creating notification:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error creating notification:', error)
    return false
  }
}

export async function createBookingNotification(
  providerUserId: string, 
  customerId: string, 
  bookingData: any
) {
  // Notification for provider
  await createNotification({
    user_id: providerUserId,
    title: '📅 New Booking Request',
    message: `${bookingData.customer_name} has requested a booking for ${bookingData.scheduled_date} at ${bookingData.scheduled_time}`,
    type: 'info',
    link: '/provider/bookings'
  })

  // Notification for customer
  await createNotification({
    user_id: customerId,
    title: '✅ Booking Request Sent',
    message: 'Your booking request has been sent. The provider will respond within 24 hours.',
    type: 'success',
    link: '/bookings'
  })
}

export async function createMessageNotification(
  receiverId: string,
  senderId: string,
  message: string
) {
  try {
    // Get sender details
    const { data: sender } = await supabase
      .from('profiles')
      .select('display_name, user_metadata')
      .eq('user_id', senderId)
      .single()

    const senderName = sender?.display_name || 
                      sender?.user_metadata?.name || 
                      sender?.user_metadata?.business_name || 
                      'User'

    await createNotification({
      user_id: receiverId,
      title: '💬 New Message',
      message: `${senderName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
      type: 'info',
      link: '/messages'
    })
  } catch (error) {
    console.error('Error creating message notification:', error)
  }
}
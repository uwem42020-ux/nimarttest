// app/messages/page.tsx - FINAL OPTIMIZED VERSION
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  ArrowLeft, MessageSquare, Send, Search, User, 
  Clock, Check, CheckCheck, Phone, Mail,
  Loader2, Calendar, Briefcase, Star,
  RefreshCw
} from 'lucide-react'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
  provider_id?: string
  booking_id?: string
}

interface Conversation {
  id: string
  other_user_id: string
  other_user_name: string
  other_user_type: string
  provider_id: string
  last_message: string
  last_message_time: string
  unread_count: number
  business_name?: string
  profile_picture_url?: string
  service_type?: string
}

// Message polling interval (3 seconds for fast updates)
const MESSAGE_POLL_INTERVAL = 3000
const CONVERSATION_POLL_INTERVAL = 5000

export default function MessagesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [userType, setUserType] = useState<'customer' | 'provider' | null>(null)
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [otherUserDetails, setOtherUserDetails] = useState<any>(null)
  const [providerId, setProviderId] = useState<string>('')
  const [lastMessageUpdate, setLastMessageUpdate] = useState<Date>(new Date())
  const [lastConversationUpdate, setLastConversationUpdate] = useState<Date>(new Date())
  const [messageSubscription, setMessageSubscription] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  const paramProviderId = searchParams.get('provider')
  const paramCustomerId = searchParams.get('customer')

  useEffect(() => {
    checkAuth()
    return () => {
      // Cleanup subscriptions when component unmounts
      if (messageSubscription) {
        supabase.removeChannel(messageSubscription)
      }
    }
  }, [])

  useEffect(() => {
    if (user && userType) {
      loadConversations()
      if (paramProviderId || paramCustomerId) {
        handleParamConversation()
      }
      // Setup real-time subscriptions
      setupRealtimeSubscriptions()
    }
  }, [user, userType, paramProviderId, paramCustomerId])

  useEffect(() => {
    if (selectedConversation && user) {
      loadMessages(selectedConversation)
      markMessagesAsRead(selectedConversation)
      // Setup message subscription for this conversation
      setupMessageSubscription(selectedConversation)
    }
  }, [selectedConversation, user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Poll for new messages
  useEffect(() => {
    let messagePollInterval: NodeJS.Timeout
    let conversationPollInterval: NodeJS.Timeout
    
    if (selectedConversation && user) {
      messagePollInterval = setInterval(() => {
        pollNewMessages(selectedConversation)
      }, MESSAGE_POLL_INTERVAL)
    }
    
    if (user) {
      conversationPollInterval = setInterval(() => {
        pollConversations()
      }, CONVERSATION_POLL_INTERVAL)
    }
    
    return () => {
      if (messagePollInterval) clearInterval(messagePollInterval)
      if (conversationPollInterval) clearInterval(conversationPollInterval)
    }
  }, [selectedConversation, user])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login?redirect=/messages')
        return
      }
      
      setUser(session.user)
      const userType = session.user.user_metadata?.user_type
      setUserType(userType as 'customer' | 'provider')
      
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleParamConversation = async () => {
    try {
      if (userType === 'customer' && paramProviderId) {
        setSelectedConversation(paramProviderId)
        
        const { data: provider } = await supabase
          .from('providers')
          .select('id, business_name, profile_picture_url, service_type')
          .eq('id', paramProviderId)
          .single()

        if (provider) {
          setOtherUserDetails({
            id: provider.id,
            name: provider.business_name,
            type: 'provider',
            image: provider.profile_picture_url,
            service_type: provider.service_type
          })
        }
      } else if (userType === 'provider' && paramCustomerId) {
        setSelectedConversation(paramCustomerId)
        
        try {
          const { data: customer } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', paramCustomerId)
            .maybeSingle()

          setOtherUserDetails({
            id: paramCustomerId,
            name: customer?.display_name || 'Customer',
            type: 'customer',
            image: customer?.avatar_url
          })
        } catch (error) {
          setOtherUserDetails({
            id: paramCustomerId,
            name: 'Customer',
            type: 'customer'
          })
        }
      }
    } catch (error) {
      console.error('Error handling param conversation:', error)
    }
  }

  const setupRealtimeSubscriptions = () => {
    if (!user) return
    
    // Subscribe to message insertions
    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message
          
          // If message is for current user in selected conversation
          if (selectedConversation && 
              ((userType === 'customer' && newMessage.provider_id === selectedConversation) ||
               (userType === 'provider' && (newMessage.sender_id === selectedConversation || newMessage.receiver_id === selectedConversation)))) {
            
            // Add message to current conversation
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(msg => msg.id === newMessage.id)) {
                return prev
              }
              return [...prev, newMessage]
            })
            
            // Update conversations list
            updateConversationWithNewMessage(newMessage)
            
            // If message is for current user, mark as read
            if (newMessage.receiver_id === user.id) {
              markSingleMessageAsRead(newMessage.id)
            }
          }
          
          // Always update conversations when new message arrives
          updateConversationWithNewMessage(newMessage)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const updatedMessage = payload.new as Message
          
          // Update in messages list
          setMessages(prev => 
            prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
          )
          
          // Update read status in conversations
          if (updatedMessage.is_read && updatedMessage.receiver_id === user.id) {
            setConversations(prev => 
              prev.map(conv => {
                if (conv.id === updatedMessage.provider_id || conv.id === updatedMessage.sender_id) {
                  return {
                    ...conv,
                    unread_count: Math.max(0, conv.unread_count - 1)
                  }
                }
                return conv
              })
            )
          }
        }
      )
      .subscribe()
    
    setMessageSubscription(channel)
  }

  const setupMessageSubscription = (conversationId: string) => {
    // Additional subscription for the specific conversation
    const convChannel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: userType === 'customer' 
            ? `provider_id=eq.${conversationId}` 
            : `sender_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message
          
          // Add to messages if not already present
          setMessages(prev => {
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev
            }
            return [...prev, newMessage]
          })
          
          // Mark as read if it's for current user
          if (newMessage.receiver_id === user.id) {
            markSingleMessageAsRead(newMessage.id)
          }
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(convChannel)
    }
  }

  const pollNewMessages = async (conversationId: string) => {
    if (!user || loadingMessages) return
    
    try {
      const { data: newMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq(userType === 'customer' ? 'provider_id' : 'sender_id', conversationId)
        .gt('created_at', lastMessageUpdate.toISOString())
        .order('created_at', { ascending: true })

      if (error) throw error

      if (newMessages && newMessages.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(msg => msg.id))
          const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg.id))
          
          if (uniqueNewMessages.length === 0) return prev
          
          // Update last message time
          const latestMessage = newMessages[newMessages.length - 1]
          setLastMessageUpdate(new Date(latestMessage.created_at))
          
          return [...prev, ...uniqueNewMessages]
        })
        
        // Mark new messages as read if they're for current user
        const unreadMessages = newMessages.filter(msg => 
          msg.receiver_id === user.id && !msg.is_read
        )
        
        if (unreadMessages.length > 0) {
          await markMessagesAsRead(conversationId)
        }
      }
    } catch (error) {
      console.error('Error polling messages:', error)
    }
  }

  const pollConversations = async () => {
    if (!user || refreshing) return
    
    try {
      const { data: recentMessages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .gt('created_at', lastConversationUpdate.toISOString())
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      if (recentMessages && recentMessages.length > 0) {
        // Update conversations based on new messages
        await loadConversations(true) // Fast refresh
        setLastConversationUpdate(new Date())
      }
    } catch (error) {
      console.error('Error polling conversations:', error)
    }
  }

  const loadConversations = async (fastRefresh = false) => {
    if (!fastRefresh) {
      setRefreshing(true)
    }
    
    try {
      console.log('📋 Loading conversations for:', user.id, userType)
      
      if (userType === 'customer') {
        // Get all messages involving this customer
        const { data: messages, error } = await supabase
          .from('messages')
          .select(`
            *,
            provider:providers!messages_provider_id_fkey(
              id,
              business_name,
              profile_picture_url,
              service_type
            )
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading customer messages:', error)
          return
        }

        if (!messages || messages.length === 0) {
          setConversations([])
          return
        }

        // Group by provider
        const conversationMap = new Map<string, Conversation>()
        
        messages.forEach(message => {
          const providerId = message.provider_id
          if (!providerId) return
          
          const provider = message.provider
          
          if (!conversationMap.has(providerId)) {
            conversationMap.set(providerId, {
              id: providerId,
              provider_id: providerId,
              other_user_id: user.id === message.sender_id ? message.receiver_id : message.sender_id,
              other_user_name: provider?.business_name || 'Provider',
              other_user_type: 'provider',
              last_message: message.content,
              last_message_time: message.created_at,
              unread_count: message.receiver_id === user.id && !message.is_read ? 1 : 0,
              business_name: provider?.business_name,
              profile_picture_url: provider?.profile_picture_url,
              service_type: provider?.service_type
            })
          } else {
            const conv = conversationMap.get(providerId)!
            // Update last message if newer
            if (new Date(message.created_at) > new Date(conv.last_message_time)) {
              conv.last_message = message.content
              conv.last_message_time = message.created_at
            }
            // Update unread count
            if (message.receiver_id === user.id && !message.is_read) {
              conv.unread_count += 1
            }
          }
        })

        const conversationsList = Array.from(conversationMap.values())
        setConversations(conversationsList)
        
      } else if (userType === 'provider') {
        // First get provider ID
        const { data: provider, error: providerError } = await supabase
          .from('providers')
          .select('id, business_name')
          .eq('user_id', user.id)
          .single()

        if (!provider || providerError) {
          console.error('Provider not found:', providerError)
          return
        }

        const foundProviderId = provider.id
        setProviderId(foundProviderId)

        // Get all messages for this provider
        const { data: messages, error } = await supabase
          .from('messages')
          .select('*')
          .eq('provider_id', foundProviderId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading provider messages:', error)
          return
        }

        if (!messages || messages.length === 0) {
          setConversations([])
          return
        }

        // Group by customer
        const conversationMap = new Map<string, Conversation>()
        
        messages.forEach(message => {
          const customerId = message.sender_id === user.id ? message.receiver_id : message.sender_id
          
          if (!conversationMap.has(customerId)) {
            conversationMap.set(customerId, {
              id: customerId,
              provider_id: foundProviderId,
              other_user_id: customerId,
              other_user_name: 'Customer',
              other_user_type: 'customer',
              last_message: message.content,
              last_message_time: message.created_at,
              unread_count: message.receiver_id === user.id && !message.is_read ? 1 : 0
            })
          } else {
            const conv = conversationMap.get(customerId)!
            // Update last message if newer
            if (new Date(message.created_at) > new Date(conv.last_message_time)) {
              conv.last_message = message.content
              conv.last_message_time = message.created_at
            }
            // Update unread count
            if (message.receiver_id === user.id && !message.is_read) {
              conv.unread_count += 1
            }
          }
        })

        const conversationsList = Array.from(conversationMap.values())
        setConversations(conversationsList)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      if (!fastRefresh) {
        setRefreshing(false)
      }
    }
  }

  const updateConversationWithNewMessage = (message: Message) => {
    setConversations(prev => {
      const convId = userType === 'customer' ? message.provider_id : message.sender_id
      if (!convId) return prev
      
      const existingConvIndex = prev.findIndex(conv => conv.id === convId)
      
      if (existingConvIndex >= 0) {
        // Update existing conversation
        const updatedConvs = [...prev]
        const existingConv = updatedConvs[existingConvIndex]
        
        updatedConvs[existingConvIndex] = {
          ...existingConv,
          last_message: message.content,
          last_message_time: message.created_at,
          unread_count: message.receiver_id === user.id && !message.is_read 
            ? existingConv.unread_count + 1 
            : existingConv.unread_count
        }
        
        // Move to top
        const [movedConv] = updatedConvs.splice(existingConvIndex, 1)
        updatedConvs.unshift(movedConv)
        
        return updatedConvs
      } else {
        // Create new conversation
        const newConversation: Conversation = {
          id: convId,
          provider_id: message.provider_id || '',
          other_user_id: user.id === message.sender_id ? message.receiver_id : message.sender_id,
          other_user_name: userType === 'customer' ? 'Provider' : 'Customer',
          other_user_type: userType === 'customer' ? 'provider' : 'customer',
          last_message: message.content,
          last_message_time: message.created_at,
          unread_count: message.receiver_id === user.id && !message.is_read ? 1 : 0
        }
        
        return [newConversation, ...prev]
      }
    })
  }

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true)
    try {
      console.log('💬 Loading messages for conversation:', conversationId)
      
      if (userType === 'customer') {
        // Customer: Load messages with this provider
        const { data: messages, error } = await supabase
          .from('messages')
          .select('*')
          .eq('provider_id', conversationId)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Error loading customer messages:', error)
          return
        }

        console.log('Customer messages loaded:', messages?.length)

        // Get provider details
        const { data: provider } = await supabase
          .from('providers')
          .select('business_name, profile_picture_url, service_type')
          .eq('id', conversationId)
          .maybeSingle()

        if (provider) {
          setOtherUserDetails({
            id: conversationId,
            name: provider.business_name,
            type: 'provider',
            image: provider.profile_picture_url,
            service_type: provider.service_type
          })
        }

        setMessages(messages || [])
        if (messages && messages.length > 0) {
          setLastMessageUpdate(new Date(messages[messages.length - 1].created_at))
        }
        
      } else if (userType === 'provider') {
        // Provider: Get provider ID if not set
        let currentProviderId = providerId
        if (!currentProviderId) {
          const { data: providerData } = await supabase
            .from('providers')
            .select('id')
            .eq('user_id', user.id)
            .single()
          
          if (!providerData) {
            console.error('Provider data not found')
            return
          }
          currentProviderId = providerData.id
          setProviderId(currentProviderId)
        }

        console.log('Loading provider messages with provider_id:', currentProviderId, 'and customer_id:', conversationId)

        // FIXED: Use proper filtering
        const { data: messages, error } = await supabase
          .from('messages')
          .select('*')
          .eq('provider_id', currentProviderId)
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conversationId}),and(sender_id.eq.${conversationId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Error loading provider messages:', error)
          
          // Alternative: Load all messages and filter client-side
          const { data: allMessages } = await supabase
            .from('messages')
            .select('*')
            .eq('provider_id', currentProviderId)
            .order('created_at', { ascending: true })
          
          if (allMessages) {
            const filteredMessages = allMessages.filter(msg => 
              (msg.sender_id === user.id && msg.receiver_id === conversationId) ||
              (msg.sender_id === conversationId && msg.receiver_id === user.id)
            )
            setMessages(filteredMessages)
            if (filteredMessages.length > 0) {
              setLastMessageUpdate(new Date(filteredMessages[filteredMessages.length - 1].created_at))
            }
          }
          return
        }

        console.log('Provider messages loaded:', messages?.length)

        // Get customer details
        try {
          const { data: customer } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', conversationId)
            .maybeSingle()

          setOtherUserDetails({
            id: conversationId,
            name: customer?.display_name || 'Customer',
            type: 'customer',
            image: customer?.avatar_url
          })
        } catch (error) {
          setOtherUserDetails({
            id: conversationId,
            name: 'Customer',
            type: 'customer'
          })
        }

        setMessages(messages || [])
        if (messages && messages.length > 0) {
          setLastMessageUpdate(new Date(messages[messages.length - 1].created_at))
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      if (!user) return

      // Update UI immediately for better UX
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unread_count: 0 }
          : conv
      ))
      
      setMessages(prev => prev.map(msg => 
        msg.receiver_id === user.id 
          ? { ...msg, is_read: true }
          : msg
      ))

      // Then update in database - SIMPLIFIED VERSION
      if (userType === 'customer') {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('receiver_id', user.id)
          .eq('provider_id', conversationId)
          .eq('is_read', false)
      } else {
        let currentProviderId = providerId
        if (!currentProviderId) {
          const { data: providerData } = await supabase
            .from('providers')
            .select('id')
            .eq('user_id', user.id)
            .single()
          
          if (!providerData) return
          currentProviderId = providerData.id
        }

        // SIMPLIFIED: Mark all unread messages from this customer as read
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('receiver_id', user.id)
          .eq('provider_id', currentProviderId)
          .eq('is_read', false)
          .or(`sender_id.eq.${conversationId},receiver_id.eq.${conversationId}`)
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const markSingleMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
    } catch (error) {
      console.error('Error marking single message as read:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user || !userType) return

    const messageText = newMessage.trim()
    setNewMessage('')
    setSending(true)

    try {
      let messageProviderId: string
      let receiverId: string

      if (userType === 'customer') {
        // Customer sending to provider
        messageProviderId = selectedConversation
        
        const { data: provider } = await supabase
          .from('providers')
          .select('user_id')
          .eq('id', messageProviderId)
          .single()

        if (!provider) {
          throw new Error('Provider not found')
        }
        receiverId = provider.user_id
      } else {
        // Provider sending to customer
        receiverId = selectedConversation
        
        let currentProviderId = providerId
        if (!currentProviderId) {
          const { data: providerData } = await supabase
            .from('providers')
            .select('id')
            .eq('user_id', user.id)
            .single()
            
          if (!providerData) {
            throw new Error('Provider not found')
          }
          currentProviderId = providerData.id
          setProviderId(currentProviderId)
        }
        messageProviderId = currentProviderId
      }

      console.log('Sending message from', user.id, 'to', receiverId, 'provider:', messageProviderId)

      const messageData = {
        sender_id: user.id,
        receiver_id: receiverId,
        provider_id: messageProviderId,
        content: messageText,
        is_read: false,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single()

      if (error) {
        console.error('Message insert error details:', error)
        throw error
      }

      console.log('✅ Message sent successfully:', data)

      // Add to messages list immediately
      if (data) {
        setMessages(prev => [...prev, data])
        updateConversationWithNewMessage(data)
        setLastMessageUpdate(new Date(data.created_at))
      }

      // Create notification for receiver
      await createMessageNotification(receiverId, user.id, messageText)
      
    } catch (error: any) {
      console.error('❌ Error sending message:', error)
      alert(`Failed to send message: ${error.message || 'Unknown error'}`)
      setNewMessage(messageText) // Restore message
    } finally {
      setSending(false)
    }
  }

  const createMessageNotification = async (receiverId: string, senderId: string, message: string) => {
    try {
      let senderName = 'User'
      
      if (userType === 'provider') {
        const { data: provider } = await supabase
          .from('providers')
          .select('business_name')
          .eq('user_id', senderId)
          .maybeSingle()
        
        senderName = provider?.business_name || 'Provider'
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', senderId)
          .maybeSingle()
        
        senderName = profile?.display_name || 'Customer'
      }

      await supabase
        .from('notifications')
        .insert({
          user_id: receiverId,
          title: '💬 New Message',
          message: `${senderName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
          type: 'message',
          is_read: false,
          link: '/messages',
          created_at: new Date().toISOString()
        })

    } catch (error) {
      console.error('Error creating message notification:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const filteredConversations = conversations.filter(conv =>
    conv.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.service_type?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadConversations()
    if (selectedConversation) {
      await loadMessages(selectedConversation)
    }
    setRefreshing(false)
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
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                <p className="text-sm text-gray-600">
                  {userType === 'customer' ? 'Chat with service providers' : 'Chat with customers'}
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh messages"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex h-[calc(100vh-80px)]">
          {/* Conversations List */}
          <div className={`w-full md:w-96 border-r bg-white ${selectedConversation ? 'hidden md:block' : 'block'}`}>
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="overflow-y-auto h-[calc(100%-73px)]">
              {refreshing ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Refreshing conversations...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No conversations yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {userType === 'customer' 
                      ? 'Message a provider to start a conversation' 
                      : 'Customers will appear here when they message you'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedConversation === conversation.id ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                          {conversation.profile_picture_url ? (
                            <img
                              src={conversation.profile_picture_url}
                              alt={conversation.other_user_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                              {conversation.other_user_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        {conversation.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                            {conversation.unread_count}
                          </div>
                        )}
                      </div>

                      {/* Conversation Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {conversation.other_user_name}
                          </h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatTime(conversation.last_message_time)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conversation.last_message}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${
                            conversation.other_user_type === 'provider' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {conversation.other_user_type === 'provider' ? 'Provider' : 'Customer'}
                          </span>
                          {conversation.service_type && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded ml-2">
                              {conversation.service_type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${selectedConversation ? 'block' : 'hidden md:block'}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="bg-white border-b p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      
                      {/* User Info */}
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                          {otherUserDetails?.image ? (
                            <img
                              src={otherUserDetails.image}
                              alt={otherUserDetails.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                              {otherUserDetails?.name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {otherUserDetails?.name || 'User'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {otherUserDetails?.type === 'provider' 
                              ? otherUserDetails?.service_type || 'Service Provider'
                              : 'Customer'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      {otherUserDetails?.type === 'customer' && (
                        <button
                          onClick={() => window.open(`tel:${otherUserDetails?.phone}`)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title="Call Customer"
                        >
                          <Phone className="h-5 w-5" />
                        </button>
                      )}
                      {userType === 'customer' && otherUserDetails?.type === 'provider' && (
                        <Link
                          href={`/bookings/new?provider=${otherUserDetails?.id}`}
                          className="p-2 hover:bg-gray-100 rounded-lg text-primary"
                          title="Book Service"
                        >
                          <Calendar className="h-5 w-5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-gray-600">Loading messages...</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No messages yet</p>
                        <p className="text-sm text-gray-500 mt-2">Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.sender_id === user?.id
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                            <div
                              className={`rounded-2xl px-4 py-2 ${
                                isOwnMessage
                                  ? 'bg-primary text-white rounded-br-none'
                                  : 'bg-gray-100 text-gray-900 rounded-bl-none'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <div className={`flex items-center text-xs mt-1 ${
                              isOwnMessage ? 'justify-end' : 'justify-start'
                            }`}>
                              <span className="text-gray-500">
                                {new Date(message.created_at).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                              {isOwnMessage && (
                                <span className="ml-2">
                                  {message.is_read ? (
                                    <CheckCheck className="h-3 w-3 text-blue-500" />
                                  ) : (
                                    <Check className="h-3 w-3 text-gray-400" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="bg-white border-t p-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={sending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className={`p-2 rounded-lg ${
                        newMessage.trim() && !sending
                          ? 'bg-primary text-white hover:bg-green-700'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {sending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8">
                <MessageSquare className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-600 text-center max-w-md">
                  {userType === 'customer' 
                    ? 'Choose a provider from the list to start chatting. Ask about services, pricing, or availability.'
                    : 'Select a customer conversation to view messages.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
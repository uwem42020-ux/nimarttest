// components/SessionChecker.tsx - UPDATED VERSION
'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SessionChecker() {
  const router = useRouter()

  useEffect(() => {
    const checkAndSetSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('SessionChecker: User authenticated:', session.user.email)
          
          // Set authentication cookie
          document.cookie = `is-authenticated=true; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days
          
          // Set user type cookie
          const userType = session.user.user_metadata?.user_type || 'customer'
          document.cookie = `user-type=${userType}; path=/; max-age=${60 * 60 * 24 * 7}`
          
          // If provider, set provider ID
          if (userType === 'provider') {
            try {
              const { data: provider } = await supabase
                .from('providers')
                .select('id')
                .eq('user_id', session.user.id)
                .single()
                
              if (provider?.id) {
                document.cookie = `provider-id=${provider.id}; path=/; max-age=${60 * 60 * 24 * 7}`
              }
            } catch (error) {
              console.log('SessionChecker: Could not fetch provider ID:', error)
            }
          }
        } else {
          // Clear cookies if no session
          document.cookie = 'is-authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          document.cookie = 'user-type=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          document.cookie = 'provider-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
      } catch (error) {
        console.error('SessionChecker error:', error)
      }
    }

    // Initial check
    checkAndSetSession()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('SessionChecker: Auth state changed:', event)
        
        if (session?.user) {
          document.cookie = `is-authenticated=true; path=/; max-age=${60 * 60 * 24 * 7}`
          
          const userType = session.user.user_metadata?.user_type || 'customer'
          document.cookie = `user-type=${userType}; path=/; max-age=${60 * 60 * 24 * 7}`
          
          if (userType === 'provider') {
            try {
              const { data: provider } = await supabase
                .from('providers')
                .select('id')
                .eq('user_id', session.user.id)
                .single()
                
              if (provider?.id) {
                document.cookie = `provider-id=${provider.id}; path=/; max-age=${60 * 60 * 24 * 7}`
              }
            } catch (error) {
              console.log('SessionChecker: Could not fetch provider ID:', error)
            }
          }
        } else {
          document.cookie = 'is-authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          document.cookie = 'user-type=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          document.cookie = 'provider-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return null
}
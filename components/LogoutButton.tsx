// components/LogoutButton.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { clearAuthCookies } from '@/lib/cookies'
import { LogOut, Loader2 } from 'lucide-react'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      console.log('🚪 Starting logout process...')
      
      // Clear all auth data in parallel
      await Promise.allSettled([
        // Sign out from Supabase
        supabase.auth.signOut(),
        
        // Clear localStorage auth tokens
        (() => {
          const localStorageKeys = Object.keys(localStorage).filter(key => 
            key.includes('auth') || key.includes('token') || key.includes('supabase')
          )
          localStorageKeys.forEach(key => localStorage.removeItem(key))
          console.log(`✅ Cleared localStorage keys: ${localStorageKeys.length}`)
        })(),
        
        // Clear sessionStorage
        (() => {
          sessionStorage.clear()
          console.log('✅ Cleared sessionStorage')
        })(),
        
        // Clear cookies
        (() => {
          clearAuthCookies()
          console.log('✅ Cleared all cookies')
        })()
      ])
      
      console.log('✅ All auth data cleared')
      
      // Force hard redirect to login with cache busting
      setTimeout(() => {
        window.location.href = '/login?logout=true&t=' + Date.now()
      }, 100)
      
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect to login even if there's an error
      window.location.href = '/login?logout=true&error=1'
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4 mr-2" />
      )}
      Sign Out
    </button>
  )
}
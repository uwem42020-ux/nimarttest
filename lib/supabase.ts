// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

// Define types
interface ServerContext {
  req: Request
  res?: Response
}

interface AuthResult {
  isAuthenticated: boolean
  user: any | null
  session: Session | null
  userType: 'customer' | 'provider' | null
  providerId: string | null
  error?: string
}

type AuthCallback = (event: AuthChangeEvent, session: Session | null) => void

interface SignOutResult {
  success?: boolean
  error?: string
}

// Check for environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a single Supabase client for the browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-application-name': 'nimart-web',
      'x-application-version': process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    },
  },
})

// Server-side client (for API routes)
export const createServerSupabaseClient = (context: ServerContext) => {
  const { req } = context
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: req.headers.get('Authorization') || '',
      },
    },
  })
}

// Helper functions
export const handleSupabaseError = (error: any): { error: string } => {
  console.error('Supabase Error:', error)
  
  // Don't expose internal errors to users
  const safeErrorMessages: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password',
    'Email not confirmed': 'Please verify your email first',
    'User already registered': 'An account with this email already exists',
    'Failed to fetch': 'Network error. Please check your connection.',
    'JWT': 'Session expired. Please login again.',
    'network': 'Network error. Please check your connection.',
  }
  
  // Find matching error message
  for (const [key, message] of Object.entries(safeErrorMessages)) {
    if (error?.message?.includes(key)) {
      return { error: message }
    }
  }
  
  // Default error
  return { error: 'An unexpected error occurred. Please try again.' }
}

// Check authentication status
export const checkAuth = async (): Promise<AuthResult> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      throw error
    }
    
    return {
      isAuthenticated: !!session?.user,
      user: session?.user || null,
      session: session || null,
      userType: session?.user?.user_metadata?.user_type || 'customer',
      providerId: session?.user?.user_metadata?.provider_id || null,
    }
  } catch (error: any) {
    console.error('Auth check error:', error)
    const errorResult = handleSupabaseError(error)
    return {
      isAuthenticated: false,
      user: null,
      session: null,
      userType: null,
      providerId: null,
      error: errorResult.error,
    }
  }
}

// Sign out helper - FIXED RETURN TYPE
export const signOut = async (): Promise<SignOutResult> => {
  try {
    // Only run in browser
    if (typeof window === 'undefined') {
      return { success: false, error: 'Cannot sign out on server' }
    }
    
    // Clear cookies helper
    const clearCookie = (name: string) => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}`
    }
    
    clearCookie('is-authenticated')
    clearCookie('user-type')
    clearCookie('provider-id')
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    
    if (error) throw error
    
    return { success: true }
  } catch (error: any) {
    console.error('Sign out error:', error)
    return { error: 'Failed to sign out. Please try again.' }
  }
}

// Subscribe to auth changes
export const onAuthStateChange = (callback: AuthCallback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
    
    // Update cookies when auth state changes
    if (typeof window !== 'undefined') {
      if (session?.user) {
        const userType = session.user.user_metadata?.user_type || 'customer'
        const providerId = session.user.user_metadata?.provider_id
        const maxAge = 7 * 24 * 60 * 60
        
        document.cookie = `is-authenticated=true; path=/; max-age=${maxAge}; SameSite=Lax`
        document.cookie = `user-type=${userType}; path=/; max-age=${maxAge}; SameSite=Lax`
        
        if (userType === 'provider' && providerId) {
          document.cookie = `provider-id=${providerId}; path=/; max-age=${maxAge}; SameSite=Lax`
        }
      } else {
        // Clear cookies when signed out
        const clearCookie = (name: string) => {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC`
        }
        
        clearCookie('is-authenticated')
        clearCookie('user-type')
        clearCookie('provider-id')
      }
    }
  })
}
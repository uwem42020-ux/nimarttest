// app/login/page.tsx - UPDATED for both user types
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isChecking, setIsChecking] = useState(true)

  // Clean up URL if it has redirect param for provider registration
  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const redirectParam = currentUrl.searchParams.get('redirect');
    
    // If we have a redirect param pointing to provider registration, remove it
    if (redirectParam === '/provider/register') {
      currentUrl.searchParams.delete('redirect');
      window.history.replaceState({}, '', currentUrl.toString());
    }
  }, []);

  useEffect(() => {
    // Check if already logged in
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('Already logged in as:', session.user.email)
          // Get user type
          const userType = session.user.user_metadata?.user_type || 'customer'
          const providerId = session.user.user_metadata?.provider_id
          
          // Set cookies for middleware
          const maxAge = 7 * 24 * 60 * 60
          document.cookie = `user-type=${userType}; path=/; max-age=${maxAge}`
          
          if (userType === 'provider' && providerId) {
            document.cookie = `provider-id=${providerId}; path=/; max-age=${maxAge}`
          }
          
          // Redirect based on user type
          setTimeout(() => {
            if (userType === 'provider') {
              window.location.href = '/provider/dashboard'
            } else {
              window.location.href = '/'
            }
          }, 100)
        }
      } catch (err) {
        console.error('Auth check error:', err)
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()

    // Check for verification message
    const verified = searchParams.get('verified')
    const emailParam = searchParams.get('email')
    
    if (verified === 'true' && emailParam) {
      setSuccessMessage('✅ Email verified successfully! Please login.')
      setEmail(decodeURIComponent(emailParam))
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

    if (!email || !password) {
      setError('Please enter both email and password')
      setLoading(false)
      return
    }

    try {
      console.log('Logging in:', email)
      
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (loginError) {
        console.error('Login error:', loginError)
        if (loginError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password')
        } else if (loginError.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email first')
        } else {
          throw new Error('Login failed. Please try again.')
        }
      }

      if (!data.user) {
        throw new Error('No user data returned')
      }

      console.log('✅ Login successful:', data.user.email)
      
      // Get user type from metadata
      const userType = data.user.user_metadata?.user_type || 'customer'
      const providerId = data.user.user_metadata?.provider_id

      // Set cookies for middleware
      const maxAge = 7 * 24 * 60 * 60
      
      // Set user type cookie (REQUIRED for middleware)
      document.cookie = `user-type=${userType}; path=/; max-age=${maxAge}`
      
      // Set provider ID if provider
      if (userType === 'provider' && providerId) {
        document.cookie = `provider-id=${providerId}; path=/; max-age=${maxAge}`
      }
      
      // Also set a simple auth cookie
      document.cookie = `is-authenticated=true; path=/; max-age=${maxAge}`
      
      console.log('Login successful. User type:', userType)

      // Show success message
      setSuccessMessage('✅ Login successful! Redirecting...')

      // Wait 1 second for cookies to be set, then redirect
      setTimeout(() => {
        const redirectTo = searchParams.get('redirect') || 
          (userType === 'provider' ? '/provider/dashboard' : '/')
        
        console.log('Redirecting to:', redirectTo)
        window.location.href = redirectTo
      }, 1000)

    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Sign In to Nimart</h1>
          <p className="text-gray-600 mt-2">Access your Nimart account</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-green-700">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-700 font-medium">Login Failed</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-2" />
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="you@example.com"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Lock className="h-4 w-4 inline mr-2" />
                  Password *
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-primary hover:text-green-700 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder="Your password"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <div className="pt-4 border-t">
              <p className="text-gray-600 text-sm mb-3">Don't have an account?</p>
              
              <div className="grid grid-cols-1 gap-3">
                <Link 
                  href="/register" 
                  className="block w-full border-2 border-primary text-primary py-2 rounded-lg hover:bg-green-50 font-medium transition-colors"
                >
                  Create Customer Account
                </Link>
                
                <Link 
                  href="/provider/register" 
                  className="block w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Register as Provider
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
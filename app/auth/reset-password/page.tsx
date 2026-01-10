// app/auth/reset-password/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  Shield,
  ArrowLeft
} from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const [passwordStrength, setPasswordStrength] = useState(0)

  useEffect(() => {
    // Check if we have a valid session (Supabase automatically handles token from URL)
    const checkSession = async () => {
      try {
        setIsChecking(true)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          console.log('❌ No valid session found - invalid or expired token')
          setIsValidToken(false)
        } else {
          console.log('✅ Valid session found for user:', session.user.email)
          setIsValidToken(true)
        }
      } catch (error) {
        console.error('Error checking session:', error)
        setIsValidToken(false)
      } finally {
        setIsChecking(false)
      }
    }
    
    checkSession()
  }, [])

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0)
      return
    }
    
    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1
    
    setPasswordStrength(strength)
  }, [password])

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-200'
    if (passwordStrength <= 2) return 'bg-red-500'
    if (passwordStrength === 3) return 'bg-yellow-500'
    if (passwordStrength === 4) return 'bg-green-500'
    return 'bg-green-600'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return 'Enter password'
    if (passwordStrength <= 2) return 'Weak'
    if (passwordStrength === 3) return 'Good'
    if (passwordStrength === 4) return 'Strong'
    return 'Very Strong'
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password || password.length < 8) {
      setMessage('Password must be at least 8 characters')
      return
    }
    
    if (passwordStrength < 3) {
      setMessage('Please use a stronger password (mix of letters, numbers, and symbols)')
      return
    }
    
    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      console.log('🔄 Updating password...')
      
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        console.error('Password update error:', error)
        if (error.message.includes('Auth session missing')) {
          throw new Error('Reset link has expired. Please request a new password reset.')
        }
        if (error.message.includes('Password')) {
          throw new Error('Password is too weak. Please use a stronger password.')
        }
        throw error
      }

      console.log('✅ Password updated successfully')
      setMessage('✅ Password updated successfully! Redirecting to login...')
      
      // Clear all auth cookies
      const clearCookie = (name: string) => {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}`
      }
      
      clearCookie('is-authenticated')
      clearCookie('user-type')
      clearCookie('provider-id')
      
      // Sign out to clear Supabase session
      await supabase.auth.signOut()
      
      // Redirect to login with success message
      setTimeout(() => {
        router.push('/login?message=password_reset_success')
      }, 2000)
      
    } catch (error: any) {
      console.error('Password reset error:', error)
      setMessage(error.message || 'Failed to update password. Please try again.')
      setLoading(false)
    }
  }

  // Show loading while checking token
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600 font-medium">Verifying reset link...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we validate your reset request</p>
        </div>
      </div>
    )
  }

  // Show invalid token message
  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Invalid Reset Link</h1>
            <p className="text-gray-600">
              This password reset link has expired or is invalid.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="space-y-4 mb-6">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-red-700 text-sm">
                  <strong>Possible reasons:</strong>
                </p>
                <ul className="text-red-600 text-sm mt-2 list-disc list-inside space-y-1">
                  <li>The link has expired (links expire after 1 hour)</li>
                  <li>The link has already been used</li>
                  <li>You requested a new reset link after this one</li>
                  <li>The link was modified or corrupted</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <Link
                href="/forgot-password"
                className="block w-full bg-primary text-white py-3.5 rounded-lg hover:bg-green-700 font-medium transition-colors text-center"
              >
                Request New Reset Link
              </Link>
              <Link
                href="/login"
                className="block w-full border border-gray-300 text-gray-700 py-3.5 rounded-lg hover:bg-gray-50 font-medium transition-colors text-center"
              >
                <div className="flex items-center justify-center">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </div>
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-700 text-sm">
                    For security, password reset links can only be used once and expire after 1 hour.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Set New Password</h1>
          <p className="text-gray-600">
            Create a strong new password for your account
          </p>
        </div>

        {/* Security Notice */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-blue-700 text-sm">
              You're setting a new password for your Nimart account. Make sure it's strong and unique.
            </p>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start">
              {message.includes('✅') ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-sm">{message}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="h-4 w-4 inline mr-2" />
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="At least 8 characters"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Strength Meter */}
              {password && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Password strength:</span>
                    <span className={`font-medium ${
                      passwordStrength <= 2 ? 'text-red-600' :
                      passwordStrength === 3 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                  <ul className="text-xs text-gray-500 mt-2 space-y-1">
                    <li className={password.length >= 8 ? 'text-green-600' : ''}>
                      {password.length >= 8 ? '✓' : '○'} At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-green-600' : ''}>
                      {/[A-Z]/.test(password) && /[a-z]/.test(password) ? '✓' : '○'} Upper & lowercase letters
                    </li>
                    <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
                      {/[0-9]/.test(password) ? '✓' : '○'} At least one number
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="h-4 w-4 inline mr-2" />
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="Re-enter your password"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {password && confirmPassword && password === confirmPassword && (
                <p className="text-green-600 text-sm mt-2 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" /> Passwords match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !password || !confirmPassword || passwordStrength < 3}
              className="w-full bg-gradient-to-r from-primary to-green-600 text-white py-3.5 rounded-lg hover:from-green-600 hover:to-primary font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.99] flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Updating Password...
                </>
              ) : 'Reset Password'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link href="/login" className="text-primary hover:text-green-700 font-medium">
                  Sign in here
                </Link>
              </p>
              <p className="text-xs text-gray-500 mt-3">
                Having trouble?{' '}
                <a href="mailto:support@nimart.ng" className="text-primary hover:text-green-700">
                  Contact support
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
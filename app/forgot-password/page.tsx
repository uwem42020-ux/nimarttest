// app/forgot-password/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2, Lock, Shield } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    if (!email.trim()) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      console.log('📧 Sending password reset email to:', email.trim())
      
      // Send password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(), 
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      )

      if (resetError) {
        console.error('Password reset error:', resetError)
        
        if (resetError.message.includes('rate limit')) {
          throw new Error('Too many attempts. Please try again in a few minutes.')
        }
        
        if (resetError.message.includes('email not found')) {
          // Don't reveal if email exists for security
          console.log('Email not found, but showing success for security')
          setSuccess(true)
          return
        }
        
        if (resetError.message.includes('Failed to fetch')) {
          throw new Error('Network error. Please check your internet connection.')
        }
        
        throw new Error('Failed to send reset email. Please try again.')
      }

      console.log('✅ Password reset email sent successfully')
      setSuccess(true)
      
    } catch (err: any) {
      console.error('Password reset error:', err)
      setError(err.message || 'Failed to send password reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Forgot Password?</h1>
          <p className="text-gray-600">
            Enter your email and we'll send you a password reset link.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl shadow-sm">
            <div className="flex items-start">
              <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Reset Link Sent!</h3>
                <div className="space-y-3">
                  <p className="text-green-700">
                    We've sent a password reset link to <span className="font-semibold">{email}</span>. 
                  </p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start">
                      <Shield className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-blue-800 text-sm mb-1">Important Information:</p>
                        <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                          <li>Check your spam/junk folder if you don't see the email</li>
                          <li>The reset link expires in 1 hour</li>
                          <li>Only the most recent reset link will work</li>
                          <li>If you don't receive an email, the address may not be registered</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-green-200">
                    <p className="text-green-600 text-sm">
                      Didn't receive the email?{' '}
                      <button
                        onClick={() => setSuccess(false)}
                        className="text-primary hover:text-green-700 font-medium underline"
                      >
                        Try again
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl shadow-sm">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
                <p className="text-red-700">{error}</p>
                <div className="mt-4">
                  <button
                    onClick={() => setError('')}
                    className="text-sm text-red-700 hover:text-red-800 font-medium underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form - Only show if not successful */}
        {!success && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <p className="text-gray-600 text-sm">
                Enter the email address associated with your Nimart account. We'll send you a link to reset your password.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  disabled={loading}
                />
                <p className="text-sm text-gray-500 mt-2">
                  We'll send a secure reset link to this email
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-green-600 text-white py-3.5 rounded-lg hover:from-green-600 hover:to-primary font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.99] flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5 mr-2" />
                    Send Reset Link
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link
                href="/login"
                className="flex items-center justify-center text-gray-600 hover:text-primary transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Sign In
              </Link>
            </div>
          </div>
        )}

        {/* Bottom Links */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:text-green-700 font-medium">
              Sign up here
            </Link>
          </p>
          <p className="text-xs text-gray-500 mt-3">
            Need help?{' '}
            <a href="mailto:support@nimart.ng" className="text-primary hover:text-green-700">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
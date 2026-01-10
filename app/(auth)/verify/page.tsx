// app/verify/page.tsx - UPDATED WITH RESEND
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle, AlertCircle, RefreshCw, Mail, Shield, Loader2, User, Briefcase } from 'lucide-react'

export default function VerifyPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState<string>('')
  const [userType, setUserType] = useState<'customer' | 'provider'>('customer')
  const [otp, setOtp] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [countdown, setCountdown] = useState<number>(0)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Load email and user type from URL params
    const urlEmail = searchParams.get('email')
    const urlUserType = searchParams.get('user_type') as 'customer' | 'provider'
    
    if (urlEmail) {
      setEmail(decodeURIComponent(urlEmail))
    }
    
    if (urlUserType && (urlUserType === 'customer' || urlUserType === 'provider')) {
      setUserType(urlUserType)
    } else {
      // Try to get from session
      const loadUserType = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.user_metadata?.user_type) {
          setUserType(user.user_metadata.user_type)
        }
      }
      loadUserType()
    }
  }, [searchParams])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const startCountdown = () => {
    setCountdown(60)
  }

  const updateProviderVerification = async (userId: string, email: string) => {
    try {
      console.log('📝 Updating provider verification status for:', email)
      
      // Update provider record to verified
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .update({
          is_verified: true,
          verification_status: 'verified',
          verification_step: 'completed',
          updated_at: new Date().toISOString()
        })
        .or(`user_id.eq.${userId},email.eq.${email}`)
        .select()
        .single()

      if (providerError) {
        console.error('Error updating provider verification:', providerError)
      } else {
        console.log('✅ Provider verification status updated:', providerData)
      }

      // Also update user metadata
      await supabase.auth.updateUser({
        data: {
          provider_id: providerData?.id,
          provider_status: 'verified'
        }
      })

    } catch (error) {
      console.error('Error in updateProviderVerification:', error)
    }
  }

  const createCustomerProfile = async (userId: string, email: string, name?: string) => {
    try {
      console.log('📝 Creating customer profile for:', email)
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            display_name: name || email.split('@')[0],
            email: email,
            user_type: 'customer',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('Error creating customer profile:', profileError)
        } else {
          console.log('✅ Customer profile created')
        }
      }

    } catch (error) {
      console.error('Error creating customer profile:', error)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!otp || otp.length !== 8) {
      setMessage('Please enter a valid 8-digit OTP code')
      return
    }

    if (!email) {
      setMessage('Email is required')
      return
    }

    setLoading(true)
    setMessage('Verifying OTP...')
    
    try {
      console.log('📧 Verifying OTP for:', email)
      
      // Try both methods:
      // 1. First try Supabase verification
      let verificationSuccess = false;
      let userId: string | undefined;
      
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: otp.trim(),
          type: 'email'
        });

        if (!error && data.user) {
          verificationSuccess = true;
          userId = data.user.id;
        }
      } catch (supabaseError) {
        console.log('Supabase OTP verification failed, trying custom...');
      }

      // 2. If Supabase fails, try custom verification
      if (!verificationSuccess) {
        const { data: otpData, error: otpError } = await supabase
          .from('otp_storage')
          .select('*')
          .eq('email', email.trim())
          .eq('otp', otp.trim())
          .gt('expires_at', new Date().toISOString())
          .single();

        if (otpError || !otpData) {
          throw new Error('Invalid or expired OTP. Please request a new one.');
        }
        
        verificationSuccess = true;
        
        // Clean up used OTP
        await supabase
          .from('otp_storage')
          .delete()
          .eq('email', email.trim());
        
        // Get user ID from auth
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      }

      if (verificationSuccess && userId) {
        console.log('✅ OTP verified successfully')
        
        const { data: { user } } = await supabase.auth.getUser();
        const metadata = user?.user_metadata || {}
        
        // Handle based on user type
        if (userType === 'provider' && userId) {
          await updateProviderVerification(userId, email)
        } else if (userType === 'customer' && userId) {
          await createCustomerProfile(userId, email, metadata.name)
        }
        
        // Set cookies for middleware
        const maxAge = 7 * 24 * 60 * 60
        document.cookie = `user-type=${userType}; path=/; max-age=${maxAge}`
        
        // If provider, set provider-id cookie
        if (userType === 'provider' && metadata.provider_id) {
          document.cookie = `provider-id=${metadata.provider_id}; path=/; max-age=${maxAge}`
        }
        
        setMessage(`✅ Email verified successfully! Your ${userType} account is now active. Redirecting...`)
        
        // Wait for cookies to set, then redirect
        setTimeout(() => {
          if (userType === 'provider') {
            window.location.href = '/provider/dashboard'
          } else {
            window.location.href = '/'
          }
        }, 1500)
      } else {
        throw new Error('Verification failed. Please try again.');
      }
      
    } catch (error: any) {
      console.error('Verification error:', error)
      setMessage(error.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) {
      setMessage(`Please wait ${countdown} seconds before requesting a new OTP`)
      return
    }

    if (!email) {
      setMessage('Please enter your email address first')
      return
    }

    setLoading(true)
    setMessage('Sending new OTP via Resend...')
    
    try {
      // Use our API endpoint
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), type: 'resend' })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send OTP')
      }
      
      setMessage('✅ New OTP sent! Check your email (including spam folder).')
      startCountdown()
    } catch (error: any) {
      console.error('Resend OTP error:', error)
      setMessage(error.message || 'Failed to resend OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h2>
          <div className="flex items-center justify-center gap-2 mb-3">
            {userType === 'provider' ? (
              <>
                <Briefcase className="h-5 w-5 text-primary" />
                <span className="text-primary font-medium">Provider Account</span>
              </>
            ) : (
              <>
                <User className="h-5 w-5 text-primary" />
                <span className="text-primary font-medium">Customer Account</span>
              </>
            )}
          </div>
          <p className="text-gray-600">
            Enter the 8-digit code sent to your email
          </p>
        </div>
        
        {/* Email Display */}
        <div className="mb-6 text-center">
          <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <div className="flex items-center justify-center text-blue-600 mb-1">
              <Mail className="h-4 w-4 mr-2" />
              <p className="text-sm font-medium">Verification Email Sent To:</p>
            </div>
            <p className="text-blue-800 font-semibold mt-1 break-all">{email || 'Loading...'}</p>
          </div>
          <p className="text-gray-600 text-sm mt-3">
            Enter the 8-digit code from your email to activate your {userType} account
          </p>
          <p className="text-yellow-600 text-sm mt-2 bg-yellow-50 p-2 rounded-lg">
            📧 Check your spam folder if you don't see the email!
          </p>
        </div>

        <div className="py-4">
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                8-digit Verification Code *
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="12345678"
                maxLength={8}
                required
                autoFocus
                disabled={loading}
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-500">Enter the 8-digit code from email</span>
                <span className="text-xs text-gray-500">{otp.length}/8 digits</span>
              </div>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`p-3 rounded-lg ${message.includes('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
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

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || !otp || otp.length !== 8 || !email}
              className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Verifying...
                </span>
              ) : `Verify & Activate ${userType === 'provider' ? 'Provider' : 'Customer'} Account`}
            </button>
          </form>

          {/* Resend OTP Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <button
                onClick={handleResendOtp}
                disabled={loading || countdown > 0}
                className={`flex items-center px-4 py-2 rounded-lg ${countdown > 0 ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-primary hover:bg-blue-100'} transition-colors`}
              >
                {countdown > 0 ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Resend in {countdown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend Verification Code
                  </>
                )}
              </button>
              
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Back to Login
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Didn't receive the code? Check your spam folder or click "Resend"
              </p>
              <p className="text-xs text-gray-400 mt-1">
                The 8-digit code expires in 10 minutes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
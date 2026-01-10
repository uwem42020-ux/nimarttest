// app/provider/register/page.tsx - UPDATED WITH DATABASE CATEGORIES
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { 
  Mail, Phone, MapPin, Briefcase, Lock, Eye, EyeOff, 
  CheckCircle, AlertCircle, Building, Award, FileCheck, 
  Upload, X, Camera, User, ChevronRight, Shield,
  Loader2, ChevronDown, ChevronUp
} from 'lucide-react'

interface State {
  id: string;
  name: string;
}

interface LGA {
  id: string;
  name: string;
  state_id: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
}

export default function ProviderRegistration() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [states, setStates] = useState<State[]>([])
  const [lgas, setLgas] = useState<LGA[]>([])
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([])
  const [loadingLGAs, setLoadingLGAs] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [imageUploading, setImageUploading] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    business_name: '',
    service_type: '',
    phone: '',
    years_experience: '',
    bio: '',
    state_id: '',
    lga_id: '',
    address: '',
    accept_terms: false,
    accept_privacy: false,
  })

  const [errors, setErrors] = useState<any>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [debugInfo, setDebugInfo] = useState('')

  // Load service categories from database
  const loadServiceCategories = async () => {
    try {
      setLoadingCategories(true)
      console.log('📋 Loading service categories from database...')
      
      const { data, error } = await supabase
        .from('service_categories')
        .select('id, name, icon, description, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('Error loading categories:', error)
        // Use fallback categories
        setServiceCategories(getFallbackCategories())
      } else if (data && data.length > 0) {
        console.log(`✅ Loaded ${data.length} categories from database`)
        setServiceCategories(data)
      } else {
        console.log('No categories found in database, using fallback')
        setServiceCategories(getFallbackCategories())
      }
      
    } catch (error: any) {
      console.error('Exception loading categories:', error)
      setServiceCategories(getFallbackCategories())
    } finally {
      setLoadingCategories(false)
    }
  }

  // Fallback categories if database fails
  const getFallbackCategories = (): ServiceCategory[] => {
    const fallback = [
      { id: '1', name: 'Mechanics', icon: 'car', description: 'Auto repairs & vehicle maintenance', sort_order: 1 },
      { id: '2', name: 'Electricians', icon: 'zap', description: 'Electrical wiring & installations', sort_order: 2 },
      { id: '3', name: 'Plumbers', icon: 'droplets', description: 'Plumbing, water & pipe works', sort_order: 3 },
      { id: '4', name: 'Carpenters', icon: 'hammer', description: 'Woodwork, roofing & furniture', sort_order: 4 },
      { id: '5', name: 'Painters', icon: 'palette', description: 'House & office painting', sort_order: 5 },
      { id: '6', name: 'Tailors', icon: 'scissors', description: 'Fashion design & clothing', sort_order: 6 },
      { id: '7', name: 'Cleaners', icon: 'sparkles', description: 'Home & office cleaning', sort_order: 7 },
      { id: '8', name: 'Chefs', icon: 'chef-hat', description: 'Private cooking & catering', sort_order: 8 },
    ]
    
    return fallback.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      description: cat.description,
      sort_order: cat.sort_order
    }))
  }

  useEffect(() => {
    loadStates()
    loadServiceCategories()
  }, [])

  useEffect(() => {
    if (formData.state_id) {
      loadLGAs(formData.state_id)
    } else {
      setLgas([])
      setFormData(prev => ({ ...prev, lga_id: '' }))
    }
  }, [formData.state_id])

  async function loadStates() {
    try {
      const { data, error } = await supabase
        .from('states')
        .select('id, name')
        .order('name')

      if (error) {
        console.error('Error loading states:', error)
        setStates(getHardcodedStates())
        return
      }
      
      setStates(data || getHardcodedStates())
    } catch (error: any) {
      console.error('Exception loading states:', error)
      setStates(getHardcodedStates())
    }
  }

  function getHardcodedStates(): State[] {
    return [
      { id: '1', name: 'Lagos' },
      { id: '2', name: 'FCT' },
      { id: '3', name: 'Rivers' },
      { id: '4', name: 'Oyo' },
      { id: '5', name: 'Kano' },
      { id: '6', name: 'Kaduna' },
      { id: '7', name: 'Edo' },
      { id: '8', name: 'Delta' },
      { id: '9', name: 'Ogun' },
      { id: '10', name: 'Ondo' },
    ]
  }

  async function loadLGAs(stateId: string) {
    if (!stateId) return
    
    setLoadingLGAs(true)
    setFormData(prev => ({ ...prev, lga_id: '' }))
    
    try {
      const { data, error } = await supabase
        .from('lgas')
        .select('id, name, state_id')
        .eq('state_id', stateId)
        .order('name')

      if (error) {
        console.error('Error loading LGAs from DB:', error)
        setLgas(getHardcodedLGAs(stateId))
      } else if (data && data.length > 0) {
        setLgas(data)
      } else {
        setLgas(getHardcodedLGAs(stateId))
      }
      
    } catch (error: any) {
      console.error('Exception loading LGAs:', error)
      setLgas(getHardcodedLGAs(stateId))
    } finally {
      setLoadingLGAs(false)
    }
  }

  function getHardcodedLGAs(stateId: string): LGA[] {
    const state = states.find(s => s.id === stateId)
    const stateName = state?.name?.toLowerCase() || ''
    
    if (stateName.includes('lagos') || stateId === '1') {
      return [
        { id: '101', name: 'Ikeja', state_id: stateId },
        { id: '102', name: 'Lagos Island', state_id: stateId },
        { id: '103', name: 'Lagos Mainland', state_id: stateId },
        { id: '104', name: 'Surulere', state_id: stateId },
        { id: '105', name: 'Mushin', state_id: stateId },
        { id: '106', name: 'Apapa', state_id: stateId },
        { id: '107', name: 'Eti-Osa', state_id: stateId },
        { id: '108', name: 'Alimosho', state_id: stateId },
      ]
    } else if (stateName.includes('fct') || stateId === '2') {
      return [
        { id: '201', name: 'Abuja Municipal', state_id: stateId },
        { id: '202', name: 'Bwari', state_id: stateId },
        { id: '203', name: 'Gwagwalada', state_id: stateId },
        { id: '204', name: 'Kuje', state_id: stateId },
        { id: '205', name: 'Kwali', state_id: stateId },
        { id: '206', name: 'Abaji', state_id: stateId },
      ]
    } else if (stateName.includes('rivers') || stateId === '3') {
      return [
        { id: '301', name: 'Port Harcourt', state_id: stateId },
        { id: '302', name: 'Obio-Akpor', state_id: stateId },
        { id: '303', name: 'Ikwerre', state_id: stateId },
        { id: '304', name: 'Etche', state_id: stateId },
        { id: '305', name: 'Emohua', state_id: stateId },
      ]
    } else if (stateName.includes('oyo') || stateId === '4') {
      return [
        { id: '401', name: 'Ibadan North', state_id: stateId },
        { id: '402', name: 'Ibadan South', state_id: stateId },
        { id: '403', name: 'Egbeda', state_id: stateId },
        { id: '404', name: 'Oluyole', state_id: stateId },
        { id: '405', name: 'Ibarapa', state_id: stateId },
      ]
    } else if (stateName.includes('kano') || stateId === '5') {
      return [
        { id: '501', name: 'Kano Municipal', state_id: stateId },
        { id: '502', name: 'Nassarawa', state_id: stateId },
        { id: '503', name: 'Gwale', state_id: stateId },
        { id: '504', name: 'Tarauni', state_id: stateId },
        { id: '505', name: 'Dala', state_id: stateId },
      ]
    }
    
    return [
      { id: `${stateId}01`, name: 'Central District', state_id: stateId },
      { id: `${stateId}02`, name: 'North District', state_id: stateId },
      { id: `${stateId}03`, name: 'South District', state_id: stateId },
      { id: `${stateId}04`, name: 'East District', state_id: stateId },
      { id: `${stateId}05`, name: 'West District', state_id: stateId },
    ]
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setErrors({ ...errors, profileImage: 'Please upload a JPEG, PNG, or WebP image' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, profileImage: 'Image size must be less than 5MB' })
      return
    }

    setProfileImage(file)
    setErrors({ ...errors, profileImage: null })

    const reader = new FileReader()
    reader.onload = (e) => {
      setProfilePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function uploadProfileImage(): Promise<string | null> {
    if (!profileImage) return null
    
    try {
      setImageUploading(true)
      
      const fileExt = profileImage.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `provider-avatars/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, profileImage, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) {
        console.error('Image upload error:', uploadError)
        return null
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
      
      return publicUrl
      
    } catch (error: any) {
      console.error('Image upload exception:', error)
      return null
    } finally {
      setImageUploading(false)
    }
  }

  const removeImage = () => {
    setProfileImage(null)
    setProfilePreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validateStep = (stepNumber: number) => {
    const newErrors: any = {}

    if (stepNumber === 1) {
      if (!formData.email) newErrors.email = 'Email is required'
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid'
      
      if (!formData.password) newErrors.password = 'Password is required'
      else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
      
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    }

    if (stepNumber === 2) {
      if (!formData.business_name) newErrors.business_name = 'Business name is required'
      if (!formData.service_type) newErrors.service_type = 'Service type is required'
      if (!formData.phone) newErrors.phone = 'Phone number is required'
      else if (!/^[0-9]{11}$/.test(formData.phone.replace(/\D/g, ''))) newErrors.phone = 'Valid Nigerian phone number required (11 digits)'
      
      if (!formData.years_experience) newErrors.years_experience = 'Years of experience is required'
    }

    if (stepNumber === 3) {
      if (!formData.state_id) newErrors.state_id = 'State is required'
      if (!formData.lga_id) newErrors.lga_id = 'LGA is required'
      if (!formData.address) newErrors.address = 'Address is required'
    }

    if (stepNumber === 4) {
      if (!formData.accept_terms) newErrors.accept_terms = 'You must accept the terms and conditions'
      if (!formData.accept_privacy) newErrors.accept_privacy = 'You must accept the privacy policy'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1)
      window.scrollTo(0, 0)
    }
  }

  const prevStep = () => {
    setStep(step - 1)
    window.scrollTo(0, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep(4)) {
      return
    }

    setLoading(true)
    setErrors({})
    setSuccessMessage('')
    setUploadProgress(0)

    try {
      // Step 1: Upload profile image
      setUploadProgress(10)
      let profilePictureUrl = ''
      
      if (profileImage) {
        const uploadedUrl = await uploadProfileImage()
        if (uploadedUrl) {
          profilePictureUrl = uploadedUrl
        }
      }
      
      if (!profilePictureUrl) {
        profilePictureUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.business_name)}&background=008751&color=fff&size=256&bold=true&font-size=0.5`
      }
      
      setUploadProgress(30)
      
      // Step 2: Create user account - Supabase sends OTP automatically
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            user_type: 'provider',
            business_name: formData.business_name,
            phone: formData.phone
          }
        }
      })

      if (authError) {
        if (authError.message.includes('User already registered')) {
          throw new Error('This email is already registered. Please use a different email or sign in.')
        } else if (authError.message.includes('Failed to fetch')) {
          throw new Error('Network error. Please check your internet connection and try again.')
        } else {
          throw new Error(`Registration failed: ${authError.message}`)
        }
      }

      if (!authData.user) {
        throw new Error('User creation failed - no user returned')
      }

      setUploadProgress(70)

      // Step 3: Create provider profile
      const providerData = {
        user_id: authData.user.id,
        email: formData.email.trim(),
        business_name: formData.business_name,
        service_type: formData.service_type,
        phone: formData.phone,
        years_experience: parseInt(formData.years_experience) || 0,
        bio: formData.bio || `${formData.service_type} service provider based in ${formData.state_id}.`,
        state_id: formData.state_id,
        lga_id: formData.lga_id,
        address: formData.address,
        profile_picture_url: profilePictureUrl,
        verification_status: 'pending_email',
        rating: 0,
        total_reviews: 0,
        is_verified: false,
        verification_step: 'email_pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: providerDataResult, error: providerError } = await supabase
        .from('providers')
        .insert(providerData)
        .select()
        .single()

      if (providerError) {
        if (providerError.code === '42501') {
          throw new Error('Registration permission issue. Please contact support.')
        } else if (providerError.code === '23505') {
          throw new Error('A provider with this email already exists.')
        } else if (providerError.code === '23503') {
          throw new Error('Invalid state or LGA selected. Please try again.')
        } else {
          throw new Error(`Database error: ${providerError.message}`)
        }
      }

      // Update user metadata
      await supabase.auth.updateUser({
        data: { 
          provider_id: providerDataResult.id,
          provider_status: 'pending_email'
        }
      })

      setUploadProgress(100)

      // Get state name for success message
      const state = states.find(s => s.id === formData.state_id)
      const lga = lgas.find(l => l.id === formData.lga_id)

      // Show success message
      setSuccessMessage(`🎉 REGISTRATION SUCCESSFUL!

📧 **CHECK YOUR EMAIL**
An 8-digit verification code has been sent to:

${formData.email}

✅ **YOUR PROFILE IS READY:**
• Business Name: ${formData.business_name}
• Service Type: ${formData.service_type}
• Location: ${lga?.name || 'Local Area'}, ${state?.name || 'State'}
• Phone: ${formData.phone}
• Experience: ${formData.years_experience} years
• Profile Picture: ✅ ${profileImage ? 'Uploaded' : 'Generated'}

🔒 **NEXT STEPS:**
1. Check your email (and spam folder) for the 8-digit code
2. Enter the code on the verification page
3. Once verified, you can login to your dashboard
4. Your profile will appear on the marketplace immediately

⏳ You will be redirected to verification in 5 seconds...`)

      // Auto-redirect to verification page
      setTimeout(() => {
        router.push(`/verify?email=${encodeURIComponent(formData.email)}&from_registration=true`)
      }, 5000)

    } catch (error: any) {
      console.error('Registration error:', error)
      setErrors({ 
        submit: error.message || 'Registration failed. Please try again.'
      })
      setUploadProgress(0)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement
      setFormData({ ...formData, [name]: checkbox.checked })
    } else {
      setFormData({ ...formData, [name]: value })
    }
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: null })
    }
  }

  const getSelectedStateName = () => {
    const state = states.find(s => s.id === formData.state_id)
    return state?.name || ''
  }

  const getSelectedLGAName = () => {
    const lga = lgas.find(l => l.id === formData.lga_id)
    return lga?.name || ''
  }

  // Get visible categories (show all or first 12)
  const visibleCategories = showAllCategories 
    ? serviceCategories 
    : serviceCategories.slice(0, 12)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-100 mb-4 md:mb-6">
            <Briefcase className="h-8 w-8 md:h-10 md:w-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
            Register as a Service Provider
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Join Nigeria's fastest growing service marketplace. Get more customers and grow your business.
          </p>
          <p className="text-sm text-primary font-medium mt-2">
            Choose from {serviceCategories.length} professional service categories
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 md:mb-10">
          <div className="flex items-center justify-between px-4 md:px-0">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`
                  w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base
                  ${step === stepNumber ? 'bg-primary text-white shadow-lg' : 
                    step > stepNumber ? 'bg-green-100 text-green-700' : 
                    'bg-gray-200 text-gray-500'}
                  transition-all duration-300
                `}>
                  {step > stepNumber ? <CheckCircle className="h-4 w-4 md:h-5 md:w-5" /> : stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-12 md:w-24 h-1 ${step > stepNumber ? 'bg-green-500' : 'bg-gray-200'} transition-colors duration-300`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-xs md:text-sm px-2 md:px-0">
            <span className={step >= 1 ? 'text-primary font-medium' : 'text-gray-500'}>Account</span>
            <span className={step >= 2 ? 'text-primary font-medium' : 'text-gray-500'}>Business</span>
            <span className={step >= 3 ? 'text-primary font-medium' : 'text-gray-500'}>Location</span>
            <span className={step >= 4 ? 'text-primary font-medium' : 'text-gray-500'}>Terms</span>
          </div>
        </div>

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-6 md:mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-primary">Processing Registration...</span>
              <span className="text-sm font-medium text-primary">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 md:mb-8 p-4 md:p-6 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex">
              <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-500 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-800 mb-2">Registration Successful!</h3>
                <div className="text-green-700 whitespace-pre-line text-sm md:text-base">{successMessage}</div>
                <div className="mt-4 md:mt-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4 mb-3 md:mb-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-yellow-800 text-sm">Check your email</p>
                        <p className="text-xs md:text-sm text-yellow-700 mt-1">
                          Look for an email from Nimart. If you don't see it, check your spam folder.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs md:text-sm text-gray-600 mb-3">
                    Redirecting to verification in <span className="font-bold">5 seconds</span>...
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                    <button
                      onClick={() => router.push(`/verify?email=${encodeURIComponent(formData.email)}&from_registration=true`)}
                      className="px-4 py-2 md:px-6 md:py-2 bg-primary text-white rounded-lg hover:bg-green-700 font-medium text-sm md:text-base transition-colors"
                    >
                      Go to Verification Now
                    </button>
                    <button
                      onClick={() => {
                        window.open(`mailto:${formData.email}?subject=Nimart Verification Code`, '_blank')
                      }}
                      className="px-4 py-2 md:px-6 md:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm md:text-base transition-colors"
                    >
                      Open Email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="mb-6 md:mb-8 p-4 md:p-6 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex">
              <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-red-500 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-800 mb-2">Registration Failed</h3>
                <p className="text-red-700 text-sm md:text-base">{errors.submit}</p>
                <div className="mt-4 flex flex-col sm:flex-row gap-2 md:gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm md:text-base transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => router.push('/login')}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm md:text-base transition-colors"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        {!successMessage && !errors.submit && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl overflow-hidden">
            <div className="p-4 md:p-6 lg:p-8">
              {/* Step 1: Account Details */}
              {step === 1 && (
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Account Details</h2>
                  <div className="space-y-4 md:space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="h-4 w-4 inline mr-2" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 md:px-4 md:py-3 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                        placeholder="you@example.com"
                      />
                      {errors.email && <p className="mt-1 md:mt-2 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Lock className="h-4 w-4 inline mr-2" />
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 md:px-4 md:py-3 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                          placeholder="Minimum 8 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4 md:h-5 md:w-5" /> : <Eye className="h-4 w-4 md:h-5 md:w-5" />}
                        </button>
                      </div>
                      {errors.password && <p className="mt-1 md:mt-2 text-sm text-red-600">{errors.password}</p>}
                      <p className="text-xs text-gray-500 mt-1">Use at least 8 characters with letters and numbers</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Lock className="h-4 w-4 inline mr-2" />
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 md:px-4 md:py-3 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                          placeholder="Re-enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4 md:h-5 md:w-5" /> : <Eye className="h-4 w-4 md:h-5 md:w-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="mt-1 md:mt-2 text-sm text-red-600">{errors.confirmPassword}</p>}
                    </div>

                    <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start">
                        <Shield className="h-4 w-4 md:h-5 md:w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">Secure Registration</p>
                          <p className="text-xs md:text-sm text-blue-700 mt-1">
                            Your information is protected with industry-standard encryption. 
                            We'll send a verification code to your email to secure your account.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Business Details */}
              {step === 2 && (
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Business Details</h2>
                  <div className="space-y-4 md:space-y-6">
                    {/* Profile Picture Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Camera className="h-4 w-4 inline mr-2" />
                        Profile Picture (Optional)
                      </label>
                      <div className="mt-1 flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
                        <div className="relative">
                          {profilePreview ? (
                            <div className="relative">
                              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                <Image
                                  src={profilePreview}
                                  alt="Profile preview"
                                  width={128}
                                  height={128}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={removeImage}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                              >
                                <X className="h-3 w-3 md:h-4 md:w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-100 border-4 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                              <Upload className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
                              <span className="mt-1 md:mt-2 text-xs md:text-sm text-gray-500">Upload Photo</span>
                              <span className="text-xs text-gray-400">Optional</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            id="profile-picture"
                          />
                          <div className="space-y-2 md:space-y-3">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={imageUploading}
                              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-sm md:text-base transition-colors ${
                                imageUploading 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                  : 'bg-primary text-white hover:bg-green-700'
                              }`}
                            >
                              {imageUploading ? (
                                <>
                                  <Loader2 className="h-4 w-4 md:h-5 md:w-5 mr-2 animate-spin inline" />
                                  Uploading...
                                </>
                              ) : profileImage ? (
                                'Change Photo'
                              ) : (
                                'Choose Photo'
                              )}
                            </button>
                            <div>
                              <p className="text-xs md:text-sm text-gray-600">
                                Upload a clear photo of yourself or your business logo
                              </p>
                              <p className="text-xs text-gray-500">
                                JPG, PNG, or WebP • Max 5MB
                              </p>
                              {errors.profileImage && (
                                <p className="mt-1 text-sm text-red-600">{errors.profileImage}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Building className="h-4 w-4 inline mr-2" />
                        Business Name *
                      </label>
                      <input
                        type="text"
                        name="business_name"
                        value={formData.business_name}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 md:px-4 md:py-3 border ${errors.business_name ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                        placeholder="e.g., Ade's Plumbing Services"
                      />
                      {errors.business_name && <p className="mt-1 md:mt-2 text-sm text-red-600">{errors.business_name}</p>}
                    </div>

                    {/* Service Type Selection - Dynamic from Database */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Briefcase className="h-4 w-4 inline mr-2" />
                        Service Type *
                      </label>
                      
                      {loadingCategories ? (
                        <div className="flex items-center text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading service categories...
                        </div>
                      ) : (
                        <>
                          <select
                            name="service_type"
                            value={formData.service_type}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 md:px-4 md:py-3 border ${errors.service_type ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                          >
                            <option value="">Select your service type</option>
                            {visibleCategories.map((category) => (
                              <option key={category.id} value={category.name}>
                                {category.name} {category.description ? `- ${category.description}` : ''}
                              </option>
                            ))}
                          </select>
                          
                          {/* Show More/Less Toggle for Categories */}
                          {serviceCategories.length > 12 && (
                            <button
                              type="button"
                              onClick={() => setShowAllCategories(!showAllCategories)}
                              className="mt-2 flex items-center text-sm text-primary hover:text-green-700"
                            >
                              {showAllCategories ? (
                                <>
                                  <ChevronUp className="h-4 w-4 mr-1" />
                                  Show Less Categories ({serviceCategories.length} total)
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-1" />
                                  Show All {serviceCategories.length} Categories
                                </>
                              )}
                            </button>
                          )}
                        </>
                      )}
                      
                      {errors.service_type && <p className="mt-1 md:mt-2 text-sm text-red-600">{errors.service_type}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        Choose from {serviceCategories.length} professional service categories
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="h-4 w-4 inline mr-2" />
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 md:px-4 md:py-3 border ${errors.phone ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                        placeholder="e.g., 08012345678"
                      />
                      {errors.phone && <p className="mt-1 md:mt-2 text-sm text-red-600">{errors.phone}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Award className="h-4 w-4 inline mr-2" />
                        Years of Experience *
                      </label>
                      <select
                        name="years_experience"
                        value={formData.years_experience}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 md:px-4 md:py-3 border ${errors.years_experience ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                      >
                        <option value="">Select years</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, '10+'].map((year) => (
                          <option key={year} value={year}>{year} year{year === 1 ? '' : 's'}</option>
                        ))}
                      </select>
                      {errors.years_experience && <p className="mt-1 md:mt-2 text-sm text-red-600">{errors.years_experience}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="h-4 w-4 inline mr-2" />
                        Brief Business Description
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                        placeholder="Tell customers about your services, expertise, and what makes you unique..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Location */}
              {step === 3 && (
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Service Location</h2>
                  <div className="space-y-4 md:space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="h-4 w-4 inline mr-2" />
                        State *
                      </label>
                      <select
                        name="state_id"
                        value={formData.state_id}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 md:px-4 md:py-3 border ${errors.state_id ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                      >
                        <option value="">Select your state</option>
                        {states.map((state) => (
                          <option key={state.id} value={state.id}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                      {errors.state_id && <p className="mt-1 md:mt-2 text-sm text-red-600">{errors.state_id}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="h-4 w-4 inline mr-2" />
                        Local Government Area (LGA) *
                      </label>
                      <select
                        name="lga_id"
                        value={formData.lga_id}
                        onChange={handleInputChange}
                        disabled={!formData.state_id || loadingLGAs}
                        className={`w-full px-3 py-2 md:px-4 md:py-3 border ${errors.lga_id ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${!formData.state_id || loadingLGAs ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      >
                        <option value="">
                          {!formData.state_id ? 'Select state first' : 
                           loadingLGAs ? 'Loading LGAs...' : 
                           lgas.length === 0 ? 'No LGAs available' : 'Select your LGA'}
                        </option>
                        {lgas.map((lga) => (
                          <option key={lga.id} value={lga.id}>
                            {lga.name}
                          </option>
                        ))}
                      </select>
                      {loadingLGAs && (
                        <div className="flex items-center mt-2 text-sm text-gray-600">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading LGAs...
                        </div>
                      )}
                      {errors.lga_id && <p className="mt-1 md:mt-2 text-sm text-red-600">{errors.lga_id}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="h-4 w-4 inline mr-2" />
                        Business Address *
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={2}
                        className={`w-full px-3 py-2 md:px-4 md:py-3 border ${errors.address ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                        placeholder="Street address, landmarks, or area description"
                      />
                      {errors.address && <p className="mt-1 md:mt-2 text-sm text-red-600">{errors.address}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Terms */}
              {step === 4 && (
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Terms & Conditions</h2>
                  
                  <div className="space-y-4 md:space-y-8">
                    <div className="bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 md:mb-4">Registration Summary</h3>
                      <div className="space-y-3 md:space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          <div>
                            <p className="text-xs md:text-sm text-gray-500">Business Name</p>
                            <p className="font-medium text-gray-900 text-sm md:text-base">{formData.business_name}</p>
                          </div>
                          <div>
                            <p className="text-xs md:text-sm text-gray-500">Service Type</p>
                            <p className="font-medium text-gray-900 text-sm md:text-base">{formData.service_type}</p>
                          </div>
                          <div>
                            <p className="text-xs md:text-sm text-gray-500">Location</p>
                            <p className="font-medium text-gray-900 text-sm md:text-base">
                              {getSelectedLGAName() ? `${getSelectedLGAName()}, ${getSelectedStateName()}` : 'Not selected'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs md:text-sm text-gray-500">Phone</p>
                            <p className="font-medium text-gray-900 text-sm md:text-base">{formData.phone}</p>
                          </div>
                          <div>
                            <p className="text-xs md:text-sm text-gray-500">Profile Picture</p>
                            <p className="font-medium text-gray-900 text-sm md:text-base">
                              {profileImage ? '✅ Uploaded' : '✅ Auto-generated'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs md:text-sm text-gray-500">Experience</p>
                            <p className="font-medium text-gray-900 text-sm md:text-base">
                              {formData.years_experience ? `${formData.years_experience} year${formData.years_experience === '1' ? '' : 's'}` : 'Not specified'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 md:p-6 rounded-lg border border-green-200">
                      <h3 className="text-lg font-semibold text-green-900 mb-3 md:mb-4 flex items-center">
                        <FileCheck className="h-5 w-5 mr-2" />
                        Verification Information
                      </h3>
                      <p className="text-green-700 text-sm md:text-base mb-3 md:mb-4">
                        After registration, you'll receive an 8-digit OTP code via email. 
                        Verify your email to activate your account and appear on the marketplace immediately.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 md:mb-4">Agreement</h3>
                      
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            name="accept_terms"
                            checked={formData.accept_terms}
                            onChange={handleInputChange}
                            className="h-4 w-4 md:h-5 md:w-5 text-primary focus:ring-primary border-gray-300 rounded mt-1 flex-shrink-0"
                          />
                          <label className="ml-3 text-gray-700 text-sm md:text-base">
                            I agree to the{' '}
                            <a href="/terms" target="_blank" className="text-primary hover:text-green-700 font-medium underline">
                              Terms and Conditions
                            </a>
                            {' '}of Nimart service provider agreement *
                          </label>
                        </div>
                        {errors.accept_terms && <p className="ml-7 md:ml-8 text-sm text-red-600">{errors.accept_terms}</p>}

                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            name="accept_privacy"
                            checked={formData.accept_privacy}
                            onChange={handleInputChange}
                            className="h-4 w-4 md:h-5 md:w-5 text-primary focus:ring-primary border-gray-300 rounded mt-1 flex-shrink-0"
                          />
                          <div className="ml-3">
                            <label className="text-gray-700 text-sm md:text-base">
                              I have read and agree to the{' '}
                              <a href="/privacy" target="_blank" className="text-primary hover:text-green-700 font-medium underline">
                                Privacy Policy
                              </a>
                              {' '}and understand how my data will be used *
                            </label>
                          </div>
                        </div>
                        {errors.accept_privacy && <p className="ml-7 md:ml-8 text-sm text-red-600">{errors.accept_privacy}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-gray-200">
                <div className="flex justify-between">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={loading}
                      className="px-4 py-2 md:px-8 md:py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                    >
                      <span className="flex items-center">
                        <ChevronRight className="h-4 w-4 md:h-5 md:w-5 rotate-180 mr-2" />
                        Back
                      </span>
                    </button>
                  ) : (
                    <div></div>
                  )}

                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-4 py-2 md:px-8 md:py-3 bg-primary text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center text-sm md:text-base shadow-md hover:shadow-lg"
                    >
                      Continue
                      <ChevronRight className="h-4 w-4 md:h-5 md:w-5 ml-2" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 md:px-12 md:py-3 bg-primary text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm md:text-base shadow-md hover:shadow-lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        'Complete Registration'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Footer Links */}
        <div className="mt-8 md:mt-12 text-center">
          <p className="text-gray-600 text-sm md:text-base">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-green-700 font-medium transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
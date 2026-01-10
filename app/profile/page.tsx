// app/profile/page.tsx - CUSTOMER PROFILE PAGE
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  User, Mail, Phone, MapPin, Calendar, 
  Edit, Save, X, Camera, Loader2,
  Shield, CheckCircle, AlertCircle
} from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    address: '',
    email: ''
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login?redirect=/profile')
        return
      }
      
      setUser(session.user)
      
      // Check if user is a customer
      const userType = session.user.user_metadata?.user_type
      if (userType !== 'customer') {
        alert('Only customers can access this page')
        router.push('/')
        return
      }
      
      // Load profile data
      await loadProfile(session.user)
      
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    }
  }

  const loadProfile = async (user: any) => {
    try {
      // Try to load from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setProfileData({
        name: profile?.display_name || user.user_metadata?.name || '',
        phone: profile?.phone || user.user_metadata?.phone || '',
        address: profile?.address || '',
        email: user.email || ''
      })
      
    } catch (error) {
      console.error('Error loading profile:', error)
      // Use auth metadata as fallback
      setProfileData({
        name: user.user_metadata?.name || user.email?.split('@')[0] || '',
        phone: user.user_metadata?.phone || '',
        address: '',
        email: user.email || ''
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: profileData.name,
          phone: profileData.phone
        }
      })

      if (authError) throw authError

      // Update or create profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: profileData.name,
          phone: profileData.phone,
          address: profileData.address,
          user_type: 'customer',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (profileError) throw profileError

      setEditing(false)
      alert('Profile updated successfully!')
      
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 text-sm">Manage your personal information</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
              <p className="text-gray-600 text-sm">Update your contact details</p>
            </div>
            
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center px-4 py-2 border border-primary text-primary rounded-lg hover:bg-green-50 font-medium"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-green-500 flex items-center justify-center text-white text-3xl font-bold">
                {profileData.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Profile Picture</h3>
                <p className="text-gray-600 text-sm">Upload a photo to personalize your profile</p>
                {editing && (
                  <button className="mt-2 flex items-center text-primary hover:text-green-700 text-sm">
                    <Camera className="h-4 w-4 mr-1" />
                    Upload Photo
                  </button>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Your full name"
                  />
                ) : (
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <span>{profileData.name || 'Not set'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <span>{profileData.email}</span>
                  <Shield className="h-4 w-4 text-green-500 ml-2" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="08012345678"
                  />
                ) : (
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <span>{profileData.phone || 'Not set'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Your address"
                  />
                ) : (
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <span>{profileData.address || 'Not set'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Account Info */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <div>
                      <p className="font-medium">Email Verified</p>
                      <p className="text-sm text-gray-600">Your email is verified</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Verified
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-blue-500 mr-3" />
                    <div>
                      <p className="font-medium">Member Since</p>
                      <p className="text-sm text-gray-600">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            <AlertCircle className="h-5 w-5 inline mr-2" />
            Danger Zone
          </h3>
          <p className="text-red-700 mb-4">
            These actions are irreversible. Please proceed with caution.
          </p>
          <div className="flex space-x-4">
            <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 font-medium">
              Delete Account
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
              Deactivate Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
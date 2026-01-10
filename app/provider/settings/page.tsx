// app/provider/settings/page.tsx - PROVIDER SETTINGS
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Settings, User, Mail, Phone, MapPin, 
  Briefcase, DollarSign, Globe, Bell,
  Shield, Key, CreditCard, FileText,
  Save, X, Loader2, AlertCircle
} from 'lucide-react'

export default function ProviderSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [providerData, setProviderData] = useState<any>(null)
  const [settings, setSettings] = useState({
    business_name: '',
    phone: '',
    email: '',
    address: '',
    service_type: '',
    hourly_rate: '',
    bio: '',
    notifications: true,
    email_notifications: true,
    sms_notifications: false
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login?redirect=/provider/settings')
        return
      }
      
      setUser(session.user)
      
      // Check if user is a provider
      const userType = session.user.user_metadata?.user_type
      if (userType !== 'provider') {
        alert('Only providers can access this page')
        router.push('/')
        return
      }
      
      // Load provider data
      await loadProviderData(session.user)
      
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    }
  }

  const loadProviderData = async (user: any) => {
    try {
      const { data } = await supabase
        .from('providers')
        .select('*')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .single()
      
      if (data) {
        setProviderData(data)
        setSettings({
          business_name: data.business_name || '',
          phone: data.phone || '',
          email: data.email || user.email,
          address: data.address || '',
          service_type: data.service_type || '',
          hourly_rate: data.hourly_rate || '',
          bio: data.bio || '',
          notifications: true,
          email_notifications: true,
          sms_notifications: false
        })
      }
      
    } catch (error) {
      console.error('Error loading provider data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (!providerData?.id) {
        throw new Error('Provider data not found')
      }

      const { error } = await supabase
        .from('providers')
        .update({
          business_name: settings.business_name,
          phone: settings.phone,
          email: settings.email,
          address: settings.address,
          service_type: settings.service_type,
          hourly_rate: settings.hourly_rate ? parseFloat(settings.hourly_rate) : null,
          bio: settings.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', providerData.id)

      if (error) throw error

      // Update auth metadata
      await supabase.auth.updateUser({
        data: {
          business_name: settings.business_name,
          phone: settings.phone
        }
      })

      alert('Settings saved successfully!')
      
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Provider Settings</h1>
              <p className="text-gray-600 text-sm">Manage your business settings</p>
            </div>
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Settings */}
          <div className="lg:col-span-2 space-y-8">
            {/* Business Information */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center mb-6">
                <Briefcase className="h-5 w-5 text-primary mr-3" />
                <h2 className="text-xl font-bold text-gray-900">Business Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={settings.business_name}
                    onChange={(e) => setSettings({...settings, business_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Your business name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Type *
                  </label>
                  <select
                    value={settings.service_type}
                    onChange={(e) => setSettings({...settings, service_type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select service type</option>
                    <option value="Mechanic">Mechanic</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="Painter">Painter</option>
                    <option value="Tailor">Tailor</option>
                    <option value="Cleaner">Cleaner</option>
                    <option value="Chef">Chef</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => setSettings({...settings, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="08012345678"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({...settings, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="business@example.com"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Address
                  </label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({...settings, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="123 Business Street, City"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Rate (₦)
                  </label>
                  <input
                    type="number"
                    value={settings.hourly_rate}
                    onChange={(e) => setSettings({...settings, hourly_rate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="5000"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Bio
                  </label>
                  <textarea
                    value={settings.bio}
                    onChange={(e) => setSettings({...settings, bio: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Describe your business and services..."
                  />
                  <p className="text-xs text-gray-500 mt-1">This will appear on your public profile</p>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center mb-6">
                <Bell className="h-5 w-5 text-primary mr-3" />
                <h2 className="text-xl font-bold text-gray-900">Notification Settings</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-600">Receive notifications for new bookings and messages</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive email updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email_notifications}
                      onChange={(e) => setSettings({...settings, email_notifications: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">SMS Notifications</p>
                    <p className="text-sm text-gray-600">Receive text message alerts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.sms_notifications}
                      onChange={(e) => setSettings({...settings, sms_notifications: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Account & Security */}
          <div className="space-y-8">
            {/* Account Security */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center mb-6">
                <Shield className="h-5 w-5 text-primary mr-3" />
                <h2 className="text-xl font-bold text-gray-900">Account Security</h2>
              </div>
              
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <Key className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Change Password</p>
                      <p className="text-sm text-gray-600">Update your password</p>
                    </div>
                  </div>
                  <span className="text-primary">→</span>
                </button>
                
                <button className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Payment Methods</p>
                      <p className="text-sm text-gray-600">Manage payment options</p>
                    </div>
                  </div>
                  <span className="text-primary">→</span>
                </button>
                
                <button className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Terms & Policies</p>
                      <p className="text-sm text-gray-600">View platform policies</p>
                    </div>
                  </div>
                  <span className="text-primary">→</span>
                </button>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Verification Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    providerData?.is_verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {providerData?.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Profile Views</span>
                  <span className="font-medium">{providerData?.profile_views || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Response Rate</span>
                  <span className="font-medium">{providerData?.response_rate || 0}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium">
                    {providerData?.created_at 
                      ? new Date(providerData.created_at).toLocaleDateString() 
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                <AlertCircle className="h-5 w-5 inline mr-2" />
                Danger Zone
              </h3>
              <p className="text-red-700 text-sm mb-4">
                These actions are irreversible. Please proceed with caution.
              </p>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 font-medium">
                  Deactivate Account
                </button>
                <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
// app/page.tsx - SIMPLIFIED CREATIVE ANIMATION
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FastProvider, ServiceCategory, UserLocation, State, LGA } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import ProviderCard from '@/components/ProviderCard'
import { 
  Search, MapPin, Star, Shield, CheckCircle, 
  ArrowRight, ChevronRight, ChevronDown,
  Briefcase, Car, Zap, Droplets,
  Palette, Scissors, ChefHat, Sparkles,
  Wrench, Grid, List, Mail, Phone, 
  Facebook, Instagram, Youtube, Home as HomeIcon, 
  Utensils, Cake, Store, Calendar, Mic, Flower,
  Camera, Video, Users, Bike, Truck, Package, 
  Smartphone, Laptop, Code, PenTool, TrendingUp, 
  Calculator, Scale, Building, Map, Book, 
  GraduationCap, Award, Eye, AlertTriangle, Layers, 
  Clock, Heart, User, Shirt, Baby, Square, Circle, 
  Hammer, WifiOff, RefreshCw, Filter, SortAsc, SortDesc
} from 'lucide-react'

// Import utilities
import { getUserLocation } from '@/lib/location'
import { SORT_OPTIONS, SortOption, sortProviders } from '@/lib/sorting'

export default function Home() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [featuredProviders, setFeaturedProviders] = useState<FastProvider[]>([])
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [categoriesVisible, setCategoriesVisible] = useState(8)
  const [gridView, setGridView] = useState<'basic' | 'detailed'>('basic')
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // Location state
  const [userLocation, setUserLocation] = useState<UserLocation>({
    state: null,
    lga: null,
    coordinates: null,
    detected: false
  })
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('distance')
  const [selectedState, setSelectedState] = useState<string>('')
  const [selectedLGA, setSelectedLGA] = useState<string>('')
  const [states, setStates] = useState<State[]>([])
  const [lgas, setLgas] = useState<LGA[]>([])
  const [filteredProviders, setFilteredProviders] = useState<FastProvider[]>([])
  const [onlineStatus, setOnlineStatus] = useState(true)

  // Check online status
  useEffect(() => {
    const handleOnlineStatus = () => {
      setOnlineStatus(navigator.onLine)
    }
    
    handleOnlineStatus()
    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('offline', handleOnlineStatus)
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus)
      window.removeEventListener('offline', handleOnlineStatus)
    }
  }, [])

  // Simple icon mapping
  const getIconComponent = (iconName: string | null): React.ReactNode => {
    if (!iconName) return <Briefcase className="h-5 w-5" />
    
    const iconMap: Record<string, React.ReactNode> = {
      'car': <Car className="h-5 w-5" />,
      'zap': <Zap className="h-5 w-5" />,
      'droplets': <Droplets className="h-5 w-5" />,
      'hammer': <Hammer className="h-5 w-5" />,
      'palette': <Palette className="h-5 w-5" />,
      'scissors': <Scissors className="h-5 w-5" />,
      'sparkles': <Sparkles className="h-5 w-5" />,
      'chef-hat': <ChefHat className="h-5 w-5" />,
      'home': <HomeIcon className="h-5 w-5" />,
      'shirt': <Shirt className="h-5 w-5" />,
      'baby': <Baby className="h-5 w-5" />,
      'user': <User className="h-5 w-5" />,
      'utensils': <Utensils className="h-5 w-5" />,
      'cake': <Cake className="h-5 w-5" />,
      'store': <Store className="h-5 w-5" />,
      'calendar': <Calendar className="h-5 w-5" />,
      'mic': <Mic className="h-5 w-5" />,
      'flower': <Flower className="h-5 w-5" />,
      'camera': <Camera className="h-5 w-5" />,
      'video': <Video className="h-5 w-5" />,
      'users': <Users className="h-5 w-5" />,
      'bike': <Bike className="h-5 w-5" />,
      'truck': <Truck className="h-5 w-5" />,
      'package': <Package className="h-5 w-5" />,
      'smartphone': <Smartphone className="h-5 w-5" />,
      'laptop': <Laptop className="h-5 w-5" />,
      'code': <Code className="h-5 w-5" />,
      'pen-tool': <PenTool className="h-5 w-5" />,
      'trending-up': <TrendingUp className="h-5 w-5" />,
      'calculator': <Calculator className="h-5 w-5" />,
      'scale': <Scale className="h-5 w-5" />,
      'building': <Building className="h-5 w-5" />,
      'map': <Map className="h-5 w-5" />,
      'book': <Book className="h-5 w-5" />,
      'graduation-cap': <GraduationCap className="h-5 w-5" />,
      'award': <Award className="h-5 w-5" />,
      'eye': <Eye className="h-5 w-5" />,
      'alert-triangle': <AlertTriangle className="h-5 w-5" />,
      'layers': <Layers className="h-5 w-5" />,
      'clock': <Clock className="h-5 w-5" />,
      'heart': <Heart className="h-5 w-5" />,
      'square': <Square className="h-5 w-5" />,
      'circle': <Circle className="h-5 w-5" />,
      'grid': <Grid className="h-5 w-5" />,
      'wrench': <Wrench className="h-5 w-5" />,
      'steering-wheel': <Car className="h-5 w-5" />,
      'briefcase': <Briefcase className="h-5 w-5" />,
      'car-front': <Car className="h-5 w-5" />,
      'shield': <Shield className="h-5 w-5" />,
      'tree': <Sparkles className="h-5 w-5" />,
      'leaf': <Sparkles className="h-5 w-5" />,
      'fish': <Droplets className="h-5 w-5" />,
      'dress': <Shirt className="h-5 w-5" />,
      'brush': <PenTool className="h-5 w-5" />,
      'cut': <Scissors className="h-5 w-5" />,
      'tool': <Wrench className="h-5 w-5" />,
    }
    
    return iconMap[iconName] || <Briefcase className="h-5 w-5" />
  }

  // Color mapping for categories
  const getCategoryColors = (index: number) => {
    const colors = [
      { color: 'text-orange-600 bg-orange-50', darkColor: 'text-orange-400 bg-orange-900/20' },
      { color: 'text-yellow-600 bg-yellow-50', darkColor: 'text-yellow-400 bg-yellow-900/20' },
      { color: 'text-blue-600 bg-blue-50', darkColor: 'text-blue-400 bg-blue-900/20' },
      { color: 'text-green-600 bg-green-50', darkColor: 'text-green-400 bg-green-900/20' },
      { color: 'text-purple-600 bg-purple-50', darkColor: 'text-purple-400 bg-purple-900/20' },
      { color: 'text-pink-600 bg-pink-50', darkColor: 'text-pink-400 bg-pink-900/20' },
      { color: 'text-red-600 bg-red-50', darkColor: 'text-red-400 bg-red-900/20' },
      { color: 'text-indigo-600 bg-indigo-50', darkColor: 'text-indigo-400 bg-indigo-900/20' },
    ]
    return colors[index % colors.length]
  }

  // Check for dark mode
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkMode(darkModeMediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)
    darkModeMediaQuery.addEventListener('change', handleChange)
    
    return () => darkModeMediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Load service categories
  const loadServiceCategories = async () => {
    try {
      setLoadingCategories(true)
      
      const { data, error } = await supabase
        .from('service_categories')
        .select('id, name, icon, description, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('Error loading categories:', error)
        setServiceCategories(getFallbackCategories())
      } else if (data && data.length > 0) {
        const categoriesWithColors = data.map((category, index) => {
          const colors = getCategoryColors(index)
          return {
            ...category,
            ...colors
          }
        })
        setServiceCategories(categoriesWithColors)
      } else {
        setServiceCategories(getFallbackCategories())
      }
      
    } catch (error) {
      console.error('Error loading categories:', error)
      setServiceCategories(getFallbackCategories())
    } finally {
      setLoadingCategories(false)
    }
  }

  // Fallback categories
  const getFallbackCategories = (): ServiceCategory[] => {
    const fallbackCategories = [
      { name: 'Mechanics', description: 'Auto repairs & maintenance', icon: 'car' },
      { name: 'Electricians', description: 'Electrical installations', icon: 'zap' },
      { name: 'Plumbers', description: 'Plumbing & pipe works', icon: 'droplets' },
      { name: 'Carpenters', description: 'Woodwork & furniture', icon: 'hammer' },
      { name: 'Painters', description: 'Painting & decoration', icon: 'palette' },
      { name: 'Tailors', description: 'Fashion & clothing', icon: 'scissors' },
      { name: 'Cleaners', description: 'Home & office cleaning', icon: 'sparkles' },
      { name: 'Chefs', description: 'Cooking & catering', icon: 'chef-hat' },
    ]
    
    return fallbackCategories.map((cat, index) => {
      const colors = getCategoryColors(index)
      return {
        id: `fallback-${index}`,
        name: cat.name,
        icon: cat.icon,
        description: cat.description,
        sort_order: index + 1,
        ...colors
      }
    })
  }

  // Load providers with proper state/LGA joins
  const loadFeaturedProviders = async () => {
    try {
      setLoadingProviders(true)
      
      if (!navigator.onLine) {
        throw new Error('No internet connection')
      }
      
      const { data: providers, error } = await supabase
        .from('providers')
        .select(`*, states:state_id (name), lgas:lga_id (name)`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Load error:', error)
        setFeaturedProviders([])
        return
      }

      if (providers && providers.length > 0) {
        const typedProviders: FastProvider[] = providers.map((provider: any) => ({
          id: provider.id,
          business_name: provider.business_name,
          service_type: provider.service_type,
          rating: provider.rating,
          total_reviews: provider.total_reviews,
          profile_picture_url: provider.profile_picture_url,
          state_id: provider.state_id,
          lga_id: provider.lga_id,
          states: provider.states ? [{ name: provider.states.name }] : null,
          lgas: provider.lgas ? [{ name: provider.lgas.name }] : null,
          years_experience: provider.years_experience,
          is_verified: provider.is_verified,
          created_at: provider.created_at,
          bio: provider.bio,
          phone: provider.phone,
          total_bookings: provider.total_bookings || 0,
          response_time: provider.response_time,
          city: provider.city,
          response_rate: provider.response_rate,
          is_online: provider.is_online
        }))
        
        setFeaturedProviders(typedProviders)
        setFilteredProviders(typedProviders)
      } else {
        setFeaturedProviders([])
        setFilteredProviders([])
      }
      
    } catch (error: any) {
      console.error('Loading error:', error)
      setFeaturedProviders([])
      setFilteredProviders([])
    } finally {
      setLoadingProviders(false)
    }
  }

  // Load states and LGAs for dropdowns
  const loadStatesAndLGAs = async () => {
    try {
      // Load states
      const { data: statesData } = await supabase
        .from('states')
        .select('id, name')
        .order('name')
      
      if (statesData) setStates(statesData)
      
      // Load all LGAs
      const { data: lgasData } = await supabase
        .from('lgas')
        .select('id, name, state_id')
        .order('name')
      
      if (lgasData) setLgas(lgasData)
    } catch (error) {
      console.error('Error loading location data:', error)
    }
  }

  // Initialize everything
  useEffect(() => {
    loadServiceCategories()
    loadFeaturedProviders()
    loadStatesAndLGAs()
    
    // Check if user has saved location in localStorage
    const savedLocation = localStorage.getItem('nimart-user-location')
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation)
        setUserLocation(location)
        
        // Auto-select in dropdowns if location exists
        if (location.state) {
          const state = states.find(s => s.name === location.state)
          if (state) {
            setSelectedState(state.id)
            if (location.lga) {
              const lga = lgas.find(l => 
                l.name === location.lga && 
                l.state_id === state.id
              )
              if (lga) setSelectedLGA(lga.id)
            }
          }
        }
      } catch (error) {
        console.error('Error parsing saved location:', error)
      }
    }
  }, [])

  // Update filtered providers when dependencies change
  useEffect(() => {
    updateFilteredProviders()
  }, [featuredProviders, sortBy, selectedState, selectedLGA, userLocation])

  // FIXED: Location detection using database - SIMPLIFIED
  const detectUserLocation = async () => {
    setDetectingLocation(true)
    try {
      const coords = await getUserLocation()
      
      if (coords) {
        console.log('📍 User coordinates:', coords)
        
        // Call the find_nearest_location RPC function - FIXED
        const { data: nearestLocation, error } = await supabase
          .rpc('find_nearest_location', {
            user_lat: Number(coords.latitude),
            user_lng: Number(coords.longitude),
            max_distance_km: 100
          })

        if (error) {
          console.error('RPC Error:', error)
          throw error
        }
        
        console.log('📍 Nearest location data:', nearestLocation)
        
        if (nearestLocation && nearestLocation.length > 0) {
          const location = nearestLocation[0]
          
          // Save user location
          const newLocation: UserLocation = {
            coordinates: coords,
            state: location.state_name,
            lga: location.lga_name,
            detected: true
          }
          
          setUserLocation(newLocation)
          localStorage.setItem('nimart-user-location', JSON.stringify(newLocation))
          
          // Update dropdowns
          const state = states.find(s => s.name === location.state_name)
          if (state) {
            setSelectedState(state.id)
            
            // Find LGA by name and state
            const lga = lgas.find(l => 
              l.name === location.lga_name && 
              l.state_id === state.id
            )
            if (lga) {
              setSelectedLGA(lga.id)
            }
          }
          
          alert(`📍 Location detected! You're in ${location.lga_name}, ${location.state_name}`)
          
        } else {
          console.log('No location found in database')
          alert('📍 Location detected! Please select your state and LGA from dropdowns.')
        }
        
      } else {
        alert('Please allow location access or select your location manually.')
      }
    } catch (error) {
      console.error('Location detection failed:', error)
      alert('Location detection failed. Please select your location manually.')
    } finally {
      setDetectingLocation(false)
    }
  }

  // Get LGAs for selected state
  const getLGAsForState = (stateId: string) => {
    return lgas.filter(lga => lga.state_id === stateId)
  }

  // Sort and filter providers
  const updateFilteredProviders = () => {
    let filtered = [...featuredProviders]
    
    // Filter by selected state
    if (selectedState) {
      const stateName = states.find(s => s.id === selectedState)?.name
      filtered = filtered.filter(p => 
        p.states?.[0]?.name === stateName
      )
    }
    
    // Filter by selected LGA
    if (selectedLGA) {
      const lgaName = lgas.find(l => l.id === selectedLGA)?.name
      filtered = filtered.filter(p => 
        p.lgas?.[0]?.name === lgaName
      )
    }
    
    // Sort providers
    const sorted = sortProviders(
      filtered,
      sortBy,
      userLocation.state,
      userLocation.lga
    )
    
    setFilteredProviders(sorted)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleShowMoreCategories = () => {
    setCategoriesVisible(prev => Math.min(prev + 8, serviceCategories.length))
  }

  const handleShowLessCategories = () => {
    setCategoriesVisible(8)
  }

  // Save user's manual location selection
  const handleLocationSelect = () => {
    const selectedStateName = states.find(s => s.id === selectedState)?.name || null
    const selectedLGAName = lgas.find(l => l.id === selectedLGA)?.name || null
    
    if (selectedStateName) {
      const newLocation: UserLocation = {
        state: selectedStateName,
        lga: selectedLGAName,
        coordinates: null,
        detected: true
      }
      
      setUserLocation(newLocation)
      localStorage.setItem('nimart-user-location', JSON.stringify(newLocation))
      
      updateFilteredProviders()
      
      alert(`📍 Location set to ${selectedLGAName ? selectedLGAName + ', ' : ''}${selectedStateName}`)
    }
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section with Minimalist Animated Circles */}
      <div className={`relative overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        
        {/* Simple Circle Animation - Clean and Creative */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          {/* Central floating circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/10 rounded-full animate-pulse-slow"></div>
          
          {/* Gentle floating circles */}
          <div className="absolute top-1/4 left-1/4 w-6 h-6 bg-green-500/30 rounded-full animate-float-simple animation-delay-100"></div>
          <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-primary/20 rounded-full animate-float-simple animation-delay-300"></div>
          <div className="absolute bottom-1/3 left-1/3 w-10 h-10 bg-green-600/25 rounded-full animate-float-simple animation-delay-500"></div>
          <div className="absolute top-2/3 right-1/3 w-7 h-7 bg-primary/15 rounded-full animate-float-simple animation-delay-700"></div>
          <div className="absolute bottom-1/4 right-1/4 w-5 h-5 bg-green-500/35 rounded-full animate-float-simple animation-delay-900"></div>
          
          {/* Small subtle dots */}
          <div className="absolute top-1/5 left-1/5 w-3 h-3 bg-primary/40 rounded-full animate-pulse-slow animation-delay-200"></div>
          <div className="absolute top-1/2 right-1/5 w-2 h-2 bg-green-600/50 rounded-full animate-pulse-slow animation-delay-400"></div>
          <div className="absolute bottom-1/5 left-2/5 w-3 h-3 bg-primary/30 rounded-full animate-pulse-slow animation-delay-600"></div>
          <div className="absolute bottom-2/5 right-2/5 w-2 h-2 bg-green-500/45 rounded-full animate-pulse-slow animation-delay-800"></div>
          
          {/* Orbiting accent circles */}
          <div className="absolute top-40 left-40 w-4 h-4 bg-primary/50 rounded-full animate-orbit-simple"></div>
          <div className="absolute top-32 right-32 w-3 h-3 bg-green-600/40 rounded-full animate-orbit-simple animation-delay-500"></div>
          <div className="absolute bottom-40 left-48 w-5 h-5 bg-primary/35 rounded-full animate-orbit-simple animation-delay-250"></div>
          <div className="absolute bottom-32 right-48 w-4 h-4 bg-green-500/45 rounded-full animate-orbit-simple animation-delay-750"></div>
        </div>

        <style jsx>{`
          @keyframes float-simple {
            0%, 100% { 
              transform: translate(0, 0); 
              opacity: 0.3;
            }
            33% { 
              transform: translate(10px, -15px); 
              opacity: 0.4;
            }
            66% { 
              transform: translate(-15px, 10px); 
              opacity: 0.35;
            }
          }
          
          @keyframes orbit-simple {
            0% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(20px, -10px) rotate(90deg); opacity: 0.5; }
            50% { transform: translate(10px, 20px) rotate(180deg); opacity: 0.3; }
            75% { transform: translate(-20px, 10px) rotate(270deg); opacity: 0.4; }
            100% { transform: translate(0, 0) rotate(360deg); opacity: 0.6; }
          }
          
          .animate-float-simple {
            animation: float-simple 15s ease-in-out infinite;
          }
          
          .animate-orbit-simple {
            animation: orbit-simple 12s linear infinite;
          }
          
          .animate-pulse-slow {
            animation: pulse-slow 4s ease-in-out infinite;
          }
        `}</style>

        <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight whitespace-nowrap overflow-hidden text-ellipsis px-2">
              <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Find Trusted </span>
              <span className="text-primary">Service Providers near you</span>
            </h1>
            <p className="mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Connect with verified professionals in your area
            </p>
          </div>

          <div className="max-w-3xl mx-auto px-2 sm:px-0">
            <form onSubmit={handleSearch} className="relative">
              <div className={`relative ${isDarkMode ? 'bg-gray-800/80 backdrop-blur-sm border-gray-700' : 'bg-white/80 backdrop-blur-sm border-gray-300'} rounded-xl sm:rounded-2xl border shadow-2xl p-1.5 sm:p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0`}>
                <div className="flex-1 flex items-center min-w-0">
                  <Search className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ml-3 sm:ml-5 mr-2 sm:mr-4`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="What service do you need? (mechanic, electrician, plumber, etc.)"
                    className={`flex-1 min-w-0 py-3 sm:py-4 text-sm sm:text-base md:text-lg border-0 focus:outline-none focus:ring-0 bg-transparent ${
                      isDarkMode 
                        ? 'text-white placeholder-gray-400' 
                        : 'text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto sm:ml-2 px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary to-green-600 text-white rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Location Detection Section */}
      <div className={`py-8 border-b ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Find services near you
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {userLocation.detected && userLocation.state 
                    ? `📍 Current location: ${userLocation.lga ? userLocation.lga + ', ' : ''}${userLocation.state}`
                    : 'Allow location access for accurate distance calculation.'}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                {/* Auto-detect button */}
                <button
                  onClick={detectUserLocation}
                  disabled={detectingLocation}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center transition-colors ${detectingLocation
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-primary text-white'
                  }`}
                >
                  {detectingLocation ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Detecting...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Auto-detect
                    </>
                  )}
                </button>
                
                <div className="text-sm text-gray-500 text-center sm:hidden">or select manually</div>
                
                {/* State/LGA Selection */}
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value)
                      setSelectedLGA('')
                    }}
                    className={`px-3 py-2 rounded-lg border w-full ${isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedLGA}
                    onChange={(e) => setSelectedLGA(e.target.value)}
                    disabled={!selectedState}
                    className={`px-3 py-2 rounded-lg border w-full ${isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                    } ${!selectedState ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Select LGA</option>
                    {getLGAsForState(selectedState).map((lga) => (
                      <option key={lga.id} value={lga.id}>
                        {lga.name}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={handleLocationSelect}
                    disabled={!selectedState}
                    className={`px-4 py-2 rounded-lg font-medium ${isDarkMode 
                      ? 'bg-gray-700 text-white' 
                      : 'bg-gray-800 text-white'
                    } ${!selectedState ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Providers Section */}
      <section className={`py-12 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div className="hidden md:block">
              {/* Empty div for spacing - no text */}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              {/* View Toggle - Now on left */}
              <div className={`inline-flex rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} p-1`}>
                <button
                  onClick={() => setGridView('basic')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center ${
                    gridView === 'basic'
                      ? 'bg-primary text-white'
                      : isDarkMode 
                        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setGridView('detailed')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center ${
                    gridView === 'detailed'
                      ? 'bg-primary text-white'
                      : isDarkMode 
                        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              
              {/* Sorting Controls - Now on right with text buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setSortBy(option.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      sortBy === option.key
                        ? 'bg-primary text-white'
                        : isDarkMode 
                          ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Providers Grid */}
          {!onlineStatus ? (
            <div className="text-center py-12">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} mb-4`}>
                <WifiOff className={`h-8 w-8 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                No Internet Connection
              </h3>
              <p className={`mb-4 max-w-md mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Please check your internet connection and try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Retry Connection
              </button>
            </div>
          ) : (
            <div className={gridView === 'basic' 
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4" 
              : "grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6"
            }>
              {loadingProviders ? (
                Array.from({ length: gridView === 'basic' ? 10 : 4 }).map((_, i) => (
                  <div 
                    key={`skeleton-${i}`}
                    className={`rounded-lg overflow-hidden animate-pulse ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
                  >
                    <div className={`aspect-square ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                    <div className="p-3">
                      <div className={`h-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded mb-2 w-3/4`}></div>
                      <div className={`h-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded mb-2 w-1/2`}></div>
                      <div className={`h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded mb-2`}></div>
                      <div className={`h-8 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded w-full`}></div>
                    </div>
                  </div>
                ))
              ) : filteredProviders.length > 0 ? (
                filteredProviders.map((provider) => (
                  <ProviderCard 
                    key={provider.id}
                    provider={provider}
                    gridView={gridView}
                    isDarkMode={isDarkMode}
                    userState={userLocation.state}
                    userLGA={userLocation.lga}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} mb-4`}>
                    <Briefcase className={`h-8 w-8 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  </div>
                  <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    No Providers Found
                  </h3>
                  <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedState || selectedLGA 
                      ? 'No providers match your selected filters. Try changing your location or filters.'
                      : 'There are no service providers registered yet.'}
                  </p>
                  {selectedState || selectedLGA ? (
                    <button
                      onClick={() => {
                        setSelectedState('')
                        setSelectedLGA('')
                      }}
                      className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-green-700 font-semibold"
                    >
                      <Filter className="h-5 w-5 mr-2" />
                      Clear Filters
                    </button>
                  ) : (
                    <Link
                      href="/provider/register"
                      className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-green-700 font-semibold"
                    >
                      <Briefcase className="h-5 w-5 mr-2" />
                      Become a Provider
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {filteredProviders.length > 0 && (
            <div className="text-center mt-8">
              <Link
                href="/marketplace"
                className="inline-flex items-center px-6 py-3 border-2 border-primary text-primary hover:bg-green-50 dark:hover:bg-green-900/10 rounded-lg font-semibold transition-colors"
              >
                View All Providers
                <ChevronRight className="h-5 w-5 ml-2" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Service Categories - SECOND SECTION */}
      <section className={`py-12 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Browse by Category
            </h2>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              {serviceCategories.length} professional services available
            </p>
          </div>

          {loadingCategories ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div 
                  key={`skeleton-category-${i}`} 
                  className={`p-4 rounded-xl animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} mr-3`}>
                      <div className="h-5 w-5"></div>
                    </div>
                    <div className="flex-1">
                      <div className={`h-4 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded mb-2 w-3/4`}></div>
                      <div className={`h-3 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded w-1/2`}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : serviceCategories.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {serviceCategories.slice(0, categoriesVisible).map((category, index) => (
                  <Link
                    key={category.id}
                    href={`/marketplace?service=${encodeURIComponent(category.name)}`}
                    className={`group p-4 rounded-xl transition-all duration-300 hover:-translate-y-1 ${
                      isDarkMode 
                        ? `${category.darkColor} border border-gray-700 hover:border-primary/50` 
                        : `${category.color} border border-gray-200 hover:border-primary`
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-900/30' : 'bg-white/50'} mr-3`}>
                        <div className={isDarkMode ? category.darkColor?.split(' ')[0] : category.color?.split(' ')[0]}>
                          {getIconComponent(category.icon)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold mb-1 truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {category.name}
                        </h3>
                        <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} title={category.description || ''}>
                          {category.description || 'Professional services'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {serviceCategories.length > 8 && (
                <div className="text-center mt-8">
                  {categoriesVisible < serviceCategories.length ? (
                    <button
                      onClick={handleShowMoreCategories}
                      className="inline-flex items-center px-6 py-3 border-2 border-primary text-primary hover:bg-green-50 dark:hover:bg-green-900/10 rounded-lg font-semibold transition-colors"
                    >
                      <ChevronDown className="h-5 w-5 mr-2" />
                      Show More Categories ({categoriesVisible}/{serviceCategories.length})
                    </button>
                  ) : (
                    <button
                      onClick={handleShowLessCategories}
                      className="inline-flex items-center px-6 py-3 border-2 border-primary text-primary hover:bg-green-50 dark:hover:bg-green-900/10 rounded-lg font-semibold transition-colors"
                    >
                      <ChevronDown className="h-5 w-5 mr-2 rotate-180" />
                      Show Less Categories
                    </button>
                  )}
                  
                  <p className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Showing {categoriesVisible} of {serviceCategories.length} categories
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} mb-4`}>
                <Briefcase className={`h-8 w-8 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                No Categories Found
              </h3>
              <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Service categories will appear here once added.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-12 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 to-primary/20' : 'bg-gradient-to-br from-primary to-green-600'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Are You a Service Provider?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Join Nigeria's fastest-growing service marketplace with {serviceCategories.length} service categories
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/provider/register"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary rounded-lg hover:bg-gray-100 font-bold text-base transition-colors"
              >
                <Briefcase className="h-5 w-5 mr-2" />
                Register as Provider
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white/10 font-bold text-base transition-colors"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 text-gray-800 pt-12 sm:pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12">
            <div className="col-span-2 md:col-span-1">
              <div className="relative h-12 w-32 mb-4 sm:mb-6">
                <Image
                  src="/logo.png"
                  alt="Nimart Logo"
                  fill
                  className="object-contain"
                  sizes="160px"
                />
              </div>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Nigeria's premier service marketplace connecting customers with trusted professionals.
              </p>
              
              <div className="space-y-3 mb-6">
                <a 
                  href="mailto:info@nimart.ng" 
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary transition-colors group"
                >
                  <Mail className="h-4 w-4 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
                  <span className="text-sm break-all">info@nimart.ng</span>
                </a>
                <a 
                  href="tel:+2348038887589" 
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary transition-colors group"
                >
                  <Phone className="h-4 w-4 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
                  <span className="text-sm">+234 803 888 7589</span>
                </a>
              </div>

              <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                <a
                  href="https://facebook.com/nimart"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-primary flex items-center justify-center transition-all duration-200 hover:scale-110 group shadow-sm"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 group-hover:text-white" />
                </a>
                <a
                  href="https://instagram.com/nimart"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-primary flex items-center justify-center transition-all duration-200 hover:scale-110 group shadow-sm"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 group-hover:text-white" />
                </a>
                <a
                  href="https://youtube.com/@nimart"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-primary flex items-center justify-center transition-all duration-200 hover:scale-110 group shadow-sm"
                  aria-label="YouTube"
                >
                  <Youtube className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 group-hover:text-white" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold mb-4 text-gray-900">For Customers</h3>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/marketplace" className="text-gray-600 hover:text-primary transition-colors text-sm sm:text-base">
                    Browse Services
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="text-gray-600 hover:text-primary transition-colors text-sm sm:text-base">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="text-gray-600 hover:text-primary transition-colors text-sm sm:text-base">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-600 hover:text-primary transition-colors text-sm sm:text-base">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold mb-4 text-gray-900">For Providers</h3>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/provider/register" className="text-gray-600 hover:text-primary transition-colors text-sm sm:text-base">
                    Become a Provider
                  </Link>
                </li>
                <li>
                  <Link href="/provider/benefits" className="text-gray-600 hover:text-primary transition-colors text-sm sm:text-base">
                    Provider Benefits
                  </Link>
                </li>
                <li>
                  <Link href="/provider/support" className="text-gray-600 hover:text-primary transition-colors text-sm sm:text-base">
                    Provider Support
                  </Link>
                </li>
                <li>
                  <Link href="/provider/terms" className="text-gray-600 hover:text-primary transition-colors text-sm sm:text-base">
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-1">
              <h3 className="text-base sm:text-lg font-bold mb-4 text-gray-900">Company</h3>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/about" className="text-gray-600 hover:text-primary transition-colors text-sm sm:text-base">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-gray-600 hover:text-primary transition-colors text-sm sm:text-base">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-gray-600 hover:text-primary transition-colors text-sm sm:text-base">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-600 hover:text-primary transition-colors text-sm sm:text-base">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-300 mt-8 sm:mt-12 pt-6 sm:pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-gray-600 text-sm text-center sm:text-left">
                © {new Date().getFullYear()} Nimart. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
                <Link href="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
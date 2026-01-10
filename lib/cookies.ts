// lib/cookies.ts
export function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  userType: string,
  providerId?: string
) {
  const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000) // 7 days
  
  // Set Supabase cookies for middleware
  document.cookie = `sb-access-token=${accessToken}; path=/; expires=${expiresAt.toUTCString()}; samesite=lax`
  document.cookie = `sb-refresh-token=${refreshToken}; path=/; expires=${expiresAt.toUTCString()}; samesite=lax`
  
  // Set user type cookie
  document.cookie = `user-type=${userType}; path=/; expires=${expiresAt.toUTCString()}; samesite=lax`
  
  if (userType === 'provider' && providerId) {
    document.cookie = `provider-id=${providerId}; path=/; expires=${expiresAt.toUTCString()}; samesite=lax`
  }
  
  console.log('🍪 Cookies set for middleware:', { userType, providerId })
}

export function clearAuthCookies() {
  const pastDate = new Date(0).toUTCString()
  const cookies = [
    'sb-access-token',
    'sb-refresh-token',
    'user-type',
    'provider-id',
    'nimart-auth-token'
  ]
  
  cookies.forEach(cookieName => {
    document.cookie = `${cookieName}=; path=/; expires=${pastDate}; samesite=lax`
    console.log(`✅ Cleared cookie: ${cookieName}`)
  })
}

export function getAuthCookies() {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {} as Record<string, string>)
  
  return {
    userType: cookies['user-type'] || 'customer',
    providerId: cookies['provider-id'],
    hasSupabaseToken: !!(cookies['sb-access-token'] && cookies['sb-refresh-token'])
  }
}
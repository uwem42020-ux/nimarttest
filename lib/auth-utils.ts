// lib/auth-utils.ts - Helper functions for authentication
import { cookies } from 'next/headers'

export async function checkAuth() {
  const cookieStore = cookies()
  const isAuthenticated = cookieStore.get('is-authenticated')?.value === 'true'
  const userType = cookieStore.get('user-type')?.value
  
  return {
    isAuthenticated,
    userType: userType as 'customer' | 'provider' | null,
    hasAuth: isAuthenticated && userType
  }
}

export async function requireAuth(userType?: 'customer' | 'provider') {
  const { isAuthenticated, userType: currentUserType } = await checkAuth()
  
  if (!isAuthenticated) {
    throw new Error('Authentication required')
  }
  
  if (userType && currentUserType !== userType) {
    throw new Error(`Access denied. Required role: ${userType}`)
  }
  
  return { isAuthenticated: true, userType: currentUserType }
}

export async function getCurrentUser() {
  const cookieStore = cookies()
  const userId = cookieStore.get('user-id')?.value
  const userEmail = cookieStore.get('user-email')?.value
  const userName = cookieStore.get('user-name')?.value
  
  return {
    id: userId,
    email: userEmail,
    name: userName,
    type: cookieStore.get('user-type')?.value as 'customer' | 'provider' | undefined
  }
}
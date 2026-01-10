// middleware.ts - SIMPLIFIED & SAFE VERSION
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Allow static files
  const isStaticRoute = pathname.startsWith('/_next') || 
                       pathname.startsWith('/_vercel') ||
                       pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/i)

  if (isStaticRoute) {
    return response
  }

  // PUBLIC ROUTES - No authentication required
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/auth/reset-password',
    '/verify',
    '/auth/callback',
    '/marketplace',
    '/provider/register',
    '/provider/benefits',
    '/provider/terms',
    '/provider/how-it-works',
    '/providers/[id]',
    '/services/[id]',
    '/about',
    '/contact',
    '/help',
    '/privacy',
    '/terms',
    '/sitemap.xml',
    '/robots.txt',
    '/api/sitemap',
    '/api/health',
    '/api/providers',
    '/api/services',
    '/manifest.json',
  ]

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => {
    // Dynamic route patterns
    if (route === '/providers/[id]' && pathname.match(/^\/providers\/[^\/]+$/)) {
      return true
    }
    if (route === '/services/[id]' && pathname.match(/^\/services\/[^\/]+$/)) {
      return true
    }
    if (pathname === route) return true
    if (pathname.startsWith(route + '/')) return true
    return false
  })

  // Allow public API routes
  const isPublicApiRoute = pathname === '/api/sitemap' || 
                          pathname === '/api/health' ||
                          pathname === '/api/providers' ||
                          pathname === '/api/services'

  if (isPublicRoute || isPublicApiRoute) {
    return response
  }

  // For development/testing: Temporarily allow all authenticated routes
  // Remove this in production
  const isAuthenticated = request.cookies.get('is-authenticated')?.value === 'true'
  
  if (!isAuthenticated) {
    console.log(`🔒 Middleware: Redirecting to login from: ${pathname}`)
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', encodeURIComponent(pathname))
    return NextResponse.redirect(loginUrl)
  }

  // For now, allow all authenticated users to access all routes
  // You can add role-based restrictions back later once cookies are working
  console.log(`✅ Middleware: Allowed access to ${pathname}`)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. _next/static (static files)
     * 2. _next/image (image optimization files)
     * 3. favicon.ico, sitemap.xml, robots.txt
     * 4. Public files with extensions (images, fonts, etc.)
     * 5. api/sitemap and api/health (public APIs)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*\\.(?:ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot|json)$).*)',
  ],
}
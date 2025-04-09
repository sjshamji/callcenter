import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory store for rate limiting
const rateLimit = new Map<string, { count: number; timestamp: number }>()

// Rate limit settings
const RATE_LIMIT = 100 // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(self), geolocation=(), interest-cohort=()'
  )
  
  // Only apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const ip = request.ip ?? 'anonymous'
    const now = Date.now()
    const windowStart = now - RATE_LIMIT_WINDOW
    
    // Clean up old entries
    for (const [key, value] of rateLimit.entries()) {
      if (value.timestamp < windowStart) {
        rateLimit.delete(key)
      }
    }
    
    // Get existing rate limit data
    const rateData = rateLimit.get(ip) ?? { count: 0, timestamp: now }
    
    // Reset count if outside window
    if (rateData.timestamp < windowStart) {
      rateData.count = 0
      rateData.timestamp = now
    }
    
    // Increment count
    rateData.count++
    rateLimit.set(ip, rateData)
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT.toString())
    response.headers.set('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT - rateData.count).toString())
    response.headers.set('X-RateLimit-Reset', (windowStart + RATE_LIMIT_WINDOW).toString())
    
    // Return 429 if rate limit exceeded
    if (rateData.count > RATE_LIMIT) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: Math.ceil((windowStart + RATE_LIMIT_WINDOW - now) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((windowStart + RATE_LIMIT_WINDOW - now) / 1000).toString()
          }
        }
      )
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 
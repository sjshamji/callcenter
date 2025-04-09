import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { APIError, handleAPIError, ErrorCodes } from '@/lib/errors'

// Log environment variable status in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('📞 CALLS API INITIALIZED:')
  console.log('- Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set ✅' : 'Missing ❌')
  console.log('- Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set ✅' : 'Missing ❌')
}

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
)

export async function GET(req: NextRequest) {
  console.log('📥 Calls API - Received GET request')
  
  try {
    // Get query parameters for pagination
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    
    console.log(`📊 Query params: limit=${limit}, offset=${offset}`)
    
    // Validate limit and offset
    if (isNaN(limit) || limit < 1 || limit > 100) {
      console.error('❌ Calls API - Invalid limit parameter:', limit)
      throw new APIError('Invalid limit parameter (must be between 1-100)', 400, ErrorCodes.BAD_REQUEST)
    }
    
    if (isNaN(offset) || offset < 0) {
      console.error('❌ Calls API - Invalid offset parameter:', offset)
      throw new APIError('Invalid offset parameter (must be >= 0)', 400, ErrorCodes.BAD_REQUEST)
    }
    
    // Check if Supabase is properly configured
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      console.error('❌ Calls API - Missing Supabase credentials')
      throw new APIError('Database configuration error', 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }
    
    console.log('🔄 Querying Supabase for calls...')
    
    // Query Supabase for calls
    const { data, error, count } = await supabase
      .from('calls')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('❌ Supabase error:', error)
      throw new APIError(`Failed to retrieve calls: ${error.message}`, 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }
    
    // Success
    console.log(`✅ Retrieved ${data?.length || 0} calls (total: ${count || 0})`)
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('❌ Error fetching calls:', error)
    const { error: message, code, status } = handleAPIError(error)
    return NextResponse.json({ error: message, code }, { status })
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { APIError, handleAPIError, ErrorCodes } from '@/lib/errors'

// Initialize Supabase client
const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
)

/**
 * GET - Fetch call history for a specific farmer
 */
export async function GET(req: NextRequest) {
  console.log('📥 History API - Received GET request')
  
  try {
    // Check if Supabase is properly configured
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      console.error('❌ History API - Missing Supabase credentials')
      throw new APIError('Database configuration error', 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }
    
    // Parse URL parameters
    const url = new URL(req.url)
    const farmerId = url.searchParams.get('farmer_id')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    
    if (!farmerId) {
      throw new APIError('Missing farmer_id parameter', 400, ErrorCodes.BAD_REQUEST)
    }
    
    console.log(`🔍 Fetching call history for Farmer ID: ${farmerId}, Limit: ${limit}`)
    
    // Query calls for specific farmer
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('Farmer ID', farmerId)
      .order('timestamp', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('❌ Supabase error fetching calls:', error)
      throw new APIError(`Database error: ${error.message}`, 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }
    
    console.log(`✅ Retrieved ${data?.length || 0} calls for farmer ${farmerId}`)
    return NextResponse.json({ calls: data || [] })
    
  } catch (error) {
    console.error('❌ Error in history API GET:', error)
    const { error: message, code, status } = handleAPIError(error)
    return NextResponse.json({ error: message, code }, { status })
  }
} 
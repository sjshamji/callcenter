import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { APIError, handleAPIError, ErrorCodes } from '@/lib/errors'

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
)

export async function GET() {
  try {
    // Fetch all call records from Supabase
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .order('timestamp', { ascending: false })
    
    if (error) {
      throw new APIError('Failed to fetch from database', 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching calls:', error)
    const { error: message, code, status } = handleAPIError(error)
    return NextResponse.json({ error: message, code }, { status })
  }
} 
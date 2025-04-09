import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { APIError, handleAPIError, ErrorCodes } from '@/lib/errors'

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
)

export async function POST(req: NextRequest) {
  try {
    const { transcript, summary, categories, sentiment } = await req.json()
    
    if (!transcript || !summary || !categories || sentiment === undefined) {
      throw new APIError('Missing required fields', 400, ErrorCodes.BAD_REQUEST)
    }
    
    // Insert call record into Supabase
    const { data, error } = await supabase
      .from('calls')
      .insert([
        {
          transcript,
          summary,
          categories,
          sentiment,
          timestamp: new Date().toISOString()
        }
      ])
      .select()
    
    if (error) {
      throw new APIError('Failed to save to database', 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }
    
    return NextResponse.json({ success: true, call: data?.[0] })
  } catch (error) {
    console.error('Error saving call data:', error)
    const { error: message, code, status } = handleAPIError(error)
    return NextResponse.json({ error: message, code }, { status })
  }
} 
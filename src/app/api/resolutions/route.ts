import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { APIError, handleAPIError, ErrorCodes } from '@/lib/errors'

// Initialize Supabase client
const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
)

// GET - Retrieve resolutions
export async function GET(req: NextRequest) {
  console.log('📥 Resolutions API - Received GET request')
  
  try {
    // Get query parameters for pagination and filtering
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const callId = url.searchParams.get('call_id')
    
    // Check if Supabase is properly configured
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      console.error('❌ Resolutions API - Missing Supabase credentials')
      throw new APIError('Database configuration error', 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }
    
    // Query builder
    let query = supabase
      .from('resolutions')
      .select('*')
      .order('date_resolved', { ascending: false })
    
    // Apply call_id filter if provided
    if (callId) {
      query = query.eq('call_id', callId)
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1)
    
    // Execute query
    const { data, error } = await query
    
    if (error) {
      console.error('❌ Supabase error:', error)
      throw new APIError(`Failed to retrieve resolutions: ${error.message}`, 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }
    
    // Success
    console.log(`✅ Retrieved ${data?.length || 0} resolutions`)
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('❌ Error fetching resolutions:', error)
    const { error: message, code, status } = handleAPIError(error)
    return NextResponse.json({ error: message, code }, { status })
  }
}

// POST - Create a new resolution and update call status
export async function POST(req: NextRequest) {
  console.log('📥 Resolutions API - Received POST request')
  
  try {
    // Parse request body
    const body = await req.json()
    
    // Validate required fields
    if (!body.call_id) {
      throw new APIError('Missing required field: call_id', 400, ErrorCodes.BAD_REQUEST)
    }
    
    if (!body.date_resolved) {
      body.date_resolved = new Date().toISOString()
    }
    
    if (!body.resolved_by) {
      throw new APIError('Missing required field: resolved_by', 400, ErrorCodes.BAD_REQUEST)
    }
    
    if (!body.issue_resolved) {
      throw new APIError('Missing required field: issue_resolved', 400, ErrorCodes.BAD_REQUEST)
    }
    
    // Check if Supabase is properly configured
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      console.error('❌ Resolutions API - Missing Supabase credentials')
      throw new APIError('Database configuration error', 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }
    
    // Start a transaction using supabase
    
    // 1. Insert new resolution
    const { data: resolution, error: resolutionError } = await supabase
      .from('resolutions')
      .insert({
        call_id: body.call_id,
        date_resolved: body.date_resolved,
        resolved_by: body.resolved_by,
        issue_resolved: body.issue_resolved,
        farmer_confirmation: body.farmer_confirmation || false,
        notes: body.notes || null
      })
      .select()
      .single()
    
    if (resolutionError) {
      console.error('❌ Supabase error creating resolution:', resolutionError)
      throw new APIError(`Failed to create resolution: ${resolutionError.message}`, 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }
    
    // 2. Update the call's resolved status
    const { error: updateError } = await supabase
      .from('calls')
      .update({ resolved: true })
      .eq('id', body.call_id)
    
    if (updateError) {
      console.error('❌ Supabase error updating call:', updateError)
      throw new APIError(`Failed to update call status: ${updateError.message}`, 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }
    
    // Success
    console.log(`✅ Created resolution and updated call status for call ID: ${body.call_id}`)
    return NextResponse.json({ 
      success: true, 
      message: 'Resolution created and call status updated',
      data: resolution
    })
  } catch (error) {
    console.error('❌ Error creating resolution:', error)
    const { error: message, code, status } = handleAPIError(error)
    return NextResponse.json({ error: message, code }, { status })
  }
} 
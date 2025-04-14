import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { APIError, handleAPIError, ErrorCodes } from '@/lib/errors'
import { FarmingCategory, FARMING_CATEGORIES } from "@/lib/constants"

// Log environment variable status in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('💾 SAVE API INITIALIZED:')
  console.log('- Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set ✅' : 'Missing ❌')
  console.log('- Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set ✅' : 'Missing ❌')
}

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
)

export async function POST(req: NextRequest) {
  console.log('📥 Save API - Received POST request')
  
  try {
    // Check if Supabase is properly configured
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      console.error('❌ Save API - Missing Supabase credentials')
      throw new APIError('Database configuration error', 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }
    
    const body = await req.json()
    const { transcript, summary, categories, sentiment } = body
    
    console.log('📄 Request body:', JSON.stringify(body, null, 2))
    
    if (!transcript || !summary || !categories || sentiment === undefined) {
      console.error('❌ Save API - Missing required fields')
      throw new APIError('Missing required fields', 400, ErrorCodes.BAD_REQUEST)
    }

    // Validate sentiment range
    if (sentiment < -1 || sentiment > 1) {
      console.error('❌ Save API - Invalid sentiment value:', sentiment)
      throw new APIError('Sentiment must be between -1 and 1', 400, ErrorCodes.BAD_REQUEST)
    }

    // Validate categories
    const invalidCategories = categories.filter((cat: string) => !FARMING_CATEGORIES.includes(cat as FarmingCategory))
    if (invalidCategories.length > 0) {
      console.error('❌ Save API - Invalid categories:', invalidCategories)
      throw new APIError(`Invalid categories: ${invalidCategories.join(', ')}`, 400, ErrorCodes.BAD_REQUEST)
    }
    
    console.log('🔄 Inserting data into Supabase...')
    
    try {
      // Check if Supabase table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('calls')
        .select('count')
        .limit(1)
      
      if (tableError) {
        console.error('❌ Supabase table check error:', tableError)
        
        // Create the table if it doesn't exist
        if (tableError.message.includes('does not exist')) {
          console.log('⚠️ Table does not exist. Attempting to create it...')
          
          // Note: This approach may not work in all Supabase setups, as it could require admin privileges
          // This is more of a fallback for development setups
          throw new APIError('Database table "calls" does not exist. Please create it first.', 500, ErrorCodes.SERVICE_UNAVAILABLE)
        } else {
          throw new APIError(`Database error: ${tableError.message}`, 500, ErrorCodes.SERVICE_UNAVAILABLE)
        }
      }
      
      console.log('✅ Database connection and table verified')
      
      // Extract farmer needs data
      const {
        needs_fertilizer = false,
        needs_seed_cane = false,
        needs_harvesting = false,
        needs_ploughing = false,
        has_crop_issues = false,
        needs_pesticide = false,
        resolved = false,
        follow_up_required = false,
        priority = 1,
        farmer_id = null
      } = body;
      
      console.log(`${farmer_id ? '👨‍🌾 Farmer ID:' + farmer_id : '⚠️ No Farmer ID provided'}`)
      
      // Insert call record into Supabase
      const { data, error } = await supabase
        .from('calls')
        .insert([
          {
            transcript,
            summary,
            categories: typeof categories === 'string' ? categories : JSON.stringify(categories),
            sentiment,
            timestamp: new Date().toISOString(),
            needs_fertilizer,
            needs_seed_cane,
            needs_harvesting,
            needs_ploughing,
            has_crop_issues,
            needs_pesticide,
            resolved,
            follow_up_required,
            priority,
            "Farmer ID": farmer_id // Link to farmer table
          }
        ])
        .select()
      
      if (error) {
        console.error('❌ Supabase error:', error)
        throw new APIError(`Failed to save to database: ${error.message}`, 500, ErrorCodes.SERVICE_UNAVAILABLE)
      }
      
      console.log('✅ Call data saved successfully:', data?.[0]?.id)
      return NextResponse.json({ success: true, call: data?.[0] })
    } catch (dbError) {
      console.error('❌ Database operation error:', dbError)
      throw dbError; // Re-throw to be caught by the outer catch block
    }
  } catch (error) {
    console.error('❌ Error saving call data:', error)
    const { error: message, code, status } = handleAPIError(error)
    return NextResponse.json({ error: message, code }, { status })
  }
} 
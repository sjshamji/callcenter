import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { APIError, handleAPIError, ErrorCodes } from '@/lib/errors'

// Log environment variable status in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('👨‍🌾 FARMERS API INITIALIZED:')
  console.log('- Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set ✅' : 'Missing ❌')
  console.log('- Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set ✅' : 'Missing ❌')
}

// Initialize Supabase client
const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
)

/**
 * GET - Handle farmer lookup by ID or name search
 */
export async function GET(req: NextRequest) {
  console.log('📥 Farmers API - Received GET request')
  
  try {
    // Check if Supabase is properly configured
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      console.error('❌ Farmers API - Missing Supabase credentials')
      throw new APIError('Database configuration error', 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }
    
    // Parse URL parameters
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    const name = url.searchParams.get('name')
    const listAll = url.searchParams.get('list_all')
    const seed = url.searchParams.get('seed')
    const updateResource = url.searchParams.get('update_resource')
    const farmerId = url.searchParams.get('farmer_id')
    const resource = url.searchParams.get('resource')
    
    if (updateResource && farmerId && resource) {
      // Update a specific resource timestamp for a farmer
      console.log(`🔄 Updating resource ${resource} timestamp for farmer ${farmerId}`)
      
      const resourceField = getResourceField(resource)
      if (!resourceField) {
        throw new APIError(`Invalid resource type: ${resource}`, 400, ErrorCodes.BAD_REQUEST)
      }
      
      const { error } = await supabase
        .from('farmers')
        .update({ [resourceField]: new Date().toISOString() })
        .eq('Farmer ID', farmerId)
      
      if (error) {
        console.error('❌ Supabase error updating resource timestamp:', error)
        throw new APIError(`Database error: ${error.message}`, 500, ErrorCodes.SERVICE_UNAVAILABLE)
      }
      
      console.log(`✅ Updated ${resource} timestamp for farmer ${farmerId}`)
      return NextResponse.json({ success: true, message: `Updated ${resource} timestamp for farmer ${farmerId}` })
    } else if (seed) {
      // Seed test farmers data
      console.log('🌱 Seeding test farmers data')
      
      // Sample farmer data
      const farmers = [
        { 
          'Farmer ID': 'KF001', 
          'Farmer Name': 'John Mwangi', 
          'Location': 'Kisumu',
          'Farm Size (Acres)': 1.2,
          'Preferred Language': 'English',
          'Age': 45,
          'Gender': 'Male',
          'GPS Coordinates': '(-0.092, 34.769)',
          'Last Fertilizer': getTwoMonthsAgo(),
          'Last Seed Cane': getSevenMonthsAgo(),
          'Last Pesticide': getFiveMonthsAgo(),
          'Last Ploughing': getTwelveMonthsAgo(),
          'Last Harvesting': getEighteenMonthsAgo()
        },
        { 
          'Farmer ID': 'KF002', 
          'Farmer Name': 'Mary Wanjiku', 
          'Location': 'Homa Bay',
          'Farm Size (Acres)': 1.5,
          'Preferred Language': 'Kiswahili',
          'Age': 38,
          'Gender': 'Female',
          'GPS Coordinates': '(-0.523, 34.457)',
          'Last Fertilizer': getEightMonthsAgo(),
          'Last Seed Cane': getFiveMonthsAgo(), 
          'Last Pesticide': getTwoMonthsAgo(),
          'Last Ploughing': getSixMonthsAgo(),
          'Last Harvesting': getTwelveMonthsAgo()
        },
        { 
          'Farmer ID': 'KF014', 
          'Farmer Name': 'Samuel Odhiambo', 
          'Location': 'Siaya',
          'Farm Size (Acres)': 2.3,
          'Preferred Language': 'English',
          'Age': 52,
          'Gender': 'Male',
          'GPS Coordinates': '(-0.178, 34.289)',
          'Last Fertilizer': getFiveMonthsAgo(),
          'Last Seed Cane': getOneMonthAgo(),
          'Last Pesticide': getSevenMonthsAgo(),
          'Last Ploughing': getEighteenMonthsAgo(),
          'Last Harvesting': getSeventeenMonthsAgo()
        },
      ]
      
      // Insert each farmer
      for (const farmer of farmers) {
        const { error } = await supabase
          .from('farmers')
          .upsert(farmer, { onConflict: 'Farmer ID' })
          
        if (error) {
          console.error(`❌ Error seeding farmer ${farmer['Farmer ID']}:`, error)
          throw new APIError(`Failed to seed farmer: ${error.message}`, 500, ErrorCodes.SERVICE_UNAVAILABLE)
        }
      }
      
      console.log('✅ Successfully seeded test farmers data')
      return NextResponse.json({ success: true, message: 'Seeded test farmers data' })
    } else if (listAll) {
      // List all farmers (for debugging)
      console.log('🔍 Listing all farmers')
      
      const { data, error } = await supabase
        .from('farmers')
        .select('*')
        .limit(50)
      
      if (error) {
        console.error('❌ Supabase error listing farmers:', error)
        throw new APIError(`Database error: ${error.message}`, 500, ErrorCodes.SERVICE_UNAVAILABLE)
      }
      
      console.log(`✅ Found ${data.length} farmers in database`)
      return NextResponse.json({ farmers: data })
    } else if (id) {
      // Lookup farmer by ID
      console.log(`🔍 Looking up farmer with ID: ${id}`)
      
      const { data, error } = await supabase
        .from('farmers')
        .select('*')
        .eq('Farmer ID', id)
        .single()
      
      if (error) {
        console.error('❌ Supabase error fetching farmer by ID:', error)
        if (error.code === 'PGRST116') {
          // No rows returned
          return NextResponse.json({ farmer: null })
        }
        throw new APIError(`Database error: ${error.message}`, 500, ErrorCodes.SERVICE_UNAVAILABLE)
      }
      
      console.log('✅ Farmer found:', data ? data["Farmer ID"] : 'null')
      return NextResponse.json({ farmer: data })
      
    } else if (name) {
      // Search farmers by name
      console.log(`🔍 Searching farmers with name: ${name}`)
      
      const { data, error } = await supabase
        .from('farmers')
        .select('*')
        .ilike('Farmer Name', `%${name}%`)
        .limit(5)
      
      if (error) {
        console.error('❌ Supabase error searching farmers by name:', error)
        throw new APIError(`Database error: ${error.message}`, 500, ErrorCodes.SERVICE_UNAVAILABLE)
      }
      
      console.log(`✅ Found ${data.length} farmers matching "${name}"`)
      return NextResponse.json({ farmers: data })
      
    } else {
      // No search parameters provided
      throw new APIError('Missing search parameters (id, name, list_all, seed, or update_resource required)', 400, ErrorCodes.BAD_REQUEST)
    }
    
  } catch (error) {
    console.error('❌ Error in farmers API GET:', error)
    const { error: message, code, status } = handleAPIError(error)
    return NextResponse.json({ error: message, code }, { status })
  }
}

/**
 * POST - Create a new farmer
 */
export async function POST(req: NextRequest) {
  console.log('📥 Farmers API - Received POST request')
  
  try {
    // Check if Supabase is properly configured
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      console.error('❌ Farmers API - Missing Supabase credentials')
      throw new APIError('Database configuration error', 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }
    
    // Parse request body
    const body = await req.json()
    const { 
      name,
      farmSize = 0.5,
      preferredLanguage = 'English',
      age = 35,
      gender = 'Unknown',
      location = 'Kisumu',
      gpsCoordinates = '(-0.09, 34.76)'
    } = body
    
    if (!name) {
      throw new APIError('Name is required', 400, ErrorCodes.BAD_REQUEST)
    }
    
    // Get the highest farmer ID currently in the system
    const { data: existingFarmers, error: queryError } = await supabase
      .from('farmers')
      .select('Farmer ID')
      .order('Farmer ID', { ascending: false })
      .limit(1)
    
    if (queryError) {
      console.error('❌ Supabase error querying highest farmer ID:', queryError)
      throw new APIError(`Database error: ${queryError.message}`, 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }
    
    // Generate new farmer ID (KF001, KF002, etc.)
    let newId = 'KF001'
    
    if (existingFarmers && existingFarmers.length > 0) {
      const lastId = existingFarmers[0]['Farmer ID' as keyof typeof existingFarmers[0]] as string
      const numPart = parseInt(lastId.substring(2), 10)
      newId = `KF${String(numPart + 1).padStart(3, '0')}`
    }
    
    console.log(`🆕 Creating new farmer with ID: ${newId}, Name: ${name}`)
    
    // Current date for default "never received" timestamps (1 year ago)
    const defaultTimestamp = new Date();
    defaultTimestamp.setFullYear(defaultTimestamp.getFullYear() - 1);
    const neverReceivedDate = defaultTimestamp.toISOString();
    
    // Insert new farmer
    const { data, error } = await supabase
      .from('farmers')
      .insert([
        {
          'Farmer ID': newId,
          'Farmer Name': name,
          'Farm Size (Acres)': farmSize,
          'Preferred Language': preferredLanguage,
          'Age': age,
          'Gender': gender,
          'Location': location,
          'GPS Coordinates': gpsCoordinates,
          'Last Fertilizer': neverReceivedDate,
          'Last Seed Cane': neverReceivedDate,
          'Last Pesticide': neverReceivedDate,
          'Last Ploughing': neverReceivedDate,
          'Last Harvesting': neverReceivedDate,
          'Created At': new Date().toISOString()
        }
      ])
      .select()
    
    if (error) {
      console.error('❌ Supabase error creating farmer:', error)
      throw new APIError(`Failed to create farmer: ${error.message}`, 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }
    
    console.log('✅ Farmer created successfully:', newId)
    return NextResponse.json({ 
      success: true,
      farmerId: newId,
      farmer: data?.[0] || null
    })
    
  } catch (error) {
    console.error('❌ Error in farmers API POST:', error)
    const { error: message, code, status } = handleAPIError(error)
    return NextResponse.json({ error: message, code }, { status })
  }
}

// Helper functions to generate dates for seeding data
function getOneMonthAgo(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date.toISOString();
}

function getTwoMonthsAgo(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 2);
  return date.toISOString();
}

function getFiveMonthsAgo(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 5);
  return date.toISOString();
}

function getSixMonthsAgo(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 6);
  return date.toISOString();
}

function getSevenMonthsAgo(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 7);
  return date.toISOString();
}

function getEightMonthsAgo(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 8);
  return date.toISOString();
}

function getTwelveMonthsAgo(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 12);
  return date.toISOString();
}

function getSeventeenMonthsAgo(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 17);
  return date.toISOString();
}

function getEighteenMonthsAgo(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 18);
  return date.toISOString();
}

// Map resource type to database field
function getResourceField(resource: string): string | null {
  const resourceMap: Record<string, string> = {
    'fertilizer': 'Last Fertilizer',
    'seed_cane': 'Last Seed Cane',
    'pesticide': 'Last Pesticide',
    'ploughing': 'Last Ploughing',
    'harvesting': 'Last Harvesting'
  };
  
  return resourceMap[resource] || null;
} 
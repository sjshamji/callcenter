import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { APIError, handleAPIError, ErrorCodes } from '@/lib/errors'
import { env } from '@/lib/env'
import { FarmingCategory, FARMING_CATEGORIES } from "@/lib/constants"

// Log environment variable status in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('🧠 ANALYZE API INITIALIZED:')
  console.log('- OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Set ✅' : 'Missing ❌')
}

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY
})

// List of fertilizer-related keywords to improve detection
const FERTILIZER_KEYWORDS = [
  'fertilizer', 'fertilizers', 'fertilising', 'fertilizing', 'fertilise', 'fertilize',
  'nutrients', 'nutrient', 'npk', 'nitrogen', 'phosphorus', 'potassium',
  'manure', 'compost', 'feed', 'feeding', 'nourish', 'soil', 'growth', 'grow', 
  'organic matter', 'ammonia', 'urea', 'chemicals', 'chemical'
]

export async function POST(req: NextRequest) {
  console.log('📥 Analyze API - Received request')
  
  try {
    // Validate request body
    const body = await req.json()
    
    if (!body?.transcript || typeof body.transcript !== 'string') {
      console.error('❌ Analyze API - Missing or invalid transcript')
      throw new APIError('Transcript must be a non-empty string', 400, ErrorCodes.BAD_REQUEST)
    }

    if (body.transcript.length > 5000) {
      console.error('❌ Analyze API - Transcript too long:', body.transcript.length)
      throw new APIError('Transcript too long (max 5000 characters)', 400, ErrorCodes.BAD_REQUEST)
    }
    
    console.log(`📝 Processing transcript: "${body.transcript.substring(0, 100)}${body.transcript.length > 100 ? '...' : ''}"`)

    // Pre-check for fertilizer-related keywords
    const lowerTranscript = body.transcript.toLowerCase()
    const containsFertilizerKeywords = FERTILIZER_KEYWORDS.some(keyword => 
      lowerTranscript.includes(keyword)
    )
    
    if (containsFertilizerKeywords) {
      console.log('🔎 Detected potential fertilizer-related keywords in transcript')
    }

    // Use OpenAI to analyze the transcript
    console.log('🔄 Calling OpenAI API...')
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an agricultural support assistant for Angata Sugar Mills Limited, specializing in sugarcane farming.
          You will analyze the farmer's message and then respond directly to them in a warm, personalized, and empathetic manner.
          
          Your response must address the farmer directly in the first person, as if you are speaking with them. 
          Be empathetic, understanding, and use a conversational tone. Avoid third-person descriptions or analysis.
          
          Pay EXTRA CLOSE ATTENTION to any mention, even indirect, about soil quality, plant growth issues, or crop health,
          as these often indicate fertilizer needs. Even vague mentions of "plants not growing well" or "soil issues" should 
          flag needs_fertilizer as true.
          
          In addition to your direct response, analyze whether the farmer's message indicates they need any of the following:
          
          1. Fertilizer input - Mark TRUE for ANY mention of plants not growing properly, yellow leaves, soil quality issues, etc.
          2. Seed cane input
          3. Harvesting service
          4. Ploughing service
          5. Help with crop issues
          6. Pesticide input
          7. Help with extraneous issues (issues unrelated to farming)
          8. Help with invoicing issues
          
          Also determine:
          9. Relevant categories from this list: ${FARMING_CATEGORIES.join(', ')}
          10. A sentiment score from -1 (very negative) to +1 (very positive)
          
          Format your response as JSON:
          {
            "summary": "Your first-person response to the farmer (1-2 sentences)",
            "categories": ["category1", "category2"],
            "sentiment": number,
            "needs_fertilizer": boolean,
            "needs_seed_cane": boolean,
            "needs_harvesting": boolean,
            "needs_ploughing": boolean,
            "has_crop_issues": boolean,
            "needs_pesticide": boolean,
            "resolved": false,
            "follow_up_required": boolean,
            "priority": number (1-3, where 1 is low priority, 3 is high)
          }
          
          Example:
          Instead of "The farmer is concerned about pest infestation in their crops",
          write "I understand your concern about the pests affecting your crops. Let me help you find a solution."
          
          Set the boolean values to true only if the farmer explicitly mentions or implies a need for that specific item.
          ${containsFertilizerKeywords ? 'NOTE: The transcript contains keywords related to fertilizer needs. Be sure to analyze this carefully when setting the needs_fertilizer flag.' : ''}
          `
        },
        {
          role: 'user',
          content: body.transcript
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5
    })
    
    console.log('✅ OpenAI API response received')

    // Parse and validate the response
    const responseContent = completion.choices[0].message.content
    if (!responseContent) {
      console.error('❌ Analyze API - Empty response from OpenAI')
      throw new APIError('Failed to get analysis from OpenAI', 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }

    console.log(`🔤 Raw response: ${responseContent}`)
    
    try {
      const analysis = JSON.parse(responseContent)
      
      // Validate the analysis object
      if (!analysis.summary || !Array.isArray(analysis.categories) || typeof analysis.sentiment !== 'number') {
        console.error('❌ Analyze API - Invalid analysis format:', analysis)
        throw new APIError('Invalid analysis format received from OpenAI', 500, ErrorCodes.SERVICE_UNAVAILABLE)
      }

      if (analysis.sentiment < -1 || analysis.sentiment > 1) {
        console.error('❌ Analyze API - Invalid sentiment score:', analysis.sentiment)
        throw new APIError('Invalid sentiment score from OpenAI', 500, ErrorCodes.SERVICE_UNAVAILABLE)
      }

      // Validate categories
      const invalidCategories = analysis.categories.filter((cat: string) => !FARMING_CATEGORIES.includes(cat as FarmingCategory))
      if (invalidCategories.length > 0) {
        console.error('❌ Analyze API - Invalid categories:', invalidCategories)
        throw new APIError(`Invalid categories received from OpenAI: ${invalidCategories.join(', ')}`, 500, ErrorCodes.SERVICE_UNAVAILABLE)
      }
      
      // Set default values for any missing fields and ensure fertilizer detection
      const enhancedAnalysis = {
        summary: analysis.summary,
        categories: analysis.categories,
        sentiment: analysis.sentiment,
        needs_fertilizer: analysis.needs_fertilizer || containsFertilizerKeywords || false,
        needs_seed_cane: analysis.needs_seed_cane || false,
        needs_harvesting: analysis.needs_harvesting || false,
        needs_ploughing: analysis.needs_ploughing || false,
        has_crop_issues: analysis.has_crop_issues || false,
        needs_pesticide: analysis.needs_pesticide || false,
        resolved: false,
        follow_up_required: analysis.follow_up_required || false,
        priority: analysis.priority || 1
      }
      
      console.log('✅ Analysis successful:', enhancedAnalysis)
      return NextResponse.json(enhancedAnalysis)
    } catch (parseError) {
      console.error('❌ Analyze API - Failed to parse response:', parseError)
      throw new APIError('Failed to parse analysis from OpenAI', 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }
  } catch (error) {
    console.error('❌ Error analyzing transcript:', error)
    const { error: message, code, status } = handleAPIError(error)
    return NextResponse.json({ error: message, code }, { status })
  }
} 
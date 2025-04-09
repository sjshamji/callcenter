import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { APIError, handleAPIError, ErrorCodes } from '@/lib/errors'
import { env } from '@/lib/env'

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY
})

// Predefined categories for farming issues
const CATEGORIES = [
  "Pest Control",
  "Irrigation",
  "Fertilizer",
  "Harvesting",
  "Planting",
  "Equipment",
  "Weather",
  "Market Prices"
] as const

type Category = typeof CATEGORIES[number]

interface Analysis {
  summary: string
  categories: Category[]
  sentiment: number
}

export async function POST(req: NextRequest) {
  try {
    // Validate request body
    const body = await req.json()
    
    if (!body?.transcript || typeof body.transcript !== 'string') {
      throw new APIError('Transcript must be a non-empty string', 400, ErrorCodes.BAD_REQUEST)
    }

    if (body.transcript.length > 5000) {
      throw new APIError('Transcript too long (max 5000 characters)', 400, ErrorCodes.BAD_REQUEST)
    }

    // Use OpenAI to analyze the transcript
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an agricultural support assistant for Angata Sugar Mills Limited, specializing in sugarcane farming. 
          Analyze the farmer's message and provide:
          1. A brief summary (max 2 sentences)
          2. Relevant categories from this list: ${CATEGORIES.join(', ')}
          3. A sentiment score from -1 (very negative) to +1 (very positive)
          
          Format your response as JSON:
          {
            "summary": "string",
            "categories": ["string", "string"],
            "sentiment": number
          }`
        },
        {
          role: 'user',
          content: body.transcript
        }
      ],
      response_format: { type: 'json_object' }
    })
    
    // Parse and validate the response
    const responseContent = completion.choices[0].message.content
    if (!responseContent) {
      throw new APIError('Failed to get analysis from OpenAI', 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }

    const analysis = JSON.parse(responseContent) as Analysis
    
    // Validate the analysis object
    if (!analysis.summary || !Array.isArray(analysis.categories) || typeof analysis.sentiment !== 'number') {
      throw new APIError('Invalid analysis format received from OpenAI', 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }

    if (analysis.sentiment < -1 || analysis.sentiment > 1) {
      throw new APIError('Invalid sentiment score from OpenAI', 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }

    // Validate categories
    const invalidCategories = analysis.categories.filter(cat => !CATEGORIES.includes(cat as Category))
    if (invalidCategories.length > 0) {
      throw new APIError(`Invalid categories received from OpenAI: ${invalidCategories.join(', ')}`, 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }
    
    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing transcript:', error)
    const { error: message, code, status } = handleAPIError(error)
    return NextResponse.json({ error: message, code }, { status })
  }
} 
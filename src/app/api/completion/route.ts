import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'
import { handleAPIError, ErrorCodes } from '@/lib/errors'

// Log environment variable status in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('🧠 COMPLETION API INITIALIZED:')
  console.log('- Anthropic API Key:', process.env.ANTHROPIC_API_KEY ? 'Set ✅' : 'Missing ❌')
}

// Create Claude client
const claude = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY
})

// Define system prompt for the assistant
const SYSTEM_PROMPT = `You are a virtual call center assistant specializing in agriculture and farming issues.
Your goal is to provide helpful, accurate information to farmers calling with questions.
Be concise, respectful, and practical in your responses.
If you don't know something, be honest about it.
Always provide actionable advice when possible.

Respond in a conversational way, as if you are speaking directly to the caller.`

export async function POST(req: NextRequest) {
  console.log('📥 Completion API - Received request')
  
  try {
    // Parse request
    const body = await req.json()
    const { messages, category } = body
    
    // Validate request data
    if (!messages || !Array.isArray(messages)) {
      console.error('❌ Completion API - Invalid messages format')
      return NextResponse.json({ 
        error: 'Messages must be provided as an array',
        code: ErrorCodes.BAD_REQUEST
      }, { status: 400 })
    }
    
    if (messages.length === 0) {
      console.error('❌ Completion API - Empty messages array')
      return NextResponse.json({ 
        error: 'At least one message is required',
        code: ErrorCodes.BAD_REQUEST
      }, { status: 400 })
    }
    
    // Check API key
    if (!env.ANTHROPIC_API_KEY) {
      console.error('❌ Completion API - Anthropic API key missing')
      return NextResponse.json({ 
        error: 'Server configuration error (missing API key)',
        code: ErrorCodes.SERVICE_UNAVAILABLE
      }, { status: 500 })
    }
    
    // Prepare messages with category context if provided
    let enhancedSystemPrompt = SYSTEM_PROMPT
    if (category) {
      console.log(`🏷️ Using category: ${category}`)
      enhancedSystemPrompt += `\n\nThe caller has a question about ${category}.`
    }
    
    console.log('🤖 Calling Claude API...')
    console.log(`📨 Message count: ${messages.length}`)
    
    try {
      // Make Claude API call
      const response = await claude.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1000,
        system: enhancedSystemPrompt,
        messages: messages,
        temperature: 0.7,
      })
      
      console.log('✅ Claude API response received')
      
      // Extract and return the response content
      // Access the first content block which should be text type
      const content = response.content[0].type === 'text' ? response.content[0].text : 'No text response received'
      console.log(`🔤 Response (first 50 chars): "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`)
      
      return NextResponse.json({ 
        completion: content,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens
        }
      })
      
    } catch (claudeError: unknown) {
      // Handle Claude API-specific errors
      console.error('❌ Claude API Error:', claudeError)
      
      // Use type assertion since we know it's likely an Error object
      const errorMessage = claudeError instanceof Error ? claudeError.message : 'Unknown error'
      
      return NextResponse.json({ 
        error: `Claude API Error: ${errorMessage}`,
        code: 'CLAUDE_API_ERROR'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Error in completion API:', error)
    
    const { error: message, code, status } = handleAPIError(error)
    return NextResponse.json({ error: message, code }, { status })
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { env } from '@/lib/env'
import { APIError, handleAPIError, ErrorCodes } from '@/lib/errors'

// Log environment variable status in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('🎤 TRANSCRIBE API INITIALIZED:')
  console.log('- OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Set ✅' : 'Missing ❌')
}

// Create OpenAI client
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY
})

export async function POST(req: NextRequest) {
  console.log('📥 Transcribe API - Received request')
  
  try {
    // Parse form data from the request
    const formData = await req.formData()
    const audio = formData.get('audio') as File
    
    // Validate audio file
    if (!audio) {
      console.error('❌ Transcribe API - No audio file in request')
      return NextResponse.json({ 
        error: 'Audio file is required',
        code: ErrorCodes.BAD_REQUEST
      }, { status: 400 })
    }
    
    // Log audio file details for debugging
    console.log(`📊 Audio file details: type=${audio.type}, size=${audio.size} bytes`)
    
    // Check for empty file
    if (audio.size === 0) {
      console.error('❌ Transcribe API - Empty audio file')
      return NextResponse.json({ 
        error: 'Audio file is empty',
        code: ErrorCodes.BAD_REQUEST
      }, { status: 400 })
    }
    
    // Check file size limit
    if (audio.size > 25 * 1024 * 1024) {
      console.error('❌ Transcribe API - Audio file too large')
      return NextResponse.json({ 
        error: 'Audio file too large (max 25MB)',
        code: ErrorCodes.BAD_REQUEST
      }, { status: 400 })
    }
    
    // Check API key
    if (!env.OPENAI_API_KEY) {
      console.error('❌ Transcribe API - OpenAI API key missing')
      return NextResponse.json({ 
        error: 'Server configuration error (missing API key)',
        code: ErrorCodes.SERVICE_UNAVAILABLE
      }, { status: 500 })
    }
    
    console.log('🔄 Calling OpenAI Whisper API...')
    
    try {
      // Create a buffer from the file
      const buffer = Buffer.from(await audio.arrayBuffer())
      
      // Transcribe audio using Whisper API
      const transcription = await openai.audio.transcriptions.create({
        file: new File([buffer], 'audio.webm', { type: audio.type }),
        model: 'whisper-1',
        language: 'en',
      })
      
      console.log('✅ Transcription successful')
      console.log(`🔤 Result: "${transcription.text.substring(0, 50)}${transcription.text.length > 50 ? '...' : ''}"`)
      
      // Check for empty result
      if (!transcription.text || transcription.text.trim() === '') {
        console.warn('⚠️ Empty transcription result')
        return NextResponse.json({ 
          transcript: '', 
          warning: 'No speech detected in the audio'
        })
      }
      
      // Return successful transcription
      return NextResponse.json({ transcript: transcription.text })
      
    } catch (openaiError) {
      // Handle OpenAI-specific errors
      console.error('❌ OpenAI API Error:', openaiError)
      
      if (openaiError instanceof OpenAI.APIError) {
        return NextResponse.json({ 
          error: `OpenAI API Error: ${openaiError.message}`,
          code: 'OPENAI_API_ERROR'
        }, { status: openaiError.status || 500 })
      } else {
        throw openaiError // Pass to general error handler
      }
    }
    
  } catch (error) {
    console.error('❌ Error transcribing audio:', error)
    
    const { error: message, code, status } = handleAPIError(error)
    return NextResponse.json({ error: message, code }, { status })
  }
} 
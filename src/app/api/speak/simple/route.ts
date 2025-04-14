import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { APIError, handleAPIError, ErrorCodes } from '@/lib/errors'

/**
 * Simple text-to-speech API for basic farmer identification flows
 * This is a simplified version of the main speak API that just takes 
 * a text string without requiring full analysis data
 */
export async function POST(req: NextRequest) {
  console.log('Simple Speak API - Received request')
  
  try {
    // Validate input
    if (!req.body) {
      throw new APIError('Request body is required', 400, ErrorCodes.BAD_REQUEST)
    }

    let requestData
    try {
      requestData = await req.json()
    } catch (parseError) {
      console.error('Simple Speak API - Failed to parse request body:', parseError)
      throw new APIError('Invalid JSON in request body', 400, ErrorCodes.BAD_REQUEST)
    }
    
    const { text, voiceId } = requestData
    
    if (!text || typeof text !== 'string') {
      console.error('Simple Speak API - No text in request')
      throw new APIError('Text is required', 400, ErrorCodes.BAD_REQUEST)
    }
    
    console.log('Simple Speak API - Text received:', text.substring(0, 100) + (text.length > 100 ? '...' : ''))
    
    // Use ElevenLabs for text-to-speech
    const VOICE_ID = voiceId || 'EXAVITQu4vr4xnSDxMaL' // Use provided voice ID or default to male voice
    
    if (env.ELEVENLABS_API_KEY) {
      try {
        console.log('Simple Speak API - Calling ElevenLabs API with voice:', VOICE_ID)
        
        // Set timeout for ElevenLabs API
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10-second timeout
        
        // Call ElevenLabs API for higher quality voice
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': env.ELEVENLABS_API_KEY
          },
          body: JSON.stringify({
            text,
            voice_settings: {
              stability: 0.75,
              similarity_boost: 0.75
            }
          }),
          signal: controller.signal
        })
        
        // Clear the timeout since the request completed
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          let errorDetail = 'Unknown error'
          try {
            const errorText = await response.text()
            errorDetail = errorText || `Status ${response.status}`
          } catch (textError) {
            errorDetail = `Status ${response.status}`
          }
          
          console.error('Simple Speak API - ElevenLabs API error:', response.status, errorDetail)
          throw new APIError(`Text-to-speech API request failed: ${errorDetail}`, 500, ErrorCodes.SERVICE_UNAVAILABLE)
        }
        
        console.log('Simple Speak API - ElevenLabs API success')
        
        // Return the audio blob
        const audioBlob = await response.blob()
        
        if (!audioBlob || audioBlob.size === 0) {
          console.error('Simple Speak API - ElevenLabs returned empty audio blob')
          throw new APIError('Text-to-speech API returned empty audio', 500, ErrorCodes.SERVICE_UNAVAILABLE)
        }
        
        console.log('Simple Speak API - Returning audio blob, size:', audioBlob.size)
        return new NextResponse(audioBlob, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
      } catch (error) {
        console.error('Simple Speak API - ElevenLabs API failed:', error)
        console.log('Simple Speak API - Falling back to text response')
        
        // Check for abort errors (timeout)
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.error('Simple Speak API - Request timed out')
        }
        
        // Fallback to text if ElevenLabs fails
        return NextResponse.json({ 
          text,
          error: error instanceof Error ? error.message : 'Text-to-speech generation failed',
          fallback: true
        }, {
          status: 200, // Return 200 even for fallback to make client handling simpler
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        })
      }
    } else {
      console.log('Simple Speak API - No ElevenLabs API key, using text fallback')
      
      // Fallback to a simple text response if no ElevenLabs API key
      return NextResponse.json({ 
        text,
        fallback: true
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    }
  } catch (error) {
    console.error('Error generating speech:', error)
    const { error: message, code, status } = handleAPIError(error)
    return NextResponse.json({ 
      error: message, 
      code,
      fallback: true
    }, { 
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
} 
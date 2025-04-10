import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { APIError, handleAPIError, ErrorCodes } from '@/lib/errors'

// Log environment check in development
if (process.env.NODE_ENV === 'development') {
  console.log('Speak API - ElevenLabs API Key:', env.ELEVENLABS_API_KEY ? 'Set' : 'Missing')
}

export async function POST(req: NextRequest) {
  console.log('Speak API - Received request')
  
  try {
    // Input validation
    if (!req.body) {
      throw new APIError('Request body is required', 400, ErrorCodes.BAD_REQUEST)
    }

    let requestData
    try {
      requestData = await req.json()
    } catch (parseError) {
      console.error('Speak API - Failed to parse request body:', parseError)
      throw new APIError('Invalid JSON in request body', 400, ErrorCodes.BAD_REQUEST)
    }
    
    const { analysis } = requestData
    
    if (!analysis) {
      console.error('Speak API - No analysis data in request')
      throw new APIError('Analysis data is required', 400, ErrorCodes.BAD_REQUEST)
    }
    
    console.log('Speak API - Analysis data received:', 
      typeof analysis === 'object' ? JSON.stringify(analysis).substring(0, 100) + '...' : 'Invalid analysis format')
    
    // Validate analysis structure
    if (!analysis.categories || !Array.isArray(analysis.categories) || !analysis.summary) {
      console.error('Speak API - Invalid analysis structure:', analysis)
      throw new APIError('Invalid analysis structure', 400, ErrorCodes.BAD_REQUEST)
    }
    
    // Generate response text based on analysis
    const responseText = `Thank you for your message about ${analysis.categories.join(' and ')}. ${analysis.summary} We have recorded your inquiry and our agricultural team will follow up with you shortly.`
    
    console.log('Speak API - Generated response text:', responseText.substring(0, 100) + '...')
    
    // Use ElevenLabs for text-to-speech
    const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL' // Default male voice
    
    if (env.ELEVENLABS_API_KEY) {
      try {
        console.log('Speak API - Calling ElevenLabs API...')
        
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
            text: responseText,
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
          
          console.error('Speak API - ElevenLabs API error:', response.status, errorDetail)
          throw new APIError(`Text-to-speech API request failed: ${errorDetail}`, 500, ErrorCodes.SERVICE_UNAVAILABLE)
        }
        
        console.log('Speak API - ElevenLabs API success')
        
        // Return the audio blob
        const audioBlob = await response.blob()
        
        if (!audioBlob || audioBlob.size === 0) {
          console.error('Speak API - ElevenLabs returned empty audio blob')
          throw new APIError('Text-to-speech API returned empty audio', 500, ErrorCodes.SERVICE_UNAVAILABLE)
        }
        
        console.log('Speak API - Returning audio blob, size:', audioBlob.size)
        return new NextResponse(audioBlob, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
      } catch (error) {
        console.error('Speak API - ElevenLabs API failed:', error)
        console.log('Speak API - Falling back to text response')
        
        // Check for abort errors (timeout)
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.error('Speak API - Request timed out')
        }
        
        // Fallback to text if ElevenLabs fails
        return NextResponse.json({ 
          text: responseText,
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
      console.log('Speak API - No ElevenLabs API key, using text fallback')
      
      // Fallback to a simple text response if no ElevenLabs API key
      return NextResponse.json({ 
        text: responseText,
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
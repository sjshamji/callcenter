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
    const { analysis } = await req.json()
    
    if (!analysis) {
      console.error('Speak API - No analysis data in request')
      throw new APIError('Analysis data is required', 400, ErrorCodes.BAD_REQUEST)
    }
    
    console.log('Speak API - Analysis data received:', JSON.stringify(analysis).substring(0, 100) + '...')
    
    // Generate response text based on analysis
    const responseText = `Thank you for your message about ${analysis.categories.join(' and ')}. ${analysis.summary} We have recorded your inquiry and our agricultural team will follow up with you shortly.`
    
    console.log('Speak API - Generated response text:', responseText.substring(0, 100) + '...')
    
    // Use ElevenLabs for text-to-speech
    const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL' // Default male voice
    
    if (env.ELEVENLABS_API_KEY) {
      try {
        console.log('Speak API - Calling ElevenLabs API...')
        
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
          })
        })
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('Speak API - ElevenLabs API error:', response.status, errorText)
          throw new APIError('Text-to-speech API request failed: ' + errorText, 500, ErrorCodes.SERVICE_UNAVAILABLE)
        }
        
        console.log('Speak API - ElevenLabs API success')
        
        // Return the audio blob
        const audioBlob = await response.blob()
        return new NextResponse(audioBlob, {
          headers: {
            'Content-Type': 'audio/mpeg'
          }
        })
      } catch (error) {
        console.error('Speak API - ElevenLabs API failed:', error)
        console.log('Speak API - Falling back to text response')
        
        // Fallback to text if ElevenLabs fails
        return NextResponse.json({ 
          text: responseText,
          error: error instanceof Error ? error.message : 'Text-to-speech generation failed',
          fallback: true
        })
      }
    } else {
      console.log('Speak API - No ElevenLabs API key, using text fallback')
      
      // Fallback to a simple text response if no ElevenLabs API key
      return NextResponse.json({ text: responseText })
    }
  } catch (error) {
    console.error('Error generating speech:', error)
    const { error: message, code, status } = handleAPIError(error)
    return NextResponse.json({ error: message, code }, { status })
  }
} 
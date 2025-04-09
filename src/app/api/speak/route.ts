import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { APIError, handleAPIError, ErrorCodes } from '@/lib/errors'

export async function POST(req: NextRequest) {
  try {
    const { analysis } = await req.json()
    
    if (!analysis) {
      throw new APIError('Analysis data is required', 400, ErrorCodes.BAD_REQUEST)
    }
    
    // Generate response text based on analysis
    const responseText = `Thank you for your message about ${analysis.categories.join(' and ')}. ${analysis.summary} We have recorded your inquiry and our agricultural team will follow up with you shortly.`
    
    // Use ElevenLabs for text-to-speech
    const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL' // Default male voice
    
    if (env.ELEVENLABS_API_KEY) {
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
        throw new APIError('Text-to-speech API request failed', 500, ErrorCodes.SERVICE_UNAVAILABLE)
      }
      
      // Return the audio blob
      const audioBlob = await response.blob()
      return new NextResponse(audioBlob, {
        headers: {
          'Content-Type': 'audio/mpeg'
        }
      })
    } else {
      // Fallback to a simple text response if no ElevenLabs API key
      return NextResponse.json({ text: responseText })
    }
  } catch (error) {
    console.error('Error generating speech:', error)
    const { error: message, code, status } = handleAPIError(error)
    return NextResponse.json({ error: message, code }, { status })
  }
} 
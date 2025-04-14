import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { APIError, handleAPIError, ErrorCodes } from '@/lib/errors'

// Log environment check in development
if (process.env.NODE_ENV === 'development') {
  console.log('Voices API - ElevenLabs API Key:', env.ELEVENLABS_API_KEY ? 'Set' : 'Missing')
}

export async function GET(req: NextRequest) {
  console.log('Voices API - Received request')
  
  try {
    if (!env.ELEVENLABS_API_KEY) {
      throw new APIError('ElevenLabs API key is required', 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }
    
    // Call ElevenLabs API to get available voices
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': env.ELEVENLABS_API_KEY
      }
    })
    
    if (!response.ok) {
      throw new APIError('Failed to fetch voices from ElevenLabs', 500, ErrorCodes.SERVICE_UNAVAILABLE)
    }
    
    const voices = await response.json()
    
    // Filter and format voices by gender
    const formattedVoices = {
      male: voices.voices.filter((voice: any) => voice.labels?.gender === 'male'),
      female: voices.voices.filter((voice: any) => voice.labels?.gender === 'female')
    }
    
    return NextResponse.json(formattedVoices)
  } catch (error) {
    console.error('Error fetching voices:', error)
    const { error: message, code, status } = handleAPIError(error)
    return NextResponse.json({ error: message, code }, { status })
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { env } from '@/lib/env'
import { APIError, handleAPIError, ErrorCodes } from '@/lib/errors'

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY
})

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audio = formData.get('audio') as File
    
    if (!audio) {
      throw new APIError('Audio file is required', 400, ErrorCodes.BAD_REQUEST)
    }
    
    // Transcribe audio using Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      language: 'en',
    })
    
    return NextResponse.json({ transcript: transcription.text })
  } catch (error) {
    console.error('Error transcribing audio:', error)
    const { error: message, code, status } = handleAPIError(error)
    return NextResponse.json({ error: message, code }, { status })
  }
} 
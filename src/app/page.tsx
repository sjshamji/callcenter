"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MicIcon, StopCircleIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface Analysis {
  summary: string
  categories: string[]
  sentiment: number
}

export default function Home() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        await transcribeAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      // Stop all audio tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
    }
  }

  // Transcribe audio using Whisper API
  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob)
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Transcription failed')
      }
      
      const data = await response.json()
      setTranscript(data.transcript)
      
      // After transcription, analyze the text
      await analyzeTranscript(data.transcript)
    } catch (error) {
      console.error('Error transcribing audio:', error)
    }
  }

  // Analyze transcript using Claude/OpenAI
  const analyzeTranscript = async (text: string) => {
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: text }),
      })
      
      if (!response.ok) {
        throw new Error('Analysis failed')
      }
      
      const analysisData = await response.json()
      setAnalysis(analysisData)
      
      // Save the call data to Supabase
      await saveCall(text, analysisData)
      
      // Generate and play AI response
      await generateSpeechResponse(analysisData)
    } catch (error) {
      console.error('Error analyzing transcript:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Save call to Supabase
  const saveCall = async (transcript: string, analysis: Analysis) => {
    try {
      await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          summary: analysis.summary,
          categories: analysis.categories,
          sentiment: analysis.sentiment,
        }),
      })
    } catch (error) {
      console.error('Error saving call data:', error)
    }
  }

  // Generate speech response
  const generateSpeechResponse = async (analysis: Analysis) => {
    try {
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysis }),
      })
      
      if (!response.ok) {
        throw new Error('Speech generation failed')
      }
      
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audio.play()
    } catch (error) {
      console.error('Error generating speech:', error)
    }
  }

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to Angata Sugar Mills Call Center</h1>
        <p className="text-muted-foreground">
          Speak directly to our AI assistant about your farming needs
        </p>
      </div>
      
      <Card className="max-w-xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center">
            <div className="relative mb-8">
              {isRecording && (
                <motion.div
                  className="absolute -inset-4 rounded-full bg-primary/20"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
              <Button
                size="lg"
                className={`h-24 w-24 rounded-full ${isRecording ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <StopCircleIcon className="h-12 w-12" />
                ) : (
                  <MicIcon className="h-12 w-12" />
                )}
              </Button>
            </div>
            
            <div className="text-center">
              {isRecording ? (
                <p className="text-primary animate-pulse">Recording... Click to stop</p>
              ) : (
                <p className="text-muted-foreground">Click to start speaking</p>
              )}
            </div>
            
            {transcript && (
              <div className="mt-8 w-full">
                <h3 className="font-medium mb-2">Your message:</h3>
                <div className="p-4 rounded-lg bg-secondary/50 text-sm">
                  {transcript}
                </div>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="mt-6">
                <p className="text-muted-foreground animate-pulse">Analyzing your request...</p>
              </div>
            )}
            
            {analysis && (
              <div className="mt-8 w-full">
                <h3 className="font-medium mb-2">AI Response:</h3>
                <div className="p-4 rounded-lg bg-secondary/50 text-sm">
                  <p className="mb-4">{analysis.summary}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {analysis.categories.map((category, index) => (
                      <span key={index} className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary-foreground">
                        {category}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-xs text-muted-foreground mr-2">Sentiment:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      analysis.sentiment > 0.2 ? 'bg-green-500/20 text-green-400' :
                      analysis.sentiment < -0.2 ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {analysis.sentiment > 0.2 ? 'Positive' :
                       analysis.sentiment < -0.2 ? 'Negative' : 'Neutral'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

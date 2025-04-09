"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MicIcon, StopCircleIcon, Volume2Icon, Loader2Icon } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'

interface Message {
  role: 'user' | 'assistant'
  content: string
  categories?: string[]
  sentiment?: number
}

export default function Home() {
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [timer, setTimer] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [callEnded, setCallEnded] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Create timer for recording
  useEffect(() => {
    if (isRecording) {
      setTimer(0)
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Audio playback
  const playAudio = (url: string) => {
    const audio = new Audio(url)
    audio.onerror = (e) => {
      console.error('Audio playback error:', e)
      toast({
        title: "Audio Playback Error",
        description: "Failed to play audio response.",
        variant: "destructive"
      })
    }
    
    audio.play().catch(err => {
      console.error('Failed to play audio:', err)
      toast({
        title: "Audio Playback Error",
        description: "Failed to play audio. Click the play button to try again.",
        variant: "destructive"
      })
    })
  }

  // Toggle recording
  const toggleRecording = async () => {
    console.log('Toggle recording clicked. Current state:', isRecording)
    
    if (isRecording) {
      console.log('Stopping recording...')
      stopRecording()
    } else {
      console.log('Starting recording...')
      await startRecording()
    }
  }

  // Start recording
  const startRecording = async () => {
    console.log('startRecording called')
    try {
      // First set recording state to true for UI feedback
      setIsRecording(true)
      
      console.log('Requesting microphone access...')
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      console.log('Microphone access granted, creating MediaRecorder...')
      // Choose a widely supported format
      const mimeType = 'audio/webm'
      
      // Create and configure the media recorder
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000 
      })
      
      console.log('MediaRecorder created:', mediaRecorder.state)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available event, size:', event.data.size)
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        console.log('MediaRecorder stopped, processing chunks:', audioChunksRef.current.length)
        // Process recorded audio
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
          console.log('Created audio blob, size:', audioBlob.size)
          
          if (audioBlob.size > 0) {
            await processRecording(audioBlob)
          } else {
            console.error('Empty audio blob created')
            toast({
              title: "Recording Error",
              description: "No audio was captured. Please try again.",
              variant: "destructive"
            })
          }
        } else {
          console.error('No audio chunks recorded')
          toast({
            title: "Recording Error",
            description: "No audio was captured. Please try again.",
            variant: "destructive"
          })
        }
      }
      
      // Start recording with timeslice to get data frequently
      mediaRecorder.start(500)
      console.log('MediaRecorder started:', mediaRecorder.state)
      
      // Auto-stop after 60 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          console.log('Auto-stopping after 60 seconds...')
          stopRecording()
        }
      }, 60000)
      
      toast({
        title: "Recording Started",
        description: "Speak now. Click the button again to stop.",
      })
    } catch (error) {
      console.error('Error starting recording:', error)
      // Reset recording state if we fail
      setIsRecording(false)
      
      toast({
        title: "Microphone Error",
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive"
      })
    }
  }

  // Stop recording
  const stopRecording = () => {
    console.log('stopRecording called, mediaRecorder state:', mediaRecorderRef.current?.state)
    
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        console.log('Stopping active recording...')
        mediaRecorderRef.current.stop()
        
        // Stop microphone tracks
        if (mediaRecorderRef.current.stream) {
          console.log('Stopping microphone tracks...')
          mediaRecorderRef.current.stream.getTracks().forEach(track => {
            console.log('Stopping track:', track.kind, track.id)
            track.stop()
          })
        }
      } else {
        console.log('No active recording to stop')
      }
    } catch (error) {
      console.error('Error stopping recording:', error)
    } finally {
      // Always reset the recording state at the end
      setIsRecording(false)
    }
  }

  // Process the recording
  const processRecording = async (audioBlob: Blob) => {
    setIsAnalyzing(true)
    
    try {
      // Step 1: Transcribe audio
      const transcript = await transcribeAudio(audioBlob)
      if (!transcript) {
        setIsAnalyzing(false)
        return
      }
      
      // Add user message
      setMessages(prev => [...prev, { role: 'user', content: transcript }])
      
      // Step 2: Analyze the transcript
      const analysis = await analyzeTranscript(transcript)
      if (!analysis) {
        setIsAnalyzing(false)
        return
      }
      
      // We'll save the data when call is ended, not right away
      
      // Step 3: Generate and play AI voice response
      const aiResponseUrl = await generateSpeechResponse(analysis)
      if (aiResponseUrl) {
        setAudioUrl(aiResponseUrl)
        playAudio(aiResponseUrl)
      }
      
      setCallEnded(false) // Reset call ended state when a new message is processed
    } catch (error) {
      console.error('Error processing recording:', error)
      toast({
        title: "Processing Error",
        description: "Something went wrong processing your recording.",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Transcribe audio using Whisper API
  const transcribeAudio = async (audioBlob: Blob): Promise<string | null> => {
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
      
      if (!data.transcript || data.transcript.trim() === '') {
        toast({
          title: "No Speech Detected",
          description: "Please try speaking louder or check your microphone.",
          variant: "destructive"
        })
        return null
      }
      
      return data.transcript
    } catch (error) {
      console.error('Error transcribing audio:', error)
      toast({
        title: "Transcription Error",
        description: "Could not convert speech to text.",
        variant: "destructive"
      })
      return null
    }
  }

  // Analyze transcript using OpenAI
  const analyzeTranscript = async (text: string) => {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      })
      
      if (!response.ok) {
        throw new Error('Analysis failed')
      }
      
      const analysis = await response.json()
      
      // Add AI response to messages
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: analysis.summary,
        categories: analysis.categories,
        sentiment: analysis.sentiment
      }])
      
      return analysis
    } catch (error) {
      console.error('Error analyzing transcript:', error)
      toast({
        title: "Analysis Error",
        description: "Failed to analyze your message.",
        variant: "destructive"
      })
      return null
    }
  }

  // Save call to database - now enhanced with better error handling
  const saveCall = async () => {
    // Don't save if there are no messages
    if (messages.length === 0) {
      toast({
        title: "No Call Data",
        description: "There's no conversation to save.",
        variant: "destructive"
      })
      return
    }
    
    setIsSaving(true)
    
    try {
      // Find last pair of user and AI messages
      const userMessages = messages.filter(m => m.role === 'user')
      const assistantMessages = messages.filter(m => m.role === 'assistant')
      
      if (userMessages.length === 0 || assistantMessages.length === 0) {
        throw new Error('Incomplete conversation')
      }
      
      const lastUserMessage = userMessages[userMessages.length - 1]
      const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]
      
      // Get any analyzed needs from the assistant message
      const {
        needs_fertilizer = false,
        needs_seed_cane = false,
        needs_harvesting = false,
        needs_ploughing = false,
        has_crop_issues = false,
        needs_pesticide = false,
        resolved = false,
        follow_up_required = false,
        priority = 1
      } = lastAssistantMessage as any;
      
      console.log('Saving call data:', {
        transcript: lastUserMessage.content,
        summary: lastAssistantMessage.content,
        categories: lastAssistantMessage.categories || [],
        sentiment: lastAssistantMessage.sentiment || 0,
        needs_fertilizer,
        needs_seed_cane,
        needs_harvesting,
        needs_ploughing,
        has_crop_issues,
        needs_pesticide,
        resolved,
        follow_up_required,
        priority
      })
      
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: lastUserMessage.content,
          summary: lastAssistantMessage.content,
          categories: lastAssistantMessage.categories || [],
          sentiment: lastAssistantMessage.sentiment || 0,
          needs_fertilizer,
          needs_seed_cane,
          needs_harvesting,
          needs_ploughing,
          has_crop_issues,
          needs_pesticide,
          resolved,
          follow_up_required,
          priority
        }),
      })
      
      const responseData = await response.json()
      
      if (!response.ok) {
        console.error('Save API error:', responseData)
        throw new Error(responseData.error || 'Failed to save call data')
      }
      
      console.log('Call saved successfully:', responseData)
      
      toast({
        title: "Call Saved",
        description: "Your conversation has been saved to the database.",
      })
      
      // Clear messages after successful save
      setMessages([])
      setAudioUrl(null)
      setCallEnded(true)
    } catch (error) {
      console.error('Error saving call data:', error)
      toast({
        title: "Save Error",
        description: error instanceof Error ? error.message : "Failed to save call data.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // End current call
  const endCall = async () => {
    if (messages.length === 0) {
      toast({
        title: "No Call to End",
        description: "Start a conversation first.",
        variant: "destructive"
      })
      return
    }
    
    await saveCall()
  }

  // Generate speech response
  const generateSpeechResponse = async (analysis: any): Promise<string | null> => {
    try {
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis }),
      })
      
      if (!response.ok) {
        throw new Error('Speech generation failed')
      }
      
      // Check for JSON fallback response
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        console.log('Received text fallback instead of audio')
        return null
      }
      
      // Process audio response
      const audioBlob = await response.blob()
      return URL.createObjectURL(audioBlob)
    } catch (error) {
      console.error('Error generating speech:', error)
      toast({
        title: "Voice Generation Error",
        description: "Could not generate voice response.",
        variant: "destructive"
      })
      return null
    }
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' + secs : secs}`
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-emerald-800 dark:text-emerald-300">Angata Sugar Mills Call Center</h1>
        <p className="text-emerald-600 dark:text-emerald-400">
          Speak directly to our AI assistant about your farming needs
        </p>
      </div>
      
      <Card className="mb-4 bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-950 dark:to-amber-950 border-emerald-200 dark:border-emerald-800 shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto border-b pb-4">
            {messages.length === 0 && (
              <div className="text-center py-16 px-4">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                  <MicIcon className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-medium text-emerald-800 dark:text-emerald-300 mb-2">No Conversations Yet</h3>
                <p className="text-emerald-600 dark:text-emerald-400 max-w-md mx-auto">
                  Click the microphone button below to start speaking about your farming needs
                </p>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 shadow-md ${
                    message.role === 'assistant'
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-50'
                      : 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-50'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  {message.categories && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {message.categories.map((category, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs rounded-full bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  )}
                  {message.sentiment !== undefined && (
                    <div className="mt-2 flex items-center">
                      <span className="text-xs text-muted-foreground mr-2">Sentiment:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        message.sentiment > 0.2 ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' :
                        message.sentiment < -0.2 ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200' :
                        'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                      }`}>
                        {message.sentiment > 0.2 ? 'Positive' :
                         message.sentiment < -0.2 ? 'Negative' : 'Neutral'}
                      </span>
                    </div>
                  )}
                  {message.role === 'assistant' && audioUrl && (
                    <button 
                      className="mt-2 flex items-center text-xs text-emerald-600 dark:text-emerald-400"
                      onClick={() => playAudio(audioUrl)}
                    >
                      <Volume2Icon className="w-3 h-3 mr-1" /> Play AI response
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="flex flex-col items-center justify-center mt-8">
            <div className="text-center mb-4">
              {isRecording && (
                <div className="text-red-500 dark:text-red-400 animate-pulse font-medium mb-2">
                  <span className="bg-red-100 dark:bg-red-900 px-2 py-1 rounded">Recording: {formatTimer(timer)}</span>
                </div>
              )}
              {isAnalyzing && (
                <div className="text-amber-700 dark:text-amber-300 flex items-center justify-center gap-2 mb-2">
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  <span>Processing your message...</span>
                </div>
              )}
              {isSaving && (
                <div className="text-blue-700 dark:text-blue-300 flex items-center justify-center gap-2 mb-2">
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  <span>Saving conversation...</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-4">
              <Button
                size="lg"
                className={`h-16 w-16 rounded-full shadow-md relative ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700' 
                    : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800'
                }`}
                onClick={toggleRecording}
                disabled={isAnalyzing || isSaving}
              >
                {isRecording ? (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full bg-red-400/30 dark:bg-red-600/30"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                    <StopCircleIcon className="h-8 w-8" />
                  </>
                ) : (
                  <MicIcon className="h-8 w-8" />
                )}
              </Button>
              
              {messages.length > 0 && !callEnded && (
                <Button
                  size="lg"
                  className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800"
                  onClick={endCall}
                  disabled={isRecording || isAnalyzing || isSaving}
                >
                  End Call
                </Button>
              )}
            </div>
            
            <div className="text-center mt-4">
              <p className="text-emerald-600 dark:text-emerald-400 text-sm">
                {isRecording 
                  ? "Click again to stop recording" 
                  : isAnalyzing 
                    ? "Please wait..." 
                    : isSaving
                      ? "Saving conversation..."
                      : messages.length > 0 && !callEnded
                        ? "Click 'End Call' when finished"
                        : "Click to start speaking"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  )
}


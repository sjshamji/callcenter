"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MicIcon, StopCircleIcon, Volume2Icon, Loader2Icon } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import CropHealthVisualization from '@/components/CropHealthVisualization'

// Create a global variable to store the first issue outside of React state
// This ensures it won't be affected by component re-renders or state timing issues
let globalInitialIssue: string | null = null;

// Function to detect if a message is just a greeting
const isGreeting = (text: string): boolean => {
  const greetingPatterns = [
    /^(hello|hi|hey|greetings|good morning|good afternoon|good evening|howdy)/i,
    /^(how are you|how do you do|how's it going|what's up|how have you been)/i,
    /^(nice to meet you|pleased to meet you)/i
  ];
  
  // Clean up the input text
  const cleanText = text.trim().toLowerCase();
  
  // Check if text is short (likely a greeting)
  if (cleanText.length < 20) {
    // Check against greeting patterns
    for (const pattern of greetingPatterns) {
      if (pattern.test(cleanText)) {
        return true;
      }
    }
    
    // Check if it's just casual conversation
    if (/^(how's your day|how are things|what's new)/.test(cleanText)) {
      return true;
    }
  }
  
  return false;
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  categories?: string[]
  sentiment?: number
  needs_fertilizer?: boolean
  needs_seed_cane?: boolean
  needs_harvesting?: boolean
  needs_ploughing?: boolean
  has_crop_issues?: boolean
  needs_pesticide?: boolean
  resolved?: boolean
  follow_up_required?: boolean
  priority?: number
  audioUrl?: string | null // Updated to allow null
}

// Farmer interface to match Supabase schema
interface Farmer {
  "Farmer ID": string
  "Farmer Name"?: string
  Location?: string
  Phone?: string
  [key: string]: any
}

export default function Home() {
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [timer, setTimer] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [callEnded, setCallEnded] = useState(false)
  const [currentFarmer, setCurrentFarmer] = useState<Farmer | null>(null)
  const [isIdentifying, setIsIdentifying] = useState(false)
  const [identificationStep, setIdentificationStep] = useState<'none' | 'ask_name' | 'ask_id' | 'confirm_new'>('none')
  const [initialFarmerIssue, setInitialFarmerIssue] = useState<string | null>(null)
  const [maleVoiceId, setMaleVoiceId] = useState<string>('EXAVITQu4vr4xnSDxMaL') // Default male voice
  const [femaleVoiceId, setFemaleVoiceId] = useState<string>('EXAVITQu4vr4xnSDxMaL') // Default female voice
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch available voices on component mount
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/voices')
        if (!response.ok) throw new Error('Failed to fetch voices')
        
        const voices = await response.json()
        
        // Set the first available male and female voices
        if (voices.male?.[0]?.voice_id) {
          setMaleVoiceId(voices.male[0].voice_id)
        }
        if (voices.female?.[0]?.voice_id) {
          setFemaleVoiceId(voices.female[0].voice_id)
        }
      } catch (error) {
        console.error('Error fetching voices:', error)
      }
    }
    
    fetchVoices()
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Add logging on component mount
  useEffect(() => {
    console.log('======== COMPONENT MOUNTED ========')
    console.log('Initial state:')
    console.log('- initialFarmerIssue:', initialFarmerIssue)
    console.log('- globalInitialIssue:', globalInitialIssue)
    console.log('- currentFarmer:', currentFarmer)
    console.log('- identificationStep:', identificationStep)
    console.log('- isIdentifying:', isIdentifying)
    
    // Set up cleanup
    return () => {
      console.log('======== COMPONENT UNMOUNTING ========')
      // Don't clear the global variable on unmount
    }
  }, [])

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
  const playAudio = (audioUrl: string) => {
    try {
      console.log('Playing audio from URL:', audioUrl.substring(0, 50) + '...')
      
      // Stop any currently playing audio first
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      
      const audio = new Audio(audioUrl)
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e)
        toast({
          title: "Audio Playback Error",
          description: "Failed to play audio response. Please try clicking the play button.",
          variant: "destructive"
        })
      }
      
      audio.oncanplay = () => {
        console.log('Audio is ready to play')
      }
      
      audio.onended = () => {
        console.log('Audio playback completed')
      }
      
      // Save reference to audio element
      audioRef.current = audio
      
      // Play the audio
      audio.play().catch(err => {
        console.error('Failed to play audio:', err)
        toast({
          title: "Audio Playback Error",
          description: "Failed to play audio. Click the play button to try again.",
          variant: "destructive"
        })
      })
    } catch (error) {
      console.error('Error setting up audio playback:', error)
      toast({
        title: "Audio Playback Error",
        description: "Failed to set up audio playback.",
        variant: "destructive"
      })
    }
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
    
    // Reset audio chunks before starting
    audioChunksRef.current = []
    
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
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available event, size:', event.data.size)
        if (event.data && event.data.size > 0) {
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
            setIsRecording(false)
          }
        } else {
          console.error('No audio chunks recorded')
          toast({
            title: "Recording Error",
            description: "No audio was captured. Please try again.",
            variant: "destructive"
          })
          setIsRecording(false)
        }
      }
      
      // Error handler for MediaRecorder
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        toast({
          title: "Recording Error",
          description: "An error occurred while recording. Please try again.",
          variant: "destructive"
        })
        stopRecording()
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
        
        // Request all remaining data before stopping
        mediaRecorderRef.current.requestData()
        
        // Stop recording
        mediaRecorderRef.current.stop()
        
        // Stop microphone tracks
        if (mediaRecorderRef.current.stream) {
          console.log('Stopping microphone tracks...')
          mediaRecorderRef.current.stream.getTracks().forEach(track => {
            console.log('Stopping track:', track.kind, track.id)
            track.stop()
          })
        }
        
        // Release reference to MediaRecorder
        mediaRecorderRef.current = null
      } else {
        console.log('No active recording to stop')
      }
    } catch (error) {
      console.error('Error stopping recording:', error)
      toast({
        title: "Recording Error",
        description: "Error stopping recording. Please refresh the page and try again.",
        variant: "destructive"
      })
    } finally {
      // Always reset the recording state
      setIsRecording(false)
    }
  }

  // Process the recording
  const processRecording = async (audioBlob: Blob) => {
    setIsAnalyzing(true)
    
    try {
      console.log('Processing audio blob, size:', audioBlob.size)
      
      // Step 1: Transcribe audio
      const transcript = await transcribeAudio(audioBlob)
      if (!transcript) {
        console.log('No transcript returned, aborting processing')
        setIsAnalyzing(false)
        return
      }
      
      console.log('Transcript received:', transcript.substring(0, 50) + (transcript.length > 50 ? '...' : ''))
      
      // Add user message
      setMessages(prev => [...prev, { role: 'user', content: transcript }])
      
      // If we already identified the farmer, process the issue
      if (currentFarmer) {
        // This is an issue statement after ID verification
        const analysis = await analyzeTranscript(transcript)
        if (!analysis) {
          console.log('No analysis returned, aborting processing')
          setIsAnalyzing(false)
          return
        }
        
        console.log('Analysis received for issue from existing farmer')
        
        // We don't need to do anything here as the analyzeTranscript function
        // already adds the message and plays the audio
        return
      }
      
      // For first message, always store the content for later reference
      if (messages.length === 0) {
        // Check if it's just a greeting
        const justGreeting = isGreeting(transcript);
        
        // Store the initial message content - both in state and global var for backup
        console.log('Storing initial message for later reference:', transcript)
        
        // Only treat it as an "issue" if it's not just a greeting
        if (!justGreeting) {
          setInitialFarmerIssue(transcript)
          globalInitialIssue = transcript
        } else {
          console.log('Detected greeting, not storing as an issue')
        }
        
        // Check if there's an ID in the initial message
        const idPattern = /\b(KF\d{3})\b/i
        const idMatch = transcript.match(idPattern)
        
        if (idMatch && idMatch[1]) {
          // ID found in the first message, verify it
          const farmerId = idMatch[1].toUpperCase()
          console.log(`Found farmer ID in first transcript: ${farmerId}`)
          const farmer = await getFarmerById(farmerId)
          
          if (farmer) {
            console.log(`Verified farmer: ${farmer["Farmer Name"] || '(No name)'} (${farmer["Farmer ID"]})`)
            setCurrentFarmer(farmer)
            await askForIssue(farmer)
            return
          }
        }
        
        // No valid ID found, ask for one
        await askForFarmerId()
        return
      }
      
      // If we reach here, we're processing a message that should contain a farmer ID
      const idPattern = /\b(KF\d{3})\b/i
      const idMatch = transcript.match(idPattern)
      
      if (idMatch && idMatch[1]) {
        const farmerId = idMatch[1].toUpperCase()
        console.log(`Found farmer ID in response: ${farmerId}`)
        
        const farmer = await getFarmerById(farmerId)
        if (farmer) {
          setCurrentFarmer(farmer)
          
          // If we have an initial issue stored, analyze it now
          const initialIssue = initialFarmerIssue || globalInitialIssue
          if (initialIssue) {
            console.log('Found initial issue to analyze after ID verification:', initialIssue)
            
            // Set a personalized greeting that addresses the initial issue
            const welcomeMsg = `Hello ${farmer["Farmer Name"] || `Farmer ${farmer["Farmer ID"]}`}! Let me help you with your issue about "${initialIssue.substring(0, 50)}${initialIssue.length > 50 ? '...' : ''}"`
            
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: welcomeMsg
            }])
            
            // Generate and play the greeting
            const greetingUrl = await generateTextToSpeech(welcomeMsg)
            if (greetingUrl) {
              setAudioUrl(greetingUrl)
              playAudio(greetingUrl)
            }
            
            // Analyze the initial issue now that we have the farmer ID
            const analysis = await analyzeTranscript(initialIssue, true) // Skip adding analysis message as we already have greeting
            if (analysis) {
              // Add the analysis response
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: analysis.summary,
                categories: analysis.categories,
                sentiment: analysis.sentiment,
                needs_fertilizer: analysis.needs_fertilizer || false,
                needs_seed_cane: analysis.needs_seed_cane || false,
                needs_harvesting: analysis.needs_harvesting || false,
                needs_ploughing: analysis.needs_ploughing || false,
                has_crop_issues: analysis.has_crop_issues || false,
                needs_pesticide: analysis.needs_pesticide || false,
                resolved: analysis.resolved || false,
                follow_up_required: analysis.follow_up_required || false,
                priority: analysis.priority || 1
              }])
              
              // Generate and play the analysis response
              const aiResponseUrl = await generateSpeechResponse(analysis)
              if (aiResponseUrl) {
                setAudioUrl(aiResponseUrl)
                playAudio(aiResponseUrl)
              }
            }
            
            // Clear the stored initial issue once processed
            setInitialFarmerIssue(null)
            globalInitialIssue = null
          } else {
            // No initial issue found, just ask what they need help with
            await askForIssue(farmer)
          }
          
          // Reset identification flow now that we have the farmer
          setIsIdentifying(false)
          setIdentificationStep('none')
          return
        } else {
          // ID not found, offer to create new farmer
          const response = `I couldn't find a farmer with ID ${farmerId}. Would you like to create a new farmer profile?`
          
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: response
          }])
          
          const aiResponseUrl = await generateTextToSpeech(response)
          if (aiResponseUrl) {
            setAudioUrl(aiResponseUrl)
            playAudio(aiResponseUrl)
          }
          setIdentificationStep('confirm_new')
        }
      } else {
        // No ID found in response, ask again
        const response = `I couldn't identify a Farmer ID in your message. Please provide your ID in the format KF followed by 3 digits (like KF001).`
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response
        }])
        
        const aiResponseUrl = await generateTextToSpeech(response)
        if (aiResponseUrl) {
          setAudioUrl(aiResponseUrl)
          playAudio(aiResponseUrl)
        }
      }
      
      // Set callEnded to false to indicate an ongoing conversation
      setCallEnded(false)
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

  // Process transcript
  const processTranscript = async (transcript: string) => {
    console.log('Processing transcript:', transcript)
    
    try {
      if (isIdentifying) {
        console.log('Currently in identification mode:', identificationStep)
        
        // Check for a farmer ID in the format KF### (3 digits)
        const idMatch = transcript.match(/\b(KF\d{3})\b/i)
        
        if (idMatch) {
          const farmerId = idMatch[1].toUpperCase()
          console.log(`Found potential farmer ID in transcript: ${farmerId}`)
          
          // Try to verify the ID
          const farmer = await getFarmerById(farmerId)
          
          if (farmer) {
            console.log(`Verified farmer: ${farmer["Farmer Name"] || '(No name)'} (${farmer["Farmer ID"]})`)
            setCurrentFarmer(farmer)
            
            // Check for initial issue stored
            const initialIssue = initialFarmerIssue || globalInitialIssue
            if (initialIssue) {
              console.log('Found initial issue to analyze after ID verification:', initialIssue)
              
              // Set a personalized greeting
              let welcomeMsg
              
              // If it's a stored issue and not just a greeting, mention it in the greeting
              if (!isGreeting(initialIssue)) {
                welcomeMsg = `Hello ${farmer["Farmer Name"] || `Farmer ${farmer["Farmer ID"]}`}! Let me help you with your issue about "${initialIssue.substring(0, 50)}${initialIssue.length > 50 ? '...' : ''}"`
              } else {
                // If it was just a greeting, respond appropriately without mentioning an "issue"
                welcomeMsg = `Hello ${farmer["Farmer Name"] || `Farmer ${farmer["Farmer ID"]}`}! How can I assist you today?`
              }
              
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: welcomeMsg
              }])
              
              // Generate and play the greeting
              const greetingUrl = await generateTextToSpeech(welcomeMsg)
              if (greetingUrl) {
                setAudioUrl(greetingUrl)
                playAudio(greetingUrl)
              }
              
              // Analyze the initial issue now that we have the farmer ID
              // Only analyze as an issue if it's not a greeting
              if (!isGreeting(initialIssue)) {
                const analysis = await analyzeTranscript(initialIssue, true) // Skip adding greeting message as we already have it
                if (analysis) {
                  // Add the analysis response
                  setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: analysis.summary,
                    categories: analysis.categories,
                    sentiment: analysis.sentiment,
                    needs_fertilizer: analysis.needs_fertilizer || false,
                    needs_seed_cane: analysis.needs_seed_cane || false,
                    needs_harvesting: analysis.needs_harvesting || false,
                    needs_ploughing: analysis.needs_ploughing || false,
                    has_crop_issues: analysis.has_crop_issues || false,
                    needs_pesticide: analysis.needs_pesticide || false,
                    resolved: analysis.resolved || false,
                    follow_up_required: analysis.follow_up_required || false,
                    priority: analysis.priority || 1
                  }])
                  
                  // Generate and play the analysis response
                  const aiResponseUrl = await generateSpeechResponse(analysis)
                  if (aiResponseUrl) {
                    setAudioUrl(aiResponseUrl)
                    playAudio(aiResponseUrl)
                  }
                }
              }
              
              // Clear the stored initial issue once processed
              setInitialFarmerIssue(null)
              globalInitialIssue = null
            } else {
              // No initial issue, just ask what they need help with
              await askForIssue(farmer)
            }
            
            // Reset identification flow
            setIsIdentifying(false)
            setIdentificationStep('none')
            return
          } else {
            console.log(`No farmer found with ID: ${farmerId}`)
            
            // Offer to create a new farmer profile
            const responseText = `I couldn't find a farmer with ID ${farmerId}. Would you like to create a new farmer profile?`
            
            // Add message to chat
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: responseText
            }])
            
            // Generate and play audio response
            const audioUrl = await generateTextToSpeech(responseText)
            if (audioUrl) {
              setAudioUrl(audioUrl)
              playAudio(audioUrl)
            }
            
            setIdentificationStep('confirm_new')
            return
          }
        }
        
        // If we're waiting for confirmation to create a new profile
        if (identificationStep === 'confirm_new') {
          const isAffirmative = /\b(yes|yeah|sure|ok|okay|create|new|profile)\b/i.test(transcript)
          
          if (isAffirmative) {
            console.log('User wants to create a new farmer profile')
            
            // Create a new farmer profile
            const farmerId = await createNewFarmer(transcript)
            
            if (farmerId) {
              // Fetch the newly created farmer
              const newFarmer = await getFarmerById(farmerId)
              
              if (newFarmer) {
                setCurrentFarmer(newFarmer)
                
                // Check for initial issue stored
                const initialIssue = initialFarmerIssue || globalInitialIssue
                if (initialIssue) {
                  // Process the initial issue with the new farmer profile
                  console.log('Processing initial issue with new farmer profile:', initialIssue)
                  
                  // Customize the welcome message based on whether it's a greeting or an issue
                  let welcomeMsg
                  if (!isGreeting(initialIssue)) {
                    welcomeMsg = `Hello ${newFarmer["Farmer Name"] || `Farmer ${newFarmer["Farmer ID"]}`}! I've created your profile. Now, let me help you with your issue about "${initialIssue.substring(0, 50)}${initialIssue.length > 50 ? '...' : ''}"`
                  } else {
                    welcomeMsg = `Hello ${newFarmer["Farmer Name"] || `Farmer ${newFarmer["Farmer ID"]}`}! I've created your profile. How can I assist you today?`
                  }
                  
                  setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: welcomeMsg
                  }])
                  
                  // Generate and play greeting
                  const greetingUrl = await generateTextToSpeech(welcomeMsg)
                  if (greetingUrl) {
                    setAudioUrl(greetingUrl)
                    playAudio(greetingUrl)
                  }
                  
                  // Only analyze as an issue if it's not just a greeting
                  if (!isGreeting(initialIssue)) {
                    // Analyze the initial issue
                    await analyzeTranscript(initialIssue)
                  }
                  
                  // Clear the stored initial issue
                  setInitialFarmerIssue(null)
                  globalInitialIssue = null
                } else {
                  await askForIssue(newFarmer)
                }
                
                // Reset identification flow
                setIsIdentifying(false)
                setIdentificationStep('none')
              } else {
                console.error('Failed to fetch newly created farmer:', farmerId)
                await askForFarmerId()
              }
            } else {
              console.error('Failed to create new farmer')
              await askForFarmerId()
            }
            return
          } else {
            // User doesn't want to create a new profile, ask for ID again
            await askForFarmerId()
            return
          }
        }
        
        // If we couldn't find an ID, ask specifically for it
        await askForFarmerId()
        return
      }
      
      // Regular conversation flow when farmer is already identified
      if (currentFarmer) {
        // Add message to chat
        setMessages(prev => [...prev, {
          role: 'user',
          content: transcript
        }])
        
        // Analyze the transcript
        await analyzeTranscript(transcript)
      } else {
        // Start by identifying the farmer but store their initial issue
        console.log('Starting farmer identification process, storing initial issue:', transcript)
        setInitialFarmerIssue(transcript)
        globalInitialIssue = transcript
        setIsIdentifying(true)
        await askForFarmerId()
      }
    } catch (error) {
      console.error('Error processing transcript:', error)
      toast({
        title: "Processing Error",
        description: "There was an error processing your message. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  // Ask for farmer ID
  const askForFarmerId = async () => {
    let responseText = "Please provide your farmer ID. It should be in the format KF followed by 3 digits, like KF001."
    
    // Check if we have an initial issue stored
    const initialIssue = initialFarmerIssue || globalInitialIssue
    if (initialIssue) {
      // Acknowledge that we've heard their issue but need their ID first
      responseText = `I understand you're asking about "${initialIssue.substring(0, 30)}${initialIssue.length > 30 ? '...' : ''}". First, please provide your farmer ID so I can help you better. It should be in the format KF followed by 3 digits, like KF001.`
    } else {
      // No initial issue - possibly just a greeting, use the default response
      responseText = "Please provide your farmer ID. It should be in the format KF followed by 3 digits, like KF001."
    }
    
    console.log("Asking for farmer ID:", responseText)
    
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: responseText
    }])
    
    // Generate and play audio response
    const audioUrl = await generateTextToSpeech(responseText)
    if (audioUrl) {
      setAudioUrl(audioUrl)
      playAudio(audioUrl)
    }
    
    setIdentificationStep('ask_id')
  }
  
  // Ask for issue after successful ID verification
  const askForIssue = async (farmer: Farmer) => {
    const welcomeMsg = `Hello ${farmer["Farmer Name"] || `Farmer ${farmer["Farmer ID"]}`}! How can I assist you today?`
    
    console.log("Asking farmer for issue:", welcomeMsg)
    
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: welcomeMsg
    }])
    
    // Generate and play audio response
    const audioUrl = await generateTextToSpeech(welcomeMsg)
    if (audioUrl) {
      setAudioUrl(audioUrl)
      playAudio(audioUrl)
    }
    
    // Reset identification flow now that we have the farmer
    setIsIdentifying(false)
    setIdentificationStep('none')
  }

  // Supabase API calls for farmer data
  const getFarmerById = async (farmerId: string): Promise<Farmer | null> => {
    try {
      const response = await fetch(`/api/farmers?id=${encodeURIComponent(farmerId)}`, {
        method: 'GET',
      })
      
      if (!response.ok) return null
      
      const data = await response.json()
      return data.farmer || null
    } catch (error) {
      console.error('Error fetching farmer by ID:', error)
      return null
    }
  }
  
  const searchFarmersByName = async (name: string): Promise<Farmer[]> => {
    try {
      const response = await fetch(`/api/farmers?name=${encodeURIComponent(name)}`, {
        method: 'GET',
      })
      
      if (!response.ok) return []
      
      const data = await response.json()
      return data.farmers || []
    } catch (error) {
      console.error('Error searching farmers by name:', error)
      return []
    }
  }
  
  const createNewFarmer = async (transcript: string): Promise<string> => {
    try {
      // Extract name from transcript using improved patterns
      let name = 'New Farmer'
      
      // Check for explicit name declarations with various formats
      const namePatterns = [
        // Match "my name is [Name]" with various terminators
        /my name is ([A-Za-z\s\-'.]+?)(?:[,.]|\s+(?:and|i'm|i am|calling|from|a farmer|with|about|having|regarding|concerning|we|my|very|quite|so|because)|\s*$)/i,
        
        // Match "I am [Name]" formats
        /(?:^|\s+)(?:I am|I'm) ([A-Za-z\s\-'.]+?)(?:[,.]|\s+(?:and|calling|from|a farmer|with|about|having|regarding|concerning|we|my|very|quite|so|because)|\s*$)/i,
        
        // Match "this is [Name]" formats
        /this is ([A-Za-z\s\-'.]+?)(?:[,.]|\s+(?:and|i'm|i am|calling|from|a farmer|with|about|having|regarding|concerning|we|my|very|quite|so|because)|\s*$)/i,
        
        // Match "Hello, I'm [Name]" formats
        /hello,?\s+(?:this is |i am |i'm |my name is )?([A-Za-z\s\-'.]+?)(?:[,.]|\s+(?:and|i'm|i am|calling|from|a farmer|with|about|having|regarding|concerning|we|my|very|quite|so|because)|\s*$)/i,
      ]
      
      for (const pattern of namePatterns) {
        const match = transcript.match(pattern)
        if (match && match[1] && match[1].trim().length > 1) {
          name = match[1].trim()
          break
        }
      }
      
      // If no name found, try to extract names using capitalized words
      if (name === 'New Farmer') {
        // Look for capitalized words that aren't at the beginning of sentences
        const capitalizedPattern = /(?:^|[.!?]\s+|\s+)([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)\b(?!\s+[Ff]armer)/;
        const capitalizedMatch = transcript.match(capitalizedPattern);
        
        if (capitalizedMatch && capitalizedMatch[1]) {
          name = capitalizedMatch[1].trim();
        }
      }
      
      const response = await fetch('/api/farmers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name,
          farmSize: 1.0,
          preferredLanguage: 'English',
          age: 35,
          gender: 'Unknown',
          location: 'Kisumu',
          gpsCoordinates: '(-0.09, 34.76)'
        }),
      })
      
      if (!response.ok) throw new Error('Failed to create new farmer')
      
      const data = await response.json()
      return data.farmerId
    } catch (error) {
      console.error('Error creating new farmer:', error)
      return ''
    }
  }
  
  // Generate text to speech without analysis for simple responses
  const generateTextToSpeech = async (text: string): Promise<string | null> => {
    try {
      // Determine which voice to use based on farmer gender
      let voiceId = femaleVoiceId; // Default to female voice
      
      if (currentFarmer?.gender) {
        const gender = currentFarmer.gender.toLowerCase();
        console.log(`Using ${gender} voice based on farmer gender`);
        if (gender === 'male') {
          voiceId = maleVoiceId;
        } else {
          voiceId = femaleVoiceId;
        }
      } else {
        console.log(`No gender specified for farmer, using default voice`);
      }
      
      const response = await fetch('/api/speak/simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId }),
      })
      
      if (!response.ok) {
        throw new Error(`Text-to-speech failed with status: ${response.status}`)
      }
      
      // Check for JSON fallback response
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        return null
      }
      
      // Process audio response
      const audioBlob = await response.blob()
      return URL.createObjectURL(audioBlob)
    } catch (error) {
      console.error('Error generating speech:', error)
      return null
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
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Transcription failed:', errorData);
        toast({
          title: "Transcription Failed",
          description: errorData.error || `Error (${response.status}): Could not transcribe audio`,
          variant: "destructive"
        });
        return null;
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
  const analyzeTranscript = async (text: string, skipAddingMessage = false) => {
    try {
      // Handle very short or vague messages gracefully
      if (!text || text.trim().length < 3) {
        const fallbackResponse = {
          summary: "I didn't quite catch that. Could you please say more about your farming concern?",
          categories: ["General"],
          sentiment: 0,
          needs_fertilizer: false,
          needs_seed_cane: false,
          needs_harvesting: false,
          needs_ploughing: false,
          has_crop_issues: false,
          needs_pesticide: false,
          resolved: false,
          follow_up_required: false,
          priority: 1,
          audioUrl: null
        };
        
        // Add fallback response to messages
        if (!skipAddingMessage) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: fallbackResponse.summary,
            categories: fallbackResponse.categories,
            sentiment: fallbackResponse.sentiment,
            needs_fertilizer: fallbackResponse.needs_fertilizer,
            needs_seed_cane: fallbackResponse.needs_seed_cane,
            needs_harvesting: fallbackResponse.needs_harvesting,
            needs_ploughing: fallbackResponse.needs_ploughing,
            has_crop_issues: fallbackResponse.has_crop_issues,
            needs_pesticide: fallbackResponse.needs_pesticide,
            resolved: fallbackResponse.resolved,
            follow_up_required: fallbackResponse.follow_up_required,
            priority: fallbackResponse.priority
          }]);
          
          // Generate simple speech for the fallback response
          const audioUrl = await generateTextToSpeech(fallbackResponse.summary);
          if (audioUrl) {
            setAudioUrl(audioUrl);
            playAudio(audioUrl);
          }
        }
        
        return fallbackResponse;
      }
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript: text,
          farmer: currentFarmer // Pass the current farmer's data for context
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Analysis failed:', errorData);
        toast({
          title: "Analysis Failed",
          description: errorData.error || `Error (${response.status}): Could not analyze message`,
          variant: "destructive"
        });
        return null;
      }
      
      const analysis = await response.json()
      
      // Log the complete analysis for debugging
      console.log('Analysis received from API:', analysis)
      
      // Ensure analysis has all required fields with defaults if missing
      const safeAnalysis = {
        summary: analysis.summary || "I understand your concern. Let me help you with that.",
        categories: analysis.categories || ["General"],
        sentiment: analysis.sentiment || 0,
        needs_fertilizer: analysis.needs_fertilizer || false,
        needs_seed_cane: analysis.needs_seed_cane || false,
        needs_harvesting: analysis.needs_harvesting || false,
        needs_ploughing: analysis.needs_ploughing || false,
        has_crop_issues: analysis.has_crop_issues || false,
        needs_pesticide: analysis.needs_pesticide || false,
        resolved: analysis.resolved || false,
        follow_up_required: analysis.follow_up_required || false,
        priority: analysis.priority || 1
      }
      
      // Generate audio for the response
      const audioUrl = await generateSpeechResponse(safeAnalysis)
      
      // Only add to messages if not skipped (used during farmer identification)
      if (!skipAddingMessage) {
        // Add AI response to messages with ALL properties from analysis
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: safeAnalysis.summary,
          categories: safeAnalysis.categories,
          sentiment: safeAnalysis.sentiment,
          needs_fertilizer: safeAnalysis.needs_fertilizer,
          needs_seed_cane: safeAnalysis.needs_seed_cane,
          needs_harvesting: safeAnalysis.needs_harvesting,
          needs_ploughing: safeAnalysis.needs_ploughing,
          has_crop_issues: safeAnalysis.has_crop_issues,
          needs_pesticide: safeAnalysis.needs_pesticide,
          resolved: safeAnalysis.resolved,
          follow_up_required: safeAnalysis.follow_up_required,
          priority: safeAnalysis.priority,
          audioUrl: audioUrl
        }])
        
        // Play the audio for this message
        if (audioUrl) {
          playAudio(audioUrl)
        }
      }
      
      return { ...safeAnalysis, audioUrl }
    } catch (error) {
      console.error('Error analyzing transcript:', error)
      
      // Create a graceful fallback response
      const fallbackResponse = {
        summary: "I'm having trouble understanding your request. Could you please rephrase that?",
        categories: ["General"],
        sentiment: 0,
        needs_fertilizer: false,
        needs_seed_cane: false,
        needs_harvesting: false,
        needs_ploughing: false,
        has_crop_issues: false,
        needs_pesticide: false,
        resolved: false,
        follow_up_required: false,
        priority: 1,
        audioUrl: null
      };
      
      if (!skipAddingMessage) {
        // Add fallback response to messages
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: fallbackResponse.summary,
          categories: fallbackResponse.categories,
          sentiment: fallbackResponse.sentiment,
          needs_fertilizer: fallbackResponse.needs_fertilizer,
          needs_seed_cane: fallbackResponse.needs_seed_cane,
          needs_harvesting: fallbackResponse.needs_harvesting,
          needs_ploughing: fallbackResponse.needs_ploughing,
          has_crop_issues: fallbackResponse.has_crop_issues,
          needs_pesticide: fallbackResponse.needs_pesticide,
          resolved: fallbackResponse.resolved,
          follow_up_required: fallbackResponse.follow_up_required,
          priority: fallbackResponse.priority
        }]);
        
        // Generate simple speech for the fallback
        const audioUrl = await generateTextToSpeech(fallbackResponse.summary);
        if (audioUrl) {
          setAudioUrl(audioUrl);
          playAudio(audioUrl);
        }
      }
      
      return fallbackResponse;
    }
  }

  // Save call data to database
  const saveCall = async () => {
    try {
      setIsSaving(true)
      
      // Find all user messages for this call
      const userTranscripts = messages
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .join('\n\n');
      
      // Find the last assistant message to get the final analysis
      const lastAssistantMessage = messages.findLast(msg => msg.role === 'assistant')
      
      if (!lastAssistantMessage) {
        console.error('No assistant message found to save')
        return
      }
      
      console.log('Saving call with all messages:', messages.length)
      
      // Prepare data in format expected by API, combining all interactions in this call
      const callData = {
        transcript: userTranscripts,
        summary: lastAssistantMessage.content,
        categories: lastAssistantMessage.categories || [],
        sentiment: lastAssistantMessage.sentiment || 0,
        needs_fertilizer: messages.some(msg => msg.role === 'assistant' && msg.needs_fertilizer) || false,
        needs_seed_cane: messages.some(msg => msg.role === 'assistant' && msg.needs_seed_cane) || false,
        needs_harvesting: messages.some(msg => msg.role === 'assistant' && msg.needs_harvesting) || false,
        needs_ploughing: messages.some(msg => msg.role === 'assistant' && msg.needs_ploughing) || false,
        has_crop_issues: messages.some(msg => msg.role === 'assistant' && msg.has_crop_issues) || false,
        needs_pesticide: messages.some(msg => msg.role === 'assistant' && msg.needs_pesticide) || false,
        resolved: lastAssistantMessage.resolved || false,
        follow_up_required: lastAssistantMessage.follow_up_required || false,
        priority: lastAssistantMessage.priority || 1,
        // Add farmer ID if available
        farmer_id: currentFarmer ? currentFarmer["Farmer ID"] : null
      }

      console.log('Saving complete call data:', callData)
      
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save call data')
      }
      
      toast({
        title: "Call Saved",
        description: "Call data has been saved successfully.",
      })
      
      setCallEnded(true)
    } catch (error) {
      console.error('Error saving call data:', error)
      toast({
        title: "Save Error",
        description: "Failed to save call data.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // End current call - this is the ONLY place where saveCall is triggered
  const endCall = async () => {
    if (messages.length === 0) {
      toast({
        title: "No Call to End",
        description: "Start a conversation first.",
        variant: "destructive"
      })
      return
    }
    
    // Save the entire conversation as a single call
    await saveCall()
    
    // Visual feedback that the call has been saved
    toast({
      title: "Call Ended",
      description: "The call has been saved. You can start a new conversation.",
    })
  }

  // Generate speech response
  const generateSpeechResponse = async (analysis: any): Promise<string | null> => {
    try {
      // Determine which voice to use based on farmer gender
      let voiceId = femaleVoiceId; // Default to female voice
      
      if (currentFarmer?.gender) {
        const gender = currentFarmer.gender.toLowerCase();
        console.log(`Using ${gender} voice based on farmer gender`);
        if (gender === 'male') {
          voiceId = maleVoiceId;
        } else {
          voiceId = femaleVoiceId;
        }
      } else {
        console.log(`No gender specified for farmer, using default voice`);
      }
      
      console.log('Calling /api/speak endpoint with analysis data and voice:', voiceId)
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis, voiceId }),
      })
      
      if (!response.ok) {
        console.error('Speech generation failed with status:', response.status)
        throw new Error(`Speech generation failed with status: ${response.status}`)
      }
      
      // Check for JSON fallback response
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        console.log('Received text fallback instead of audio')
        const textData = await response.json()
        toast({
          title: "Text Response",
          description: "Using text response as voice generation is unavailable.",
          variant: "default"
        })
        return null
      }
      
      // Process audio response
      console.log('Processing audio blob response')
      const audioBlob = await response.blob()
      return URL.createObjectURL(audioBlob)
    } catch (error) {
      console.error('Error generating speech:', error)
      toast({
        title: "Voice Generation Error",
        description: "Could not generate voice response. Using text response instead.",
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2">
          <Card className="h-full bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-950 dark:to-amber-950 border-emerald-200 dark:border-emerald-800 shadow-lg">
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
                              className={`px-2 py-1 text-xs rounded-full font-bold ${
                                category === 'Fertilizer' 
                                  ? 'bg-amber-800 text-white' 
                                  : category === 'Planting' 
                                    ? 'bg-emerald-800 text-white' 
                                    : 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200'
                              }`}
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
        </div>
        
        <div className="md:col-span-1">
          <CropHealthVisualization messages={messages} />
        </div>
      </div>
      <Toaster />
    </div>
  )
}


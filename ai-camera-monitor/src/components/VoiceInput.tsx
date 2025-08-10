'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface VoiceInputProps {
  onCommand?: (command: any) => void
  context?: string
  className?: string
}

export function VoiceInput({ onCommand, context = 'general', className = '' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      setIsSupported(!!SpeechRecognition)
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = 'en-US'
        
        recognition.onstart = () => {
          setIsListening(true)
          setTranscript('')
        }
        
        recognition.onresult = (event) => {
          const current = event.resultIndex
          const transcript = event.results[current][0].transcript
          setTranscript(transcript)
          
          if (event.results[current].isFinal) {
            processVoiceCommand(transcript)
          }
        }
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          toast.error('Voice recognition error: ' + event.error)
        }
        
        recognition.onend = () => {
          setIsListening(false)
        }
        
        recognitionRef.current = recognition
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const processVoiceCommand = async (transcript: string) => {
    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/voice/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          context,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to process voice command')
      }

      const result = await response.json()
      
      // Speak the response
      if (result.response) {
        await speakResponse(result.response)
      }
      
      // Execute the command
      if (onCommand) {
        onCommand(result)
      }
      
      toast.success(`Command processed: ${result.action || 'Unknown'}`)
      
    } catch (error) {
      console.error('Voice command processing error:', error)
      toast.error('Failed to process voice command')
    } finally {
      setIsProcessing(false)
      setTranscript('')
    }
  }

  const speakResponse = async (text: string) => {
    try {
      const response = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate speech')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.play()
      }
      
    } catch (error) {
      console.error('TTS error:', error)
      // Fallback to browser speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.8
        utterance.pitch = 1
        speechSynthesis.speak(utterance)
      }
    }
  }

  if (!isSupported) {
    return (
      <Card className={`${className} opacity-50`}>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            Voice input not supported in this browser
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`${className} transition-all duration-300`}>
      <div className="flex items-center justify-center gap-2">
        <Button
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing}
          className={`flex items-center gap-1 px-3 py-1 h-8 transition-all ${isListening ? 'ring-2 ring-red-500/20 bg-red-500 hover:bg-red-600' : 'hover:bg-blue-50'}`}
        >
          {isProcessing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : isListening ? (
            <MicOff className="h-3 w-3" />
          ) : (
            <Mic className="h-3 w-3" />
          )}
          <span className="text-xs">
            {isProcessing 
              ? 'Processing...' 
              : isListening 
                ? 'Stop' 
                : 'Voice'
            }
          </span>
        </Button>
        
        {isListening && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">Listening...</span>
          </div>
        )}
      </div>
      
      {transcript && (
        <div className="mt-2 text-center">
          <p className="text-xs bg-background/50 rounded p-2 border border-blue-200 inline-block">
            {transcript}
          </p>
        </div>
      )}
      
      <audio ref={audioRef} className="hidden" />
    </div>
  )
}

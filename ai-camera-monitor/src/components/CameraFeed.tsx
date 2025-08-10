'use client'

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import Webcam from 'react-webcam'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, Camera, Upload, Video, CheckCircle, Bug, X, Scissors } from 'lucide-react'
import { toast } from 'sonner'
import SAM2Segmentation from './SAM2Segmentation'

interface WatchTarget {
  description: string
  referenceImage?: string
  confidence: number
}

interface DetectionAlert {
  timestamp: Date
  detected: boolean
  confidence: number
  image: string
  message: string
}

interface CameraFeedProps {
  isMonitoring: boolean
  watchTarget: WatchTarget | null
  captureInterval: number
  onDetection: (alert: Omit<DetectionAlert, 'id'>) => void
  onMonitoringChange: (monitoring: boolean) => void
}

interface ApiLog {
  timestamp: string
  status: 'calling' | 'success' | 'error'
  duration?: number
  request?: any
  response?: any
  error?: string
}

export const CameraFeed = forwardRef<
  { captureFrame: () => void },
  CameraFeedProps
>(function CameraFeed({
  isMonitoring,
  watchTarget,
  captureInterval,
  onDetection,
  onMonitoringChange
}, ref) {
  const webcamRef = useRef<Webcam>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [lastCapture, setLastCapture] = useState<Date | null>(null)
  const [processingFrame, setProcessingFrame] = useState(false)
  const [inputType, setInputType] = useState<'webcam' | 'upload' | 'rtsp'>('webcam')
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Debug state
  const [showDebug, setShowDebug] = useState(false)
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([])
  const [currentApiCall, setCurrentApiCall] = useState<ApiLog | null>(null)
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null)

  // Motion detection state
  const [motionDetection, setMotionDetection] = useState(true)
  const [lastFrame, setLastFrame] = useState<string | null>(null)
  const [frameBuffer, setFrameBuffer] = useState<string[]>([])
  const [motionThreshold, setMotionThreshold] = useState(0.15)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // SAM2 segmentation state
  const [sam2Enabled, setSam2Enabled] = useState(false)
  const [lastSegmentationResult, setLastSegmentationResult] = useState<any>(null)
  const [segmentedImages, setSegmentedImages] = useState<string[]>([])
  const [useSegmentationForDetection, setUseSegmentationForDetection] = useState(true)

  const addApiLog = (log: ApiLog) => {
    setApiLogs(prev => [log, ...prev].slice(0, 10))
  }

  // Handle SAM2 segmentation results
  const handleSegmentationResult = useCallback((result: any, croppedImages: string[]) => {
    console.log('🎯 SAM2 segmentation result received:', result)
    setLastSegmentationResult(result)
    setSegmentedImages(croppedImages)

    if (useSegmentationForDetection && croppedImages.length > 0) {
      console.log(`🖼️ Got ${croppedImages.length} segmented regions for enhanced detection`)

      // Use the best segmented region for detection
      const bestSegmentIndex = result.scores.indexOf(Math.max(...result.scores))
      const bestSegmentImage = croppedImages[bestSegmentIndex]

      if (bestSegmentImage && watchTarget) {
        console.log(`🎯 Using best segment (score: ${result.scores[bestSegmentIndex].toFixed(3)}) for detection`)
        // You could trigger detection on the segmented region here
      }
    }
  }, [useSegmentationForDetection, watchTarget])

  // Motion detection function
  const detectMotion = useCallback(async (currentFrame: string): Promise<{ hasMotion: boolean; changePercent: number }> => {
    if (!lastFrame || !motionDetection) {
      return { hasMotion: true, changePercent: 100 }
    }

    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return { hasMotion: true, changePercent: 100 }

      canvas.width = 160
      canvas.height = 120

      const [img1, img2] = await Promise.all([
        new Promise<HTMLImageElement>((resolve) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.src = lastFrame
        }),
        new Promise<HTMLImageElement>((resolve) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.src = currentFrame
        })
      ])

      ctx.drawImage(img1, 0, 0, canvas.width, canvas.height)
      const data1 = ctx.getImageData(0, 0, canvas.width, canvas.height)

      ctx.drawImage(img2, 0, 0, canvas.width, canvas.height)
      const data2 = ctx.getImageData(0, 0, canvas.width, canvas.height)

      let diffPixels = 0
      const totalPixels = data1.data.length / 4

      for (let i = 0; i < data1.data.length; i += 4) {
        const diff = Math.abs(data1.data[i] - data2.data[i]) +
                    Math.abs(data1.data[i + 1] - data2.data[i + 1]) +
                    Math.abs(data1.data[i + 2] - data2.data[i + 2])

        if (diff > 30) {
          diffPixels++
        }
      }

      const changePercent = (diffPixels / totalPixels) * 100
      const hasMotion = changePercent > (motionThreshold * 100)

      console.log(`🎯 Motion Detection: ${changePercent.toFixed(1)}% change, Motion: ${hasMotion}`)
      return { hasMotion, changePercent }
    } catch (error) {
      console.error('Motion detection error:', error)
      return { hasMotion: true, changePercent: 100 }
    }
  }, [lastFrame, motionDetection, motionThreshold])

  // Enhanced prompt for complex actions
  const createComplexPrompt = (target: WatchTarget, frames: string[]) => {
    const isComplexAction = target.description.includes('falling') ||
                           target.description.includes('breaking') ||
                           target.description.includes('distress') ||
                           target.description.includes('suspicious') ||
                           target.description.includes('climbing') ||
                           target.description.includes('weapon') ||
                           target.description.includes('emergency') ||
                           target.description.includes('unconscious') ||
                           target.description.includes('collapsed')

    if (isComplexAction && frames.length > 1) {
      return `You are an advanced AI security system analyzing ${frames.length} consecutive video frames for: "${target.description}"

CONTEXT: These frames are captured 2 seconds apart. Look for:
- MOTION PATTERNS: Changes in body position, movement direction
- BEHAVIORAL CUES: Unusual postures, actions, or interactions
- ENVIRONMENTAL CHANGES: Broken objects, displaced items
- EMERGENCY INDICATORS: People on ground, distress signals, weapons

ANALYSIS INSTRUCTIONS:
1. Compare frames to understand the sequence of events
2. Look for the specific target behavior across the timespan
3. Consider context: lighting, setting, normal vs abnormal activity
4. Be especially sensitive to safety-critical situations

TARGET TO DETECT: ${target.description}
CONFIDENCE THRESHOLD: ${target.confidence}

Respond ONLY with valid JSON:
{
  "detected": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "detailed explanation of what you observed across the frames",
  "urgency": "low/medium/high",
  "recommended_action": "brief action recommendation if detected"
}`
    } else {
      return `You are an AI security monitoring system analyzing this image for: "${target.description}"

Look carefully for the specified target. Consider:
- Object/person identification and behavior
- Environmental context and setting
- Any signs of the described situation

Respond ONLY with valid JSON:
{
  "detected": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of what you see"
}`
    }
  }

  const captureFrame = useCallback(async () => {
    if (!watchTarget || processingFrame) return

    let imageDataUrl: string | null = null

    if (inputType === 'webcam' && webcamRef.current) {
      imageDataUrl = webcamRef.current.getScreenshot()
    } else if (inputType === 'upload' && videoRef.current) {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (ctx) {
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        ctx.drawImage(videoRef.current, 0, 0)
        imageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
      }
    }

    if (!imageDataUrl) return

    // Store the captured image for SAM2
    setLastCapturedImage(imageDataUrl)

    // Update frame buffer for multi-frame analysis
    const newFrameBuffer = [...frameBuffer, imageDataUrl].slice(-3)
    setFrameBuffer(newFrameBuffer)

    // Motion detection for API optimization
    let shouldAnalyze = true
    let motionData = { hasMotion: true, changePercent: 100 }

    if (motionDetection && lastFrame) {
      try {
        motionData = await detectMotion(imageDataUrl)
        shouldAnalyze = motionData.hasMotion

        if (!shouldAnalyze) {
          console.log('🔇 Skipping API call - No significant motion detected')
          setLastCapture(new Date())
          setLastFrame(imageDataUrl)
          return
        }
      } catch (error) {
        console.error('Motion detection failed:', error)
      }
    }

    setProcessingFrame(true)
    setLastCapture(new Date())
    setLastFrame(imageDataUrl)

    // Determine if this is a complex action requiring multi-frame analysis
    const isComplexAction = watchTarget.description.includes('falling') ||
                           watchTarget.description.includes('breaking') ||
                           watchTarget.description.includes('distress') ||
                           watchTarget.description.includes('suspicious') ||
                           watchTarget.description.includes('climbing') ||
                           watchTarget.description.includes('weapon') ||
                           watchTarget.description.includes('emergency') ||
                           watchTarget.description.includes('unconscious') ||
                           watchTarget.description.includes('collapsed')

    // For complex actions, wait for multiple frames before analysis
    if (isComplexAction && newFrameBuffer.length < 2) {
      console.log('🎬 Complex action detected - waiting for more frames...')
      setProcessingFrame(false)
      return
    }

    // Start API call logging
    const startTime = Date.now()
    const callLog: ApiLog = {
      timestamp: new Date().toISOString(),
      status: 'calling',
      request: {
        target: watchTarget.description,
        confidence: watchTarget.confidence,
        hasReferenceImage: !!watchTarget.referenceImage,
        isComplexAction,
        frameCount: isComplexAction ? newFrameBuffer.length : 1,
        motionDetected: motionData.hasMotion,
        motionPercent: motionData.changePercent.toFixed(1),
        sam2Enabled: sam2Enabled,
        segmentsCount: lastSegmentationResult?.masks?.length || 0,
        usingSegmentation: sam2Enabled && segmentedImages.length > 0
      }
    }

    setCurrentApiCall(callLog)
    addApiLog(callLog)

    try {
      console.log('🚀 [FRONTEND] Starting OpenAI API call for target:', watchTarget.description)
      console.log('📊 Motion detected:', motionData.hasMotion, `(${motionData.changePercent.toFixed(1)}% change)`)
      console.log('🎬 Complex action:', isComplexAction, '| Frames:', isComplexAction ? newFrameBuffer.length : 1)

      const response = await fetch('/api/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageDataUrl,
          frames: isComplexAction ? newFrameBuffer : [imageDataUrl],
          target: watchTarget,
          isComplexAction,
          motionData,
          prompt: createComplexPrompt(watchTarget, isComplexAction ? newFrameBuffer : [imageDataUrl])
        })
      })

      const duration = Date.now() - startTime
      console.log(`⏱️ [FRONTEND] API call completed in ${duration}ms`)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ [FRONTEND] API Response:', result)

        const successLog: ApiLog = {
          ...callLog,
          status: 'success',
          duration,
          response: {
            detected: result.detected,
            confidence: result.confidence,
            reasoning: result.reasoning,
            urgency: result.urgency || 'low',
            recommendedAction: result.recommended_action,
            debug: result.debug
          }
        }
        setCurrentApiCall(successLog)
        addApiLog(successLog)

        const alertData = {
          timestamp: new Date(),
          detected: result.detected,
          confidence: result.confidence,
          image: imageDataUrl,
          message: result.detected
            ? `🚨 ${watchTarget.description} detected! (${(result.confidence * 100).toFixed(1)}% confidence)`
            : 'No detection'
        }

        onDetection(alertData)

        // Enhanced alerts for complex/urgent situations
        if (result.detected) {
          const isUrgent = result.urgency === 'high'

          // Play more urgent sound for high-priority alerts
          try {
            const audio = new Audio('/notification.mp3')
            audio.volume = isUrgent ? 0.7 : 0.3
            if (isUrgent) {
              audio.play().then(() => {
                setTimeout(() => audio.play().catch(() => {}), 500)
              }).catch(() => {})
            } else {
              audio.play().catch(() => {})
            }
          } catch {}

          toast.success(`${isUrgent ? 'URGENT' : 'DETECTION'} ALERT!`, {
            description: (
              <div className="space-y-2">
                <div className={`font-semibold ${isUrgent ? 'text-red-700' : 'text-green-700'}`}>
                  {watchTarget.description} detected!
                </div>
                <div className="text-sm space-y-1">
                  <div>Confidence: {(result.confidence * 100).toFixed(1)}%</div>
                  <div>Urgency: {result.urgency || 'low'}</div>
                  {result.recommended_action && (
                    <div className="font-medium text-blue-700">
                      Action: {result.recommended_action}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Motion: {motionData.changePercent.toFixed(1)}% | Duration: {duration}ms | {new Date().toLocaleTimeString()}
                </div>
              </div>
            ),
            icon: isUrgent ? <CheckCircle className="h-5 w-5 text-red-600" /> : <CheckCircle className="h-5 w-5 text-green-600" />,
            duration: isUrgent ? 12000 : 8000,
            action: {
              label: 'View Details',
              onClick: () => setShowDebug(true)
            },
            style: {
              backgroundColor: isUrgent ? '#fef2f2' : '#f0fdf4',
              borderColor: isUrgent ? '#dc2626' : '#16a34a',
              borderWidth: '2px'
            }
          })
        }
      } else {
        const errorData = await response.json()
        console.error('❌ [FRONTEND] API Error Response:', errorData)
        console.error('❌ [FRONTEND] Response Status:', response.status)
        console.error('❌ [FRONTEND] Response Headers:', Object.fromEntries(response.headers.entries()))

        const errorLog: ApiLog = {
          ...callLog,
          status: 'error',
          duration: Date.now() - startTime,
          error: `${response.status}: ${errorData.error || 'Unknown error'}`,
          response: {
            statusCode: response.status,
            errorDetails: errorData.details || 'No details provided',
            fullError: errorData
          }
        }
        setCurrentApiCall(errorLog)
        addApiLog(errorLog)

        // Show detailed error in toast
        toast.error(`API Error (${response.status})`, {
          description: (
            <div className="space-y-1">
              <div className="font-medium text-red-700">
                {errorData.error || 'Unknown API error'}
              </div>
              {errorData.details && (
                <div className="text-sm text-red-600">
                  Details: {errorData.details}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Status: {response.status} | Duration: {Date.now() - startTime}ms
              </div>
            </div>
          ),
          duration: 8000,
          action: {
            label: 'Show Debug',
            onClick: () => setShowDebug(true)
          }
        })

        throw new Error(`${response.status}: ${errorData.error || 'API request failed'}`)
      }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error('💥 [FRONTEND] Detection error after', duration + 'ms:', error)
      console.error('💥 [FRONTEND] Error type:', typeof error)
      console.error('💥 [FRONTEND] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })

      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorLog: ApiLog = {
        ...callLog,
        status: 'error',
        duration,
        error: errorMessage,
        response: {
          errorType: typeof error,
          errorName: error instanceof Error ? error.name : 'Unknown',
          fullError: error instanceof Error ? {
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 5).join('\n') // First 5 lines of stack
          } : String(error)
        }
      }
      setCurrentApiCall(errorLog)
      addApiLog(errorLog)

      toast.error('Detection Error', {
        description: (
          <div className="space-y-1">
            <div className="font-medium text-red-700">
              {errorMessage}
            </div>
            <div className="text-xs text-muted-foreground">
              Duration: {duration}ms | Click 'Show Debug' for details
            </div>
          </div>
        ),
        duration: 6000,
        action: {
          label: 'Show Debug',
          onClick: () => setShowDebug(true)
        }
      })
    } finally {
      setProcessingFrame(false)
      setCurrentApiCall(null)
    }
  }, [watchTarget, processingFrame, inputType, onDetection, frameBuffer, lastFrame, motionDetection, detectMotion, createComplexPrompt])

  useEffect(() => {
    if (isMonitoring && watchTarget) {
      intervalRef.current = setInterval(captureFrame, captureInterval * 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isMonitoring, watchTarget, captureInterval, captureFrame])

  // Expose captureFrame function to parent component
  useImperativeHandle(ref, () => ({
    captureFrame
  }), [captureFrame])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file)
      setUploadedVideo(url)
      setInputType('upload')
      toast.success('Video uploaded', {
        description: 'Video file loaded successfully'
      })
    }
  }

  const toggleMonitoring = () => {
    if (!watchTarget) {
      toast.warning('Setup Required', {
        description: 'Please configure a watch target first!',
        duration: 4000
      })
      return
    }

    const newState = !isMonitoring
    onMonitoringChange(newState)

    if (newState) {
      toast.success('Monitoring Started', {
        description: `Watching for: ${watchTarget.description}`,
        duration: 3000
      })
    } else {
      toast.info('Monitoring Stopped', {
        description: 'Camera monitoring has been paused',
        duration: 2000
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={inputType === 'webcam' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInputType('webcam')}
          >
            <Camera className="h-4 w-4 mr-2" />
            Webcam
          </Button>
          <Button
            variant={inputType === 'upload' ? 'default' : 'outline'}
            size="sm"
            onClick={() => document.getElementById('video-upload')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Video
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMotionDetection(!motionDetection)}
          >
            {motionDetection ? '🎯' : '🔇'} Motion Filter
          </Button>
          <Button
            variant={sam2Enabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSam2Enabled(!sam2Enabled)}
          >
            <Scissors className="h-4 w-4 mr-1" />
            SAM2
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const response = await fetch('/api/health')
                const health = await response.json()
                console.log('🏥 Health check result:', health)

                if (response.ok && health.api?.openaiKeyValid) {
                  toast.success('API Health Check Passed', {
                    description: (
                      <div className="space-y-1">
                        <div>OpenAI API key: Valid</div>
                        <div>Status: {health.status}</div>
                        <div className="text-xs">Key: {health.api.openaiKeyPreview}</div>
                      </div>
                    ),
                    duration: 4000
                  })
                } else {
                  toast.error('API Health Check Failed', {
                    description: (
                      <div className="space-y-1">
                        <div>OpenAI API key: {health.api?.openaiKeyConfigured ? 'Configured' : 'Missing'}</div>
                        <div>Valid format: {health.api?.openaiKeyValid ? 'Yes' : 'No'}</div>
                        {!health.api?.openaiKeyValid && (
                          <div className="text-xs text-red-600">
                            Keys should start with "sk-"
                          </div>
                        )}
                      </div>
                    ),
                    duration: 6000
                  })
                }
              } catch (error) {
                console.error('Health check failed:', error)
                toast.error('Health Check Failed', {
                  description: 'Could not connect to API endpoint',
                  duration: 4000
                })
              }
            }}
          >
            🏥 API Health
          </Button>
          <Button
            variant={showDebug ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
          >
            <Bug className="h-4 w-4 mr-2" />
            {showDebug ? 'Hide' : 'Show'} Debug
          </Button>
        </div>
      </div>

      <input
        id="video-upload"
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Debug Panel */}
      {showDebug && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Enhanced Debug Panel - Motion Detection & Complex Actions
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowDebug(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Motion Detection Status */}
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded text-xs">
              <strong>Motion Detection:</strong> {motionDetection ? '✅ Enabled' : '❌ Disabled'} |
              <strong> Threshold:</strong> {(motionThreshold * 100).toFixed(0)}% |
              <strong> Frame Buffer:</strong> {frameBuffer.length}/3
            </div>

            {/* SAM2 Status */}
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded text-xs">
              <strong>SAM2 Segmentation:</strong> {sam2Enabled ? '✅ Enabled' : '❌ Disabled'} |
              <strong> Segments:</strong> {lastSegmentationResult?.masks?.length || 0} |
              <strong> Best Score:</strong> {lastSegmentationResult?.scores ? Math.max(...lastSegmentationResult.scores).toFixed(3) : 'N/A'}
            </div>

            {/* Current API Call */}
            {currentApiCall && (
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded border border-yellow-300">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">
                    {currentApiCall.request?.isComplexAction ? '🎬 Complex Action Analysis...' : '🔍 Standard Detection...'}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <div><strong>Target:</strong> {currentApiCall.request?.target}</div>
                  <div><strong>Frames:</strong> {currentApiCall.request?.frameCount}</div>
                  <div><strong>Motion:</strong> {currentApiCall.request?.motionDetected ? '✅' : '❌'} ({currentApiCall.request?.motionPercent}%)</div>
                </div>
              </div>
            )}

            {/* API Call History */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {apiLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No API calls yet. Start monitoring to see enhanced debug info.
                </p>
              ) : (
                apiLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border text-xs ${
                      log.status === 'success'
                        ? 'bg-green-100 border-green-300 dark:bg-green-900/20'
                        : log.status === 'error'
                        ? 'bg-red-100 border-red-300 dark:bg-red-900/20'
                        : 'bg-gray-100 border-gray-300 dark:bg-gray-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex gap-2">
                        <Badge variant={log.status === 'success' ? 'default' : log.status === 'error' ? 'destructive' : 'secondary'}>
                          {log.status}
                        </Badge>
                        {log.request?.isComplexAction && <Badge variant="outline">COMPLEX</Badge>}
                        {log.request?.sam2Enabled && <Badge variant="outline">SAM2</Badge>}
                      </div>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>

                    <div className="space-y-1">
                      <div><strong>Target:</strong> {log.request?.target}</div>
                      <div><strong>Frames:</strong> {log.request?.frameCount} | <strong>Motion:</strong> {log.request?.motionPercent}%</div>
                      {log.request?.sam2Enabled && (
                        <div><strong>SAM2:</strong> {log.request.segmentsCount} segments | {log.request.usingSegmentation ? '✅ Used' : '❌ Not used'}</div>
                      )}
                      {log.duration && <div><strong>Duration:</strong> {log.duration}ms</div>}

                      {log.response && (
                        <div className="space-y-1">
                          <div><strong>Detected:</strong> {log.response.detected ? '✅ Yes' : '❌ No'}</div>
                          <div><strong>Confidence:</strong> {(log.response.confidence * 100).toFixed(1)}%</div>
                          {log.response.urgency && <div><strong>Urgency:</strong> {log.response.urgency}</div>}
                          <div><strong>Reasoning:</strong> {log.response.reasoning}</div>
                          {log.response.recommendedAction && (
                            <div><strong>Action:</strong> {log.response.recommendedAction}</div>
                          )}
                        </div>
                      )}

                      {log.error && (
                        <div className="text-red-700 dark:text-red-300 space-y-1">
                          <div><strong>Error:</strong> {log.error}</div>
                          {log.response?.statusCode && (
                            <div><strong>Status Code:</strong> {log.response.statusCode}</div>
                          )}
                          {log.response?.errorDetails && (
                            <div><strong>Details:</strong> {log.response.errorDetails}</div>
                          )}
                          {log.response?.errorType && (
                            <div><strong>Error Type:</strong> {log.response.errorType}</div>
                          )}
                          {log.response?.fullError?.stack && (
                            <div className="text-xs">
                              <strong>Stack:</strong>
                              <pre className="mt-1 text-xs bg-red-50 dark:bg-red-900/20 p-1 rounded overflow-x-auto">
                                {log.response.fullError.stack}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Display */}
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        {inputType === 'webcam' ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover"
            onUserMediaError={(error) => {
              setCameraError('Failed to access camera. Please check permissions.')
              console.error('Camera error:', error)
            }}
          />
        ) : inputType === 'upload' && uploadedVideo ? (
          <video
            ref={videoRef}
            src={uploadedVideo}
            controls
            className="w-full h-full object-cover"
            onLoadedData={() => setCameraError(null)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Video className="h-12 w-12 mx-auto mb-2" />
              <p>Select a camera source</p>
            </div>
          </div>
        )}

        {/* Status Overlays */}
        {isMonitoring && (
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <Badge variant="destructive">MONITORING</Badge>
            {processingFrame && (
              <Badge variant="secondary" className="ml-2">
                {currentApiCall?.request?.isComplexAction ? 'COMPLEX ANALYSIS...' : 'AI PROCESSING...'}
              </Badge>
            )}
          </div>
        )}

        {currentApiCall && (
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="animate-pulse">
              {currentApiCall.request?.isComplexAction ? '🎬 Multi-Frame Analysis' : '🤖 OpenAI API Call'}
            </Badge>
          </div>
        )}
      </div>

      {cameraError && (
        <Card className="p-4 border-destructive">
          <p className="text-sm text-destructive">{cameraError}</p>
        </Card>
      )}

      {/* SAM2 Segmentation Component */}
      {sam2Enabled && lastCapturedImage && (
        <SAM2Segmentation
          imageDataUrl={lastCapturedImage}
          onSegmentationResult={handleSegmentationResult}
          enabled={sam2Enabled}
          onEnabledChange={setSam2Enabled}
        />
      )}

      {/* Control Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={toggleMonitoring}
            variant={isMonitoring ? 'destructive' : 'default'}
            disabled={!watchTarget}
          >
            {isMonitoring ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Monitoring
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Monitoring
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={captureFrame}
            disabled={!watchTarget || processingFrame}
          >
            <Camera className="h-4 w-4 mr-2" />
            Test Capture
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {lastCapture && (
            <span>Last capture: {lastCapture.toLocaleTimeString()}</span>
          )}
          {apiLogs.length > 0 && (
            <span className="ml-4">
              API calls: {apiLogs.filter(l => l.status === 'success').length}/{apiLogs.length}
            </span>
          )}
        </div>
      </div>
    </div>
  )
})

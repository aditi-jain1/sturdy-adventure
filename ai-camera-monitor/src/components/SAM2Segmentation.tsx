'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Scissors,
  Play,
  Pause,
  Download,
  Settings,
  Loader2,
  Zap,
  Target,
  Eye,
  EyeOff,
  Cpu,
  Gpu,
  AlertCircle
} from 'lucide-react'
import { sam2Service, SAM2Service, SAM2Point, SAM2Mask, SAM2Result, initializeSAM2 } from '@/services/sam2Service'
import { toast } from 'sonner'

interface SAM2SegmentationProps {
  imageDataUrl: string | null
  onSegmentationResult?: (result: SAM2Result, croppedImages: string[]) => void
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
}

export function SAM2Segmentation({
  imageDataUrl,
  onSegmentationResult,
  enabled,
  onEnabledChange
}: SAM2SegmentationProps) {
  // State management
  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showMasks, setShowMasks] = useState(true)
  const [useWebGPU, setUseWebGPU] = useState(true)
  const [currentMasks, setCurrentMasks] = useState<SAM2Mask[]>([])
  const [clickPoints, setClickPoints] = useState<SAM2Point[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState({
    initTime: 0,
    encodeTime: 0,
    segmentTime: 0,
    totalTime: 0
  })

  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    callCount: 0,
    lastClickTime: null as Date | null,
    lastSegmentationTime: null as Date | null,
    serviceCallsLog: [] as string[]
  })

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const addDebugLog = (message: string) => {
    setDebugInfo(prev => ({
      ...prev,
      serviceCallsLog: [`${new Date().toISOString()}: ${message}`, ...prev.serviceCallsLog].slice(0, 10)
    }))
  }

  const initializeSAM2Model = useCallback(async () => {
    setIsInitializing(true)
    const startTime = Date.now()

    try {
      console.log('🚀 [SAM2-UI] Starting SAM2 initialization...')
      addDebugLog('Starting SAM2 initialization')

      // Configure the global sam2Service instance
      sam2Service.updateConfig({
        modelSize: 'tiny',
        useWebGPU,
        multimaskOutput: true
      })

      // Initialize the global sam2Service instance
      await sam2Service.initialize()

      const initTime = Date.now() - startTime
      setPerformanceMetrics(prev => ({ ...prev, initTime }))

      // Verify service is ready
      const isServiceReady = sam2Service.isReady()
      console.log('🔍 [SAM2-UI] SAM2 service ready check:', isServiceReady)
      addDebugLog(`SAM2 service ready: ${isServiceReady}`)

      setIsInitialized(isServiceReady)

      // Check if we're in demo mode
      const isDemoMode = initTime < 50 // Demo mode initializes very quickly

      toast.success(isDemoMode ? 'SAM2 Demo Mode Ready!' : 'SAM2 Initialized!', {
        description: isDemoMode
          ? 'Demo segmentation active - add ONNX models for full functionality'
          : `Ready for segmentation (${initTime}ms)`,
        duration: isDemoMode ? 6000 : 4000
      })

      console.log(`✅ [SAM2-UI] SAM2 initialized in ${initTime}ms`)
      addDebugLog(`Initialization completed in ${initTime}ms (${isDemoMode ? 'Demo Mode' : 'Full Mode'})`)
    } catch (error) {
      console.error('❌ [SAM2-UI] SAM2 initialization failed:', error)
      addDebugLog(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsInitialized(false)

      toast.error('SAM2 Initialization Failed', {
        description: (
          <div className="space-y-1">
            <div className="text-sm">
              {error instanceof Error ? error.message : 'Unknown error'}
            </div>
            <div className="text-xs text-muted-foreground">
              Check browser console for details. Falling back to OpenAI-only mode.
            </div>
          </div>
        ),
        duration: 8000
      })
    } finally {
      setIsInitializing(false)
    }
  }, [useWebGPU])

  // Initialize SAM2 when enabled
  useEffect(() => {
    if (enabled && !isInitialized && !isInitializing) {
      console.log('🔄 [SAM2-UI] Auto-initializing SAM2...')
      addDebugLog('Auto-initializing SAM2 on enable')
      initializeSAM2Model()
    }
  }, [enabled, isInitialized, isInitializing, initializeSAM2Model])

  // Handle canvas clicks for point prompts
  const handleCanvasClick = useCallback(async (event: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('🖱️ [SAM2-UI] Canvas click detected')
    console.log('🖱️ [SAM2-UI] State check:', {
      isInitialized,
      hasImageData: !!imageDataUrl,
      isProcessing,
      currentPoints: clickPoints.length
    })

    setDebugInfo(prev => ({
      ...prev,
      lastClickTime: new Date(),
      callCount: prev.callCount + 1
    }))

    addDebugLog(`Canvas click #${debugInfo.callCount + 1} - Button: ${event.button}`)

    if (!isInitialized || !imageDataUrl || isProcessing) {
      console.log('🖱️ [SAM2-UI] Click ignored - prerequisites not met')
      addDebugLog('Click ignored: not ready for segmentation')
      return
    }

    const canvas = canvasRef.current
    if (!canvas) {
      console.log('🖱️ [SAM2-UI] No canvas reference found')
      addDebugLog('Click ignored: no canvas reference')
      return
    }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY

    console.log('🖱️ [SAM2-UI] Click coordinates:', {
      clientX: event.clientX,
      clientY: event.clientY,
      canvasX: x,
      canvasY: y,
      button: event.button
    })

    // Add point (positive prompt for left click, negative for right click)
    const newPoint: SAM2Point = {
      x,
      y,
      label: event.button === 2 ? 0 : 1 // Right click = negative prompt
    }

    const updatedPoints = [...clickPoints, newPoint]
    console.log('🖱️ [SAM2-UI] Adding new point:', newPoint)
    console.log('🖱️ [SAM2-UI] Updated points array:', updatedPoints)
    addDebugLog(`Added ${newPoint.label === 1 ? 'positive' : 'negative'} point at (${x.toFixed(0)}, ${y.toFixed(0)})`)
    setClickPoints(updatedPoints)

    // Perform segmentation
    console.log('🖱️ [SAM2-UI] Starting segmentation with updated points...')
    await performSegmentation(updatedPoints)
  }, [isInitialized, imageDataUrl, isProcessing, clickPoints, debugInfo.callCount])

  // Prevent context menu on right click
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
  }, [])

  const performSegmentation = async (points: SAM2Point[]) => {
    console.log('🎯 [SAM2-UI] performSegmentation called')
    console.log('🎯 [SAM2-UI] Parameters:', {
      isInitialized,
      hasImageData: !!imageDataUrl,
      pointsLength: points.length,
      points: points
    })

    setDebugInfo(prev => ({
      ...prev,
      lastSegmentationTime: new Date()
    }))

    addDebugLog(`Starting segmentation with ${points.length} points`)

    if (!isInitialized || !imageDataUrl || points.length === 0) {
      console.log('🎯 [SAM2-UI] Segmentation skipped - prerequisites not met')
      addDebugLog('Segmentation skipped: prerequisites not met')
      return
    }

    // Double-check service is ready
    console.log('🎯 [SAM2-UI] Checking if SAM2 service is ready...')
    const serviceReady = sam2Service.isReady()
    console.log('🎯 [SAM2-UI] Service ready status:', serviceReady)
    addDebugLog(`Service ready check: ${serviceReady}`)

    if (!serviceReady) {
      console.error('❌ [SAM2-UI] SAM2 service not ready for segmentation')
      addDebugLog('ERROR: SAM2 service not ready for segmentation')
      toast.error('SAM2 Not Ready', {
        description: 'Please initialize SAM2 first by clicking the Initialize button',
        duration: 4000
      })
      return
    }

    setIsProcessing(true)
    const totalStartTime = Date.now()
    console.log('🎯 [SAM2-UI] Starting segmentation process...')

    try {
      console.log(`🎯 [SAM2-UI] Starting segmentation with ${points.length} points...`)
      console.log('✅ [SAM2-UI] SAM2 service verified ready')

      // Convert image data
      console.log('🎯 [SAM2-UI] Converting screenshot to ImageData...')
      addDebugLog('Converting screenshot to ImageData')
      const imageData = await SAM2Service.screenshotToImageData(imageDataUrl)
      console.log('🎯 [SAM2-UI] ImageData conversion complete:', {
        width: imageData.width,
        height: imageData.height
      })

      // Encode image
      console.log('🎯 [SAM2-UI] Starting image encoding...')
      addDebugLog('Starting image encoding')
      const encodeStartTime = Date.now()
      await sam2Service.encodeImage(imageData)
      const encodeTime = Date.now() - encodeStartTime
      console.log('🎯 [SAM2-UI] Image encoding completed in', encodeTime, 'ms')
      addDebugLog(`Image encoding completed in ${encodeTime}ms`)

      // Segment with points
      console.log('🎯 [SAM2-UI] Starting segmentation...')
      addDebugLog('Starting segmentation inference')
      const segmentStartTime = Date.now()
      const result = await sam2Service.segment(points)
      const segmentTime = Date.now() - segmentStartTime
      console.log('🎯 [SAM2-UI] Segmentation completed in', segmentTime, 'ms')
      console.log('🎯 [SAM2-UI] Segmentation result:', result)
      addDebugLog(`Segmentation completed in ${segmentTime}ms, found ${result.masks.length} masks`)

      const totalTime = Date.now() - totalStartTime

      // Update performance metrics
      setPerformanceMetrics(prev => ({
        ...prev,
        encodeTime,
        segmentTime,
        totalTime
      }))

      // Store masks
      console.log('🎯 [SAM2-UI] Storing', result.masks.length, 'masks')
      setCurrentMasks(result.masks)

      // Draw masks if enabled
      if (showMasks) {
        console.log('🎯 [SAM2-UI] Drawing masks on canvas...')
        addDebugLog('Drawing masks on canvas')
        drawMasks(result.masks)
      } else {
        console.log('🎯 [SAM2-UI] Mask display disabled - skipping drawing')
        addDebugLog('Mask display disabled')
      }

      // Generate cropped images
      console.log('🎯 [SAM2-UI] Generating cropped images...')
      const croppedImages = generateCroppedImages(result.masks, imageData)
      console.log('🎯 [SAM2-UI] Generated', croppedImages.length, 'cropped images')
      addDebugLog(`Generated ${croppedImages.length} cropped images`)

      // Notify parent component
      if (onSegmentationResult) {
        console.log('🎯 [SAM2-UI] Notifying parent component with results...')
        addDebugLog('Notifying parent component with results')
        onSegmentationResult(result, croppedImages)
      } else {
        console.log('🎯 [SAM2-UI] No parent callback provided')
        addDebugLog('No parent callback provided')
      }

      console.log(`✅ [SAM2-UI] Complete segmentation pipeline finished in ${totalTime}ms`)
      console.log(`📊 [SAM2-UI] Performance breakdown: Encode ${encodeTime}ms, Segment ${segmentTime}ms, Total ${totalTime}ms`)
      addDebugLog(`Complete pipeline finished in ${totalTime}ms`)

      toast.success('Segmentation Complete!', {
        description: (
          <div className="space-y-1">
            <div>Found {result.masks.length} segments</div>
            <div className="text-xs">
              Best score: {Math.max(...result.scores).toFixed(3)} | {totalTime}ms
            </div>
          </div>
        ),
        duration: 3000
      })

    } catch (error) {
      console.error('❌ [SAM2-UI] Segmentation failed:', error)
      console.error('❌ [SAM2-UI] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      addDebugLog(`ERROR: Segmentation failed - ${error instanceof Error ? error.message : 'Unknown error'}`)

      toast.error('Segmentation Failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 5000
      })
    } finally {
      setIsProcessing(false)
      console.log('🎯 [SAM2-UI] Segmentation process completed (finally block)')
      addDebugLog('Segmentation process completed')
    }
  }

  const drawMasks = (masks: SAM2Mask[]) => {
    const canvas = overlayCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear previous masks
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw each mask with different colors
    masks.forEach((mask, index) => {
      const hue = (index * 137.5) % 360 // Golden angle for good color distribution
      ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.3)`
      ctx.strokeStyle = `hsla(${hue}, 70%, 40%, 0.8)`
      ctx.lineWidth = 2

      // Draw mask
      const imageData = ctx.createImageData(mask.width, mask.height)
      for (let i = 0; i < mask.data.length; i++) {
        const alpha = mask.data[i]
        imageData.data[i * 4] = alpha     // R
        imageData.data[i * 4 + 1] = alpha // G
        imageData.data[i * 4 + 2] = alpha // B
        imageData.data[i * 4 + 3] = alpha // A
      }

      // Scale mask to canvas size
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')!
      tempCanvas.width = mask.width
      tempCanvas.height = mask.height
      tempCtx.putImageData(imageData, 0, 0)

      ctx.globalCompositeOperation = 'source-over'
      ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height)
    })

    // Draw click points
    clickPoints.forEach((point, index) => {
      ctx.fillStyle = point.label === 1 ? '#00ff00' : '#ff0000'
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2

      ctx.beginPath()
      ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()

      // Add point number
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText((index + 1).toString(), point.x, point.y + 4)
    })
  }

  const generateCroppedImages = (masks: SAM2Mask[], imageData: ImageData): string[] => {
    const croppedImages: string[] = []

    masks.forEach((mask) => {
      // Find bounding box of mask
      const bounds = findMaskBounds(mask)
      if (!bounds) return

      // Create cropped canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      canvas.width = bounds.width
      canvas.height = bounds.height

      // Draw original image section
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')!
      tempCanvas.width = imageData.width
      tempCanvas.height = imageData.height
      tempCtx.putImageData(imageData, 0, 0)

      ctx.drawImage(
        tempCanvas,
        bounds.x, bounds.y, bounds.width, bounds.height,
        0, 0, bounds.width, bounds.height
      )

      // Apply mask
      const maskCanvas = document.createElement('canvas')
      const maskCtx = maskCanvas.getContext('2d')!
      maskCanvas.width = bounds.width
      maskCanvas.height = bounds.height

      // Draw mask section
      for (let y = 0; y < bounds.height; y++) {
        for (let x = 0; x < bounds.width; x++) {
          const maskIndex = (bounds.y + y) * mask.width + (bounds.x + x)
          if (mask.data[maskIndex] === 0) {
            ctx.clearRect(x, y, 1, 1) // Remove pixels outside mask
          }
        }
      }

      croppedImages.push(canvas.toDataURL('image/jpeg', 0.8))
    })

    return croppedImages
  }

  const findMaskBounds = (mask: SAM2Mask) => {
    let minX = mask.width, minY = mask.height, maxX = 0, maxY = 0
    let hasPixels = false

    for (let y = 0; y < mask.height; y++) {
      for (let x = 0; x < mask.width; x++) {
        if (mask.data[y * mask.width + x] > 0) {
          hasPixels = true
          minX = Math.min(minX, x)
          minY = Math.min(minY, y)
          maxX = Math.max(maxX, x)
          maxY = Math.max(maxY, y)
        }
      }
    }

    if (!hasPixels) return null

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    }
  }

  const clearSegmentation = () => {
    setClickPoints([])
    setCurrentMasks([])
    addDebugLog('Segmentation cleared')

    // Clear overlay canvas
    const canvas = overlayCanvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
    }

    toast.info('Segmentation Cleared', {
      description: 'Click on the image to start new segmentation',
      duration: 2000
    })
  }

  // Update canvas when image changes
  useEffect(() => {
    if (imageDataUrl && canvasRef.current) {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!

        // Calculate display size while maintaining aspect ratio
        const maxWidth = 600
        const maxHeight = 400
        const aspectRatio = img.width / img.height

        let displayWidth = img.width
        let displayHeight = img.height

        if (displayWidth > maxWidth) {
          displayWidth = maxWidth
          displayHeight = displayWidth / aspectRatio
        }

        if (displayHeight > maxHeight) {
          displayHeight = maxHeight
          displayWidth = displayHeight * aspectRatio
        }

        // Set canvas display size
        canvas.style.width = `${displayWidth}px`
        canvas.style.height = `${displayHeight}px`

        // Set canvas internal resolution
        canvas.width = img.width
        canvas.height = img.height

        // Draw image
        ctx.drawImage(img, 0, 0)

        // Update overlay canvas size and position
        const overlayCanvas = overlayCanvasRef.current!
        overlayCanvas.width = img.width
        overlayCanvas.height = img.height
        overlayCanvas.style.width = `${displayWidth}px`
        overlayCanvas.style.height = `${displayHeight}px`

        // Redraw masks if they exist
        if (showMasks && currentMasks.length > 0) {
          drawMasks(currentMasks)
        }

        console.log(`📷 [SAM2-UI] Image loaded: ${img.width}x${img.height}, display: ${displayWidth}x${displayHeight}`)
        addDebugLog(`Image loaded: ${img.width}x${img.height}`)
      }
      img.onerror = (error) => {
        console.error('Failed to load image:', error)
        addDebugLog('ERROR: Failed to load image')
      }
      img.src = imageDataUrl
    }
  }, [imageDataUrl, showMasks, currentMasks])

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            SAM2 Segmentation
          </CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              checked={enabled}
              onCheckedChange={onEnabledChange}
              disabled={isInitializing}
            />
            <Label className="text-sm">Enable</Label>
          </div>
        </div>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-4">
          {/* Status and Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isInitializing ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Initializing...
                </Badge>
              ) : isInitialized ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {performanceMetrics.initTime < 50 ? 'Demo Mode' : 'Ready'}
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Not Ready
                </Badge>
              )}

              {useWebGPU ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Gpu className="h-3 w-3" />
                  WebGPU
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Cpu className="h-3 w-3" />
                  CPU
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMasks(!showMasks)}
                disabled={!isInitialized}
              >
                {showMasks ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={clearSegmentation}
                disabled={!isInitialized || clickPoints.length === 0}
              >
                Clear
              </Button>

              {!isInitialized && !isInitializing && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={initializeSAM2Model}
                >
                  Initialize SAM2
                </Button>
              )}
            </div>
          </div>

          {/* Debug Information Panel */}
          {isInitialized && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">🔍 Debug Information</Label>
                <div className="flex gap-2 text-xs">
                  <Badge variant="outline">Clicks: {debugInfo.callCount}</Badge>
                  <Badge variant="outline">Points: {clickPoints.length}</Badge>
                  <Badge variant="outline">Masks: {currentMasks.length}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <strong>Last Click:</strong> {debugInfo.lastClickTime?.toLocaleTimeString() || 'None'}
                </div>
                <div>
                  <strong>Last Segmentation:</strong> {debugInfo.lastSegmentationTime?.toLocaleTimeString() || 'None'}
                </div>
              </div>

              {debugInfo.serviceCallsLog.length > 0 && (
                <div className="mt-2">
                  <Label className="text-xs font-medium">Recent Service Calls:</Label>
                  <div className="max-h-24 overflow-y-auto bg-white dark:bg-gray-800 rounded p-2 mt-1">
                    {debugInfo.serviceCallsLog.map((log, index) => (
                      <div key={index} className="text-xs font-mono mb-1">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Canvas Area */}
          {imageDataUrl && (
            <div className="relative border rounded-lg overflow-hidden bg-muted min-h-[300px] flex items-center justify-center">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                onContextMenu={handleContextMenu}
                className="max-w-full max-h-[500px] cursor-crosshair relative z-10"
                style={{ pointerEvents: isInitialized ? 'auto' : 'none' }}
              />
              <canvas
                ref={overlayCanvasRef}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
              />

              {isProcessing && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing segmentation...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          {isInitialized && (
            <div className={`text-sm p-3 rounded-lg ${
              performanceMetrics.initTime < 50
                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200'
                : 'bg-blue-50 dark:bg-blue-900/20 text-muted-foreground'
            }`}>
              <div className="font-medium mb-1">
                {performanceMetrics.initTime < 50 ? 'Demo Mode Instructions:' : 'Instructions:'}
              </div>
              {performanceMetrics.initTime < 50 ? (
                <>
                  <div>• This is a demo with mock segmentation results</div>
                  <div>• Left click to create circular demo segments</div>
                  <div>• To enable full SAM2: Place ONNX models in /public/models/sam2/</div>
                  <div>• See the setup guide in the models directory</div>
                </>
              ) : (
                <>
                  <div>• Left click to add positive prompts (include in segment)</div>
                  <div>• Right click to add negative prompts (exclude from segment)</div>
                  <div>• Each click will automatically update the segmentation</div>
                </>
              )}
            </div>
          )}

          {/* Performance Metrics */}
          {isInitialized && performanceMetrics.totalTime > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-medium">{performanceMetrics.initTime}ms</div>
                <div className="text-xs text-muted-foreground">Init</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-medium">{performanceMetrics.encodeTime}ms</div>
                <div className="text-xs text-muted-foreground">Encode</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-medium">{performanceMetrics.segmentTime}ms</div>
                <div className="text-xs text-muted-foreground">Segment</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-medium">{performanceMetrics.totalTime}ms</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          )}

          {/* Current Results */}
          {currentMasks.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Segmentation Results:</Label>
              <div className="flex flex-wrap gap-2">
                {currentMasks.map((mask, index) => (
                  <Badge key={index} variant="outline">
                    Segment {index + 1} ({mask.width}×{mask.height})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export default SAM2Segmentation

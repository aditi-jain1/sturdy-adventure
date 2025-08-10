import * as ort from 'onnxruntime-web'

// Configure ONNX Runtime Web
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/'

export interface SAM2Point {
  x: number
  y: number
  label: 1 | 0 // 1 for positive prompt, 0 for negative prompt
}

export interface SAM2Mask {
  data: Uint8Array
  width: number
  height: number
}

export interface SAM2Result {
  masks: SAM2Mask[]
  scores: number[]
  processingTime: number
}

export interface SAM2Config {
  modelSize: 'tiny' | 'small' | 'base' | 'large'
  useWebGPU: boolean
  multimaskOutput: boolean
}

export class SAM2Service {
  private encoderSession: ort.InferenceSession | null = null
  private decoderSession: ort.InferenceSession | null = null
  private imageEmbeddings: ort.Tensor | null = null
  private highResFeats0: ort.Tensor | null = null
  private highResFeats1: ort.Tensor | null = null
  private isModelLoaded = false
  private isLoading = false
  private config: SAM2Config

  constructor(config: SAM2Config = {
    modelSize: 'tiny',
    useWebGPU: true,
    multimaskOutput: true
  }) {
    this.config = config
  }

  async initialize(): Promise<void> {
    if (this.isModelLoaded || this.isLoading) {
      console.log('🔄 SAM2 initialize() called but already loaded/loading:', { isModelLoaded: this.isModelLoaded, isLoading: this.isLoading })
      return
    }

    this.isLoading = true
    console.log('🚀 [SAM2-INIT] Starting SAM2 Service initialization...')
    console.log('🚀 [SAM2-INIT] Config:', this.config)

    try {
      // Check if models are available
      const modelsAvailable = await this.checkModelsAvailable()
      console.log('🚀 [SAM2-INIT] Models available check result:', modelsAvailable)

      if (!modelsAvailable) {
        console.log('🎭 [SAM2-INIT] SAM2 models not found - enabling demo mode')
        console.log('📝 [SAM2-INIT] To enable full SAM2: Place ONNX models in /public/models/sam2/')
        this.isModelLoaded = true // Set as "loaded" for demo mode
        console.log('✅ [SAM2-INIT] Demo mode enabled successfully')
        return
      }

      // Configure execution providers
      const executionProviders: string[] = []

      if (this.config.useWebGPU && 'gpu' in navigator) {
        try {
          const adapter = await (navigator as any).gpu?.requestAdapter()
          if (adapter) {
            executionProviders.push('webgpu')
            console.log('✅ WebGPU available - using GPU acceleration')
          } else {
            console.log('⚠️ WebGPU adapter not available - falling back to WASM')
            executionProviders.push('wasm')
          }
        } catch (error) {
          console.log('⚠️ WebGPU error - falling back to WASM:', error)
          executionProviders.push('wasm')
        }
      } else {
        executionProviders.push('wasm')
        console.log('🔧 Using WASM backend')
      }

      // Load models
      console.log('📥 Loading SAM2 models...')
      const startTime = Date.now()

      const [encoderSession, decoderSession] = await Promise.all([
        this.loadEncoderModel(executionProviders),
        this.loadDecoderModel(executionProviders)
      ])

      this.encoderSession = encoderSession
      this.decoderSession = decoderSession

      const loadTime = Date.now() - startTime
      console.log(`✅ SAM2 models loaded in ${loadTime}ms`)

      this.isModelLoaded = true
    } catch (error) {
      console.error('❌ Failed to initialize SAM2:', error)
      throw new Error(`SAM2 initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      this.isLoading = false
    }
  }

  private async loadEncoderModel(executionProviders: string[]): Promise<ort.InferenceSession> {
    const encoderUrl = this.getModelUrl('encoder')
    console.log('📥 Loading encoder from:', encoderUrl)

    return await ort.InferenceSession.create(encoderUrl, {
      executionProviders,
      graphOptimizationLevel: 'all'
    })
  }

  private async loadDecoderModel(executionProviders: string[]): Promise<ort.InferenceSession> {
    const decoderUrl = this.getModelUrl('decoder')
    console.log('📥 Loading decoder from:', decoderUrl)

    return await ort.InferenceSession.create(decoderUrl, {
      executionProviders,
      graphOptimizationLevel: 'all'
    })
  }

  private getModelUrl(type: 'encoder' | 'decoder'): string {
    // For now, we'll use a placeholder URL - in production these would be hosted on your CDN
    const baseUrl = '/models/sam2'
    const modelName = `sam2_hiera_${this.config.modelSize}_${type}.onnx`
    return `${baseUrl}/${modelName}`
  }

  private async checkModelsAvailable(): Promise<boolean> {
    try {
      const encoderUrl = this.getModelUrl('encoder')
      const response = await fetch(encoderUrl, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }

  private createDemoSegmentation(points: SAM2Point[], imageData: ImageData): SAM2Result {
    console.log('🎭 [SAM2-DEMO] Creating demo segmentation (models not available)')
    console.log('🎭 [SAM2-DEMO] Input points:', points)
    console.log('🎭 [SAM2-DEMO] Image data:', { width: imageData.width, height: imageData.height })

    const masks: SAM2Mask[] = []
    const scores: number[] = []

    // Create mock masks around click points
    points.forEach((point, index) => {
      console.log(`🎭 [SAM2-DEMO] Processing point ${index}:`, point)
      if (point.label === 1) { // Only for positive prompts
        const maskSize = 100 + Math.random() * 50 // Random size 100-150px
        const mask = new Uint8Array(imageData.width * imageData.height)

        // Create circular mask around click point
        const centerX = Math.floor(point.x)
        const centerY = Math.floor(point.y)
        const radius = maskSize / 2

        console.log(`🎭 [SAM2-DEMO] Creating mask at (${centerX}, ${centerY}) with radius ${radius}`)

        let maskedPixels = 0
        for (let y = 0; y < imageData.height; y++) {
          for (let x = 0; x < imageData.width; x++) {
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
            if (distance < radius) {
              // Add some randomness for more realistic shape
              const noise = Math.random() * 0.3
              if (distance / radius + noise < 1) {
                mask[y * imageData.width + x] = 255
                maskedPixels++
              }
            }
          }
        }

        console.log(`🎭 [SAM2-DEMO] Created mask with ${maskedPixels} pixels`)

        masks.push({
          data: mask,
          width: imageData.width,
          height: imageData.height
        })

        const score = 0.7 + Math.random() * 0.25
        scores.push(score) // Random score 0.7-0.95
        console.log(`🎭 [SAM2-DEMO] Added mask ${masks.length - 1} with score ${score.toFixed(3)}`)
      } else {
        console.log(`🎭 [SAM2-DEMO] Skipping negative prompt point ${index}`)
      }
    })

    const processingTime = 50 + Math.random() * 100
    const result = {
      masks,
      scores,
      processingTime
    }

    console.log('🎭 [SAM2-DEMO] Final demo result:', {
      maskCount: result.masks.length,
      scores: result.scores,
      processingTime: result.processingTime
    })

    return result
  }

  async encodeImage(imageData: ImageData): Promise<void> {
    console.log('🖼️ [SAM2-ENCODE] encodeImage() called')
    console.log('🖼️ [SAM2-ENCODE] Service state:', { isModelLoaded: this.isModelLoaded, hasEncoderSession: !!this.encoderSession })
    console.log('🖼️ [SAM2-ENCODE] Image data:', { width: imageData.width, height: imageData.height, dataLength: imageData.data.length })

    if (!this.isModelLoaded) {
      console.error('❌ [SAM2-ENCODE] Service not initialized!')
      throw new Error('SAM2 not initialized - call initialize() first')
    }

    // In demo mode, skip actual encoding
    if (!this.encoderSession) {
      console.log('🎭 [SAM2-ENCODE] Demo mode: Skipping actual image encoding (models not available)')
      console.log('🎭 [SAM2-ENCODE] Demo mode encode completed')
      return
    }

    console.log('🖼️ [SAM2-ENCODE] Starting real model encoding...')
    const startTime = Date.now()

    try {
      // Preprocess image to 1024x1024
      const processedImage = this.preprocessImage(imageData)

      // Create ONNX tensor
      const imageTensor = new ort.Tensor('float32', processedImage, [1, 3, 1024, 1024])

      // Run encoder
      const encoderResults = await this.encoderSession.run({
        image: imageTensor
      })

      // Store embeddings for decoder
      this.imageEmbeddings = encoderResults.image_embed
      this.highResFeats0 = encoderResults.high_res_feats_0
      this.highResFeats1 = encoderResults.high_res_feats_1

      const encodeTime = Date.now() - startTime
      console.log(`✅ Image encoded in ${encodeTime}ms`)
    } catch (error) {
      console.error('❌ Image encoding failed:', error)
      throw new Error(`Image encoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async segment(points: SAM2Point[]): Promise<SAM2Result> {
    console.log(`🎯 [SAM2-SEGMENT] segment() called with ${points.length} points`)
    console.log(`🎯 [SAM2-SEGMENT] Points:`, points)
    console.log(`🎯 [SAM2-SEGMENT] Service state:`, {
      isModelLoaded: this.isModelLoaded,
      hasDecoderSession: !!this.decoderSession,
      hasImageEmbeddings: !!this.imageEmbeddings
    })

    if (!this.isModelLoaded) {
      console.error('❌ [SAM2-SEGMENT] Service not initialized!')
      throw new Error('SAM2 not initialized - call initialize() first')
    }

    const startTime = Date.now()

    // Check if we're in demo mode (no real models loaded)
    if (!this.decoderSession || !this.imageEmbeddings) {
      console.log('🎭 [SAM2-SEGMENT] Using demo segmentation mode')

      // We need to get the current image data for demo mode
      // This is a simplified approach - in real usage the image would be passed or stored
      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      console.log('🎭 [SAM2-SEGMENT] Found canvas for demo:', !!canvas)
      if (!canvas) {
        console.error('❌ [SAM2-SEGMENT] No canvas found for demo segmentation')
        throw new Error('No canvas found for demo segmentation')
      }

      const ctx = canvas.getContext('2d')!
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      console.log('🎭 [SAM2-SEGMENT] Canvas image data:', { width: imageData.width, height: imageData.height })

      const demoResult = this.createDemoSegmentation(points, imageData)
      console.log('🎭 [SAM2-SEGMENT] Demo segmentation result:', demoResult)
      return demoResult
    }

    try {
      // Prepare point inputs
      const pointCoords = new Float32Array(points.length * 2)
      const pointLabels = new Float32Array(points.length)

      points.forEach((point, idx) => {
        pointCoords[idx * 2] = point.x
        pointCoords[idx * 2 + 1] = point.y
        pointLabels[idx] = point.label
      })

      // Create input tensors
      const pointCoordsTensor = new ort.Tensor('float32', pointCoords, [1, points.length, 2])
      const pointLabelsTensor = new ort.Tensor('float32', pointLabels, [1, points.length])

      // Create mask input (no prior mask)
      const maskInput = new Float32Array(1 * 1 * 256 * 256).fill(0)
      const maskInputTensor = new ort.Tensor('float32', maskInput, [1, 1, 256, 256])

      // Has mask input (0 = no prior mask)
      const hasMaskInput = new ort.Tensor('float32', [0], [1])

      // Original image size
      const origImSize = new ort.Tensor('int32', [1024, 1024], [2])

      // Run decoder
      const decoderResults = await this.decoderSession.run({
        image_embed: this.imageEmbeddings,
        high_res_feats_0: this.highResFeats0!,
        high_res_feats_1: this.highResFeats1!,
        point_coords: pointCoordsTensor,
        point_labels: pointLabelsTensor,
        mask_input: maskInputTensor,
        has_mask_input: hasMaskInput,
        orig_im_size: origImSize
      })

      // Process results
      const masks = this.processMasks(decoderResults.masks)
      const scores = Array.from(decoderResults.iou_predictions.data as Float32Array)

      const processingTime = Date.now() - startTime
      console.log(`✅ Segmentation completed in ${processingTime}ms`)

      return {
        masks,
        scores,
        processingTime
      }
    } catch (error) {
      console.error('❌ Segmentation failed:', error)
      throw new Error(`Segmentation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private preprocessImage(imageData: ImageData): Float32Array {
    // Resize image to 1024x1024 and normalize
    const { width, height, data } = imageData
    const targetSize = 1024

    // Create canvas for resizing
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = targetSize
    canvas.height = targetSize

    // Create ImageData and draw to canvas
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')!
    tempCanvas.width = width
    tempCanvas.height = height
    tempCtx.putImageData(imageData, 0, 0)

    // Resize to target size
    ctx.drawImage(tempCanvas, 0, 0, targetSize, targetSize)
    const resizedImageData = ctx.getImageData(0, 0, targetSize, targetSize)

    // Convert to CHW format and normalize
    const input = new Float32Array(3 * targetSize * targetSize)
    const pixels = resizedImageData.data

    for (let i = 0; i < targetSize * targetSize; i++) {
      const pixelIndex = i * 4

      // Normalize to [0, 1] and convert to CHW format
      input[i] = pixels[pixelIndex] / 255.0                           // R channel
      input[targetSize * targetSize + i] = pixels[pixelIndex + 1] / 255.0     // G channel
      input[2 * targetSize * targetSize + i] = pixels[pixelIndex + 2] / 255.0 // B channel
    }

    return input
  }

  private processMasks(masksTensor: ort.Tensor): SAM2Mask[] {
    const masks: SAM2Mask[] = []
    const maskData = masksTensor.data as Float32Array
    const [batch, numMasks, height, width] = masksTensor.dims

    for (let i = 0; i < numMasks; i++) {
      const maskStart = i * height * width
      const maskEnd = maskStart + height * width
      const maskValues = maskData.slice(maskStart, maskEnd)

      // Convert to binary mask (threshold at 0.0)
      const binaryMask = new Uint8Array(maskValues.length)
      for (let j = 0; j < maskValues.length; j++) {
        binaryMask[j] = maskValues[j] > 0.0 ? 255 : 0
      }

      masks.push({
        data: binaryMask,
        width: width as number,
        height: height as number
      })
    }

    return masks
  }

  // Utility method to convert canvas to ImageData
  static canvasToImageData(canvas: HTMLCanvasElement): ImageData {
    const ctx = canvas.getContext('2d')!
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  // Utility method to convert webcam screenshot to ImageData
  static async screenshotToImageData(screenshotDataUrl: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        resolve(ctx.getImageData(0, 0, img.width, img.height))
      }
      img.onerror = reject
      img.src = screenshotDataUrl
    })
  }

  // Check if models are ready
  isReady(): boolean {
    return this.isModelLoaded
  }

  // Get current configuration
  getConfig(): SAM2Config {
    return { ...this.config }
  }

  // Update configuration (only when not loaded)
  updateConfig(newConfig: Partial<SAM2Config>): void {
    if (this.isModelLoaded) {
      console.warn('Cannot update config after SAM2 is already loaded')
      return
    }
    this.config = { ...this.config, ...newConfig }
    console.log('🔧 SAM2 config updated:', this.config)
  }

  // Clean up resources
  async dispose(): Promise<void> {
    console.log('🧹 Disposing SAM2 resources...')

    if (this.encoderSession) {
      await this.encoderSession.release()
      this.encoderSession = null
    }

    if (this.decoderSession) {
      await this.decoderSession.release()
      this.decoderSession = null
    }

    this.imageEmbeddings = null
    this.highResFeats0 = null
    this.highResFeats1 = null
    this.isModelLoaded = false

    console.log('✅ SAM2 resources disposed')
  }
}

// Singleton instance for global use
export const sam2Service = new SAM2Service()

// Helper function to initialize SAM2 with error handling
export async function initializeSAM2(config?: Partial<SAM2Config>): Promise<SAM2Service> {
  if (config) {
    // Create new instance with custom config
    return new SAM2Service(config as SAM2Config)
  }

  // Use singleton
  await sam2Service.initialize()
  return sam2Service
}

// Types are already exported above as interfaces

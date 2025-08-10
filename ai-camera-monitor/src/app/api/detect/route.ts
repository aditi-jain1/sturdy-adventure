import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client conditionally to avoid build-time errors
const getOpenAIClient = () => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  // Declare variables at function level to avoid scope issues
  let image: string | undefined
  let frames: string[] | undefined
  let target: any
  let isComplexAction: boolean = false
  let motionData: any
  let prompt: string | undefined

  try {
    console.log('🔍 Detection API called at:', new Date().toISOString())

    const requestData = await request.json()
    image = requestData.image
    frames = requestData.frames
    target = requestData.target
    isComplexAction = requestData.isComplexAction || false
    motionData = requestData.motionData
    prompt = requestData.prompt

    if (!image || !target) {
      console.log('❌ Missing data - image:', !!image, 'target:', !!target)
      return NextResponse.json(
        { error: 'Missing image or target data' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ OpenAI API key not configured')
      return NextResponse.json(
        {
          error: 'OpenAI API key not configured',
          details: 'Please set the OPENAI_API_KEY environment variable in Netlify dashboard under Site settings → Environment variables',
          errorType: 'ConfigurationError'
        },
        { status: 500 }
      )
    }

    // Validate API key format
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey.startsWith('sk-')) {
      console.log('❌ OpenAI API key has invalid format')
      return NextResponse.json(
        {
          error: 'Invalid OpenAI API key format',
          details: 'OpenAI API keys should start with "sk-". Please check your API key.',
          errorType: 'ConfigurationError'
        },
        { status: 500 }
      )
    }

    console.log('🔑 OpenAI API key configured:', apiKey.substring(0, 10) + '...' + apiKey.slice(-4))

    console.log('🎯 Target to detect:', target.description)
    console.log('📊 Confidence threshold:', target.confidence)
    console.log('🖼️ Reference image provided:', !!target.referenceImage)
    console.log('🎬 Complex action analysis:', isComplexAction)
    console.log('📹 Frame count:', frames?.length || 1)
    console.log('🎯 Motion data:', motionData)

    // Use the provided prompt or create a fallback
    const analysisPrompt = prompt || `You are an AI vision system for security monitoring. Analyze this image and determine if it contains: "${target.description}"

    Instructions:
    1. Look carefully at the image for the specified target
    2. Consider the context and setting
    3. Be reasonably confident but not overly strict
    4. Respond ONLY with valid JSON in this exact format:

    {
      "detected": true/false,
      "confidence": 0.0-1.0,
      "reasoning": "brief explanation of what you see"
    }

    Target to detect: ${target.description}
    Confidence threshold: ${target.confidence}

    Remember: Only return the JSON object, no other text.`

    const messages: any[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: analysisPrompt
          }
        ]
      }
    ]

    // Add frames to the message content
    const framesToAnalyze = frames || [image]
    framesToAnalyze.forEach((frame: string, index: number) => {
      if (isComplexAction && frames && frames.length > 1) {
        messages[0].content.push({
          type: 'text',
          text: `Frame ${index + 1} (${index * 2}s ago):`
        })
      } else {
        messages[0].content.push({
          type: 'text',
          text: 'Current frame:'
        })
      }

      messages[0].content.push({
        type: 'image_url',
        image_url: {
          url: frame,
          detail: 'low' // Use 'low' for faster, cheaper processing
        }
      })
    })

    // Add reference image if provided
    if (target.referenceImage) {
      console.log('📷 Adding reference image to analysis')
      messages[0].content.push({
        type: 'text',
        text: 'Reference image for comparison:'
      })
      messages[0].content.push({
        type: 'image_url',
        image_url: {
          url: target.referenceImage,
          detail: 'low'
        }
      })
    }

    console.log('🚀 Calling OpenAI Vision API...')
    console.log('📝 Using model: gpt-4o-mini')
    console.log('🔢 Total content items:', messages[0].content.length)
    console.log('📏 Message structure:', {
      messageCount: messages.length,
      contentItems: messages[0].content.map((item: any, index: number) => ({
        index,
        type: item.type,
        textLength: item.type === 'text' ? item.text?.length : 0,
        hasImageUrl: item.type === 'image_url' ? !!item.image_url?.url : false
      }))
    })
    console.log('🎛️ API Parameters:', {
      model: 'gpt-4o-mini',
      maxTokens: isComplexAction ? 250 : 150,
      temperature: 0.1
    })

    let openaiResponse
    try {
      const openai = getOpenAIClient()
      openaiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: isComplexAction ? 250 : 150, // More tokens for complex analysis
        temperature: 0.1
      })

      console.log('✅ OpenAI API call successful')
    } catch (openaiError) {
      console.error('💥 OpenAI API call failed:', openaiError)
      console.error('💥 OpenAI Error details:', {
        name: openaiError instanceof Error ? openaiError.name : 'Unknown',
        message: openaiError instanceof Error ? openaiError.message : String(openaiError),
        stack: openaiError instanceof Error ? openaiError.stack?.split('\n').slice(0, 3) : null
      })
      throw openaiError // Re-throw to be caught by main catch block
    }

    const apiCallDuration = Date.now() - startTime
    console.log('⏱️ OpenAI API call completed in:', apiCallDuration + 'ms')
    console.log('💰 Usage - Prompt tokens:', openaiResponse.usage?.prompt_tokens)
    console.log('💰 Usage - Completion tokens:', openaiResponse.usage?.completion_tokens)
    console.log('💰 Usage - Total tokens:', openaiResponse.usage?.total_tokens)

    const content = openaiResponse.choices[0]?.message?.content
    if (!content) {
      console.log('❌ No response content from OpenAI')
      throw new Error('No response from OpenAI')
    }

    console.log('📄 Raw OpenAI response:', content)

    // Parse the JSON response
    let result
    try {
      // Clean the response in case there's extra text
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : content
      result = JSON.parse(jsonString)
      console.log('✅ Parsed result:', result)
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response:', content)
      console.error('Parse error:', parseError)

      // Enhanced fallback for complex actions
      const detected = content.toLowerCase().includes('true') ||
                      content.toLowerCase().includes('detected') ||
                      content.toLowerCase().includes('yes') ||
                      content.toLowerCase().includes('falling') ||
                      content.toLowerCase().includes('emergency') ||
                      content.toLowerCase().includes('weapon')

      result = {
        detected,
        confidence: detected ? 0.6 : 0.1,
        reasoning: 'Response parsing failed, using enhanced fallback detection',
        urgency: detected && isComplexAction ? 'medium' : 'low'
      }
      console.log('🔄 Using enhanced fallback result:', result)
    }

    // Validate and enhance the result structure
    if (typeof result.detected !== 'boolean') {
      console.log('⚠️ Invalid detected value, defaulting to false')
      result.detected = false
    }
    if (typeof result.confidence !== 'number') {
      console.log('⚠️ Invalid confidence value, defaulting to 0.1')
      result.confidence = 0.1
    }

    // Auto-assign urgency for certain keywords if not provided
    if (!result.urgency && result.detected) {
      const description = target.description.toLowerCase()
      if (description.includes('falling') ||
          description.includes('weapon') ||
          description.includes('breaking') ||
          description.includes('emergency') ||
          description.includes('collapsed') ||
          description.includes('unconscious')) {
        result.urgency = 'high'
      } else if (description.includes('suspicious') ||
                 description.includes('distress') ||
                 description.includes('climbing')) {
        result.urgency = 'medium'
      } else {
        result.urgency = 'low'
      }
      console.log('🏷️ Auto-assigned urgency level:', result.urgency)
    }

    // Auto-generate recommended actions for high-urgency detections
    if (!result.recommended_action && result.detected && result.urgency === 'high') {
      const description = target.description.toLowerCase()
      if (description.includes('falling') || description.includes('collapsed')) {
        result.recommended_action = 'Check person immediately, call emergency services if needed'
      } else if (description.includes('weapon')) {
        result.recommended_action = 'Alert security immediately, do not approach'
      } else if (description.includes('breaking')) {
        result.recommended_action = 'Secure area, check for intruders, contact authorities'
      } else if (description.includes('emergency')) {
        result.recommended_action = 'Investigate immediately, call emergency services'
      } else {
        result.recommended_action = 'Investigate situation immediately'
      }
      console.log('🎯 Auto-generated action recommendation:', result.recommended_action)
    }

    // Apply confidence threshold
    const originalDetected = result.detected
    if (result.confidence < target.confidence) {
      result.detected = false
      console.log(`🎚️ Confidence ${result.confidence} below threshold ${target.confidence}, setting detected to false`)
    }

    const finalResult = {
      detected: result.detected,
      confidence: result.confidence,
      reasoning: result.reasoning || 'No reasoning provided',
      urgency: result.urgency || 'low',
      recommended_action: result.recommended_action,
      timestamp: new Date().toISOString(),
      // Enhanced debug info
      debug: {
        apiCallDuration,
        rawResponse: content,
        originalDetected,
        thresholdApplied: originalDetected !== result.detected,
        usage: openaiResponse.usage,
        isComplexAction,
        frameCount: framesToAnalyze.length,
        motionData: motionData,
        promptLength: analysisPrompt.length
      }
    }

    console.log('🎉 Final result:', finalResult)
    return NextResponse.json(finalResult)

  } catch (error) {
    const apiCallDuration = Date.now() - startTime
    console.error('💥 Detection API error after', apiCallDuration + 'ms:', error)
    console.error('💥 Error type:', typeof error)
    console.error('💥 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 10).join('\n') : 'No stack trace'
    })

    // Enhanced error response with more details
    let errorMessage = 'Detection failed'
    let errorDetails = 'Unknown error occurred'
    let errorType = 'UnknownError'

    if (error instanceof Error) {
      errorType = error.name
      errorMessage = error.message

      // Specific error handling for common issues
      if (error.message.includes('API key')) {
        errorMessage = 'OpenAI API key is missing or invalid'
        errorDetails = 'Please check your OPENAI_API_KEY environment variable'
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = 'OpenAI API rate limit exceeded'
        errorDetails = 'Too many requests. Please wait a moment and try again.'
      } else if (error.message.includes('insufficient_quota') || error.message.includes('quota')) {
        errorMessage = 'OpenAI API quota exceeded'
        errorDetails = 'Your OpenAI account has insufficient credits. Please add credits or upgrade your plan.'
      } else if (error.message.includes('model_not_found') || error.message.includes('model')) {
        errorMessage = 'OpenAI model not available'
        errorDetails = 'The gpt-4o-mini model may not be available for your account'
      } else if (error.message.includes('timeout') || error.message.includes('ECONNRESET')) {
        errorMessage = 'OpenAI API timeout'
        errorDetails = 'The request timed out. Please try again.'
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network connection error'
        errorDetails = 'Unable to connect to OpenAI API. Check your internet connection.'
      } else {
        errorDetails = error.message
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        errorType: errorType,
        debug: {
          apiCallDuration,
          timestamp: new Date().toISOString(),
          errorStack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : null,
          openaiApiKeyConfigured: !!process.env.OPENAI_API_KEY,
          requestData: {
            hasImage: !!image,
            hasFrames: !!frames,
            frameCount: frames?.length || 1,
            hasTarget: !!target,
            isComplexAction: !!isComplexAction
          }
        }
      },
      { status: 500 }
    )
  }
}

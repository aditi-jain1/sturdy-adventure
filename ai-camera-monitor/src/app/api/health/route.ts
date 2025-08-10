import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🏥 Health check endpoint called')

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY
    const hasApiKey = !!apiKey
    const apiKeyValid = hasApiKey && apiKey.startsWith('sk-')

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      api: {
        openaiKeyConfigured: hasApiKey,
        openaiKeyValid: apiKeyValid,
        openaiKeyPreview: hasApiKey ?
          apiKey.substring(0, 10) + '...' + apiKey.slice(-4) :
          'Not configured'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        nodeVersion: process.version
      }
    }

    console.log('✅ Health check passed:', health)

    return NextResponse.json(health)
  } catch (error) {
    console.error('💥 Health check failed:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Health check endpoint failed'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { message: 'Use GET method for health check' },
    { status: 405 }
  )
}

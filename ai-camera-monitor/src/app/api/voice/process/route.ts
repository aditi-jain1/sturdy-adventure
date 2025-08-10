import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client conditionally to avoid build-time errors
const getOpenAIClient = () => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export async function POST(request: NextRequest) {
  try {
    const { transcript, context } = await request.json()

    if (!transcript) {
      return NextResponse.json(
        { error: 'No transcript provided' },
        { status: 400 }
      )
    }

    // Determine command type and extract parameters
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a voice command processor for Scope, an AI camera monitoring system. 
          
          Parse voice commands and return JSON responses with these fields:
          - type: "camera_control" | "detection_query" | "system_command" | "unknown"
          - action: specific action to take
          - parameters: object with relevant parameters
          - response: natural language response to speak back
          
          Context: ${context || 'general'}
          
          Example camera commands:
          - "Make sure my dog doesn't go out of the house" → type: "camera_control", action: "set_watch_target", parameters: {description: "dog leaving house", alertType: "exit"}, response: "I'll monitor for your dog leaving the house and alert you if detected."
          - "Alert me when someone approaches the front door" → type: "camera_control", action: "set_watch_target", parameters: {description: "person at front door", alertType: "approach"}, response: "Setting up monitoring for people approaching the front door."
          - "Start monitoring" → type: "camera_control", action: "start_monitoring", response: "Starting camera monitoring now."
          - "Stop monitoring" → type: "camera_control", action: "stop_monitoring", response: "Stopping camera monitoring."
          
          Example detection queries (monitor_page context):
          - "What has been the hit rate so far?" → type: "detection_query", action: "get_hit_rate", response: "Based on current alerts, I'll calculate the detection hit rate for you."
          - "Extend collection time to 5 seconds" → type: "system_command", action: "set_capture_interval", parameters: {interval: 5}, response: "Setting capture interval to 5 seconds."
          - "Show me the alerts" → type: "detection_query", action: "get_recent_alerts", response: "Opening the alerts panel for you."
          - "Switch to camera settings" → type: "system_command", action: "switch_tab", parameters: {tab: "camera"}, response: "Switching to camera settings."
          - "Open reactions tab" → type: "system_command", action: "switch_tab", parameters: {tab: "reactions"}, response: "Opening reaction rules configuration."
          
          System commands:
          - "Toggle alerts panel" → type: "system_command", action: "toggle_alerts_panel", response: "Toggling the alerts panel."
          - "Go to monitor" → type: "system_command", action: "navigate_to_monitor", response: "Taking you to the monitoring interface."
          
          Be conversational and helpful in responses.`
        },
        {
          role: "user",
          content: transcript
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')

    return NextResponse.json(result)

  } catch (error) {
    console.error('Voice processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process voice command' },
      { status: 500 }
    )
  }
}

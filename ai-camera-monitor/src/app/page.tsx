'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Camera, 
  Target, 
  Activity, 
  Shield, 
  Zap, 
  Eye,
  ArrowRight,
  Mic,
  Clock,
  Settings
} from 'lucide-react'
import { VoiceInput } from '@/components/VoiceInput'

export default function Home() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/monitor?query=${encodeURIComponent(query)}`)
    } else {
      router.push('/monitor')
    }
  }

  const handleAdvanced = () => {
    router.push('/monitor?advanced=true')
  }

  const handleVoiceCommand = (command: any) => {
    console.log('Voice command received:', command)
    
    if (command.type === 'camera_control') {
      if (command.action === 'set_watch_target') {
        // Set the query from voice command and navigate to monitor
        setQuery(command.parameters?.description || '')
        router.push(`/monitor?query=${encodeURIComponent(command.parameters?.description || '')}&voice=true`)
      }
    } else if (command.type === 'system_command') {
      if (command.action === 'navigate_to_monitor') {
        router.push('/monitor')
      }
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced Circuit Background Animation */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <defs>
            {/* Gradient definitions for different colored lines */}
            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
            
            {/* Flow animation gradients */}
            <linearGradient id="flowGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0">
                <animate attributeName="stop-opacity" values="0;1;0" dur="3s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="1">
                <animate attributeName="stop-opacity" values="1;0;1" dur="3s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0">
                <animate attributeName="stop-opacity" values="0;1;0" dur="3s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>
          

        </svg>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold text-foreground mb-6 animate-fade-in">
            Scope
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 animate-fade-in-delay">
            Real-time intelligent surveillance with custom detection systems
          </p>

          {/* Enhanced Central Input Box with Full Viewport Circuit Integration */}
          <div className="relative w-full animate-slide-up">
            {/* Full Viewport Circuit Connections */}
            <div className="absolute inset-0 w-screen left-1/2 transform -translate-x-1/2 pointer-events-none overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid slice">
                <defs>
                  {/* Enhanced gradient definitions */}
                  <linearGradient id="fullLeftGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
                    <stop offset="30%" stopColor="#6366f1" stopOpacity="0.7" />
                    <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="fullRightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.6" />
                    <stop offset="70%" stopColor="#f97316" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
                  </linearGradient>
                  <linearGradient id="centerConnectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                    <stop offset="25%" stopColor="#8b5cf6" stopOpacity="0.6" />
                    <stop offset="50%" stopColor="#10b981" stopOpacity="0.7" />
                    <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                
                {/* Base Circuit Traces - Always Visible with Variations */}
                {/* Main trace - straight with minimal turns */}
                <path d="M 0 400 L 200 400 L 220 390 L 400 390 L 420 400 L 600 400" 
                      stroke="#374151" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                      
                {/* Secondary trace with more complex routing */}
                <path d="M 0 360 L 80 360 L 100 340 L 180 340 L 200 360 L 300 360 L 320 380 L 400 380 L 420 360 L 500 360 L 520 380 L 600 380" 
                      stroke="#374151" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
                      
                {/* Branch trace that merges with main */}
                <path d="M 0 440 L 120 440 L 140 420 L 200 420 M 200 420 L 220 410 L 300 410 L 320 420 L 420 420 L 440 410 L 520 410 L 540 420 L 600 420" 
                      stroke="#374151" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
                      
                {/* Upper trace with zigzag pattern */}
                <path d="M 0 320 L 60 320 L 80 300 L 120 300 L 140 320 L 180 320 L 200 340 L 240 340 L 260 320 L 320 320 L 340 340 L 380 340 L 400 360 L 460 360 L 480 340 L 540 340 L 560 360 L 600 360" 
                      stroke="#374151" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
                      
                {/* Lower trace with branch connection */}
                <path d="M 0 480 L 80 480 L 100 460 L 140 460 L 160 480 L 220 480 L 240 460 L 280 460 L 300 480 L 360 480 L 380 460 L 420 460 L 440 480 L 500 480 L 520 460 L 600 460" 
                      stroke="#374151" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
                      
                {/* Connector traces between main paths */}
                <path d="M 200 360 L 220 380 L 200 400" stroke="#374151" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.2" />
                <path d="M 320 380 L 340 400 L 320 420" stroke="#374151" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.2" />
                <path d="M 420 360 L 440 380 L 420 400 L 440 420" stroke="#374151" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.2" />
                      
                {/* Central bridge */}
                <path d="M 600 400 L 650 400 L 670 390 L 730 390 L 750 400 L 800 400" 
                      stroke="#374151" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                      
                {/* Right side traces - varied patterns */}
                {/* Main output trace - direct path */}
                <path d="M 800 400 L 1000 400 L 1020 390 L 1200 390 L 1220 400 L 1400 400" 
                      stroke="#374151" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                      
                {/* Secondary trace with branching */}
                <path d="M 800 380 L 880 380 L 900 360 L 1000 360 L 1020 380 L 1100 380 L 1120 360 L 1200 360 L 1220 380 L 1300 380 L 1320 360 L 1400 360" 
                      stroke="#374151" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
                      
                {/* Lower trace with merge pattern */}
                <path d="M 800 420 L 920 420 L 940 440 L 1060 440 L 1080 420 L 1180 420 L 1200 440 L 1280 440 L 1300 420 L 1400 420" 
                      stroke="#374151" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
                      
                {/* Upper trace with sawtooth pattern */}
                <path d="M 800 360 L 860 360 L 880 340 L 920 340 L 940 360 L 980 360 L 1000 340 L 1040 340 L 1060 360 L 1120 360 L 1140 340 L 1180 340 L 1200 320 L 1260 320 L 1280 340 L 1340 340 L 1360 320 L 1400 320" 
                      stroke="#374151" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
                      
                {/* Lower trace with step pattern */}
                <path d="M 800 460 L 880 460 L 900 480 L 960 480 L 980 460 L 1040 460 L 1060 480 L 1120 480 L 1140 460 L 1200 460 L 1220 480 L 1280 480 L 1300 460 L 1400 460" 
                      stroke="#374151" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
                      
                {/* Right side connector traces */}
                <path d="M 1000 360 L 1020 380 L 1000 400" stroke="#374151" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.2" />
                <path d="M 1180 360 L 1200 380 L 1180 420" stroke="#374151" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.2" />
                <path d="M 1120 380 L 1140 400 L 1120 420" stroke="#374151" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.2" />
                
                {/* Animated Color Flow - Left Side with varied patterns */}
                <path d="M 0 400 L 200 400 L 220 390 L 400 390 L 420 400 L 600 400" 
                      stroke="url(#fullLeftGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" 
                      strokeDasharray="35 965" opacity="0.9">
                  <animate attributeName="stroke-dashoffset" values="1000;0" dur="3.8s" repeatCount="indefinite" />
                </path>
                
                <path d="M 0 360 L 80 360 L 100 340 L 180 340 L 200 360 L 300 360 L 320 380 L 400 380 L 420 360 L 500 360 L 520 380 L 600 380" 
                      stroke="url(#fullLeftGradient)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" 
                      strokeDasharray="28 972" opacity="0.7">
                  <animate attributeName="stroke-dashoffset" values="1000;0" dur="4.2s" repeatCount="indefinite" begin="0.8s" />
                </path>
                
                <path d="M 0 440 L 120 440 L 140 420 L 200 420 M 200 420 L 220 410 L 300 410 L 320 420 L 420 420 L 440 410 L 520 410 L 540 420 L 600 420" 
                      stroke="url(#fullLeftGradient)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" 
                      strokeDasharray="25 975" opacity="0.6">
                  <animate attributeName="stroke-dashoffset" values="1000;0" dur="4.8s" repeatCount="indefinite" begin="1.5s" />
                </path>
                
                <path d="M 0 320 L 60 320 L 80 300 L 120 300 L 140 320 L 180 320 L 200 340 L 240 340 L 260 320 L 320 320 L 340 340 L 380 340 L 400 360 L 460 360 L 480 340 L 540 340 L 560 360 L 600 360" 
                      stroke="url(#fullLeftGradient)" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" 
                      strokeDasharray="22 978" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" values="1000;0" dur="5.2s" repeatCount="indefinite" begin="0.3s" />
                </path>
                
                <path d="M 0 480 L 80 480 L 100 460 L 140 460 L 160 480 L 220 480 L 240 460 L 280 460 L 300 480 L 360 480 L 380 460 L 420 460 L 440 480 L 500 480 L 520 460 L 600 460" 
                      stroke="url(#fullLeftGradient)" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" 
                      strokeDasharray="18 982" opacity="0.4">
                  <animate attributeName="stroke-dashoffset" values="1000;0" dur="5.8s" repeatCount="indefinite" begin="2.2s" />
                </path>
                
                {/* Animated Color Flow - Central Bridge */}
                <path d="M 600 400 L 650 400 L 670 390 L 730 390 L 750 400 L 800 400" 
                      stroke="url(#centerConnectionGradient)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" 
                      strokeDasharray="20 280" opacity="1">
                  <animate attributeName="stroke-dashoffset" values="300;0" dur="2.5s" repeatCount="indefinite" />
                </path>
                
                {/* Animated Color Flow - Right Side with varied patterns */}
                <path d="M 800 400 L 1000 400 L 1020 390 L 1200 390 L 1220 400 L 1400 400" 
                      stroke="url(#fullRightGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" 
                      strokeDasharray="35 965" opacity="0.9">
                  <animate attributeName="stroke-dashoffset" values="1000;0" dur="3.6s" repeatCount="indefinite" begin="0.4s" />
                </path>
                
                <path d="M 800 380 L 880 380 L 900 360 L 1000 360 L 1020 380 L 1100 380 L 1120 360 L 1200 360 L 1220 380 L 1300 380 L 1320 360 L 1400 360" 
                      stroke="url(#fullRightGradient)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" 
                      strokeDasharray="28 972" opacity="0.7">
                  <animate attributeName="stroke-dashoffset" values="1000;0" dur="4.4s" repeatCount="indefinite" begin="1.2s" />
                </path>
                
                <path d="M 800 420 L 920 420 L 940 440 L 1060 440 L 1080 420 L 1180 420 L 1200 440 L 1280 440 L 1300 420 L 1400 420" 
                      stroke="url(#fullRightGradient)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" 
                      strokeDasharray="25 975" opacity="0.6">
                  <animate attributeName="stroke-dashoffset" values="1000;0" dur="4.6s" repeatCount="indefinite" begin="2.0s" />
                </path>
                
                <path d="M 800 360 L 860 360 L 880 340 L 920 340 L 940 360 L 980 360 L 1000 340 L 1040 340 L 1060 360 L 1120 360 L 1140 340 L 1180 340 L 1200 320 L 1260 320 L 1280 340 L 1340 340 L 1360 320 L 1400 320" 
                      stroke="url(#fullRightGradient)" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" 
                      strokeDasharray="22 978" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" values="1000;0" dur="5.4s" repeatCount="indefinite" begin="0.7s" />
                </path>
                
                <path d="M 800 460 L 880 460 L 900 480 L 960 480 L 980 460 L 1040 460 L 1060 480 L 1120 480 L 1140 460 L 1200 460 L 1220 480 L 1280 480 L 1300 460 L 1400 460" 
                      stroke="url(#fullRightGradient)" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" 
                      strokeDasharray="18 982" opacity="0.4">
                  <animate attributeName="stroke-dashoffset" values="1000;0" dur="5.6s" repeatCount="indefinite" begin="2.8s" />
                </path>
                
                {/* Minimal Connection Points */}
                <g>
                  {/* Key junction points only */}
                  <circle cx="180" cy="380" r="3" fill="#3b82f6" opacity="0.7" />
                  <circle cx="340" cy="400" r="3" fill="#6366f1" opacity="0.7" />
                  <circle cx="520" cy="390" r="3" fill="#8b5cf6" opacity="0.7" />
                  
                  {/* Central connection point */}
                  <circle cx="700" cy="395" r="4" fill="#10b981" opacity="0.8">
                    <animate attributeName="r" values="4;5;4" dur="3s" repeatCount="indefinite" />
                  </circle>
                  
                  <circle cx="880" cy="390" r="3" fill="#f59e0b" opacity="0.7" />
                  <circle cx="1080" cy="380" r="3" fill="#f97316" opacity="0.7" />
                  <circle cx="1240" cy="400" r="3" fill="#ef4444" opacity="0.7" />
                </g>
              </svg>
            </div>
            
            {/* Circuit Frame Container */}
            <div className="relative max-w-4xl mx-auto">
              {/* Horizontal Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/15 via-purple-500/15 via-green-500/15 to-orange-500/15 rounded-lg blur-lg"></div>

              {/* Main Input Card */}
              <Card className="relative z-10 max-w-2xl mx-auto bg-card/90 backdrop-blur-md border-2 border-transparent shadow-2xl overflow-hidden">
                {/* Card Border Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 via-green-500/20 to-orange-500/20 rounded-lg"></div>
                <div className="absolute inset-[2px] bg-card/95 rounded-lg"></div>
                
                {/* Content */}
                <CardContent className="relative z-10 p-6">
                  {/* Top circuit connectors */}
                  <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-blue-500/30 via-purple-500/30 via-green-500/30 to-orange-500/30"></div>
                  <div className="absolute bottom-0 left-8 right-8 h-[2px] bg-gradient-to-r from-blue-500/30 via-purple-500/30 via-green-500/30 to-orange-500/30"></div>
                  
                  {/* Left and right edge connectors */}
                  <div className="absolute left-0 top-8 bottom-8 w-[2px] bg-gradient-to-b from-blue-500/40 via-purple-500/40 to-green-500/40"></div>
                  <div className="absolute right-0 top-8 bottom-8 w-[2px] bg-gradient-to-b from-green-500/40 via-orange-500/40 to-red-500/40"></div>
                  
                  {/* Corner circuit nodes */}
                  <div className="absolute top-2 left-2 w-2 h-2 bg-blue-500/60 rounded-full"></div>
                  <div className="absolute top-2 right-2 w-2 h-2 bg-green-500/60 rounded-full"></div>
                  <div className="absolute bottom-2 left-2 w-2 h-2 bg-purple-500/60 rounded-full"></div>
                  <div className="absolute bottom-2 right-2 w-2 h-2 bg-orange-500/60 rounded-full"></div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                <div className="flex items-center space-x-4">
                  <Input
                    type="text"
                    placeholder="What do you want to monitor?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 text-lg py-6 px-4 bg-background/60 border-border/30 focus:border-primary/70 focus:bg-background/80 transition-all duration-300"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAdvanced}
                        className="px-6 py-6 text-sm font-medium bg-background/60 hover:bg-background/80 border-border/30"
                  >
                    Advanced
                  </Button>
                </div>
                    <Button type="submit" className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300">
                  Start Monitoring
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 flex justify-center space-x-4 animate-fade-in-delay-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Camera className="mr-2 h-4 w-4" />
              Live Camera
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Target className="mr-2 h-4 w-4" />
              Object Detection
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Shield className="mr-2 h-4 w-4" />
              Security Monitor
            </Button>
          </div>
        </div>
      </section>

      {/* Real Time Detection Section */}
      <section className="relative py-20 px-4 bg-card/30">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <Activity className="h-12 w-12 text-primary mr-4" />
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Real Time Custom Detection Systems
            </h2>
          </div>
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Deploy intelligent monitoring that adapts to your specific needs. From security surveillance 
            to process monitoring, our AI understands what matters to you.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background/50 rounded-lg p-6 border border-border/50 transition-all duration-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 hover:bg-background/70 group">
              <Eye className="h-10 w-10 text-primary mx-auto mb-4 transition-colors duration-300 group-hover:text-blue-500" />
              <h3 className="text-xl font-semibold mb-2 transition-colors duration-300 group-hover:text-blue-400">Smart Detection</h3>
              <p className="text-muted-foreground">
                AI-powered recognition that learns from your examples and adapts to new scenarios
              </p>
            </div>
            <div className="bg-background/50 rounded-lg p-6 border border-border/50 transition-all duration-300 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 hover:bg-background/70 group">
              <Zap className="h-10 w-10 text-primary mx-auto mb-4 transition-colors duration-300 group-hover:text-green-500" />
              <h3 className="text-xl font-semibold mb-2 transition-colors duration-300 group-hover:text-green-400">Instant Alerts</h3>
              <p className="text-muted-foreground">
                Real-time notifications via SMS, email, or webhooks when events are detected
              </p>
            </div>
            <div className="bg-background/50 rounded-lg p-6 border border-border/50 transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 hover:bg-background/70 group">
              <Settings className="h-10 w-10 text-primary mx-auto mb-4 transition-colors duration-300 group-hover:text-purple-500" />
              <h3 className="text-xl font-semibold mb-2 transition-colors duration-300 group-hover:text-purple-400">Custom Rules</h3>
              <p className="text-muted-foreground">
                Configure detection sensitivity, reaction rules, and monitoring schedules
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Examples Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Examples & Highlights
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            See what our AI monitoring system can detect and track
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-background/50 border-border/50 transition-all duration-300 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/10 hover:bg-background/70 group">
              <CardContent className="p-6 text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-3 transition-colors duration-300 group-hover:text-red-500" />
                <h3 className="font-semibold mb-2 transition-colors duration-300 group-hover:text-red-400">Security Monitoring</h3>
                <p className="text-sm text-muted-foreground">Unauthorized access detection</p>
              </CardContent>
            </Card>
            <Card className="bg-background/50 border-border/50 transition-all duration-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 hover:bg-background/70 group">
              <CardContent className="p-6 text-center">
                <Target className="h-8 w-8 text-primary mx-auto mb-3 transition-colors duration-300 group-hover:text-blue-500" />
                <h3 className="font-semibold mb-2 transition-colors duration-300 group-hover:text-blue-400">Object Tracking</h3>
                <p className="text-sm text-muted-foreground">Package delivery monitoring</p>
              </CardContent>
            </Card>
            <Card className="bg-background/50 border-border/50 transition-all duration-300 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 hover:bg-background/70 group">
              <CardContent className="p-6 text-center">
                <Activity className="h-8 w-8 text-primary mx-auto mb-3 transition-colors duration-300 group-hover:text-green-500" />
                <h3 className="font-semibold mb-2 transition-colors duration-300 group-hover:text-green-400">Process Monitoring</h3>
                <p className="text-sm text-muted-foreground">Manufacturing quality control</p>
              </CardContent>
            </Card>
            <Card className="bg-background/50 border-border/50 transition-all duration-300 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 hover:bg-background/70 group">
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 text-primary mx-auto mb-3 transition-colors duration-300 group-hover:text-orange-500" />
                <h3 className="font-semibold mb-2 transition-colors duration-300 group-hover:text-orange-400">Time-lapse Analysis</h3>
                <p className="text-sm text-muted-foreground">Long-term change detection</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Voice Agent Section */}
      <section className="relative py-20 px-4 bg-card/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <Mic className="h-12 w-12 text-primary mr-4 animate-pulse" />
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Talk to Your Camera
            </h2>
          </div>
          <p className="text-xl text-muted-foreground mb-8">
            Voice-powered camera control and real-time queries are here!
          </p>
          
          {/* Voice Input Component */}
          <div className="mb-8">
            <VoiceInput 
              onCommand={handleVoiceCommand} 
              context="landing_page"
              className="max-w-md mx-auto"
            />
          </div>
          
          <div className="bg-background/50 rounded-lg p-8 border border-border/50 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 hover:bg-background/70">
            <h3 className="text-lg font-semibold text-foreground mb-4">Try saying:</h3>
            <p className="text-lg text-muted-foreground mb-4 transition-colors duration-300 hover:text-cyan-300">
              "Make sure my dog doesn't go out of the house"
            </p>
            <p className="text-lg text-muted-foreground mb-4 transition-colors duration-300 hover:text-cyan-300">
              "Alert me when someone approaches the delivery area"
            </p>
            <p className="text-lg text-muted-foreground transition-colors duration-300 hover:text-cyan-300">
              "Start monitoring the front door"
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

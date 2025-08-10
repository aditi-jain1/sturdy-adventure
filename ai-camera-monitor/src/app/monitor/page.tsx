'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CameraFeed } from '@/components/CameraFeed'
import { WatchTargetConfig } from '@/components/WatchTargetConfig'
import { ReactionRules } from '@/components/ReactionRules'
import { AlertHistory } from '@/components/AlertHistory'
import { MonitoringSettings } from '@/components/MonitoringSettings'
import { 
  Camera, 
  Target, 
  Bell, 
  History, 
  Activity, 
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Mic,
  Play,
  Pause
} from 'lucide-react'
import Link from 'next/link'
import { VoiceInput } from '@/components/VoiceInput'

interface DetectionAlert {
  id: string
  timestamp: Date
  detected: boolean
  confidence: number
  image: string
  message: string
}

interface WatchTarget {
  description: string
  referenceImage?: string
  confidence: number
}

interface ReactionRule {
  type: 'sms' | 'email' | 'webhook' | 'save_clip'
  enabled: boolean
  config: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  id: string
  name: string
}

function MonitorContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('query')
  const advanced = searchParams.get('advanced')
  
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [watchTarget, setWatchTarget] = useState<WatchTarget | null>(null)
  const [reactionRules, setReactionRules] = useState<ReactionRule[]>([])
  const [alerts, setAlerts] = useState<DetectionAlert[]>([])
  const [captureInterval, setCaptureInterval] = useState(2) // seconds
  const [activeTab, setActiveTab] = useState(advanced ? 'target' : 'camera')
  const [alertsPanelOpen, setAlertsPanelOpen] = useState(false)
  const [cameraFullscreen, setCameraFullscreen] = useState(false)
  const cameraFeedRef = useRef<{ captureFrame: () => void } | null>(null)

  // Initialize watch target from query if provided
  useEffect(() => {
    if (query && !watchTarget) {
      setWatchTarget({
        description: query,
        confidence: 0.7
      })
    }
  }, [query, watchTarget])

  const addAlert = (alert: Omit<DetectionAlert, 'id'>) => {
    const newAlert = { ...alert, id: Date.now().toString() }
    setAlerts(prev => [newAlert, ...prev].slice(0, 50)) // Keep last 50 alerts
  }

  const handleVoiceCommand = (command: any) => {
    console.log('Monitor voice command:', command)
    
    switch (command.type) {
      case 'camera_control':
        if (command.action === 'set_watch_target') {
          setWatchTarget({
            description: command.parameters?.description || '',
            confidence: command.parameters?.confidence || 0.7
          })
          setActiveTab('target')
        } else if (command.action === 'start_monitoring') {
          setIsMonitoring(true)
        } else if (command.action === 'stop_monitoring') {
          setIsMonitoring(false)
        }
        break
        
      case 'system_command':
        if (command.action === 'set_capture_interval') {
          setCaptureInterval(command.parameters?.interval || 2)
        } else if (command.action === 'toggle_alerts_panel') {
          setAlertsPanelOpen(!alertsPanelOpen)
        } else if (command.action === 'switch_tab') {
          const validTabs = ['camera', 'target', 'reactions', 'history']
          const requestedTab = command.parameters?.tab || 'camera'
          if (validTabs.includes(requestedTab)) {
            setActiveTab(requestedTab)
          }
        }
        break
        
      case 'detection_query':
        // These commands will be handled by displaying information
        if (command.action === 'get_hit_rate') {
          const detectedAlerts = alerts.filter(alert => alert.detected)
          const hitRate = alerts.length > 0 ? (detectedAlerts.length / alerts.length * 100).toFixed(1) : '0'
          // The response will be spoken by the VoiceInput component
        } else if (command.action === 'get_recent_alerts') {
          setAlertsPanelOpen(true)
          setActiveTab('history')
        }
        break
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="w-full px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
              <div className="border-l border-border pl-3">
                <h1 className="text-lg font-bold text-foreground">Scope</h1>
                <p className="text-xs text-muted-foreground truncate max-w-xs lg:max-w-none">
                  {query ? `Monitoring: ${query}` : 'Real-time intelligent surveillance'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {isMonitoring ? (
                <Badge variant="default" className="bg-green-500 shrink-0">
                  <Activity className="h-3 w-3 mr-1" />
                  Monitoring
                </Badge>
              ) : (
                <Badge variant="secondary" className="shrink-0">Stopped</Badge>
              )}
              
              {/* Voice Input for Monitor Page */}
              <VoiceInput 
                onCommand={handleVoiceCommand} 
                context="monitor_page"
                className="shrink-0"
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAlertsPanelOpen(!alertsPanelOpen)}
                className="flex items-center gap-1 shrink-0 px-3 py-1 h-8"
              >
                <Bell className="h-3 w-3" />
                <span className="text-xs">Alerts</span>
                {alerts.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs flex items-center justify-center">
                    {alerts.length > 99 ? '99+' : alerts.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)] overflow-hidden">
        {/* Left Side - Camera Feed */}
        <div className="w-[65%] flex flex-col p-4">
          {/* Camera Feed */}
          <Card className="h-[calc(100vh-120px)] flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  <CardTitle>Live Camera Feed</CardTitle>
                  {isMonitoring && (
                    <Badge variant="default" className="bg-green-500 ml-2">
                      <Activity className="h-3 w-3 mr-1" />
                      Monitoring
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCameraFullscreen(!cameraFullscreen)}
                  >
                    {cameraFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <CardDescription>
                Real-time camera feed with AI-powered detection
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
              <div className="h-full w-full">
                <CameraFeed
                  ref={cameraFeedRef}
                  isMonitoring={isMonitoring}
                  watchTarget={watchTarget}
                  captureInterval={captureInterval}
                  onDetection={addAlert}
                  onMonitoringChange={setIsMonitoring}
                />
              </div>
            </CardContent>
          </Card>


        </div>

        {/* Right Side - Controls Panel */}
        <div className={`w-[35%] border-l border-border transition-all duration-300 ${alertsPanelOpen ? 'mr-96' : ''}`}>
          <div className="h-full flex flex-col p-4">
            {/* Tab Navigation */}
            <div className="h-20 mb-4">
              <div className="grid grid-cols-2 gap-1 h-16">
                <Button
                  variant={activeTab === 'camera' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('camera')}
                  className="flex items-center gap-1 px-2 py-1 h-8 min-w-0"
                >
                  <Camera className="h-3 w-3 shrink-0" />
                  <span className="text-xs truncate">Camera</span>
                </Button>
                <Button
                  variant={activeTab === 'target' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('target')}
                  className="flex items-center gap-1 px-2 py-1 h-8 min-w-0"
                >
                  <Target className="h-3 w-3 shrink-0" />
                  <span className="text-xs truncate">Target</span>
                </Button>
                <Button
                  variant={activeTab === 'reactions' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('reactions')}
                  className="flex items-center gap-1 px-2 py-1 h-8 min-w-0"
                >
                  <Bell className="h-3 w-3 shrink-0" />
                  <span className="text-xs truncate">Action</span>
                </Button>
                <Button
                  variant={activeTab === 'history' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('history')}
                  className="flex items-center gap-1 px-2 py-1 h-8 min-w-0"
                >
                  <History className="h-3 w-3 shrink-0" />
                  <span className="text-xs truncate">History</span>
                </Button>

              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {activeTab === 'camera' && (
                <MonitoringSettings
                  captureInterval={captureInterval}
                  onCaptureIntervalChange={setCaptureInterval}
                  isMonitoring={isMonitoring}
                  onMonitoringChange={setIsMonitoring}
                  onTestCapture={() => {
                    if (cameraFeedRef.current?.captureFrame) {
                      cameraFeedRef.current.captureFrame()
                    }
                  }}
                />
              )}

              {activeTab === 'target' && (
                <WatchTargetConfig
                  watchTarget={watchTarget}
                  onWatchTargetChange={setWatchTarget}
                />
              )}

              {activeTab === 'reactions' && (
                <ReactionRules
                  rules={reactionRules}
                  onRulesChange={setReactionRules}
                />
              )}

              {activeTab === 'history' && (
                <AlertHistory alerts={alerts} />
              )}


            </div>

            {/* Watch Target Information */}
            {watchTarget && (
              <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="text-sm font-medium text-blue-500 mb-2">Current Watch Target</div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Description:</span> {watchTarget.description}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Confidence:</span> {(watchTarget.confidence * 100).toFixed(0)}%
                  </div>
                  {watchTarget.referenceImage && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Reference Image:</span> Uploaded
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-background/50 rounded border border-border/50">
                <div className="text-lg font-bold text-foreground">{alerts.length}</div>
                <div className="text-xs text-muted-foreground">Total Alerts</div>
              </div>
              <div className="text-center p-2 bg-background/50 rounded border border-border/50">
                <div className="text-lg font-bold text-green-500">{isMonitoring ? 'LIVE' : 'OFF'}</div>
                <div className="text-xs text-muted-foreground">Status</div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className={`w-96 bg-card border-l border-border transition-all duration-300 ${
          alertsPanelOpen ? 'translate-x-0' : 'translate-x-full'
        } fixed right-0 top-[80px] h-[calc(100vh-80px)] z-30`}>
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Alerts & Logs
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAlertsPanelOpen(false)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Alerts Section */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-medium text-sm text-muted-foreground mb-3">Recent Alerts</h3>
                {alerts.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {alerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="p-2 bg-background rounded border border-border/50">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant={alert.detected ? "destructive" : "secondary"} className="text-xs">
                            {alert.detected ? 'Detected' : 'Clear'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {alert.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No alerts yet</p>
                )}
              </div>

              {/* Logs Section */}
              <div className="flex-1 p-4 overflow-hidden">
                <h3 className="font-medium text-sm text-muted-foreground mb-3">Activity Logs</h3>
                <div className="h-full overflow-y-auto">
                  <AlertHistory alerts={alerts} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MonitorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading monitor...</p>
      </div>
    </div>}>
      <MonitorContent />
    </Suspense>
  )
}

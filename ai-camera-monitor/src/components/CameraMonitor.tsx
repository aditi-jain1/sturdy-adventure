'use client'

import { useState, useEffect, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CameraFeed } from './CameraFeed'
import { WatchTargetConfig } from './WatchTargetConfig'
import { ReactionRules } from './ReactionRules'
import { AlertHistory } from './AlertHistory'
import { MonitoringSettings } from './MonitoringSettings'
import { Camera, Target, Bell, History, Settings, Activity } from 'lucide-react'

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

export function CameraMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [watchTarget, setWatchTarget] = useState<WatchTarget | null>(null)
  const [reactionRules, setReactionRules] = useState<ReactionRule[]>([])
  const [alerts, setAlerts] = useState<DetectionAlert[]>([])
  const [captureInterval, setCaptureInterval] = useState(2) // seconds
  const [activeTab, setActiveTab] = useState('camera')

  const addAlert = (alert: Omit<DetectionAlert, 'id'>) => {
    const newAlert = { ...alert, id: Date.now().toString() }
    setAlerts(prev => [newAlert, ...prev].slice(0, 50)) // Keep last 50 alerts
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Camera Feed */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                <CardTitle>Live Camera Feed</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {isMonitoring ? (
                  <Badge variant="default" className="bg-green-500">
                    <Activity className="h-3 w-3 mr-1" />
                    Monitoring
                  </Badge>
                ) : (
                  <Badge variant="secondary">Stopped</Badge>
                )}
              </div>
            </div>
            <CardDescription>
              Real-time camera feed with AI-powered detection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CameraFeed
              isMonitoring={isMonitoring}
              watchTarget={watchTarget}
              captureInterval={captureInterval}
              onDetection={addAlert}
              onMonitoringChange={setIsMonitoring}
            />
          </CardContent>
        </Card>
      </div>

      {/* Configuration Panels */}
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-1 lg:h-auto lg:flex-col">
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span className="hidden lg:inline">Camera</span>
            </TabsTrigger>
            <TabsTrigger value="target" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden lg:inline">Watch Target</span>
            </TabsTrigger>
            <TabsTrigger value="reactions" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden lg:inline">Reactions</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden lg:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden lg:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="mt-4">
            <MonitoringSettings
              captureInterval={captureInterval}
              onCaptureIntervalChange={setCaptureInterval}
              isMonitoring={isMonitoring}
              onMonitoringChange={setIsMonitoring}
            />
          </TabsContent>

          <TabsContent value="target" className="mt-4">
            <WatchTargetConfig
              watchTarget={watchTarget}
              onWatchTargetChange={setWatchTarget}
            />
          </TabsContent>

          <TabsContent value="reactions" className="mt-4">
            <ReactionRules
              rules={reactionRules}
              onRulesChange={setReactionRules}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <AlertHistory alerts={alerts} />
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Additional settings will be available here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

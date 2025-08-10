'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Settings, Play, Pause, Camera } from 'lucide-react'

interface MonitoringSettingsProps {
  captureInterval: number
  onCaptureIntervalChange: (interval: number) => void
  isMonitoring: boolean
  onMonitoringChange: (monitoring: boolean) => void
  onTestCapture?: () => void
}

export function MonitoringSettings({
  captureInterval,
  onCaptureIntervalChange,
  isMonitoring,
  onMonitoringChange,
  onTestCapture
}: MonitoringSettingsProps) {


  const calculateMonthlyCost = (interval: number) => {
    // Rough estimate: $0.001 per image for gpt-4o-mini
    const imagesPerHour = 3600 / interval
    const imagesPerMonth = imagesPerHour * 24 * 30
    const monthlyCost = imagesPerMonth * 0.001
    return monthlyCost
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Monitoring Settings
        </CardTitle>
        <CardDescription>
          Configure camera monitoring parameters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Status</span>
            <Badge variant={isMonitoring ? 'default' : 'secondary'}>
              {isMonitoring ? 'Monitoring Active' : 'Stopped'}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mb-3">
            {isMonitoring
              ? `Capturing frames every ${captureInterval}s`
              : 'Click "Start Monitoring" to begin'
            }
          </div>
          
          {/* Monitoring Controls */}
          <div className="space-y-2">
            <Button
              onClick={() => onMonitoringChange(!isMonitoring)}
              variant={isMonitoring ? "destructive" : "default"}
              size="sm"
              className="w-full flex items-center gap-2"
            >
              {isMonitoring ? (
                <>
                  <Pause className="h-4 w-4" />
                  Stop Monitoring
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Monitoring
                </>
              )}
            </Button>
            
            {onTestCapture && (
              <Button
                onClick={onTestCapture}
                variant="outline"
                size="sm"
                className="w-full flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Test Capture
              </Button>
            )}
          </div>
        </div>

        {/* Capture Interval */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="interval">
              Capture Interval: {captureInterval}s
            </Label>
            <Input
              id="interval"
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={captureInterval}
              onChange={(e) => onCaptureIntervalChange(parseFloat(e.target.value))}
              className="mt-2"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Estimated monthly cost: ${calculateMonthlyCost(captureInterval).toFixed(2)}
              (if monitoring 24/7)
            </div>
          </div>
        </div>



        {/* API Configuration */}
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">OpenAI API Configuration</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Model:</span>
                <span>gpt-4o-mini</span>
              </div>
              <div className="flex justify-between">
                <span>Max tokens:</span>
                <span>100</span>
              </div>
              <div className="flex justify-between">
                <span>Temperature:</span>
                <span>0.1</span>
              </div>
            </div>
            <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Make sure to set your OpenAI API key in the environment variables.
            </div>
          </div>
        </div>

        {/* Performance Tips */}
        <div className="space-y-2">
          <Label>Performance Tips</Label>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <Camera className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Lower intervals = faster detection but higher API costs</span>
            </div>
            <div className="flex items-start gap-2">
              <Camera className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Higher confidence thresholds reduce false positives</span>
            </div>
            <div className="flex items-start gap-2">
              <Camera className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Reference images improve detection accuracy</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

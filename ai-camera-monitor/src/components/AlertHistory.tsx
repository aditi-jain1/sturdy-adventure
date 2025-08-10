'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { History, Eye, Trash, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface DetectionAlert {
  id: string
  timestamp: Date
  detected: boolean
  confidence: number
  image: string
  message: string
}

interface AlertHistoryProps {
  alerts: DetectionAlert[]
}

export function AlertHistory({ alerts }: AlertHistoryProps) {
  const [selectedAlert, setSelectedAlert] = useState<DetectionAlert | null>(null)
  const [filter, setFilter] = useState<'all' | 'detected' | 'no-detection'>('all')

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'detected') return alert.detected
    if (filter === 'no-detection') return !alert.detected
    return true
  })

  const detectionCount = alerts.filter(alert => alert.detected).length
  const totalCount = alerts.length

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Alert History
        </CardTitle>
        <CardDescription>
          Recent detection results and alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{totalCount}</div>
            <div className="text-xs text-muted-foreground">Total Captures</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{detectionCount}</div>
            <div className="text-xs text-muted-foreground">Detections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">
              {totalCount > 0 ? Math.round((detectionCount / totalCount) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">Hit Rate</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({totalCount})
          </Button>
          <Button
            variant={filter === 'detected' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('detected')}
          >
            Detected ({detectionCount})
          </Button>
          <Button
            variant={filter === 'no-detection' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('no-detection')}
          >
            No Detection ({totalCount - detectionCount})
          </Button>
        </div>

        {/* Alert List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>No alerts yet</p>
              <p className="text-sm">Start monitoring to see detection results</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {alert.detected ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={alert.detected ? 'default' : 'secondary'}>
                        {alert.detected ? 'Detected' : 'No Detection'}
                      </Badge>
                      {alert.detected && (
                        <Badge variant="outline">
                          {(alert.confidence * 100).toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(alert.timestamp)}
                    </p>
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {alert.detected ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                        )}
                        Detection Result
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      {/* Alert Details */}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                        <div>
                          <div className="text-sm text-muted-foreground">Status</div>
                          <Badge variant={alert.detected ? 'default' : 'secondary'}>
                            {alert.detected ? 'Detected' : 'No Detection'}
                          </Badge>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Confidence</div>
                          <div className="font-medium">
                            {(alert.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Timestamp</div>
                          <div className="font-medium">
                            {alert.timestamp.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Message</div>
                          <div className="font-medium text-sm">
                            {alert.message}
                          </div>
                        </div>
                      </div>

                      {/* Captured Image */}
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Captured Frame</div>
                        <img
                          src={alert.image}
                          alt="Captured frame"
                          className="w-full rounded-lg border"
                        />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))
          )}
        </div>

        {/* Clear History */}
        {alerts.length > 0 && (
          <Button variant="outline" size="sm" className="w-full">
            <Trash className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

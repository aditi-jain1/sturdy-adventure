'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Target, Upload, X, Check } from 'lucide-react'
import { toast } from 'sonner'

interface WatchTarget {
  description: string
  referenceImage?: string
  confidence: number
}

interface WatchTargetConfigProps {
  watchTarget: WatchTarget | null
  onWatchTargetChange: (target: WatchTarget | null) => void
}

export function WatchTargetConfig({
  watchTarget,
  onWatchTargetChange
}: WatchTargetConfigProps) {
  const [description, setDescription] = useState(watchTarget?.description || '')
  const [confidence, setConfidence] = useState(watchTarget?.confidence || 0.7)
  const [referenceImage, setReferenceImage] = useState<string | null>(watchTarget?.referenceImage || null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setReferenceImage(result)
        toast.success('Reference image uploaded', {
          description: 'Image will help improve detection accuracy'
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const saveTarget = () => {
    if (!description.trim()) {
      toast.error('Description Required', {
        description: 'Please enter a description of what to watch for',
        duration: 4000
      })
      return
    }

    onWatchTargetChange({
      description: description.trim(),
      referenceImage: referenceImage || undefined,
      confidence
    })

    toast.success('Watch Target Saved!', {
      description: `Now watching for: "${description.trim()}"`,
      duration: 4000
    })
  }

  const clearTarget = () => {
    setDescription('')
    setReferenceImage(null)
    setConfidence(0.7)
    onWatchTargetChange(null)

    toast.info('Target Cleared', {
      description: 'Watch target has been removed',
      duration: 3000
    })
  }

  const presetTargets = [
    // Emergency & Safety Critical
    'person falling down',
    'someone breaking window or door',
    'person collapsed or unconscious',

    // Security Monitoring
    'person acting suspiciously or lurking',
    'unauthorized person in restricted area',
    'person with weapon or threatening object',

    // Basic Detection
    'person walking',
    'package at door'
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Watch Target
        </CardTitle>
        <CardDescription>
          Define what the AI should look for in the camera feed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Target Status */}
        {watchTarget && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Target Configured
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearTarget}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              {watchTarget.description}
            </p>
          </div>
        )}

        {/* Description Input */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe what you want to detect (e.g., 'toddler standing up', 'red sedan with dent on left door', 'person wearing mask')"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Preset Targets */}
        <div className="space-y-2">
          <Label>Quick Presets</Label>
          <div className="flex flex-wrap gap-2">
            {presetTargets.map((preset) => (
              <Badge
                key={preset}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => setDescription(preset)}
              >
                {preset}
              </Badge>
            ))}
          </div>
        </div>

        {/* Reference Image Upload */}
        <div className="space-y-2">
          <Label>Reference Image (Optional)</Label>
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => document.getElementById('reference-image')?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Reference Image
            </Button>
            <input
              id="reference-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <p className="text-xs text-muted-foreground">
              Upload a reference image to help the AI better identify your target
            </p>
          </div>

          {/* Reference Image Preview */}
          {referenceImage && (
            <div className="relative">
              <img
                src={referenceImage}
                alt="Reference"
                className="w-full max-w-xs rounded-lg border"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => setReferenceImage(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Confidence Threshold */}
        <div className="space-y-2">
          <Label htmlFor="confidence">
            Detection Confidence Threshold: {(confidence * 100).toFixed(0)}%
          </Label>
          <Input
            id="confidence"
            type="range"
            min="0.1"
            max="0.95"
            step="0.05"
            value={confidence}
            onChange={(e) => setConfidence(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Higher values reduce false positives but might miss some detections
          </p>
        </div>

        {/* Save Button */}
        <Button
          onClick={saveTarget}
          className="w-full"
          disabled={!description.trim()}
        >
          <Check className="h-4 w-4 mr-2" />
          Save Watch Target
        </Button>
      </CardContent>
    </Card>
  )
}

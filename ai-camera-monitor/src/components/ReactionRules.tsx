'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Bell, Mail, MessageSquare, Webhook, Save, Plus, Edit, Trash, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface ReactionRule {
  type: 'sms' | 'email' | 'webhook' | 'save_clip'
  enabled: boolean
  config: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  id: string
  name: string
}

interface ReactionRulesProps {
  rules: ReactionRule[]
  onRulesChange: (rules: ReactionRule[]) => void
}

export function ReactionRules({ rules, onRulesChange }: ReactionRulesProps) {
  const [editingRule, setEditingRule] = useState<ReactionRule | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const addRule = (newRule: Omit<ReactionRule, 'id'>) => {
    const rule = { ...newRule, id: Date.now().toString() }
    onRulesChange([...rules, rule])
    setIsDialogOpen(false)

    toast.success('Reaction Rule Added!', {
      description: `New ${newRule.type} rule "${newRule.name}" has been created`,
      duration: 4000
    })
  }

  const updateRule = (updatedRule: ReactionRule) => {
    onRulesChange(rules.map(rule => rule.id === updatedRule.id ? updatedRule : rule))
    setEditingRule(null)
    setIsDialogOpen(false)

    toast.success('Rule Updated!', {
      description: `"${updatedRule.name}" has been updated`,
      duration: 3000
    })
  }

  const deleteRule = (id: string) => {
    const rule = rules.find(r => r.id === id)
    onRulesChange(rules.filter(rule => rule.id !== id))

    toast.info('Rule Deleted', {
      description: rule ? `"${rule.name}" has been removed` : 'Rule has been removed',
      duration: 3000
    })
  }

  const toggleRule = (id: string) => {
    const rule = rules.find(r => r.id === id)
    onRulesChange(rules.map(rule =>
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ))

    if (rule) {
      toast.info(!rule.enabled ? 'Rule Enabled' : 'Rule Disabled', {
        description: `"${rule.name}" is now ${!rule.enabled ? 'active' : 'inactive'}`,
        duration: 2000
      })
    }
  }

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <MessageSquare className="h-4 w-4" />
      case 'webhook': return <Webhook className="h-4 w-4" />
      case 'save_clip': return <Save className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Reaction Rules
        </CardTitle>
        <CardDescription>
          Configure what happens when a detection occurs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Rules */}
        <div className="space-y-2">
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No reaction rules configured. Add one to get started.
            </p>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getRuleIcon(rule.type)}
                    <span className="font-medium">{rule.name}</span>
                  </div>
                  <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRule(rule.id)}
                  >
                    {rule.enabled ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingRule(rule)
                      setIsDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRule(rule.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Rule Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full"
              onClick={() => setEditingRule(null)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Reaction Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Edit Reaction Rule' : 'Add Reaction Rule'}
              </DialogTitle>
              <DialogDescription>
                Configure what happens when a detection occurs
              </DialogDescription>
            </DialogHeader>
            <RuleEditor
              rule={editingRule}
              onSave={editingRule ? updateRule : addRule}
              onCancel={() => {
                setIsDialogOpen(false)
                setEditingRule(null)
              }}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

interface RuleEditorProps {
  rule: ReactionRule | null
  onSave: (rule: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
  onCancel: () => void
}

function RuleEditor({ rule, onSave, onCancel }: RuleEditorProps) {
  const [type, setType] = useState<ReactionRule['type']>(rule?.type || 'email')
  const [name, setName] = useState(rule?.name || '')
  const [config, setConfig] = useState(rule?.config || {})

  const ruleTypes = [
    { value: 'email', label: 'Email Notification', icon: Mail },
    { value: 'sms', label: 'SMS Notification', icon: MessageSquare },
    { value: 'webhook', label: 'Webhook', icon: Webhook },
    { value: 'save_clip', label: 'Save Video Clip', icon: Save }
  ]

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Name Required', {
        description: 'Please enter a name for this rule',
        duration: 3000
      })
      return
    }

    const newRule = {
      type,
      name: name.trim(),
      enabled: true,
      config,
      ...(rule ? { id: rule.id } : {})
    }

    onSave(newRule)
  }

  const updateConfig = (key: string, value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setConfig((prev: Record<string, any>) => ({ ...prev, [key]: value })) // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  return (
    <div className="space-y-4">
      {/* Rule Name */}
      <div className="space-y-2">
        <Label htmlFor="rule-name">Rule Name</Label>
        <Input
          id="rule-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Alert when toddler wakes up"
        />
      </div>

      {/* Rule Type */}
      <div className="space-y-2">
        <Label>Rule Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {ruleTypes.map((ruleType) => {
            const Icon = ruleType.icon
            return (
              <Button
                key={ruleType.value}
                variant={type === ruleType.value ? 'default' : 'outline'}
                className="h-auto p-3"
                onClick={() => setType(ruleType.value as ReactionRule['type'])}
              >
                <div className="text-center">
                  <Icon className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-xs">{ruleType.label}</div>
                </div>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Type-specific Configuration */}
      {type === 'email' && (
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={config.email || ''}
            onChange={(e) => updateConfig('email', e.target.value)}
            placeholder="your@email.com"
          />
        </div>
      )}

      {type === 'sms' && (
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={config.phone || ''}
            onChange={(e) => updateConfig('phone', e.target.value)}
            placeholder="+1234567890"
          />
        </div>
      )}

      {type === 'webhook' && (
        <div className="space-y-2">
          <Label htmlFor="webhook-url">Webhook URL</Label>
          <Input
            id="webhook-url"
            type="url"
            value={config.url || ''}
            onChange={(e) => updateConfig('url', e.target.value)}
            placeholder="https://your-webhook-url.com"
          />
        </div>
      )}

      {type === 'save_clip' && (
        <div className="space-y-2">
          <Label htmlFor="clip-duration">Clip Duration (seconds)</Label>
          <Input
            id="clip-duration"
            type="number"
            min="5"
            max="60"
            value={config.duration || 10}
            onChange={(e) => updateConfig('duration', parseInt(e.target.value))}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex-1">
          <Check className="h-4 w-4 mr-2" />
          Save Rule
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

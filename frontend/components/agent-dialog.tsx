"use client"

import { useState } from 'react'
import { BotIcon, Loader2Icon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Agent, AgentType, CreateAgentRequest, UpdateAgentRequest } from '@/lib/types'

interface AgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent?: Agent | null
  onSubmit: (data: CreateAgentRequest | UpdateAgentRequest) => Promise<void>
  isLoading?: boolean
}

const AGENT_TYPES: { value: AgentType; label: string }[] = [
  { value: 'assistant', label: 'Assistant' },
  { value: 'bot', label: 'Bot' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'custom', label: 'Custom' },
]

function AgentDialogInner({
  agent,
  onSubmit,
  isLoading = false,
  onOpenChange,
}: Omit<AgentDialogProps, 'open'>) {
  const [formData, setFormData] = useState({
    name: agent?.name || '',
    type: (agent?.type || 'assistant') as AgentType,
  })
  const [configKey, setConfigKey] = useState('')
  const [configValue, setConfigValue] = useState('')
  const [config, setConfig] = useState<Record<string, string>>(agent?.config || {})

  const isEdit = !!agent

  const handleAddConfig = () => {
    if (configKey.trim() && configValue.trim()) {
      setConfig((prev) => ({
        ...prev,
        [configKey.trim()]: configValue.trim(),
      }))
      setConfigKey('')
      setConfigValue('')
    }
  }

  const handleRemoveConfig = (key: string) => {
    setConfig((prev) => {
      const newConfig = { ...prev }
      delete newConfig[key]
      return newConfig
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const data: CreateAgentRequest | UpdateAgentRequest = isEdit
      ? {
          name: formData.name,
          type: formData.type,
          config: Object.keys(config).length > 0 ? config : undefined,
        }
      : {
          name: formData.name,
          type: formData.type,
          config: Object.keys(config).length > 0 ? config : undefined,
        }

    await onSubmit(data)
  }

  return (
    <DialogContent className="sm:max-w-[525px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <BotIcon className="h-5 w-5" />
          {isEdit ? 'Edit Agent' : 'Create New Agent'}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Update your agent configuration.'
            : 'Set up a new agent to automate tasks in your projects.'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-5 mt-4">
        <div className="space-y-2">
          <Label htmlFor="name">Agent Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="My Assistant"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Agent Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value as AgentType })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select agent type" />
            </SelectTrigger>
            <SelectContent>
              {AGENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Configuration (Optional)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Key"
              value={configKey}
              onChange={(e) => setConfigKey(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Value"
              value={configValue}
              onChange={(e) => setConfigValue(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddConfig}
              disabled={!configKey.trim() || !configValue.trim()}
            >
              Add
            </Button>
          </div>
          {Object.keys(config).length > 0 && (
            <div className="mt-2 space-y-1">
              {Object.entries(config).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between bg-muted px-3 py-2 rounded-md text-sm"
                >
                  <span>
                    <span className="font-medium">{key}:</span> {value}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveConfig(key)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
            {isEdit ? 'Update Agent' : 'Create Agent'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}

export function AgentDialog({
  open,
  onOpenChange,
  agent,
  onSubmit,
  isLoading = false,
}: AgentDialogProps) {
  // Use key to reset state when agent changes or dialog opens/closes
  // This avoids the setState-in-effect anti-pattern
  const dialogKey = agent?.id || 'new'
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AgentDialogInner
        key={dialogKey}
        agent={agent}
        onSubmit={onSubmit}
        isLoading={isLoading}
        onOpenChange={onOpenChange}
      />
    </Dialog>
  )
}

'use client'

import { useTheme } from 'next-themes'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { AVAILABLE_MODELS, MODEL_LABELS, type ModelType, useSettings } from '@/lib/hooks/useSettings'

export function GeneralSettings() {
  const { resolvedTheme, setTheme } = useTheme()
  const { settings, updateSettings } = useSettings()
  const [name, setName] = useState('Acme Team')

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">General</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your workspace appearance and defaults.
        </p>
      </div>

      <section className="grid gap-4">
        <h2 className="text-sm font-medium text-foreground">Appearance</h2>
        <div className="grid gap-2">
          <Label htmlFor="theme">Theme</Label>
          <Select
            onValueChange={(value) => setTheme(value)}
            value={resolvedTheme === 'system' ? 'system' : (resolvedTheme ?? 'system')}
          >
            <SelectTrigger className="w-48" id="theme">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <Separator />

      <section className="grid gap-4">
        <h2 className="text-sm font-medium text-foreground">Default model</h2>
        <div className="grid gap-2">
          <Label htmlFor="default-model">Model</Label>
          <Select
            onValueChange={(value) => updateSettings({ model: value as ModelType })}
            value={settings.model}
          >
            <SelectTrigger className="w-48" id="default-model">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map((model) => (
                <SelectItem key={model} value={model}>
                  {MODEL_LABELS[model]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <Separator />

      <section className="grid gap-4">
        <h2 className="text-sm font-medium text-foreground">Profile</h2>
        <div className="grid gap-2">
          <Label htmlFor="display-name">Display name</Label>
          <Input
            className="max-w-sm"
            id="display-name"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
          <p className="text-xs text-muted-foreground">
            Shown in the sidebar header and members list.
          </p>
        </div>
      </section>
    </div>
  )
}

'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Zap, RefreshCw, DollarSign, Package } from 'lucide-react'
import { toast } from 'sonner'

const SCENARIOS = [
  {
    id: 'high-volume',
    label: 'High-Volume Order',
    description: 'Process urgent bulk order from Stark Industries',
    icon: Package,
    badge: 'B2B',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' as string,
  },
  {
    id: 'refund',
    label: 'Refund Request',
    description: 'Process customer refund exceeding $500 threshold',
    icon: DollarSign,
    badge: 'Finance',
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' as string,
  },
  {
    id: 'inventory-crisis',
    label: 'Inventory Crisis',
    description: 'Simulate stock shortage across multiple products',
    icon: Zap,
    badge: 'Alert',
    color: 'bg-red-500/10 text-red-500 border-red-500/20' as string,
  },
  {
    id: 'full-workflow',
    label: 'Full Workflow',
    description: 'Complete order lifecycle from qualification to follow-up',
    icon: RefreshCw,
    badge: 'Demo',
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' as string,
  },
]

export function Scenarios() {
  const [running, setRunning] = useState<string | null>(null)

  const runScenario = useCallback(async (id: string) => {
    setRunning(id)
    try {
      const res = await fetch('/api/workflow/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: id }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Scenario "${id}" completed`, {
          description: `${data.events?.length ?? 'Multiple'} events generated`,
        })
      } else {
        toast.error(`Scenario failed: ${data.error}`)
      }
    } catch {
      toast.error('Failed to execute scenario')
    } finally {
      setRunning(null)
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Sample Business Scenarios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {SCENARIOS.map((s) => {
            const Icon = s.icon
            const isLoading = running === s.id
            return (
              <button
                key={s.id}
                onClick={() => runScenario(s.id)}
                disabled={isLoading}
                className="flex items-start gap-3 rounded-lg border p-3 text-left transition-all hover:bg-muted/50 hover:border-primary/50 disabled:opacity-50"
                aria-label={`Run scenario: ${s.label}`}
              >
                <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-md border ${s.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{s.label}</p>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{s.badge}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                </div>
                <Play className={`h-4 w-4 mt-1 shrink-0 text-muted-foreground ${isLoading ? 'animate-pulse' : ''}`} />
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

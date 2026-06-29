'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Play, Square, Activity, Zap, Clock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SimulationStep {
  agent: string
  task: string
  decision: string
  confidence: number
  result: string
  timestamp: number
}

interface AgentRow {
  id: string
  name: string
  role: string
  status: string
  current_task: string | null
  confidence: number
  health: number
  queue_size: number
  tasks_completed: number
}

export function LiveSimulation() {
  const [running, setRunning] = useState(false)
  const [agents, setAgents] = useState<AgentRow[]>([])
  const [steps, setSteps] = useState<SimulationStep[]>([])
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef = useRef(0)

  const fetchStep = useCallback(async () => {
    try {
      const res = await fetch('/api/simulate', { method: 'POST' })
      const data = await res.json()
      setAgents(data.agents ?? [])

      const step: SimulationStep = {
        ...data.step,
        timestamp: data.timestamp,
      }
      setSteps(prev => [step, ...prev].slice(0, 50))
      setProgress(0)
      progressRef.current = 0
    } catch { /* ignore */ }
  }, [])

  const startSimulation = useCallback(() => {
    setRunning(true)
    setSteps([])
    progressRef.current = 0
    setProgress(0)
    fetchStep()
    timerRef.current = setInterval(() => {
      progressRef.current += 2
      setProgress(prev => Math.min(prev + 2, 100))
      if (progressRef.current >= 100) {
        fetchStep()
      }
    }, 200)
  }, [fetchStep])

  const stopSimulation = useCallback(() => {
    setRunning(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-blue-500'
      case 'idle': return 'bg-emerald-500'
      case 'waiting': return 'bg-amber-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getRoleIcon = (role: string) => {
    const icons: Record<string, string> = {
      sales: '💰', finance: '📊', inventory: '📦', shipping: '🚚',
      marketing: '📢', support: '🎧', executive: '👔',
    }
    return icons[role] ?? '⚡'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm">Live Simulation Engine</CardTitle>
          {running && <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />}
        </div>
        <div className="flex items-center gap-2">
          {running && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{steps.length} ops</span>
            </div>
          )}
          <Button
            size="sm"
            variant={running ? 'destructive' : 'default'}
            onClick={running ? stopSimulation : startSimulation}
            className="h-8"
          >
            {running ? <Square className="mr-1.5 h-3.5 w-3.5" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
            {running ? 'Stop' : 'Start Simulation'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {running && (
          <Progress value={progress} className="h-1" />
        )}

        {!running && steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Zap className="h-8 w-8 mb-2" />
            <p className="text-sm font-medium">Press Start to begin live simulation</p>
            <p className="text-xs">Agents will execute tasks in real-time</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Agent Status</p>
              <div className="space-y-1.5">
                {agents.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-lg border bg-card/50 px-3 py-2 text-xs">
                    <span className="text-base">{getRoleIcon(a.role)}</span>
                    <div className={cn('h-2 w-2 rounded-full shrink-0', getStatusColor(a.status))} />
                    <span className="font-medium flex-1 truncate">{a.name}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-mono">{a.status}</Badge>
                    <span className="text-muted-foreground tabular-nums">{a.health}%</span>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <RefreshCw className="h-2.5 w-2.5" />
                      <span>{a.tasks_completed}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Activity Log</p>
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {steps.slice(0, 15).map((s, i) => (
                  <div key={`${s.timestamp}-${i}`} className="flex items-start gap-2 rounded border bg-card/30 px-2.5 py-1.5 text-[11px]">
                    <div className={cn(
                      'mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full',
                      s.result === 'success' ? 'bg-emerald-500' : s.result === 'failure' ? 'bg-red-500' : 'bg-amber-500'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium truncate">{s.agent.replace('-agent', '')}</span>
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 font-mono">{s.task}</Badge>
                      </div>
                      <p className="text-muted-foreground truncate mt-0.5">{s.decision.substring(0, 60)}</p>
                    </div>
                    <span className="text-muted-foreground shrink-0">{(s.confidence * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

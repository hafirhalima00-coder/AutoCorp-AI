'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Clock, ChevronRight, Brain, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReplayEvent {
  id: string
  timestamp: number
  agentName: string
  action: string
  decision: string
  confidence: number
  result: string
  duration: number
}

export function ReplayMode() {
  const [events, setEvents] = useState<ReplayEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events?result=all')
        const data = await res.json()
        const sorted = (data.events ?? []).reverse()
        setEvents(sorted)
        if (sorted.length > 0 && currentIndex === -1) {
          setCurrentIndex(0)
        }
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    fetchEvents()
  }, [])

  const play = useCallback(() => {
    setPlaying(true)
  }, [])

  const pause = useCallback(() => {
    setPlaying(false)
  }, [])

  const reset = useCallback(() => {
    setPlaying(false)
    setCurrentIndex(0)
  }, [])

  const next = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, events.length - 1))
  }, [events.length])

  const prev = useCallback(() => {
    setCurrentIndex(prev => Math.max(prev - 1, 0))
  }, [])

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    const interval = 1000 / speed
    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= events.length - 1) {
          setPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, interval)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [playing, speed, events.length])

  const currentEvent = events[currentIndex]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">Mission Replay</CardTitle>
            {playing && <Badge variant="default" className="text-[10px] animate-pulse">PLAYING</Badge>}
          </div>
          <div className="flex items-center gap-1">
            {[0.5, 1, 2, 4].map(s => (
              <Button
                key={s}
                variant={speed === s ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setSpeed(s)}
              >
                {s}x
              </Button>
            ))}
          </div>
        </div>
        {events.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground shrink-0">
              Step {currentIndex + 1} of {events.length}
            </span>
            <Progress value={((currentIndex + 1) / events.length) * 100} className="h-1.5 flex-1" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={reset} disabled={currentIndex <= 0 && !playing}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prev} disabled={currentIndex <= 0}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            className="h-10 w-10"
            onClick={playing ? pause : play}
            disabled={events.length === 0}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={next} disabled={currentIndex >= events.length - 1}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm font-medium">No events to replay</p>
            <p className="text-xs mt-1">Run the simulation or process orders to generate events</p>
          </div>
        ) : currentEvent ? (
          <div className="rounded-lg border bg-card">
            <div className="flex items-center gap-2 border-b bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{new Date(currentEvent.timestamp * 1000).toLocaleTimeString()}</span>
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-foreground">{currentEvent.agentName}</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-mono">{currentEvent.action}</Badge>
                <Badge variant={
                  currentEvent.result === 'success' ? 'default' : currentEvent.result === 'failure' ? 'destructive' : 'secondary'
                } className="text-[10px]">{currentEvent.result}</Badge>
              </div>
              <div className="flex items-start gap-2 rounded-md bg-muted/30 p-3">
                <Brain className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm">{currentEvent.decision}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span>Confidence: {(currentEvent.confidence * 100).toFixed(0)}%</span>
                    <span>Duration: {currentEvent.duration}ms</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {currentEvent.result === 'success' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                )}
                <span className={currentEvent.result === 'success' ? 'text-emerald-500' : 'text-red-500'}>
                  {currentEvent.result === 'success' ? 'Completed' : 'Failed'}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-1">
          {events.slice(0, 30).map((e, i) => (
            <button
              key={e.id}
              onClick={() => { setCurrentIndex(i); setPlaying(false) }}
              className={cn(
                'h-2 w-2 rounded-full transition-all',
                i === currentIndex ? 'ring-2 ring-primary scale-125' : '',
                e.result === 'success' ? 'bg-emerald-500' : e.result === 'failure' ? 'bg-red-500' : 'bg-amber-500',
                i < currentIndex ? 'opacity-60' : i > currentIndex ? 'opacity-30' : 'opacity-100'
              )}
              title={`${e.agentName}: ${e.action}`}
            />
          ))}
          {events.length > 30 && (
            <span className="text-[9px] text-muted-foreground ml-1">+{events.length - 30} more</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

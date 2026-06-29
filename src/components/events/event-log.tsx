'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Clock, Search, Download, Calendar, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { EventLogEntry } from '@/types'

export function EventLogView() {
  const [events, setEvents] = useState<EventLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterResult, setFilterResult] = useState<string>('all')
  const [filterAgent, setFilterAgent] = useState<string>('all')
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([])

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents')
      const data = await res.json()
      setAgents(data.map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })))
    } catch { /* ignore */ }
  }, [])

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterResult !== 'all') params.set('result', filterResult)
      if (filterAgent !== 'all') params.set('agent', filterAgent)
      const res = await fetch(`/api/events?${params}`)
      const data = await res.json()
      setEvents(data.events ?? [])
    } catch {
      console.error('Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }, [search, filterResult, filterAgent])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  useEffect(() => {
    fetchEvents()
    const interval = setInterval(fetchEvents, 5000)
    return () => clearInterval(interval)
  }, [fetchEvents])

  const handleExportCSV = useCallback(async () => {
    try {
      const res = await fetch('/api/export?type=csv')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `autocorp-events-${Date.now()}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Events exported as CSV')
    } catch {
      toast.error('Export failed')
    }
  }, [])

  const summary = {
    total: events.length,
    success: events.filter(e => e.result === 'success').length,
    failure: events.filter(e => e.result === 'failure').length,
    pending: events.filter(e => e.result === 'pending').length,
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle>Audit Trail</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportCSV} aria-label="Export events as CSV">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="rounded-lg border bg-muted/30 p-2">
              <p className="text-2xl font-bold">{summary.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="rounded-lg border bg-emerald-500/5 p-2">
              <p className="text-2xl font-bold text-emerald-500">{summary.success}</p>
              <p className="text-xs text-muted-foreground">Success</p>
            </div>
            <div className="rounded-lg border bg-red-500/5 p-2">
              <p className="text-2xl font-bold text-red-500">{summary.failure}</p>
              <p className="text-xs text-muted-foreground">Failure</p>
            </div>
            <div className="rounded-lg border bg-amber-500/5 p-2">
              <p className="text-2xl font-bold text-amber-500">{summary.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                className="h-9 pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search events"
              />
            </div>
            <Select value={filterAgent} onValueChange={(v) => v && setFilterAgent(v)}>
              <SelectTrigger className="h-9 w-36" aria-label="Filter by agent">
                <Filter className="mr-1 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterResult} onValueChange={(v) => v && setFilterResult(v)}>
              <SelectTrigger className="h-9 w-32" aria-label="Filter by result">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No events recorded</p>
              <p className="text-sm text-muted-foreground">Events will appear here as agents perform actions.</p>
            </div>
          ) : (
            <div className="space-y-1" role="log" aria-label="Event audit trail" aria-live="polite">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <div className={cn(
                    'mt-0.5 h-2 w-2 shrink-0 rounded-full',
                    event.result === 'success' ? 'bg-emerald-500' :
                    event.result === 'failure' ? 'bg-red-500' :
                    'bg-amber-500'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{event.agentName}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">{event.action}</Badge>
                      <Badge variant={
                        event.result === 'success' ? 'default' :
                        event.result === 'failure' ? 'destructive' :
                        'secondary'
                      } className="text-[10px]">
                        {event.result}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.decision}</p>
                    {event.details && (
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5 italic">{event.details}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(event.timestamp * 1000).toLocaleString()}
                      </span>
                      <span>Confidence: {(event.confidence * 100).toFixed(0)}%</span>
                      <span>Duration: {event.duration}ms</span>
                      {event.costEstimate > 0 && <span>Cost: ${event.costEstimate.toFixed(4)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

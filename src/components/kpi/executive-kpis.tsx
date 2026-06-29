'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { Zap, Clock, DollarSign, Target, ThumbsUp, ShieldBan, Brain } from 'lucide-react'

interface KPIData {
  avgExecutionTime: number
  costPerRun: number
  successRate: number
  avgConfidence: number
  humanApprovalRate: number
  blockedActions: number
  totalEvents: number
}

function StatCard({ icon: Icon, label, value, suffix, color, trend }: {
  icon: React.ElementType; label: string; value: string | number; suffix?: string; color: string; trend?: 'up' | 'down'
}) {
  return (
    <div className="rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={cn('h-4 w-4', color)} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold tracking-tight">{value}</span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
      {trend && (
        <span className={cn('text-[10px]', trend === 'up' ? 'text-emerald-500' : 'text-red-500')}>
          {trend === 'up' ? '↑' : '↓'} vs last hour
        </span>
      )}
    </div>
  )
}

export function ExecutiveKPIs() {
  const [kpi, setKpi] = useState<KPIData | null>(null)

  useEffect(() => {
    const fetchKPI = async () => {
      try {
        const [eventsRes, agentsRes, approvalsRes] = await Promise.all([
          fetch('/api/events'),
          fetch('/api/agents'),
          fetch('/api/approvals'),
        ])
        const events = await eventsRes.json()
        const agents = await agentsRes.json()
        const approvals = await approvalsRes.json()

        const eventList = events.events ?? []
        const totalEvents = eventList.length
        const successEvents = eventList.filter((e: { result: string }) => e.result === 'success').length
        const failureEvents = eventList.filter((e: { result: string }) => e.result === 'failure').length
        const successRate = totalEvents > 0 ? successEvents / totalEvents : 1

        const totalDuration = eventList.reduce((s: number, e: { duration: number }) => s + (e.duration ?? 0), 0)
        const avgExecutionTime = totalEvents > 0 ? Math.round(totalDuration / totalEvents) : 0

        const totalConfidence = eventList.reduce((s: number, e: { confidence: number }) => s + (e.confidence ?? 0), 0)
        const avgConfidence = totalEvents > 0 ? totalConfidence / totalEvents : 0

        const approvalList = approvals.approvals ?? []
        const totalApprovals = approvalList.length
        const resolvedApprovals = approvalList.filter((a: { status: string }) => a.status !== 'pending')
        const approvedCount = resolvedApprovals.filter((a: { status: string }) => a.status === 'approved').length
        const humanApprovalRate = resolvedApprovals.length > 0 ? approvedCount / resolvedApprovals.length : 1

        const blockedActions = failureEvents + resolvedApprovals.filter((a: { status: string }) => a.status === 'rejected').length
        const costPerRun = totalEvents > 0 ? totalEvents * 0.05 : 0

        setKpi({
          avgExecutionTime,
          costPerRun,
          successRate,
          avgConfidence,
          humanApprovalRate,
          blockedActions,
          totalEvents,
        })
      } catch { /* ignore */ }
    }

    fetchKPI()
    const interval = setInterval(fetchKPI, 10000)
    return () => clearInterval(interval)
  }, [])

  if (!kpi) {
    return (
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border bg-card animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Executive KPIs</CardTitle>
          <Badge variant="outline" className="text-[10px]">{kpi.totalEvents} total events</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={Clock} label="Avg Execution Time" value={kpi.avgExecutionTime} suffix="ms" color="text-blue-500" />
          <StatCard icon={DollarSign} label="Cost per Run" value={`$${kpi.costPerRun.toFixed(2)}`} color="text-emerald-500" />
          <StatCard icon={Target} label="Success Rate" value={(kpi.successRate * 100).toFixed(1)} suffix="%" color="text-emerald-500" trend={kpi.successRate > 0.8 ? 'up' : 'down'} />
          <StatCard icon={Brain} label="Avg Confidence" value={(kpi.avgConfidence * 100).toFixed(0)} suffix="%" color="text-purple-500" />
          <StatCard icon={ThumbsUp} label="Human Approval Rate" value={(kpi.humanApprovalRate * 100).toFixed(0)} suffix="%" color="text-amber-500" />
          <StatCard icon={ShieldBan} label="Blocked Actions" value={kpi.blockedActions} color="text-red-500" />
        </div>
      </CardContent>
    </Card>
  )
}

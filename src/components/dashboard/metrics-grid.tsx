'use client'

import { useEffect, useState } from 'react'
import { DollarSign, ShoppingCart, TrendingUp, Users, AlertTriangle, ShieldCheck, Activity } from 'lucide-react'
import { StatCard } from './stat-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BusinessMetrics } from '@/types'

export function MetricsGrid() {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/metrics')
        const data = await res.json()
        setMetrics(data)
      } catch {
        console.error('Failed to fetch metrics')
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
    )
  }

  if (!metrics) {
    return <div className="text-center text-muted-foreground py-8">Failed to load metrics</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Revenue" value={`$${metrics.revenue.toLocaleString()}`} icon={DollarSign} trend="up" />
        <StatCard title="Orders" value={metrics.orders} icon={ShoppingCart} trend="up" />
        <StatCard title="Profit" value={`$${metrics.profit.toLocaleString()}`} icon={TrendingUp} trend={metrics.profit > 0 ? 'up' : 'down'} />
        <StatCard title="Active AI Agents" value={metrics.activeAgents} icon={Users} trend="neutral" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Pending Approvals" value={metrics.pendingApprovals} icon={ShieldCheck} trend={metrics.pendingApprovals > 0 ? 'down' : 'neutral'} description="Requires CEO attention" />
        <StatCard title="Alerts" value={metrics.alerts} icon={AlertTriangle} trend={metrics.alerts > 0 ? 'down' : 'neutral'} description={metrics.alerts > 0 ? 'Requires attention' : 'All clear'} />
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Business Health Score</CardTitle>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{metrics.healthScore}</div>
            <Progress
              value={metrics.healthScore}
              className="mt-3 h-2"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {metrics.healthScore >= 80 ? 'Excellent' : metrics.healthScore >= 60 ? 'Good' : metrics.healthScore >= 40 ? 'Fair' : 'Critical'}
            </p>
          </CardContent>
          <div className={cn(
            'absolute bottom-0 left-0 right-0 h-0.5',
            metrics.healthScore >= 80 ? 'bg-emerald-500' : metrics.healthScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
          )} />
        </Card>
      </div>
    </div>
  )
}

function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

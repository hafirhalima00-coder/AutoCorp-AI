'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function StatCard({ title, value, description, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className={cn(
            'mt-2 flex items-center text-xs font-medium',
            trend === 'up' && 'text-emerald-500',
            trend === 'down' && 'text-red-500',
            trend === 'neutral' && 'text-muted-foreground'
          )}>
            <span className="mr-1">{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
            {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
          </div>
        )}
      </CardContent>
      <div className={cn(
        'absolute bottom-0 left-0 right-0 h-0.5',
        trend === 'up' && 'bg-emerald-500',
        trend === 'down' && 'bg-red-500',
        trend === 'neutral' && 'bg-muted-foreground/30'
      )} />
    </Card>
  )
}

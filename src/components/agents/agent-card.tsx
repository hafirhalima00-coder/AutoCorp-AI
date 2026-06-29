'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Brain, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'
import type { AgentState, AgentRole } from '@/types'
import { cn } from '@/lib/utils'

const roleColors: Record<AgentRole, string> = {
  sales: 'from-blue-500 to-cyan-500',
  finance: 'from-emerald-500 to-teal-500',
  inventory: 'from-amber-500 to-orange-500',
  shipping: 'from-purple-500 to-violet-500',
  marketing: 'from-pink-500 to-rose-500',
  support: 'from-indigo-500 to-blue-500',
  executive: 'from-red-500 to-rose-500',
}

const roleInitials: Record<AgentRole, string> = {
  sales: 'AS',
  finance: 'FF',
  inventory: 'II',
  shipping: 'SS',
  marketing: 'MM',
  support: 'SS',
  executive: 'EE',
}

interface AgentCardProps {
  agent: AgentState
}

export function AgentCard({ agent }: AgentCardProps) {
  const statusIcon = {
    idle: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
    working: <Clock className="h-3.5 w-3.5 text-blue-500 animate-pulse" />,
    waiting: <AlertCircle className="h-3.5 w-3.5 text-amber-500" />,
    error: <XCircle className="h-3.5 w-3.5 text-red-500" />,
  }

  const statusLabel = {
    idle: 'Idle',
    working: 'Working',
    waiting: 'Waiting',
    error: 'Error',
  }

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
      <div className={cn(
        'absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-80',
        roleColors[agent.role]
      )} />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className={cn(
              'bg-gradient-to-br text-white text-xs font-bold',
              roleColors[agent.role]
            )}>
              {roleInitials[agent.role]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold truncate">{agent.name}</CardTitle>
            <p className="text-xs capitalize text-muted-foreground">{agent.role} Agent</p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>{statusIcon[agent.status]}</TooltipTrigger>
              <TooltipContent>
                <p>{statusLabel[agent.status]}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {agent.currentTask && (
          <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
            <p className="text-xs font-medium text-muted-foreground">Current Task</p>
            <p className="text-sm truncate">{agent.currentTask}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Confidence</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Brain className="h-3 w-3 text-primary" />
              <span className="font-medium">{(agent.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Tasks Done</span>
            <p className="font-medium mt-0.5">{agent.tasksCompleted}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Health</span>
            <div className="flex items-center gap-2 mt-0.5">
              <Progress value={agent.health} className="h-1.5" />
              <span className="font-medium tabular-nums">{agent.health}%</span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Queue</span>
            <p className="font-medium mt-0.5">{agent.queueSize} tasks</p>
          </div>
        </div>
        {agent.lastDecision && (
          <div className="rounded-md border border-border/50 bg-muted/30 px-2.5 py-1.5">
            <p className="text-xs font-medium text-muted-foreground">Last Decision</p>
            <p className="text-xs mt-0.5 line-clamp-2">{agent.lastDecision}</p>
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <Badge variant={agent.status === 'error' ? 'destructive' : agent.status === 'waiting' ? 'secondary' : 'default'} className="text-[10px] px-1.5 py-0">
            {agent.role}
          </Badge>
          <span className={cn(
            'text-xs font-medium',
            agent.successRate >= 0.9 && 'text-emerald-500',
            agent.successRate >= 0.7 && agent.successRate < 0.9 && 'text-amber-500',
            agent.successRate < 0.7 && 'text-red-500'
          )}>
            {(agent.successRate * 100).toFixed(0)}% success
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

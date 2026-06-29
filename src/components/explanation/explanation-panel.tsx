'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ShieldAlert, CheckCircle2, AlertTriangle, FileText, User, DollarSign, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExplanationPanelProps {
  title: string
  decision: string
  confidence: number
  reason: string
  policy: string
  recommendedAction: string
  details?: string
  agentName?: string
  amount?: number
  className?: string
}

export function ExplanationPanel({
  title,
  decision,
  confidence,
  reason,
  policy,
  recommendedAction,
  details,
  agentName,
  amount,
  className,
}: ExplanationPanelProps) {
  const isBlocked = decision === 'BLOCKED'
  const isApproved = decision === 'APPROVED'
  const isPending = decision === 'PENDING'

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className={cn(
        'h-1.5',
        isBlocked ? 'bg-red-500' : isApproved ? 'bg-emerald-500' : 'bg-amber-500'
      )} />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isBlocked ? (
              <ShieldAlert className="h-5 w-5 text-red-500" />
            ) : isApproved ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            <CardTitle className="text-base capitalize">{title.replace(/_/g, ' ')}</CardTitle>
          </div>
          <Badge variant={
            isBlocked ? 'destructive' : isApproved ? 'default' : 'secondary'
          } className="text-xs px-3 py-1">
            {decision}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Confidence</p>
            <div className="flex items-center gap-2">
              <Progress value={confidence * 100} className="h-2 flex-1" />
              <span className={cn(
                'text-sm font-bold tabular-nums',
                confidence > 0.9 ? 'text-emerald-500' : confidence > 0.7 ? 'text-amber-500' : 'text-red-500'
              )}>
                {(confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Policy</p>
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <code className="rounded bg-muted px-2 py-0.5 text-sm font-mono font-bold">{policy}</code>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Reason</p>
            <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <span>{reason}</span>
              </div>
            </div>
          </div>

          {details && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Details</p>
              <div className="rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                {details}
              </div>
            </div>
          )}

          {agentName && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Requested by</span>
              <span className="font-medium">{agentName}</span>
            </div>
          )}

          {amount && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-500" />
              <span className="text-xl font-bold">${amount.toFixed(2)}</span>
              {amount > 500 && (
                <Badge variant="destructive" className="text-[9px]">EXCEEDS THRESHOLD</Badge>
              )}
            </div>
          )}
        </div>

        <Separator />

        <div>
          <p className="text-xs text-muted-foreground mb-1">Recommended Action</p>
          <div className="flex items-center gap-2 rounded-md border border-blue-500/30 bg-blue-500/5 px-3 py-2 text-sm">
            <ArrowRight className="h-4 w-4 text-blue-500 shrink-0" />
            <span>{recommendedAction}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertCircle, CheckCircle2, XCircle, DollarSign, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { ApprovalRequest } from '@/types'

export function ApprovalCenter() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchApprovals = useCallback(async () => {
    try {
      const res = await fetch('/api/approvals')
      const data = await res.json()
      setApprovals(data.approvals ?? [])
    } catch {
      console.error('Failed to fetch approvals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApprovals()
    const interval = setInterval(fetchApprovals, 5000)
    return () => clearInterval(interval)
  }, [fetchApprovals])

  const handleAction = async (id: string, approve: boolean) => {
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approve }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(approve ? 'Request approved' : 'Request rejected')
        fetchApprovals()
      }
    } catch {
      toast.error('Failed to process approval')
    }
  }

  const pendingApprovals = approvals.filter(a => a.status === 'pending')
  const historicalApprovals = approvals.filter(a => a.status !== 'pending')

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="text-3xl font-bold">{pendingApprovals.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="text-3xl font-bold">{historicalApprovals.filter(a => a.status === 'approved').length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-3xl font-bold">{historicalApprovals.filter(a => a.status === 'rejected').length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              <span className="text-3xl font-bold">{pendingApprovals.filter(a => a.risk === 'high').length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {pendingApprovals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-sm text-muted-foreground">No pending approvals require your attention.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((approval) => (
                  <Card key={approval.id} className={cn(
                    'border-l-4',
                    approval.risk === 'high' ? 'border-l-red-500' :
                    approval.risk === 'medium' ? 'border-l-amber-500' :
                    'border-l-blue-500'
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{approval.agentName}</span>
                            <Badge variant={
                              approval.risk === 'high' ? 'destructive' :
                              approval.risk === 'medium' ? 'secondary' :
                              'default'
                            } className="text-[10px]">
                              {approval.risk} risk
                            </Badge>
                          </div>
                          <p className="font-medium text-sm">{approval.action}</p>
                          <p className="text-xs text-muted-foreground mt-1">{approval.details}</p>
                          {approval.amount && (
                            <div className="flex items-center gap-1 mt-1 text-sm">
                              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-medium">${approval.amount.toFixed(2)}</span>
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-2">
                            {new Date(approval.createdAt * 1000).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-8"
                            onClick={() => handleAction(approval.id, true)}
                          >
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => handleAction(approval.id, false)}
                          >
                            <XCircle className="mr-1 h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {historicalApprovals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {historicalApprovals.map((approval) => (
                  <div key={approval.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{approval.action}</span>
                        <Badge variant={approval.status === 'approved' ? 'default' : 'destructive'} className="text-[10px]">
                          {approval.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{approval.agentName} &middot; {new Date(approval.createdAt * 1000).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle2, XCircle, DollarSign, ShieldAlert, FileText, User, Clock, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { ApprovalRequest } from '@/types'
import { ExplanationPanel } from '@/components/explanation/explanation-panel'

const POLICY_MAP: Record<string, { policy: string; reason: string }> = {
  refund: { policy: 'FIN-004', reason: 'Amount exceeds $500 threshold per policy' },
  discount: { policy: 'SALES-007', reason: 'Discount exceeds 40% maximum allowed' },
  bulk_restock: { policy: 'INV-002', reason: 'Bulk restock requires executive authorization' },
  large_payment: { policy: 'FIN-001', reason: 'Payment exceeds $5,000 review threshold' },
  health_intervention: { policy: 'OPS-003', reason: 'Agent health below critical threshold' },
  complaint_resolution: { policy: 'SUP-001', reason: 'High-severity complaint escalation required' },
  issue_escalation: { policy: 'SUP-003', reason: 'Issue requires executive-level decision' },
  marketing_campaign: { policy: 'MKT-002', reason: 'Campaign budget exceeds $10,000 limit' },
  pricing_change: { policy: 'SALES-008', reason: 'Price change > 40% requires approval' },
  default: { policy: 'GEN-001', reason: 'Action requires human oversight' },
}

export function EnhancedApprovalCenter() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null)

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
        toast.success(approve ? 'Approved ✓' : 'Rejected ✗')
        fetchApprovals()
        setSelectedApproval(null)
      }
    } catch {
      toast.error('Failed to process')
    }
  }

  const pending = approvals.filter(a => a.status === 'pending')
  const resolved = approvals.filter(a => a.status !== 'pending')

  const getPolicyInfo = (action: string) => {
    for (const [key, val] of Object.entries(POLICY_MAP)) {
      if (action.toLowerCase().includes(key)) return val
    }
    return POLICY_MAP.default
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{pending.length}</p>
              <p className="text-xs text-muted-foreground">Pending Approval</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{resolved.filter(a => a.status === 'approved').length}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{resolved.filter(a => a.status === 'rejected').length}</p>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedApproval ? (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedApproval(null)} className="mb-2">
            ← Back to approvals
          </Button>
          <ExplanationPanel
            title={selectedApproval.action}
            decision={selectedApproval.status === 'pending' ? 'PENDING' : selectedApproval.status === 'approved' ? 'APPROVED' : 'BLOCKED'}
            confidence={0.97}
            reason={getPolicyInfo(selectedApproval.action).reason}
            policy={getPolicyInfo(selectedApproval.action).policy}
            recommendedAction={selectedApproval.amount && selectedApproval.amount > 500
              ? 'Escalate to CEO for manual review'
              : 'Proceed with standard process'}
            details={selectedApproval.details}
            agentName={selectedApproval.agentName}
            amount={selectedApproval.amount}
          />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Human Approval Center</CardTitle>
              <Badge variant="outline" className="text-xs">
                {pending.length} pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {pending.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
                  <p className="text-lg font-medium">All clear</p>
                  <p className="text-sm text-muted-foreground">No actions require human approval</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.map((a) => {
                    const policy = getPolicyInfo(a.action)
                    return (
                      <Card key={a.id} className={cn(
                        'border-l-4 cursor-pointer transition-all hover:shadow-md',
                        a.risk === 'high' ? 'border-l-red-500' :
                        a.risk === 'medium' ? 'border-l-amber-500' :
                        'border-l-blue-500'
                      )} onClick={() => setSelectedApproval(a)}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <ShieldAlert className={cn(
                                  'h-4 w-4',
                                  a.risk === 'high' ? 'text-red-500' : a.risk === 'medium' ? 'text-amber-500' : 'text-blue-500'
                                )} />
                                <span className="font-semibold text-sm capitalize">{a.action.replace(/_/g, ' ')}</span>
                                <Badge variant={
                                  a.risk === 'high' ? 'destructive' : a.risk === 'medium' ? 'secondary' : 'default'
                                } className="text-[10px]">{a.risk.toUpperCase()} RISK</Badge>
                              </div>

                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" /> {a.agentName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" /> {policy.policy}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {new Date(a.createdAt * 1000).toLocaleString()}
                                </span>
                              </div>

                              <p className="text-xs mt-2 text-muted-foreground bg-muted/30 rounded-md px-2.5 py-2">
                                {a.details}
                              </p>

                              {a.amount && (
                                <div className="flex items-center gap-1.5 mt-2">
                                  <DollarSign className="h-4 w-4 text-red-500" />
                                  <span className="text-lg font-bold text-red-500">${a.amount.toFixed(2)}</span>
                                  {a.amount > 500 && (
                                    <Badge variant="destructive" className="text-[9px]">EXCEEDS POLICY</Badge>
                                  )}
                                </div>
                              )}

                              <div className="mt-2 text-[10px] text-muted-foreground bg-muted/20 rounded px-2 py-1">
                                <span className="font-medium">Policy {policy.policy}:</span> {policy.reason}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <Button size="sm" variant="default" className="h-8 w-24" onClick={() => handleAction(a.id, true)}>
                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 w-24" onClick={() => handleAction(a.id, false)}>
                                <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-24 text-xs" onClick={() => setSelectedApproval(a)}>
                                <ArrowUpRight className="mr-1 h-3 w-3" /> Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {resolved.length > 0 && !selectedApproval && (
        <Card>
          <CardHeader>
            <CardTitle>Resolution History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {resolved.slice(0, 10).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    {a.status === 'approved' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                    )}
                    <span className="font-medium text-xs truncate">{a.action.replace(/_/g, ' ')}</span>
                    {a.amount && <span className="text-xs text-muted-foreground">${a.amount.toFixed(2)}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                    <span>{a.agentName}</span>
                    <span>{new Date((a.resolvedAt ?? a.createdAt) * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

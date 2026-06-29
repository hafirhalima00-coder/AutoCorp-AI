import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { ApprovalRequest } from '@/types'

export async function GET() {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM approvals ORDER BY created_at DESC').all() as Array<{
    id: string; agent_id: string; agent_name: string; action: string
    details: string; risk: string; amount: number | null; status: string
    created_at: number; resolved_at: number | null; resolved_by: string | null
  }>

  const approvals: ApprovalRequest[] = rows.map(r => ({
    id: r.id,
    agentId: r.agent_id,
    agentName: r.agent_name,
    action: r.action,
    details: r.details,
    risk: r.risk as ApprovalRequest['risk'],
    amount: r.amount ?? undefined,
    status: r.status as ApprovalRequest['status'],
    createdAt: r.created_at,
    resolvedAt: r.resolved_at ?? undefined,
    resolvedBy: r.resolved_by ?? undefined,
  }))

  return NextResponse.json({ approvals })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { id, approve } = body
  const db = getDb()

  const approval = db.prepare('SELECT * FROM approvals WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!approval) {
    return NextResponse.json({ success: false, error: 'Approval not found' }, { status: 404 })
  }

  db.prepare('UPDATE approvals SET status = ?, resolved_at = unixepoch(), resolved_by = ? WHERE id = ?')
    .run(approve ? 'approved' : 'rejected', 'CEO (Manual)', id)

  return NextResponse.json({ success: true, status: approve ? 'approved' : 'rejected' })
}

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { EventLogEntry } from '@/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') ?? ''
  const result = searchParams.get('result') ?? 'all'
  const agent = searchParams.get('agent') ?? 'all'

  const db = getDb()

  let query = 'SELECT * FROM events'
  const conditions: string[] = []
  const params: unknown[] = []

  if (search) {
    conditions.push('(agent_name LIKE ? OR action LIKE ? OR decision LIKE ?)')
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }

  if (result && result !== 'all') {
    conditions.push('result = ?')
    params.push(result)
  }

  if (agent && agent !== 'all') {
    conditions.push('agent_id = ?')
    params.push(agent)
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }

  query += ' ORDER BY timestamp DESC LIMIT 100'

  const rows = db.prepare(query).all(...params) as Array<{
    id: string; timestamp: number; agent_id: string; agent_name: string
    action: string; decision: string; confidence: number; duration: number
    cost_estimate: number; result: string; details: string | null
  }>

  const events: EventLogEntry[] = rows.map(r => ({
    id: r.id,
    timestamp: r.timestamp,
    agentId: r.agent_id,
    agentName: r.agent_name,
    action: r.action,
    decision: r.decision,
    confidence: r.confidence,
    duration: r.duration,
    costEstimate: r.cost_estimate,
    result: r.result as EventLogEntry['result'],
    details: r.details ?? undefined,
  }))

  return NextResponse.json({ events })
}

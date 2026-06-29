import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { AgentMessage } from '@/types'

export async function GET() {
  const db = getDb()
  const rows = db.prepare(`
    SELECT * FROM agent_messages ORDER BY timestamp DESC LIMIT 50
  `).all() as Array<{
    id: string; from_agent: string; to_agent: string; type: string
    content: string; timestamp: number; confidence: number; metadata: string | null
  }>

  const messages: AgentMessage[] = rows.map(r => ({
    id: r.id,
    from: r.from_agent,
    to: r.to_agent,
    type: r.type as AgentMessage['type'],
    content: r.content,
    timestamp: r.timestamp,
    confidence: r.confidence,
    metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
  }))

  return NextResponse.json({ messages })
}

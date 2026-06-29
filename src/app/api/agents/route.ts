import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { AgentState } from '@/types'

export async function GET() {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM agents').all() as Array<{
    id: string; name: string; role: string; status: string; current_task: string | null
    confidence: number; last_decision: string | null; health: number; queue_size: number
    tasks_completed: number; success_rate: number
  }>

  const agents: AgentState[] = rows.map(r => ({
    id: r.id,
    name: r.name,
    role: r.role as AgentState['role'],
    status: r.status as AgentState['status'],
    currentTask: r.current_task,
    confidence: r.confidence,
    lastDecision: r.last_decision,
    health: r.health,
    queueSize: r.queue_size,
    tasksCompleted: r.tasks_completed,
    successRate: r.success_rate,
  }))

  return NextResponse.json(agents)
}

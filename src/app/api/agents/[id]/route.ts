import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getAgent } from '@/lib/agents'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = getDb()
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as Record<string, unknown> | undefined

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  return NextResponse.json(agent)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { task, context } = body

  const roleMap: Record<string, import('@/types').AgentRole> = {
    'sales-agent': 'sales',
    'finance-agent': 'finance',
    'inventory-agent': 'inventory',
    'shipping-agent': 'shipping',
    'marketing-agent': 'marketing',
    'support-agent': 'support',
    'executive-agent': 'executive',
  }

  const role = roleMap[id]
  if (!role) {
    return NextResponse.json({ error: 'Invalid agent' }, { status: 400 })
  }

  const agent = getAgent(role)
  const result = await agent.executeTask(task, context)

  return NextResponse.json(result)
}

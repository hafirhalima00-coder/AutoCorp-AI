import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { BusinessWorkflow } from '@/lib/workflows/business-workflow'

const workflow = new BusinessWorkflow()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId')
  const listOrders = searchParams.get('orders')

  if (listOrders) {
    const db = getDb()
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
    const status = await workflow.getWorkflowStatus()
    return NextResponse.json({ orders, ...status })
  }

  const steps = workflow.getWorkflowSteps(orderId ?? undefined)
  return NextResponse.json({ steps })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { orderId } = body

  if (!orderId) {
    return NextResponse.json({ error: 'orderId required' }, { status: 400 })
  }

  try {
    const events = await workflow.processOrder(orderId)
    const steps = workflow.getWorkflowSteps(orderId)
    return NextResponse.json({ success: true, events, steps })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

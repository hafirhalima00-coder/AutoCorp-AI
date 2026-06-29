import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'csv'

  const db = getDb()

  switch (type) {
    case 'csv': {
      const events = db.prepare('SELECT * FROM events ORDER BY timestamp DESC LIMIT 1000').all() as Array<{
        timestamp: number; agent_name: string; action: string; decision: string
        confidence: number; duration: number; cost_estimate: number; result: string
      }>

      const headers = 'Timestamp,Agent,Action,Decision,Confidence,Duration (ms),Cost ($),Result\n'
      const rows = events.map(e =>
        `"${new Date(e.timestamp * 1000).toISOString()}","${e.agent_name}","${e.action.replace(/"/g, '""')}","${e.decision.replace(/"/g, '""')}",${e.confidence.toFixed(2)},${e.duration},${e.cost_estimate.toFixed(4)},"${e.result}"`
      ).join('\n')

      return new NextResponse(headers + rows, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="autocorp-events-${Date.now()}.csv"`,
        },
      })
    }

    case 'metrics': {
      const revenue = (db.prepare("SELECT COALESCE(SUM(total), 0) as t FROM orders WHERE status IN ('completed','shipped','delivered')").get() as { t: number }).t
      const costs = (db.prepare("SELECT COALESCE(SUM(oi.quantity * p.cost), 0) as t FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN orders o ON oi.order_id = o.id WHERE o.status IN ('completed','shipped','delivered')").get() as { t: number }).t
      const orders = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number }).c
      const agents = db.prepare('SELECT name, role, tasks_completed, success_rate, health FROM agents').all()

      const report = {
        exportedAt: new Date().toISOString(),
        summary: { revenue, profit: revenue - costs, totalOrders: orders, profitMargin: revenue > 0 ? ((revenue - costs) / revenue * 100).toFixed(1) : 0 },
        agents,
        products: db.prepare('SELECT name, sku, price, cost, stock, category FROM products').all(),
        customers: db.prepare('SELECT name, email, total_orders, total_spent, segment FROM customers').all(),
      }

      return NextResponse.json(report, {
        headers: { 'Content-Disposition': `attachment; filename="autocorp-metrics-${Date.now()}.json"` },
      })
    }

    default:
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
  }
}

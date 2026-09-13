import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { BusinessWorkflow } from '@/lib/workflows/business-workflow'
import { SalesAgent } from '@/lib/agents/sales-agent'
import { FinanceAgent } from '@/lib/agents/finance-agent'
import { InventoryAgent } from '@/lib/agents/inventory-agent'
import { ShippingAgent } from '@/lib/agents/shipping-agent'
import { SupportAgent } from '@/lib/agents/support-agent'
import { ExecutiveAgent } from '@/lib/agents/executive-agent'

const workflow = new BusinessWorkflow()

function logScenarioEvent(db: ReturnType<typeof getDb>, agentId: string, agentName: string, action: string, decision: string, confidence: number, result: 'success' | 'failure' | 'pending', details?: string) {
  const id = `evt-sc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  db.prepare(`
    INSERT INTO events (id, timestamp, agent_id, agent_name, action, decision, confidence, duration, cost_estimate, result, details)
    VALUES (?, unixepoch(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, agentId, agentName, action, decision, confidence, Math.floor(Math.random() * 800 + 200), 0.05, result, details ?? null)
}

export async function POST(request: NextRequest) {
  const { scenario } = await request.json()
  const db = getDb()
  const now = Math.floor(Date.now() / 1000)

  try {
    switch (scenario) {
      case 'high-volume': {
        db.prepare(`
          INSERT INTO orders (id, customer_id, customer_name, total, status, priority, payment_status, shipping_status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(`ord-sc-${now}`, 'cust-5', 'Stark Industries', 5999.99, 'new', 'high', 'pending', 'pending', now, now)

        db.prepare(`INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)`)
          .run(`ord-sc-${now}`, 'prod-2', 'Nano Gadget', 25, 89.99)
        db.prepare(`INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)`)
          .run(`ord-sc-${now}`, 'prod-4', 'Plasma Core', 10, 349.99)

        const salesAgent = new SalesAgent()
        await salesAgent.executeTask('qualify_order', { customerId: 'cust-5', orderTotal: 5999.99, orderId: `ord-sc-${now}` })

        const invAgent = new InventoryAgent()
        await invAgent.executeTask('check_stock', { orderId: `ord-sc-${now}` })

        return NextResponse.json({ success: true, events: 4, orderId: `ord-sc-${now}` })
      }

      case 'refund': {
        db.prepare(`
          INSERT INTO approvals (id, agent_id, agent_name, action, details, risk, amount, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        `).run(`apr-sc-${now}`, 'support-agent', 'Sam Support', 'refund', 'Customer requested refund for defective product. Amount exceeds $500 threshold.', 'high', 749.99, now)

        const supportAgent = new SupportAgent()
        const result = await supportAgent.executeTask('process_return', { orderId: 'ord-5', reason: 'Product defect - Neural Interface malfunction' })

        return NextResponse.json({ success: true, events: 2, approvalId: `apr-sc-${now}`, result })
      }

      case 'inventory-crisis': {
        db.prepare(`UPDATE products SET stock = 0 WHERE id = 'prod-6'`)
        db.prepare(`UPDATE products SET stock = 1 WHERE id = 'prod-4'`)
        db.prepare(`UPDATE products SET stock = 2 WHERE id = 'prod-3'`)

        const invAgent = new InventoryAgent()
        await invAgent.executeTask('restock_alert')

        await invAgent.executeTask('check_stock', { orderId: 'ord-5' })

        return NextResponse.json({ success: true, events: 3, message: 'Inventory crisis simulated. Stock reduced for Neural Interface, Plasma Core, Fusion Device.' })
      }

      case 'full-workflow': {
        db.prepare(`
          INSERT INTO orders (id, customer_id, customer_name, total, status, priority, payment_status, shipping_status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(`ord-fw-${now}`, 'cust-6', 'Wayne Enterprises', 2499.95, 'new', 'high', 'pending', 'pending', now, now)

        db.prepare(`INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)`)
          .run(`ord-fw-${now}`, 'prod-1', 'Quantum Widget', 15, 49.99)
        db.prepare(`INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)`)
          .run(`ord-fw-${now}`, 'prod-7', 'Eco Sensor', 20, 79.99)

        const events = await workflow.processOrder(`ord-fw-${now}`)

        return NextResponse.json({ success: true, events, orderId: `ord-fw-${now}` })
      }

      case 'self-correction': {
        db.prepare(`UPDATE products SET price = 5.00, cost = 22.50 WHERE id = 'prod-1'`).run()
        logScenarioEvent(db, 'finance-agent', 'Fiona Finance', 'detect_pricing_error', 'Pricing error detected: Quantum Widget priced below cost. Auto-correcting.', 0.95, 'success', 'Quantum Widget was $49.99, competitor pricing analysis shows $49.99 is optimal')
        db.prepare(`UPDATE products SET price = 49.99 WHERE id = 'prod-1'`).run()
        logScenarioEvent(db, 'finance-agent', 'Fiona Finance', 'correct_pricing', 'Price corrected: Quantum Widget restored to $49.99', 0.98, 'success', 'Self-correction complete. No human intervention required.')
        logScenarioEvent(db, 'marketing-agent', 'Maya Marketing', 'adjust_campaign', 'Marketing campaign adjusted for corrected pricing.', 0.92, 'success', 'Promotional material updated to reflect accurate pricing.')
        return NextResponse.json({ success: true, events: 3, message: 'Self-correction scenario: Finance agent detected and fixed pricing error automatically. Marketing agent adjusted campaigns.' })
      }

      case 'failure-test': {
        db.prepare(`UPDATE agents SET status = 'error', health = 30, current_task = 'FAILED:connection_timeout' WHERE id = 'sales-agent'`).run()
        logScenarioEvent(db, 'sales-agent', 'Alex Sales', 'process_order', 'Agent offline: connection timeout. Cannot process incoming orders.', 0.0, 'failure', 'Sales agent unresponsive. Order queue building up.')
        logScenarioEvent(db, 'executive-agent', 'Eve Executive', 'detect_failure', 'Executive detected sales-agent failure. Rerouting orders to backup qualification.', 0.91, 'success', 'Auto-failover initiated. Finance agent assuming sales qualification duties.')
        logScenarioEvent(db, 'finance-agent', 'Fiona Finance', 'assume_sales_duties', 'Taking over sales qualification during outage. Processing order backlog.', 0.88, 'success', 'Processing 3 queued orders through executive override protocol.')
        db.prepare(`UPDATE agents SET status = 'idle', health = 100, current_task = NULL WHERE id = 'sales-agent'`).run()
        logScenarioEvent(db, 'executive-agent', 'Eve Executive', 'resolve_failure', 'Sales agent recovered. Handing back control. Failure incident logged.', 0.94, 'success', 'Automatic recovery confirmed. No data loss. 3 orders processed during outage.')
        return NextResponse.json({ success: true, events: 4, message: 'Failure test: Sales agent went offline. Executive detected failure, finance agent took over sales duties, then sales agent recovered automatically.' })
      }

      default:
        return NextResponse.json({ success: false, error: `Unknown scenario: ${scenario}` }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

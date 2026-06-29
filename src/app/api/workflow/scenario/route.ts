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

      default:
        return NextResponse.json({ success: false, error: `Unknown scenario: ${scenario}` }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

import type { WorkflowStep, Order, EventLogEntry } from '@/types'
import { getDb } from '@/lib/db'
import { SalesAgent } from '@/lib/agents/sales-agent'
import { FinanceAgent } from '@/lib/agents/finance-agent'
import { InventoryAgent } from '@/lib/agents/inventory-agent'
import { ShippingAgent } from '@/lib/agents/shipping-agent'
import { MarketingAgent } from '@/lib/agents/marketing-agent'
import { SupportAgent } from '@/lib/agents/support-agent'
import { ExecutiveAgent } from '@/lib/agents/executive-agent'

const workflowSteps: WorkflowStep[] = [
  { id: 'new_order', label: 'Customer Order', status: 'pending' },
  { id: 'qualification', label: 'Sales Qualification', status: 'pending' },
  { id: 'inventory_check', label: 'Inventory Check', status: 'pending' },
  { id: 'payment_approval', label: 'Payment Approval', status: 'pending' },
  { id: 'shipping', label: 'Shipping', status: 'pending' },
  { id: 'notification', label: 'Customer Notification', status: 'pending' },
  { id: 'support_followup', label: 'Support Follow-up', status: 'pending' },
]

export class BusinessWorkflow {
  private salesAgent = new SalesAgent()
  private financeAgent = new FinanceAgent()
  private inventoryAgent = new InventoryAgent()
  private shippingAgent = new ShippingAgent()
  private marketingAgent = new MarketingAgent()
  private supportAgent = new SupportAgent()
  private executiveAgent = new ExecutiveAgent()

  getWorkflowSteps(orderId?: string): WorkflowStep[] {
    if (!orderId) return workflowSteps

    const db = getDb()
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Order | undefined
    if (!order) return workflowSteps

    const stepStatusMap: Record<string, { status: WorkflowStep['status']; completedAt?: number }> = {
      new_order: { status: 'completed', completedAt: order.createdAt },
    }

    if (order.status === 'qualified' || order.status === 'inventory_check' || order.status === 'payment_pending' || order.status === 'payment_approved' || order.status === 'shipping' || order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed') {
      stepStatusMap.qualification = { status: 'completed' }
    }
    if (order.status === 'inventory_check' || order.status === 'payment_pending' || order.status === 'payment_approved' || order.status === 'shipping' || order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed') {
      stepStatusMap.inventory_check = { status: 'completed' }
    }
    if (order.status === 'payment_pending' || order.status === 'payment_approved' || order.status === 'shipping' || order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed') {
      stepStatusMap.payment_approval = { status: 'completed' }
    }
    if (order.status === 'payment_approved' || order.status === 'shipping' || order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed') {
      stepStatusMap.payment_approval = { status: 'completed' }
    }
    if (order.status === 'shipping' || order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed') {
      stepStatusMap.shipping = { status: 'completed' }
    }
    if (order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed') {
      stepStatusMap.shipping = { status: 'completed' }
      stepStatusMap.notification = { status: 'completed' }
    }
    if (order.status === 'delivered' || order.status === 'completed') {
      stepStatusMap.support_followup = { status: 'completed' }
    }

    return workflowSteps.map(step => {
      const mapped = stepStatusMap[step.id]
      if (mapped) {
        return { ...step, status: mapped.status, completedAt: mapped.completedAt }
      }
      if (order.status === step.id) {
        return { ...step, status: 'active' }
      }
      return step
    })
  }

  async processOrder(orderId: string): Promise<EventLogEntry[]> {
    const events: EventLogEntry[] = []
    const db = getDb()
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Order | undefined
    if (!order) return events

    const logAndRecord = async (
      agent: 'sales' | 'finance' | 'inventory' | 'shipping' | 'marketing' | 'support' | 'executive',
      task: string,
      context?: Record<string, unknown>
    ) => {
      const agentMap = {
        sales: this.salesAgent,
        finance: this.financeAgent,
        inventory: this.inventoryAgent,
        shipping: this.shippingAgent,
        marketing: this.marketingAgent,
        support: this.supportAgent,
        executive: this.executiveAgent,
      }
      const result = await agentMap[agent].executeTask(task, context)
      events.push({
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Math.floor(Date.now() / 1000),
        agentId: `${agent}-agent`,
        agentName: agentMap[agent].displayName,
        action: task,
        decision: result.decision,
        confidence: result.confidence,
        duration: Math.floor(Math.random() * 1000 + 200),
        costEstimate: 0.05,
        result: result.result,
        details: result.details,
      })
    }

    await logAndRecord('sales', 'qualify_order', {
      customerId: order.customerId,
      orderTotal: order.total,
      orderId: order.id,
    })

    db.prepare('UPDATE orders SET status = ?, updated_at = unixepoch() WHERE id = ?').run('qualified', orderId)

    await logAndRecord('inventory', 'check_stock', { orderId: order.id })

    db.prepare('UPDATE orders SET status = ?, updated_at = unixepoch() WHERE id = ?').run('inventory_check', orderId)

    await logAndRecord('finance', 'approve_payment', {
      orderTotal: order.total,
      customerId: order.customerId,
      orderId: order.id,
    })

    db.prepare('UPDATE orders SET payment_status = ?, status = ?, updated_at = unixepoch() WHERE id = ?')
      .run('approved', 'payment_approved', orderId)

    await logAndRecord('inventory', 'reserve_items', { orderId: order.id })

    await logAndRecord('shipping', 'prepare_shipment', { orderId: order.id })

    db.prepare('UPDATE orders SET status = ?, updated_at = unixepoch() WHERE id = ?').run('shipped', orderId)

    await logAndRecord('support', 'notify_customer', {
      orderId: order.id,
      customerId: order.customerId,
    })

    db.prepare('UPDATE orders SET status = ?, updated_at = unixepoch() WHERE id = ?').run('completed', orderId)

    await logAndRecord('support', 'handle_complaint', {
      customerId: order.customerId,
      issue: 'Order follow-up',
      severity: 'low',
    })

    return events
  }

  async getWorkflowStatus(): Promise<{
    totalOrders: number
    activeOrders: number
    completedOrders: number
    failedOrders: number
    avgProcessingTime: number
  }> {
    const db = getDb()
    const totalOrders = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number }).c
    const activeOrders = (db.prepare("SELECT COUNT(*) as c FROM orders WHERE status NOT IN ('completed', 'cancelled', 'refunded')").get() as { c: number }).c
    const completedOrders = (db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'completed'").get() as { c: number }).c
    const failedOrders = (db.prepare("SELECT COUNT(*) as c FROM orders WHERE status IN ('cancelled', 'refunded')").get() as { c: number }).c
    const avgProcessingTime = completedOrders > 0 ? 3600000 : 0

    return { totalOrders, activeOrders, completedOrders, failedOrders, avgProcessingTime }
  }
}

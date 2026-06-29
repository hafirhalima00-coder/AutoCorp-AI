import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { SalesAgent } from '@/lib/agents/sales-agent'
import { FinanceAgent } from '@/lib/agents/finance-agent'
import { InventoryAgent } from '@/lib/agents/inventory-agent'
import { ShippingAgent } from '@/lib/agents/shipping-agent'
import { MarketingAgent } from '@/lib/agents/marketing-agent'
import { SupportAgent } from '@/lib/agents/support-agent'
import { ExecutiveAgent } from '@/lib/agents/executive-agent'
import { MetricsEngine } from '@/lib/metrics/metrics-engine'

const TASKS: Record<string, { task: string; context: () => Record<string, unknown> }[]> = {
  'sales-agent': [
    { task: 'qualify_order', context: () => ({ customerId: `cust-${Math.floor(Math.random() * 8) + 1}`, orderTotal: Math.random() * 5000 + 50, orderId: `ord-sim-${Date.now()}` }) },
    { task: 'process_quote', context: () => ({ productId: `prod-${Math.floor(Math.random() * 8) + 1}`, quantity: Math.floor(Math.random() * 20 + 1) }) },
    { task: 'follow_up_lead', context: () => ({ customerName: ['Acme Corp', 'Globex Inc', 'Stark Industries', 'Wayne Enterprises'][Math.floor(Math.random() * 4)] }) },
  ],
  'finance-agent': [
    { task: 'approve_payment', context: () => ({ orderTotal: Math.random() * 3000 + 100, customerId: `cust-${Math.floor(Math.random() * 8) + 1}`, orderId: `ord-sim-${Date.now()}` }) },
    { task: 'calculate_profitability', context: () => ({ productId: `prod-${Math.floor(Math.random() * 8) + 1}` }) },
    { task: 'generate_report', context: () => ({}) },
  ],
  'inventory-agent': [
    { task: 'check_stock', context: () => ({ orderId: `ord-sim-${Date.now()}` }) },
    { task: 'restock_alert', context: () => ({}) },
    { task: 'update_inventory', context: () => ({ productId: `prod-${Math.floor(Math.random() * 8) + 1}`, quantity: Math.floor(Math.random() * 50 + 10) }) },
  ],
  'shipping-agent': [
    { task: 'prepare_shipment', context: () => ({ orderId: `ord-sim-${Date.now()}`, orderTotal: Math.random() * 1000 + 50 }) },
    { task: 'calculate_shipping', context: () => ({ orderId: `ord-sim-${Date.now()}`, orderTotal: Math.random() * 500 + 20, itemCount: Math.floor(Math.random() * 5 + 1) }) },
    { task: 'update_tracking', context: () => ({ orderId: `ord-sim-${Date.now()}` }) },
  ],
  'marketing-agent': [
    { task: 'analyze_market', context: () => ({}) },
    { task: 'segment_customers', context: () => ({}) },
    { task: 'create_campaign', context: () => ({ targetSegment: ['premium', 'budget', 'enterprise'][Math.floor(Math.random() * 3)], budget: Math.floor(Math.random() * 15000 + 1000) }) },
  ],
  'support-agent': [
    { task: 'notify_customer', context: () => ({ orderId: `ord-sim-${Date.now()}`, customerId: `cust-${Math.floor(Math.random() * 8) + 1}` }) },
    { task: 'handle_complaint', context: () => ({ customerId: `cust-${Math.floor(Math.random() * 8) + 1}`, issue: ['Late delivery', 'Wrong item', 'Damaged product', 'Billing error'][Math.floor(Math.random() * 4)], severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] }) },
    { task: 'process_return', context: () => ({ orderId: `ord-sim-${Date.now()}`, reason: ['Defective', 'Not as described', 'No longer needed'][Math.floor(Math.random() * 3)] }) },
  ],
  'executive-agent': [
    { task: 'review_metrics', context: () => ({}) },
    { task: 'strategic_planning', context: () => ({}) },
    { task: 'assign_task', context: () => ({ task: 'Process pending queue', targetAgent: ['sales', 'finance', 'inventory', 'shipping', 'support'][Math.floor(Math.random() * 5)] }) },
  ],
}

const AGENTS: Record<string, { new: () => SalesAgent | FinanceAgent | InventoryAgent | ShippingAgent | MarketingAgent | SupportAgent | ExecutiveAgent }> = {
  'sales-agent': { new: () => new SalesAgent() },
  'finance-agent': { new: () => new FinanceAgent() },
  'inventory-agent': { new: () => new InventoryAgent() },
  'shipping-agent': { new: () => new ShippingAgent() },
  'marketing-agent': { new: () => new MarketingAgent() },
  'support-agent': { new: () => new SupportAgent() },
  'executive-agent': { new: () => new ExecutiveAgent() },
}

export async function POST() {
  const db = getDb()

  const agentIds = Object.keys(TASKS)
  const randomAgent = agentIds[Math.floor(Math.random() * agentIds.length)]
  const taskDef = TASKS[randomAgent][Math.floor(Math.random() * TASKS[randomAgent].length)]
  const agent = AGENTS[randomAgent].new()
  const context = taskDef.context()

  const result = await agent.executeTask(taskDef.task, context)

  db.prepare('UPDATE agents SET queue_size = CAST(MAX(0, queue_size - 1 + ?) AS INTEGER) WHERE id = ?')
    .run(Math.random() > 0.7 ? 1 : 0, randomAgent)

  const agents = db.prepare('SELECT id, name, role, status, current_task, confidence, last_decision, health, queue_size, tasks_completed, success_rate FROM agents').all()

  MetricsEngine.recordSnapshot()

  return NextResponse.json({
    step: {
      agent: randomAgent,
      task: taskDef.task,
      decision: result.decision,
      confidence: result.confidence,
      result: result.result,
    },
    agents,
    timestamp: Date.now(),
  })
}

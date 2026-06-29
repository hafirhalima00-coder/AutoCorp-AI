import { NextResponse } from 'next/server'
import { SalesAgent } from '@/lib/agents/sales-agent'
import { FinanceAgent } from '@/lib/agents/finance-agent'
import { InventoryAgent } from '@/lib/agents/inventory-agent'
import { ShippingAgent } from '@/lib/agents/shipping-agent'
import { MarketingAgent } from '@/lib/agents/marketing-agent'
import { SupportAgent } from '@/lib/agents/support-agent'
import { ExecutiveAgent } from '@/lib/agents/executive-agent'

export async function POST() {
  const tasks = [
    { agent: new SalesAgent(), task: 'qualify_order', context: { customerId: 'cust-1', orderTotal: 149.99, orderId: 'ord-1' } },
    { agent: new FinanceAgent(), task: 'calculate_profitability', context: { productId: 'all' } },
    { agent: new InventoryAgent(), task: 'restock_alert', context: {} },
    { agent: new ShippingAgent(), task: 'calculate_shipping', context: { orderId: 'ord-3', orderTotal: 199.99 } },
    { agent: new MarketingAgent(), task: 'analyze_market', context: {} },
    { agent: new SupportAgent(), task: 'handle_complaint', context: { customerId: 'cust-2', issue: 'General inquiry', severity: 'low' } },
    { agent: new ExecutiveAgent(), task: 'review_metrics', context: {} },
  ]

  const results = await Promise.allSettled(
    tasks.map(t => t.agent.executeTask(t.task, t.context))
  )

  const succeeded = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({ success: true, synced: succeeded, failed })
}

import { BaseAgent } from './base-agent'
import type { AgentRole, EventLogEntry } from '@/types'

export class FinanceAgent extends BaseAgent {
  readonly role: AgentRole = 'finance'
  readonly displayName = 'Fiona Finance'

  async executeTask(task: string, context?: Record<string, unknown>): Promise<{
    decision: string
    confidence: number
    result: EventLogEntry['result']
    details?: string
  }> {
    this.updateState({ status: 'working', currentTask: task })
    const startTime = Date.now()
    await this.simulateDelay()

    switch (task) {
      case 'approve_payment':
        return this.approvePayment(context)
      case 'process_refund':
        return this.processRefund(context)
      case 'calculate_profitability':
        return this.calculateProfitability(context)
      case 'generate_report':
        return this.generateReport(context)
      default: {
        const result = this.simulateOllama(task)
        const duration = Date.now() - startTime
        this.updateState({ status: 'idle', lastDecision: result.decision, confidence: result.confidence, tasksCompleted: this.getState().tasksCompleted + 1 })
        this.logEvent(task, result.decision, result.confidence, duration, duration * 0.00005, 'success')
        return { decision: result.decision, confidence: result.confidence, result: 'success' }
      }
    }
  }

  private async approvePayment(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const startTime = Date.now()
    const orderTotal = (context?.orderTotal as number) ?? 0
    const customerId = (context?.customerId as string) ?? 'unknown'

    const customer = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId) as { segment: string; lifetime_value: number } | undefined

    const riskScore = customer
      ? Math.max(0, 100 - (customer.lifetime_value / 1000) - (customer.segment === 'platinum' ? 50 : customer.segment === 'gold' ? 30 : 10))
      : 70

    const approved = riskScore < 80 && orderTotal < 10000
    const confidence = approved ? 0.96 : 0.65

    let decision: string
    if (approved) {
      decision = `Payment of $${orderTotal.toFixed(2)} approved. Risk score: ${riskScore.toFixed(0)}/100`
      this.sendMessage('inventory-agent', 'response', `Payment approved for ${context?.orderId as string}`, confidence)
      this.sendMessage('shipping-agent', 'notification', `Order ${context?.orderId as string} payment cleared. Ready for shipping.`, confidence)
    } else {
      decision = `Payment of $${orderTotal.toFixed(2)} requires manual review. Risk score: ${riskScore.toFixed(0)}/100`
    }

    if (orderTotal > 5000) {
      this.requestApproval('large_payment', `Payment of $${orderTotal.toFixed(2)} from ${customerId}`, 'medium', orderTotal)
    }

    const duration = Date.now() - startTime
    this.updateState({ status: 'idle', lastDecision: decision, confidence, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('approve_payment', decision, confidence, duration, duration * 0.00005, approved ? 'success' : 'failure')
    return { decision, confidence, result: approved ? 'success' : 'failure' }
  }

  private async processRefund(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const startTime = Date.now()
    const amount = (context?.amount as number) ?? 0
    const orderId = (context?.orderId as string) ?? 'unknown'

    if (amount > 500) {
      this.requestApproval('refund', `Refund of $${amount.toFixed(2)} for order ${orderId}`, 'high', amount)
      this.updateState({ status: 'waiting', currentTask: 'awaiting_approval_refund' })
      return {
        decision: `Refund of $${amount.toFixed(2)} exceeds threshold. Approval requested.`,
        confidence: 0.7,
        result: 'pending',
        details: 'Awaiting executive approval for refund over $500',
      }
    }

    const decision = `Refund of $${amount.toFixed(2)} processed for order ${orderId}`
    const duration = Date.now() - startTime
    this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.95, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('process_refund', decision, 0.95, duration, duration * 0.00005, 'success')
    return { decision, confidence: 0.95, result: 'success' }
  }

  private async calculateProfitability(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const productId = (context?.productId as string) ?? 'all'
    let products: Array<{ name: string; price: number; cost: number; stock: number }>

    if (productId === 'all') {
      products = this.db.prepare('SELECT * FROM products').all() as Array<{ name: string; price: number; cost: number; stock: number }>
    } else {
      const p = this.db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as { name: string; price: number; cost: number; stock: number } | undefined
      products = p ? [p] : []
    }

    const margins = products.map(p => ({
      name: p.name,
      margin: ((p.price - p.cost) / p.price * 100).toFixed(1),
      profitPerUnit: (p.price - p.cost).toFixed(2),
    }))

    const avgMargin = margins.reduce((s, m) => s + parseFloat(m.margin), 0) / Math.max(margins.length, 1)
    const decision = `Profitability analysis: Average margin ${avgMargin.toFixed(1)}%. Top margin: ${margins[0]?.name} at ${margins[0]?.margin}%`
    const startTime = Date.now()
    const duration = Date.now() - startTime + 50

    this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.93, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('calculate_profitability', decision, 0.93, duration, duration * 0.00005, 'success')
    return { decision, confidence: 0.93, result: 'success' }
  }

  private async generateReport(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const revenue = (this.db.prepare('SELECT COALESCE(SUM(total), 0) as t FROM orders WHERE status IN (\'completed\',\'shipped\',\'delivered\')').get() as { t: number }).t
    const costs = (this.db.prepare('SELECT COALESCE(SUM(oi.quantity * p.cost), 0) as t FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN orders o ON oi.order_id = o.id WHERE o.status IN (\'completed\',\'shipped\',\'delivered\')').get() as { t: number }).t

    const decision = `Financial report: Revenue $${revenue.toFixed(2)}, Costs $${costs.toFixed(2)}, Profit $${(revenue - costs).toFixed(2)}, Margin ${(((revenue - costs) / Math.max(revenue, 1)) * 100).toFixed(1)}%`
    const startTime = Date.now()
    const duration = Date.now() - startTime + 100

    this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.97, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('generate_report', decision, 0.97, duration, duration * 0.00005, 'success')
    return { decision, confidence: 0.97, result: 'success' }
  }

  private simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 150))
  }
}

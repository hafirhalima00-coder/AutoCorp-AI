import { BaseAgent } from './base-agent'
import type { AgentRole, EventLogEntry } from '@/types'

export class SalesAgent extends BaseAgent {
  readonly role: AgentRole = 'sales'
  readonly displayName = 'Alex Sales'

  async executeTask(task: string, context?: Record<string, unknown>): Promise<{
    decision: string
    confidence: number
    result: EventLogEntry['result']
    details?: string
  }> {
    this.updateState({ status: 'working', currentTask: task })

    const startTime = Date.now()

    await this.simulateDelay()

    if (task === 'qualify_order') {
      return this.qualifyOrder(context)
    }

    if (task === 'process_quote') {
      return this.processQuote(context)
    }

    if (task === 'follow_up_lead') {
      return this.followUpLead(context)
    }

    const result = this.simulateOllama(task)
    const duration = Date.now() - startTime
    const costEstimate = duration * 0.00005

    this.updateState({
      status: 'idle',
      lastDecision: result.decision,
      confidence: result.confidence,
      tasksCompleted: this.getState().tasksCompleted + 1,
    })

    this.logEvent(task, result.decision, result.confidence, duration, costEstimate, 'success')

    return {
      decision: result.decision,
      confidence: result.confidence,
      result: 'success',
    }
  }

  private async qualifyOrder(context?: Record<string, unknown>): Promise<{
    decision: string
    confidence: number
    result: EventLogEntry['result']
    details?: string
  }> {
    const startTime = Date.now()
    const customerId = (context?.customerId as string) ?? 'unknown'
    const orderTotal = (context?.orderTotal as number) ?? 0

    const customer = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId) as {
      segment: string; lifetime_value: number
    } | undefined

    const qualified = customer && (customer.segment !== 'bronze' || orderTotal > 100)
    const confidence = qualified ? 0.94 : 0.78
    const decision = qualified
      ? `Order qualified for ${customer?.segment ?? 'unknown'} customer. Order value: $${orderTotal.toFixed(2)}`
      : `Order requires additional review. Customer segment: ${customer?.segment ?? 'unknown'}`

    const duration = Date.now() - startTime
    const costEstimate = duration * 0.00005

    this.updateState({
      status: 'idle',
      lastDecision: decision,
      confidence,
      tasksCompleted: this.getState().tasksCompleted + 1,
    })

    this.logEvent('qualify_order', decision, confidence, duration, costEstimate, qualified ? 'success' : 'failure', `Customer: ${customerId}`)

    if (qualified) {
      this.sendMessage('inventory-agent', 'request', `Check inventory for order ${context?.orderId ?? 'unknown'}`, confidence, { orderId: context?.orderId })
    }

    return {
      decision,
      confidence,
      result: qualified ? 'success' : 'failure',
      details: qualified ? undefined : 'Order below minimum threshold for qualification',
    }
  }

  private async processQuote(context?: Record<string, unknown>): Promise<{
    decision: string
    confidence: number
    result: EventLogEntry['result']
    details?: string
  }> {
    const startTime = Date.now()
    const productId = (context?.productId as string) ?? 'unknown'
    const quantity = (context?.quantity as number) ?? 1

    const product = this.db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as {
      name: string; price: number
    } | undefined

    if (!product) {
      return {
        decision: 'Product not found',
        confidence: 0.5,
        result: 'failure',
        details: `Product ${productId} does not exist`,
      }
    }

    const total = product.price * quantity
    const discount = quantity >= 10 ? 0.1 : quantity >= 5 ? 0.05 : 0
    const finalTotal = total * (1 - discount)

    const decision = `Quote for ${quantity}x ${product.name}: $${finalTotal.toFixed(2)} (${(discount * 100).toFixed(0)}% discount applied)`
    const confidence = discount > 0.4 ? 0.6 : 0.92
    const duration = Date.now() - startTime
    const costEstimate = duration * 0.00005

    if (discount > 0.4) {
      this.requestApproval('discount', `Discount of ${(discount * 100).toFixed(0)}% requested for ${product.name}`, 'high', discount)
    }

    this.updateState({
      status: 'idle',
      lastDecision: decision,
      confidence,
      tasksCompleted: this.getState().tasksCompleted + 1,
    })

    this.logEvent('process_quote', decision, confidence, duration, costEstimate, 'success')

    return { decision, confidence, result: 'success' }
  }

  private async followUpLead(context?: Record<string, unknown>): Promise<{
    decision: string
    confidence: number
    result: EventLogEntry['result']
    details?: string
  }> {
    const startTime = Date.now()
    const customerName = (context?.customerName as string) ?? 'Unknown'

    const templates = [
      `Sent personalized product recommendations to ${customerName}`,
      `Scheduled follow-up call with ${customerName} for next business day`,
      `Sent promotional offer to ${customerName} based on browsing history`,
      `Provided ${customerName} with case study relevant to their industry`,
    ]

    const decision = templates[Math.floor(Math.random() * templates.length)]
    const confidence = 0.82 + Math.random() * 0.12
    const duration = Date.now() - startTime
    const costEstimate = duration * 0.00005

    this.updateState({
      status: 'idle',
      lastDecision: decision,
      confidence,
      tasksCompleted: this.getState().tasksCompleted + 1,
    })

    this.logEvent('follow_up_lead', decision, confidence, duration, costEstimate, 'success')

    return { decision, confidence, result: 'success' }
  }

  private simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
  }
}

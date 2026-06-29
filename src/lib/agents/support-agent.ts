import { BaseAgent } from './base-agent'
import type { AgentRole, EventLogEntry } from '@/types'

export class SupportAgent extends BaseAgent {
  readonly role: AgentRole = 'support'
  readonly displayName = 'Sam Support'

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
      case 'notify_customer':
        return this.notifyCustomer(context)
      case 'handle_complaint':
        return this.handleComplaint(context)
      case 'process_return':
        return this.processReturn(context)
      case 'escalate_issue':
        return this.escalateIssue(context)
      default: {
        const result = this.simulateOllama(task)
        const duration = Date.now() - startTime
        this.updateState({ status: 'idle', lastDecision: result.decision, confidence: result.confidence, tasksCompleted: this.getState().tasksCompleted + 1 })
        this.logEvent(task, result.decision, result.confidence, duration, duration * 0.00003, 'success')
        return { decision: result.decision, confidence: result.confidence, result: 'success' }
      }
    }
  }

  private async notifyCustomer(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const startTime = Date.now()
    const orderId = (context?.orderId as string) ?? 'unknown'
    const customerId = (context?.customerId as string) ?? 'unknown'

    const customer = this.db.prepare('SELECT name, email FROM customers WHERE id = ?').get(customerId) as { name: string; email: string } | undefined
    const order = this.db.prepare('SELECT status, total FROM orders WHERE id = ?').get(orderId) as { status: string; total: number } | undefined

    if (!customer || !order) {
      return { decision: 'Customer or order not found', confidence: 0.4, result: 'failure', details: 'Missing customer or order data' }
    }

    const templates: Record<string, string> = {
      shipped: `Order ${orderId} shipped notification sent to ${customer.name} at ${customer.email}`,
      delivered: `Delivery confirmation sent to ${customer.name} at ${customer.email}`,
      payment_pending: `Payment reminder sent to ${customer.name} for order ${orderId}`,
      completed: `Thank you message sent to ${customer.name} for order ${orderId}`,
    }

    const message = templates[order.status] ?? `Status update sent to ${customer.name}: Order ${orderId} is ${order.status}`
    const decision = message
    const duration = Date.now() - startTime

    this.db.prepare('UPDATE orders SET updated_at = unixepoch() WHERE id = ?').run(orderId)
    this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.94, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('notify_customer', decision, 0.94, duration, duration * 0.00003, 'success')

    return { decision, confidence: 0.94, result: 'success' }
  }

  private async handleComplaint(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const startTime = Date.now()
    const issue = (context?.issue as string) ?? 'General complaint'
    const customerId = (context?.customerId as string) ?? 'unknown'
    const severity = (context?.severity as string) ?? 'low'

    const resolutionTemplates = [
      `Investigated complaint: "${issue.substring(0, 50)}". Resolved with standard procedure. Customer notified.`,
      `Analyzed customer issue. Offered compensation: 10% discount on next order.`,
      `Reviewed complaint from customer ${customerId}. Issue categorized as ${severity} severity. Action taken.`,
      `Complaint resolved. Root cause identified and logged for process improvement.`,
    ]

    const decision = resolutionTemplates[Math.floor(Math.random() * resolutionTemplates.length)]

    if (severity === 'high') {
      this.sendMessage('executive-agent', 'escalation', `High severity complaint from ${customerId}: ${issue}`, 0.8)
      this.requestApproval('complaint_resolution', `High severity complaint resolution: ${issue}`, 'high')
    }

    const duration = Date.now() - startTime
    this.updateState({ status: 'idle', lastDecision: decision, confidence: severity === 'high' ? 0.7 : 0.92, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('handle_complaint', decision, severity === 'high' ? 0.7 : 0.92, duration, duration * 0.00003, 'success')
    return { decision, confidence: severity === 'high' ? 0.7 : 0.92, result: 'success' }
  }

  private async processReturn(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const startTime = Date.now()
    const orderId = (context?.orderId as string) ?? 'unknown'
    const reason = (context?.reason as string) ?? 'Not specified'

    const order = this.db.prepare('SELECT total, customer_id FROM orders WHERE id = ?').get(orderId) as { total: number; customer_id: string } | undefined

    if (!order) {
      return { decision: 'Order not found', confidence: 0.4, result: 'failure', details: `Order ${orderId} does not exist` }
    }

    const refundAmount = order.total * 0.9
    const decision = `Return initiated for order ${orderId}. Reason: ${reason}. Refund amount: $${refundAmount.toFixed(2)} (10% restocking fee applied).`

    if (refundAmount > 500) {
      this.requestApproval('refund', `Return refund of $${refundAmount.toFixed(2)} for order ${orderId}`, 'high', refundAmount)
    }

    this.sendMessage('finance-agent', 'request', `Process refund for order ${orderId}: $${refundAmount.toFixed(2)}`, 0.85)

    const duration = Date.now() - startTime
    this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.88, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('process_return', decision, 0.88, duration, duration * 0.00003, 'success')
    return { decision, confidence: 0.88, result: 'success' }
  }

  private async escalateIssue(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const startTime = Date.now()
    const issue = (context?.issue as string) ?? 'Unknown issue'
    const customerId = (context?.customerId as string) ?? 'unknown'

    this.sendMessage('executive-agent', 'escalation', `Escalated issue from ${customerId}: ${issue}`, 0.75)
    this.requestApproval('issue_escalation', `Issue escalation: ${issue}`, 'high')

    const decision = `Issue escalated to executive team: ${issue.substring(0, 100)}. Priority response initiated.`
    const duration = Date.now() - startTime
    this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.75, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('escalate_issue', decision, 0.75, duration, duration * 0.00003, 'success')
    return { decision, confidence: 0.75, result: 'success' }
  }

  private simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 170))
  }
}

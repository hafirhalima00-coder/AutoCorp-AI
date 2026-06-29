import { BaseAgent } from './base-agent'
import type { AgentRole, EventLogEntry } from '@/types'

export class ShippingAgent extends BaseAgent {
  readonly role: AgentRole = 'shipping'
  readonly displayName = 'Sarah Shipping'

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
      case 'prepare_shipment':
        return this.prepareShipment(context)
      case 'calculate_shipping':
        return this.calculateShipping(context)
      case 'update_tracking':
        return this.updateTracking(context)
      case 'schedule_pickup':
        return this.schedulePickup(context)
      default: {
        const result = this.simulateOllama(task)
        const duration = Date.now() - startTime
        this.updateState({ status: 'idle', lastDecision: result.decision, confidence: result.confidence, tasksCompleted: this.getState().tasksCompleted + 1 })
        this.logEvent(task, result.decision, result.confidence, duration, duration * 0.00004, 'success')
        return { decision: result.decision, confidence: result.confidence, result: 'success' }
      }
    }
  }

  private async prepareShipment(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const startTime = Date.now()
    const orderId = (context?.orderId as string) ?? 'unknown'

    const items = this.db.prepare(`
      SELECT oi.product_name, oi.quantity FROM order_items oi WHERE oi.order_id = ?
    `).all(orderId) as Array<{ product_name: string; quantity: number }>

    if (items.length === 0) {
      return { decision: 'No items to ship', confidence: 0.4, result: 'failure', details: 'Order has no items' }
    }

    const totalQty = items.reduce((s, i) => s + i.quantity, 0)
    const packages = Math.ceil(totalQty / 5)
    const carriers = ['FedEx', 'UPS', 'DHL', 'USPS']
    const carrier = carriers[Math.floor(Math.random() * carriers.length)]

    const decision = `Shipment prepared for order ${orderId}: ${items.length} items in ${packages} package(s) via ${carrier}`

    this.db.prepare('UPDATE orders SET shipping_status = ?, status = ?, updated_at = unixepoch() WHERE id = ?')
      .run('processing', 'shipping', orderId)

    const duration = Date.now() - startTime
    this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.93, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('prepare_shipment', decision, 0.93, duration, duration * 0.00004, 'success')

    this.sendMessage('support-agent', 'notification', `Order ${orderId} has been shipped. Notify customer.`, 0.93)

    return { decision, confidence: 0.93, result: 'success' }
  }

  private async calculateShipping(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const startTime = Date.now()
    const orderId = (context?.orderId as string) ?? 'unknown'
    const total = (context?.orderTotal as number) ?? 0

    const baseRate = 5.99
    const weight = Math.ceil((context?.itemCount as number ?? 1) * 0.5)
    const distance = Math.floor(Math.random() * 2000 + 50)
    const cost = baseRate + weight * 1.5 + distance * 0.02
    const freeShipping = total > 150

    const decision = freeShipping
      ? `Free shipping for order ${orderId} (order > $150). Standard delivery 3-5 business days.`
      : `Shipping cost $${cost.toFixed(2)} for order ${orderId}. Estimated delivery 3-5 business days.`

    const duration = Date.now() - startTime
    this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.91, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('calculate_shipping', decision, 0.91, duration, duration * 0.00004, 'success')
    return { decision, confidence: 0.91, result: 'success' }
  }

  private async updateTracking(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const startTime = Date.now()
    const orderId = (context?.orderId as string) ?? 'unknown'
    const trackingId = `TRK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    this.db.prepare('UPDATE orders SET shipping_status = ?, updated_at = unixepoch() WHERE id = ?')
      .run('shipped', orderId)

    const decision = `Tracking created for order ${orderId}: ${trackingId}`
    const duration = Date.now() - startTime
    this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.95, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('update_tracking', decision, 0.95, duration, duration * 0.00004, 'success')
    return { decision, confidence: 0.95, result: 'success' }
  }

  private async schedulePickup(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const startTime = Date.now()
    const orders = (context?.orderIds as string[]) ?? []

    const decision = orders.length > 0
      ? `Pickup scheduled for ${orders.length} orders. Estimated pickup window: 2:00 PM - 4:00 PM.`
      : 'No orders scheduled for pickup'

    const duration = Date.now() - startTime
    this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.9, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('schedule_pickup', decision, 0.9, duration, duration * 0.00004, 'success')
    return { decision, confidence: 0.9, result: 'success' }
  }

  private simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 70 + Math.random() * 130))
  }
}

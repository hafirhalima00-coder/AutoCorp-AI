import { BaseAgent } from './base-agent'
import type { AgentRole, EventLogEntry } from '@/types'

export class InventoryAgent extends BaseAgent {
  readonly role: AgentRole = 'inventory'
  readonly displayName = 'Ivan Inventory'

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
      case 'check_stock':
        return this.checkStock(context)
      case 'reserve_items':
        return this.reserveItems(context)
      case 'restock_alert':
        return this.restockAlert(context)
      case 'update_inventory':
        return this.updateInventory(context)
      default: {
        const result = this.simulateOllama(task)
        const duration = Date.now() - startTime
        this.updateState({ status: 'idle', lastDecision: result.decision, confidence: result.confidence, tasksCompleted: this.getState().tasksCompleted + 1 })
        this.logEvent(task, result.decision, result.confidence, duration, duration * 0.00003, 'success')
        return { decision: result.decision, confidence: result.confidence, result: 'success' }
      }
    }
  }

  private async checkStock(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const startTime = Date.now()
    const orderId = (context?.orderId as string) ?? 'unknown'
    const items = this.db.prepare(`
      SELECT oi.product_id, oi.product_name, oi.quantity, p.stock, p.reorder_point
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(orderId) as Array<{ product_id: string; product_name: string; quantity: number; stock: number; reorder_point: number }>

    if (items.length === 0) {
      return { decision: 'No items found for order', confidence: 0.5, result: 'failure', details: 'Order has no items' }
    }

    const outOfStock = items.filter(i => i.stock < i.quantity)
    const lowStock = items.filter(i => i.stock >= i.quantity && i.stock < i.reorder_point)

    const allAvailable = outOfStock.length === 0

    let decision: string
    if (allAvailable) {
      decision = `All ${items.length} items available for order ${orderId}`
      const lowStockWarnings = lowStock.map(i => `${i.product_name} (${i.stock} remaining)`).join(', ')
      if (lowStockWarnings) {
        decision += `. Low stock warning: ${lowStockWarnings}`
      }
      this.sendMessage('finance-agent', 'request', `Inventory verified for order ${orderId}. Proceed with payment.`, 0.95)
    } else {
      decision = `Stock shortage for order ${orderId}: ${outOfStock.map(i => `${i.product_name} (need ${i.quantity}, have ${i.stock})`).join(', ')}`
    }

    const duration = Date.now() - startTime
    this.updateState({ status: 'idle', lastDecision: decision, confidence: allAvailable ? 0.95 : 0.8, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('check_stock', decision, allAvailable ? 0.95 : 0.8, duration, duration * 0.00003, allAvailable ? 'success' : 'failure')
    return { decision, confidence: allAvailable ? 0.95 : 0.8, result: allAvailable ? 'success' : 'failure' }
  }

  private async reserveItems(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const startTime = Date.now()
    const orderId = (context?.orderId as string) ?? 'unknown'

    const items = this.db.prepare(`
      SELECT oi.product_id, oi.product_name, oi.quantity, p.stock
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(orderId) as Array<{ product_id: string; product_name: string; quantity: number; stock: number }>

    const updateStock = this.db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?')
    const updateTransaction = this.db.transaction(() => {
      for (const item of items) {
        updateStock.run(item.quantity, item.product_id, item.quantity)
      }
    })

    try {
      updateTransaction()
      const decision = `Reserved ${items.length} items for order ${orderId}. Inventory updated.`
      const duration = Date.now() - startTime
      this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.97, tasksCompleted: this.getState().tasksCompleted + 1 })
      this.logEvent('reserve_items', decision, 0.97, duration, duration * 0.00003, 'success')
      return { decision, confidence: 0.97, result: 'success' }
    } catch {
      return { decision: 'Failed to reserve items', confidence: 0.4, result: 'failure', details: 'Insufficient stock for reservation' }
    }
  }

  private async restockAlert(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const lowStock = this.db.prepare(`
      SELECT id, name, sku, stock, reorder_point FROM products WHERE stock <= reorder_point
    `).all() as Array<{ id: string; name: string; sku: string; stock: number; reorder_point: number }>

    if (lowStock.length === 0) {
      const decision = 'All inventory levels are healthy. No restock needed.'
      const startTime = Date.now()
      this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.99, tasksCompleted: this.getState().tasksCompleted + 1 })
      this.logEvent('restock_alert', decision, 0.99, 30, 0.001, 'success')
      return { decision, confidence: 0.99, result: 'success' }
    }

    const items = lowStock.map(i => `${i.name} (${i.stock}/${i.reorder_point})`).join(', ')
    const decision = `Restock alert: ${lowStock.length} items below reorder point: ${items}.`

    if (lowStock.length > 3) {
      this.requestApproval('bulk_restock', `Bulk restock needed for ${lowStock.length} items`, 'medium')
    }

    this.sendMessage('executive-agent', 'notification', decision, 0.85)
    const startTime = Date.now()
    this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.85, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('restock_alert', decision, 0.85, 50, 0.002, 'success')
    return { decision, confidence: 0.85, result: 'success' }
  }

  private async updateInventory(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const productId = (context?.productId as string)
    const quantity = (context?.quantity as number) ?? 0

    if (!productId) {
      return { decision: 'No product specified', confidence: 0.4, result: 'failure', details: 'Product ID required' }
    }

    this.db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(quantity, productId)
    const product = this.db.prepare('SELECT name, stock FROM products WHERE id = ?').get(productId) as { name: string; stock: number }

    const decision = `Updated ${product.name} stock: +${quantity}. New balance: ${product.stock}`
    const startTime = Date.now()
    this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.98, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('update_inventory', decision, 0.98, 40, 0.001, 'success')
    return { decision, confidence: 0.98, result: 'success' }
  }

  private simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 60 + Math.random() * 120))
  }
}

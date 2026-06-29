import { BaseAgent } from './base-agent'
import type { AgentRole, EventLogEntry } from '@/types'

export class MarketingAgent extends BaseAgent {
  readonly role: AgentRole = 'marketing'
  readonly displayName = 'Maya Marketing'

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
      case 'create_campaign':
        return this.createCampaign(context)
      case 'analyze_market':
        return this.analyzeMarket(context)
      case 'segment_customers':
        return this.segmentCustomers(context)
      case 'optimize_pricing':
        return this.optimizePricing(context)
      default: {
        const result = this.simulateOllama(task)
        const duration = Date.now() - startTime
        this.updateState({ status: 'idle', lastDecision: result.decision, confidence: result.confidence, tasksCompleted: this.getState().tasksCompleted + 1 })
        this.logEvent(task, result.decision, result.confidence, duration, duration * 0.00006, 'success')
        return { decision: result.decision, confidence: result.confidence, result: 'success' }
      }
    }
  }

  private async createCampaign(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const startTime = Date.now()
    const channels = ['Email', 'Social Media', 'Google Ads', 'LinkedIn', 'Content Marketing']
    const channel = channels[Math.floor(Math.random() * channels.length)]
    const target = (context?.targetSegment as string) ?? 'all customers'
    const budget = (context?.budget as number) ?? 5000

    const roas = (1.5 + Math.random() * 3).toFixed(1)
    const decision = `Campaign launched on ${channel} targeting ${target}. Budget: $${budget}. Projected ROAS: ${roas}x`

    if (budget > 10000) {
      this.requestApproval('marketing_campaign', `Campaign budget $${budget} on ${channel}`, 'medium', budget)
    }

    const duration = Date.now() - startTime
    this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.85, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('create_campaign', decision, 0.85, duration, duration * 0.00006, 'success')
    return { decision, confidence: 0.85, result: 'success' }
  }

  private async analyzeMarket(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const startTime = Date.now()
    const categories = this.db.prepare(`
      SELECT category, COUNT(*) as count, AVG(price) as avg_price
      FROM products GROUP BY category
    `).all() as Array<{ category: string; count: number; avg_price: number }>

    const topCategory = categories.reduce((best, c) => c.count > (best?.count ?? 0) ? c : best, categories[0])

    const decision = `Market analysis: ${categories.length} categories analyzed. Largest: ${topCategory?.category} (${topCategory?.count} products, avg $${topCategory?.avg_price.toFixed(2)}). Market opportunity identified in ${topCategory?.category} segment.`

    const duration = Date.now() - startTime
    this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.88, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('analyze_market', decision, 0.88, duration, duration * 0.00006, 'success')
    return { decision, confidence: 0.88, result: 'success' }
  }

  private async segmentCustomers(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const startTime = Date.now()
    const segments = this.db.prepare(`
      SELECT segment, COUNT(*) as count, AVG(lifetime_value) as avg_ltv
      FROM customers GROUP BY segment ORDER BY count DESC
    `).all() as Array<{ segment: string; count: number; avg_ltv: number }>

    const summaries = segments.map(s => `${s.segment}: ${s.count} customers, avg LTV $${(s.avg_ltv ?? 0).toFixed(0)}`).join(' | ')
    const decision = `Customer segmentation complete: ${summaries}`

    const duration = Date.now() - startTime
    this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.91, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('segment_customers', decision, 0.91, duration, duration * 0.00006, 'success')
    return { decision, confidence: 0.91, result: 'success' }
  }

  private async optimizePricing(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const startTime = Date.now()
    const productId = (context?.productId as string)
    const product = productId
      ? this.db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as { name: string; price: number; cost: number } | undefined
      : null

    if (!product) {
      const decision = 'Pricing optimization requires a specific product'
      return { decision, confidence: 0.6, result: 'failure', details: 'No product specified' }
    }

    const currentMargin = ((product.price - product.cost) / product.price) * 100
    const optimalPrice = product.cost * (1 + 0.35 + Math.random() * 0.25)
    const priceChange = ((optimalPrice - product.price) / product.price) * 100

    const direction = priceChange > 0 ? 'increase' : 'decrease'
    const decision = `Pricing analysis for ${product.name}: Current $${product.price.toFixed(2)} (margin ${currentMargin.toFixed(1)}%). Suggested ${direction} to $${optimalPrice.toFixed(2)} (${Math.abs(priceChange).toFixed(1)}% change).`

    if (Math.abs(priceChange) > 40) {
      this.requestApproval('pricing_change', `Price change of ${Math.abs(priceChange).toFixed(1)}% for ${product.name}`, 'high', Math.abs(priceChange) / 100)
    }

    const duration = Date.now() - startTime
    this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.86, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('optimize_pricing', decision, 0.86, duration, duration * 0.00006, 'success')
    return { decision, confidence: 0.86, result: 'success' }
  }

  private simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 90 + Math.random() * 160))
  }
}

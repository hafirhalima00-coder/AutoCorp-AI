import { describe, it, expect } from 'vitest'
import { SalesAgent } from '@/lib/agents/sales-agent'
import { FinanceAgent } from '@/lib/agents/finance-agent'
import { InventoryAgent } from '@/lib/agents/inventory-agent'
import { ShippingAgent } from '@/lib/agents/shipping-agent'
import { MarketingAgent } from '@/lib/agents/marketing-agent'
import { SupportAgent } from '@/lib/agents/support-agent'
import { ExecutiveAgent } from '@/lib/agents/executive-agent'

describe('SalesAgent', () => {
  const agent = new SalesAgent()

  it('should have correct role and name', () => {
    expect(agent.role).toBe('sales')
    expect(agent.displayName).toBe('Alex Sales')
  })

  it('should get initial state', () => {
    const state = agent.getState()
    expect(state.status).toBe('idle')
    expect(state.health).toBe(100)
  })

  it('should execute a task', async () => {
    const result = await agent.executeTask('qualify_order', {
      customerId: 'cust-1',
      orderTotal: 149.99,
      orderId: 'ord-1',
    })
    expect(result.decision).toBeTruthy()
    expect(result.confidence).toBeGreaterThan(0)
    expect(['success', 'failure', 'pending']).toContain(result.result)
  })

  it('should handle unknown tasks', async () => {
    const result = await agent.executeTask('unknown_task')
    expect(result.result).toBe('success')
  })
})

describe('FinanceAgent', () => {
  const agent = new FinanceAgent()

  it('should have correct role and name', () => {
    expect(agent.role).toBe('finance')
    expect(agent.displayName).toBe('Fiona Finance')
  })

  it('should process payment approval', async () => {
    const result = await agent.executeTask('approve_payment', {
      orderTotal: 149.99,
      customerId: 'cust-1',
      orderId: 'ord-1',
    })
    expect(result.decision).toBeTruthy()
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('should calculate profitability', async () => {
    const result = await agent.executeTask('calculate_profitability', { productId: 'prod-1' })
    expect(result.decision).toContain('Profitability')
  })
})

describe('InventoryAgent', () => {
  const agent = new InventoryAgent()

  it('should have correct role and name', () => {
    expect(agent.role).toBe('inventory')
    expect(agent.displayName).toBe('Ivan Inventory')
  })

  it('should check stock', async () => {
    const result = await agent.executeTask('check_stock', { orderId: 'ord-1' })
    expect(result.decision).toBeTruthy()
  })
})

describe('ShippingAgent', () => {
  const agent = new ShippingAgent()

  it('should have correct role and name', () => {
    expect(agent.role).toBe('shipping')
    expect(agent.displayName).toBe('Sarah Shipping')
  })

  it('should calculate shipping', async () => {
    const result = await agent.executeTask('calculate_shipping', {
      orderId: 'ord-1',
      orderTotal: 149.99,
    })
    expect(result.decision).toBeTruthy()
  })
})

describe('MarketingAgent', () => {
  const agent = new MarketingAgent()

  it('should have correct role and name', () => {
    expect(agent.role).toBe('marketing')
    expect(agent.displayName).toBe('Maya Marketing')
  })

  it('should analyze market', async () => {
    const result = await agent.executeTask('analyze_market')
    expect(result.decision).toContain('Market analysis')
  })
})

describe('SupportAgent', () => {
  const agent = new SupportAgent()

  it('should have correct role and name', () => {
    expect(agent.role).toBe('support')
    expect(agent.displayName).toBe('Sam Support')
  })

  it('should notify customer', async () => {
    const result = await agent.executeTask('notify_customer', {
      orderId: 'ord-1',
      customerId: 'cust-1',
    })
    expect(result.decision).toBeTruthy()
  })
})

describe('ExecutiveAgent', () => {
  const agent = new ExecutiveAgent()
  const execAgent = new ExecutiveAgent()

  it('should have correct role and name', () => {
    expect(agent.role).toBe('executive')
    expect(execAgent.displayName).toBe('Eve Executive')
  })

  it('should review metrics', async () => {
    const result = await execAgent.executeTask('review_metrics')
    expect(result.decision).toBeTruthy()
    expect(result.confidence).toBeGreaterThan(0)
  })
})

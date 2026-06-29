import { BaseAgent } from './base-agent'
import { SalesAgent } from './sales-agent'
import { FinanceAgent } from './finance-agent'
import { InventoryAgent } from './inventory-agent'
import { ShippingAgent } from './shipping-agent'
import { MarketingAgent } from './marketing-agent'
import { SupportAgent } from './support-agent'
import { ExecutiveAgent } from './executive-agent'
import type { AgentRole } from '@/types'

const agentRegistry: Record<AgentRole, BaseAgent> = {
  sales: new SalesAgent(),
  finance: new FinanceAgent(),
  inventory: new InventoryAgent(),
  shipping: new ShippingAgent(),
  marketing: new MarketingAgent(),
  support: new SupportAgent(),
  executive: new ExecutiveAgent(),
}

export function getAgent(role: AgentRole): BaseAgent {
  return agentRegistry[role]
}

export function getAllAgents(): BaseAgent[] {
  return Object.values(agentRegistry)
}

export { BaseAgent, SalesAgent, FinanceAgent, InventoryAgent, ShippingAgent, MarketingAgent, SupportAgent, ExecutiveAgent }

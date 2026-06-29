export interface AgentState {
  id: string
  name: string
  role: AgentRole
  status: 'idle' | 'working' | 'waiting' | 'error'
  currentTask: string | null
  confidence: number
  lastDecision: string | null
  health: number
  queueSize: number
  tasksCompleted: number
  successRate: number
}

export type AgentRole =
  | 'sales'
  | 'finance'
  | 'inventory'
  | 'shipping'
  | 'marketing'
  | 'support'
  | 'executive'

export interface AgentMessage {
  id: string
  from: string
  to: string
  type: MessageType
  content: string
  timestamp: number
  confidence: number
  metadata?: Record<string, unknown>
}

export type MessageType =
  | 'request'
  | 'response'
  | 'approval'
  | 'rejection'
  | 'notification'
  | 'escalation'

export interface BusinessMetrics {
  revenue: number
  orders: number
  profit: number
  activeAgents: number
  pendingApprovals: number
  alerts: number
  healthScore: number
  revenueTrend: TrendPoint[]
  orderTrend: TrendPoint[]
  agentPerformance: AgentPerformance[]
  successRate: number
  failureRate: number
  avgProcessingTime: number
}

export interface TrendPoint {
  timestamp: number
  value: number
}

export interface AgentPerformance {
  agentId: string
  agentName: string
  tasksCompleted: number
  successRate: number
  avgDuration: number
  costEstimate: number
}

export interface ApprovalRequest {
  id: string
  agentId: string
  agentName: string
  action: string
  details: string
  risk: 'low' | 'medium' | 'high'
  amount?: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: number
  resolvedAt?: number
  resolvedBy?: string
}

export interface EventLogEntry {
  id: string
  timestamp: number
  agentId: string
  agentName: string
  action: string
  decision: string
  confidence: number
  duration: number
  costEstimate: number
  result: 'success' | 'failure' | 'pending'
  details?: string
}

export interface WorkflowStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  agentId?: string
  duration?: number
  startedAt?: number
  completedAt?: number
}

export interface Order {
  id: string
  customerId: string
  customerName: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  createdAt: number
  updatedAt: number
  priority: 'low' | 'medium' | 'high'
  paymentStatus: 'pending' | 'approved' | 'rejected' | 'refunded'
  shippingStatus: 'pending' | 'processing' | 'shipped' | 'delivered'
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

export type OrderStatus =
  | 'new'
  | 'qualified'
  | 'inventory_check'
  | 'payment_pending'
  | 'payment_approved'
  | 'shipping'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'

export interface Product {
  id: string
  name: string
  sku: string
  price: number
  cost: number
  stock: number
  category: string
  reorderPoint: number
}

export interface Customer {
  id: string
  name: string
  email: string
  totalOrders: number
  totalSpent: number
  lifetimeValue: number
  segment: 'bronze' | 'silver' | 'gold' | 'platinum'
}

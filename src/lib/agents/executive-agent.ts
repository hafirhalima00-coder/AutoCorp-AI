import { BaseAgent } from './base-agent'
import type { AgentRole, EventLogEntry } from '@/types'
import { MetricsEngine } from '@/lib/metrics/metrics-engine'

export class ExecutiveAgent extends BaseAgent {
  readonly role: AgentRole = 'executive'
  readonly displayName = 'Eve Executive'

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
      case 'review_metrics':
        return this.reviewMetrics(context)
      case 'approve_request':
        return this.approveRequest(context)
      case 'assign_task':
        return this.assignTask(context)
      case 'strategic_planning':
        return this.strategicPlanning(context)
      case 'resolve_escalation':
        return this.resolveEscalation(context)
      default: {
        const result = this.simulateOllama(task)
        const duration = Date.now() - startTime
        this.updateState({ status: 'idle', lastDecision: result.decision, confidence: result.confidence, tasksCompleted: this.getState().tasksCompleted + 1 })
        this.logEvent(task, result.decision, result.confidence, duration, duration * 0.00008, 'success')
        return { decision: result.decision, confidence: result.confidence, result: 'success' }
      }
    }
  }

  private async reviewMetrics(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const metrics = MetricsEngine.getMetrics()
    const agents = this.db.prepare('SELECT name, role, status, health, tasks_completed, success_rate FROM agents').all() as Array<{
      name: string; role: string; status: string; health: number; tasks_completed: number; success_rate: number
    }>

    const unhealthy = agents.filter(a => a.health < 70)
    const lowPerformer = agents.filter(a => a.success_rate < 0.8)

    let decision: string
    if (unhealthy.length > 0) {
      decision = `Health alert: ${unhealthy.map(a => a.name).join(', ')} have low health. Health score: ${metrics.healthScore}/100`
    } else if (lowPerformer.length > 0) {
      decision = `Performance review: ${lowPerformer.map(a => a.name).join(', ')} below target. Overall health: ${metrics.healthScore}/100`
    } else {
      decision = `Business health: ${metrics.healthScore}/100. Revenue: $${metrics.revenue.toFixed(2)}. Profit: $${metrics.profit.toFixed(2)}. All agents performing well.`
    }

    const startTime = Date.now()
    const duration = Date.now() - startTime + 200

    if (unhealthy.length > 0) {
      this.requestApproval('health_intervention', `Unhealthy agents: ${unhealthy.map(a => a.name).join(', ')}`, 'high')
    }

    this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.96, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('review_metrics', decision, 0.96, duration, duration * 0.00008, 'success')
    return { decision, confidence: 0.96, result: 'success' }
  }

  private async approveRequest(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const approvalId = (context?.approvalId as string)
    const approve = (context?.approve as boolean) ?? true

    if (approvalId) {
      this.db.prepare('UPDATE approvals SET status = ?, resolved_at = unixepoch(), resolved_by = ? WHERE id = ?')
        .run(approve ? 'approved' : 'rejected', this.displayName, approvalId)
    }

    const action = context?.action as string ?? 'Unknown request'
    const decision = approve
      ? `Approved: ${action}. Risk assessment complete.`
      : `Rejected: ${action}. Does not align with current business strategy.`

    const startTime = Date.now()
    const duration = Date.now() - startTime + 100
    this.updateState({ status: 'idle', lastDecision: decision, confidence: approve ? 0.94 : 0.88, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('approve_request', decision, approve ? 0.94 : 0.88, duration, duration * 0.00008, 'success')
    return { decision, confidence: approve ? 0.94 : 0.88, result: 'success' }
  }

  private async assignTask(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const task = (context?.task as string) ?? 'general task'
    const targetAgent = (context?.targetAgent as string) ?? 'unassigned'

    const agents = this.db.prepare('SELECT id, name, status, queue_size FROM agents WHERE role = ?').get(targetAgent) as {
      id: string; name: string; status: string; queue_size: number
    } | undefined

    if (!agents) {
      return { decision: `No agent found for role: ${targetAgent}`, confidence: 0.5, result: 'failure', details: 'Invalid agent role' }
    }

    this.sendMessage(agents.id, 'request', `New task assigned: ${task}`, 0.9)
    this.db.prepare('UPDATE agents SET queue_size = queue_size + 1 WHERE id = ?').run(agents.id)

    const decision = `Assigned "${task}" to ${agents.name}. Current queue: ${agents.queue_size + 1} tasks.`
    const startTime = Date.now()
    const duration = Date.now() - startTime + 50
    this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.92, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('assign_task', decision, 0.92, duration, duration * 0.00008, 'success')
    return { decision, confidence: 0.92, result: 'success' }
  }

  private async strategicPlanning(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const metrics = MetricsEngine.getMetrics()
    const revenueGrowth = metrics.revenue > 0 ? 15 + Math.random() * 25 : 0
    const profitMargin = metrics.revenue > 0 ? ((metrics.profit / metrics.revenue) * 100) : 0

    const plans = [
      `Strategic plan Q3: Target ${(revenueGrowth).toFixed(0)}% revenue growth. Focus on ${profitMargin.toFixed(1)}% margin optimization.`,
      `Strategic initiative: Expand into new markets. Current revenue $${metrics.revenue.toFixed(0)} provides strong foundation.`,
      `Strategic review: Agent team performing at ${(metrics.successRate * 100).toFixed(0)}% success rate. Recommend scaling operations.`,
      `Strategic directive: Optimize workflow efficiency. Current avg processing time: ${metrics.avgProcessingTime}ms. Target: 15% improvement.`,
    ]

    const decision = plans[Math.floor(Math.random() * plans.length)]
    const startTime = Date.now()
    const duration = Date.now() - startTime + 300
    this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.9, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('strategic_planning', decision, 0.9, duration, duration * 0.00008, 'success')
    return { decision, confidence: 0.9, result: 'success' }
  }

  private async resolveEscalation(context?: Record<string, unknown>): Promise<{
    decision: string; confidence: number; result: EventLogEntry['result']; details?: string
  }> {
    const issue = (context?.issue as string) ?? 'Unspecified escalation'

    const decision = `Escalation resolved: ${issue.substring(0, 100)}. Implementing corrective measures and updating protocols.`
    const startTime = Date.now()
    const duration = Date.now() - startTime + 150
    this.updateState({ status: 'idle', lastDecision: decision, confidence: 0.85, tasksCompleted: this.getState().tasksCompleted + 1 })
    this.logEvent('resolve_escalation', decision, 0.85, duration, duration * 0.00008, 'success')

    this.sendMessage('support-agent', 'response', `Escalation resolved: ${issue.substring(0, 100)}`, 0.85)
    return { decision, confidence: 0.85, result: 'success' }
  }

  private simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
  }
}

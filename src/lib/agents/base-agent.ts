import { getDb } from '@/lib/db'
import type { AgentState, AgentRole, AgentMessage, EventLogEntry, ApprovalRequest } from '@/types'

export abstract class BaseAgent {
  abstract readonly role: AgentRole
  abstract readonly displayName: string

  protected db = getDb()

  getState(): AgentState {
    const row = this.db.prepare('SELECT * FROM agents WHERE id = ?').get(this.agentId) as Record<string, unknown> | undefined
    if (!row) return this.defaultState()
    return {
      id: row.id as string,
      name: row.name as string,
      role: row.role as AgentRole,
      status: row.status as AgentState['status'],
      currentTask: row.current_task as string | null,
      confidence: row.confidence as number,
      lastDecision: row.last_decision as string | null,
      health: row.health as number,
      queueSize: row.queue_size as number,
      tasksCompleted: row.tasks_completed as number,
      successRate: row.success_rate as number,
    }
  }

  protected get agentId(): string {
    return `${this.role}-agent`
  }

  private defaultState(): AgentState {
    return {
      id: this.agentId,
      name: this.displayName,
      role: this.role,
      status: 'idle',
      currentTask: null,
      confidence: 0.9,
      lastDecision: null,
      health: 100,
      queueSize: 0,
      tasksCompleted: 0,
      successRate: 1,
    }
  }

  protected updateState(updates: Partial<AgentState>): void {
    const state = this.getState()
    this.db.prepare(`
      UPDATE agents SET
        status = ?,
        current_task = ?,
        confidence = ?,
        last_decision = ?,
        health = ?,
        queue_size = ?,
        tasks_completed = ?,
        success_rate = ?
      WHERE id = ?
    `).run(
      updates.status ?? state.status,
      updates.currentTask ?? state.currentTask,
      updates.confidence ?? state.confidence,
      updates.lastDecision ?? state.lastDecision,
      updates.health ?? state.health,
      updates.queueSize ?? state.queueSize,
      updates.tasksCompleted ?? state.tasksCompleted,
      updates.successRate ?? state.successRate,
      this.agentId
    )
  }

  protected logEvent(
    action: string,
    decision: string,
    confidence: number,
    duration: number,
    costEstimate: number,
    result: EventLogEntry['result'],
    details?: string
  ): void {
    const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    this.db.prepare(`
      INSERT INTO events (id, timestamp, agent_id, agent_name, action, decision, confidence, duration, cost_estimate, result, details)
      VALUES (?, unixepoch(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, this.agentId, this.displayName, action, decision, confidence, duration, costEstimate, result, details ?? null)
  }

  protected sendMessage(
    to: string,
    type: AgentMessage['type'],
    content: string,
    confidence: number,
    metadata?: Record<string, unknown>
  ): void {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    this.db.prepare(`
      INSERT INTO agent_messages (id, from_agent, to_agent, type, content, timestamp, confidence, metadata)
      VALUES (?, ?, ?, ?, ?, unixepoch(), ?, ?)
    `).run(id, this.agentId, to, type, content, confidence, metadata ? JSON.stringify(metadata) : null)
  }

  protected requestApproval(
    action: string,
    details: string,
    risk: ApprovalRequest['risk'],
    amount?: number
  ): void {
    const id = `apr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    this.db.prepare(`
      INSERT INTO approvals (id, agent_id, agent_name, action, details, risk, amount, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', unixepoch())
    `).run(id, this.agentId, this.displayName, action, details, risk, amount ?? null)
  }

  protected needsApproval(action: string, amount?: number): boolean {
    const highRiskActions = [
      { action: 'refund', threshold: 500 },
      { action: 'delete_product', threshold: 0 },
      { action: 'bulk_export', threshold: 0 },
      { action: 'discount', threshold: 0.4 },
    ]

    for (const rule of highRiskActions) {
      if (action.includes(rule.action)) {
        if (rule.action === 'discount' && amount && amount > rule.threshold) return true
        if (amount !== undefined && amount > rule.threshold) return true
        if (rule.threshold === 0) return true
      }
    }
    return false
  }

  abstract executeTask(task: string, context?: Record<string, unknown>): Promise<{
    decision: string
    confidence: number
    result: EventLogEntry['result']
    details?: string
  }>

  protected simulateOllama(prompt: string): { decision: string; confidence: number } {
    const responseTime = Date.now()
    const seed = (prompt.length + responseTime) % 100

    const templates = [
      `Analyzed request: "${prompt}". Based on current data, proceeding with optimal action.`,
      `Evaluated "${prompt}". All checks passed. Executing with standard protocol.`,
      `Processing "${prompt}". Risk assessment complete. Recommended action initiated.`,
      `Reviewed "${prompt}". Decision aligns with business objectives. Proceeding.`,
    ]

    const decision = templates[seed % templates.length]
    const confidence = 0.75 + (seed % 20) / 100

    return { decision, confidence: Math.min(confidence, 0.99) }
  }
}

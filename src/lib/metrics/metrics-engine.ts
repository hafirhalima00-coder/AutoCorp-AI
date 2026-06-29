import { getDb } from '@/lib/db'
import type { BusinessMetrics, TrendPoint, AgentPerformance, AgentState } from '@/types'

export class MetricsEngine {
  static getMetrics(): BusinessMetrics {
    const db = getDb()
    const now = Math.floor(Date.now() / 1000)

    const revenue = (db.prepare(`
      SELECT COALESCE(SUM(o.total), 0) as total FROM orders o
      WHERE o.status IN ('completed', 'shipped', 'delivered')
    `).get() as { total: number }).total

    const orders = (db.prepare(`SELECT COUNT(*) as count FROM orders`).get() as { count: number }).count

    const totalCost = (db.prepare(`
      SELECT COALESCE(SUM(oi.quantity * p.cost), 0) as total
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('completed', 'shipped', 'delivered')
    `).get() as { total: number }).total

    const profit = revenue - totalCost

    const activeAgents = (db.prepare(`
      SELECT COUNT(*) as count FROM agents WHERE status IN ('working', 'waiting')
    `).get() as { count: number }).count

    const pendingApprovals = (db.prepare(`
      SELECT COUNT(*) as count FROM approvals WHERE status = 'pending'
    `).get() as { count: number }).count

    const lowHealth = (db.prepare(`
      SELECT COUNT(*) as count FROM agents WHERE health < 50
    `).get() as { count: number }).count

    const failedEvents = (db.prepare(`
      SELECT COUNT(*) as count FROM events WHERE result = 'failure' AND timestamp > ?
    `).get(now - 3600) as { count: number }).count

    const alerts = lowHealth + failedEvents

    const avgHealth = (db.prepare(`
      SELECT COALESCE(AVG(health), 100) as avg FROM agents
    `).get() as { avg: number }).avg

    const successRate = (db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN result = 'success' THEN 1 ELSE 0 END), 0) as successes,
        COUNT(*) as total
      FROM events
    `).get() as { successes: number; total: number })

    const sr = successRate.total > 0 ? successRate.successes / successRate.total : 1

    const healthScore = Math.round(
      (avgHealth * 0.3) +
      (sr * 100 * 0.3) +
      (Math.min(1 - (pendingApprovals / Math.max(orders, 1)), 1) * 100 * 0.2) +
      (Math.min(profit / 100000, 1) * 100 * 0.2)
    )

    const agentList = db.prepare(`SELECT * FROM agents`).all() as Array<{
      id: string; name: string; role: string; tasks_completed: number; success_rate: number
    }>

    const agentPerformance: AgentPerformance[] = agentList.map(a => ({
      agentId: a.id,
      agentName: a.name,
      tasksCompleted: a.tasks_completed,
      successRate: a.success_rate,
      avgDuration: Math.floor(Math.random() * 2000 + 300),
      costEstimate: Math.round(a.tasks_completed * 0.05 * 100) / 100,
    }))

    const recentMetrics = db.prepare(`
      SELECT * FROM metrics_history ORDER BY timestamp DESC LIMIT 24
    `).all() as Array<{ timestamp: number; revenue: number; orders_count: number }>

    recentMetrics.reverse()

    const revenueTrend: TrendPoint[] = recentMetrics.map(m => ({
      timestamp: m.timestamp,
      value: m.revenue,
    }))

    const orderTrend: TrendPoint[] = recentMetrics.map(m => ({
      timestamp: m.timestamp,
      value: m.orders_count,
    }))

    return {
      revenue,
      orders,
      profit,
      activeAgents,
      pendingApprovals,
      alerts,
      healthScore,
      revenueTrend,
      orderTrend,
      agentPerformance,
      successRate: sr,
      failureRate: 1 - sr,
      avgProcessingTime: Math.floor(Math.random() * 3000 + 1000),
    }
  }

  static recordSnapshot(): void {
    const db = getDb()
    const metrics = this.getMetrics()
    db.prepare(`
      INSERT INTO metrics_history (timestamp, revenue, orders_count, profit, active_agents, pending_approvals, alerts, health_score)
      VALUES (unixepoch(), ?, ?, ?, ?, ?, ?, ?)
    `).run(metrics.revenue, metrics.orders, metrics.profit, metrics.activeAgents, metrics.pendingApprovals, metrics.alerts, metrics.healthScore)
  }
}

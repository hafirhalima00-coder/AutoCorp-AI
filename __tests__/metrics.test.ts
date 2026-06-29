import { describe, it, expect } from 'vitest'
import { MetricsEngine } from '@/lib/metrics/metrics-engine'

describe('MetricsEngine', () => {
  it('should return metrics with all required fields', () => {
    const metrics = MetricsEngine.getMetrics()
    expect(metrics).toBeDefined()
    expect(typeof metrics.revenue).toBe('number')
    expect(typeof metrics.orders).toBe('number')
    expect(typeof metrics.profit).toBe('number')
    expect(typeof metrics.activeAgents).toBe('number')
    expect(typeof metrics.pendingApprovals).toBe('number')
    expect(typeof metrics.alerts).toBe('number')
    expect(typeof metrics.healthScore).toBe('number')
    expect(typeof metrics.successRate).toBe('number')
    expect(typeof metrics.failureRate).toBe('number')
  })

  it('should have health score in valid range', () => {
    const metrics = MetricsEngine.getMetrics()
    expect(metrics.healthScore).toBeGreaterThanOrEqual(0)
    expect(metrics.healthScore).toBeLessThanOrEqual(100)
  })

  it('should have agent performance data', () => {
    const metrics = MetricsEngine.getMetrics()
    expect(metrics.agentPerformance.length).toBeGreaterThan(0)
    metrics.agentPerformance.forEach(a => {
      expect(a.agentId).toBeTruthy()
      expect(typeof a.tasksCompleted).toBe('number')
      expect(typeof a.successRate).toBe('number')
    })
  })

  it('should record snapshots', () => {
    expect(() => MetricsEngine.recordSnapshot()).not.toThrow()
  })
})

'use client'

import { useEffect, useState } from 'react'
import { AgentCard } from './agent-card'
import { Skeleton } from '@/components/ui/skeleton'
import type { AgentState } from '@/types'

export function AgentGrid() {
  const [agents, setAgents] = useState<AgentState[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch('/api/agents')
        const data = await res.json()
        setAgents(data)
      } catch {
        console.error('Failed to fetch agents')
      } finally {
        setLoading(false)
      }
    }
    fetchAgents()
    const interval = setInterval(fetchAgents, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-[280px] rounded-xl" />
        ))}
      </div>
    )
  }

  if (agents.length === 0) {
    return <div className="text-center text-muted-foreground py-12">No agents found</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  )
}

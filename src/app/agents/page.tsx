import { AgentGrid } from '@/components/agents/agent-grid'

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Employees</h1>
        <p className="text-muted-foreground mt-1">
          Seven specialized AI agents collaborating to run the business
        </p>
      </div>
      <AgentGrid />
    </div>
  )
}

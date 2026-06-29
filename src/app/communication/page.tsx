import { AgentCommunicationGraph } from '@/components/communication/agent-graph'

export default function CommunicationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agent Communication</h1>
        <p className="text-muted-foreground mt-1">
          Real-time message flow between AI agents
        </p>
      </div>
      <AgentCommunicationGraph />
    </div>
  )
}

import { MetricsGrid } from '@/components/dashboard/metrics-grid'
import { ExecutiveKPIs } from '@/components/kpi/executive-kpis'
import { AgentGrid } from '@/components/agents/agent-grid'
import { WorkflowCanvas } from '@/components/workflow/workflow-canvas'
import { EnhancedApprovalCenter } from '@/components/approvals/enhanced-approval-center'
import { AnalyticsCharts } from '@/components/analytics/analytics-charts'
import { LiveSimulation } from '@/components/simulation/live-simulation'
import { Scenarios } from '@/components/dashboard/scenarios'
import { ReplayMode } from '@/components/replay/replay-mode'
import { AgentCommunicationGraph } from '@/components/communication/agent-graph'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Executive Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Autonomous company simulator &mdash; AI agents collaborating in real-time
        </p>
      </div>

      <MetricsGrid />
      <ExecutiveKPIs />
      <LiveSimulation />

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList className="w-full justify-start border-b rounded-none h-auto pb-0 bg-transparent gap-4 sm:gap-6 overflow-x-auto" role="tablist" aria-label="Dashboard sections">
          <TabsTrigger value="agents" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2 text-xs sm:text-sm shrink-0" role="tab">AI Employees</TabsTrigger>
          <TabsTrigger value="workflow" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2 text-xs sm:text-sm shrink-0" role="tab">Company Workflow</TabsTrigger>
          <TabsTrigger value="approvals" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2 text-xs sm:text-sm shrink-0" role="tab">Approvals</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2 text-xs sm:text-sm shrink-0" role="tab">Analytics</TabsTrigger>
          <TabsTrigger value="graph" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2 text-xs sm:text-sm shrink-0" role="tab">Agent Graph</TabsTrigger>
          <TabsTrigger value="replay" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2 text-xs sm:text-sm shrink-0" role="tab">Replay</TabsTrigger>
        </TabsList>
        <TabsContent value="agents" role="tabpanel">
          <AgentGrid />
        </TabsContent>
        <TabsContent value="workflow" role="tabpanel">
          <WorkflowCanvas />
        </TabsContent>
        <TabsContent value="approvals" role="tabpanel">
          <EnhancedApprovalCenter />
        </TabsContent>
        <TabsContent value="analytics" role="tabpanel">
          <AnalyticsCharts />
        </TabsContent>
        <TabsContent value="graph" role="tabpanel">
          <AgentCommunicationGraph />
        </TabsContent>
        <TabsContent value="replay" role="tabpanel">
          <ReplayMode />
        </TabsContent>
      </Tabs>

      <Scenarios />
    </div>
  )
}

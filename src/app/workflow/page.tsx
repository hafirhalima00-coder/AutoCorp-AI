import { WorkflowCanvas } from '@/components/workflow/workflow-canvas'

export default function WorkflowPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Workflow</h1>
        <p className="text-muted-foreground mt-1">
          Interactive business process from customer order to support follow-up
        </p>
      </div>
      <WorkflowCanvas />
    </div>
  )
}

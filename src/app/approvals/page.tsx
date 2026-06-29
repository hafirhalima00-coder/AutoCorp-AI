import { EnhancedApprovalCenter } from '@/components/approvals/enhanced-approval-center'

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Human Approval Center</h1>
        <p className="text-muted-foreground mt-1">
          High-risk actions requiring CEO approval — refunds, deletions, bulk exports, large discounts
        </p>
      </div>
      <EnhancedApprovalCenter />
    </div>
  )
}
